package com.ayitrix.ayipm.auth;

import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.OptionalLong;
import java.util.Set;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.activity.ActivityService;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.employee.Role;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.workspace.WorkspaceService;
import com.ayitrix.ayipm.workspace.WorkspaceSettings;

/**
 * Two-factor authentication with an authenticator app, plus one-time recovery codes. Setting it up only takes effect
 * once a code from the app is confirmed. Accounts that have it sign in in two steps: the password check returns a
 * short-lived challenge, and the code completes it.
 */
@Service
public class TwoFactorService {

	static final int RECOVERY_CODE_COUNT = 10;
	private static final int RECOVERY_CODE_LENGTH = 10;
	// Crockford's base32 alphabet, without letters that look like digits.
	private static final String RECOVERY_CODE_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
	private static final Duration CODE_CHALLENGE_TTL = Duration.ofMinutes(5);
	// Long enough to install an authenticator app first.
	private static final Duration SETUP_CHALLENGE_TTL = Duration.ofMinutes(15);
	private static final Pattern AUTHENTICATOR_CODE = Pattern.compile("^\\d{" + Totp.DIGITS + "}$");
	private static final SecureRandom RANDOM = new SecureRandom();
	private static final Logger log = LoggerFactory.getLogger(TwoFactorService.class);

	private static final String UNAVAILABLE = "Two-factor authentication isn't set up on this server yet. Ask the person who runs AyiPM to turn it on.";
	private static final String CANNOT_CHECK_CODES = "Codes from authenticator apps can't be checked on this server right now. Use a recovery code, or ask your admin.";
	private static final String WRONG_CODE = "That code didn't work. Enter the newest code from your authenticator app.";
	private static final String USED_CODE = "That code has already been used. Wait for the next one in your authenticator app.";
	private static final String WRONG_RECOVERY_CODE = "That recovery code didn't work. Each code works only once.";
	private static final String CHALLENGE_GONE = "This sign-in has expired. Enter your password again.";
	private static final String ALREADY_ON = "Two-factor authentication is already on.";

	private final UserRepository users;
	private final RecoveryCodeRepository recoveryCodes;
	private final LoginChallengeRepository challenges;
	private final TwoFactorCipher cipher;
	private final LoginLockout lockout;
	private final WorkspaceService workspace;
	private final ActivityService activity;
	private final Clock clock;

	public TwoFactorService(UserRepository users, RecoveryCodeRepository recoveryCodes, LoginChallengeRepository challenges, TwoFactorCipher cipher,
			LoginLockout lockout, WorkspaceService workspace, ActivityService activity, Clock clock) {
		this.users = users;
		this.recoveryCodes = recoveryCodes;
		this.challenges = challenges;
		this.cipher = cipher;
		this.lockout = lockout;
		this.workspace = workspace;
		this.activity = activity;
		this.clock = clock;
	}

	/** Matches TwoFactorStatus in the frontend's src/types/auth.ts. */
	public record Status(boolean enabled, boolean available, boolean required, int recoveryCodesLeft) {
	}

	/** The secret as text, for typing into an app, and the otpauth:// link that the QR code shows. */
	public record Setup(String secret, String otpauthUri) {
	}

	/** Shown to the person once; only their hashes are kept. */
	public record NewRecoveryCodes(List<String> recoveryCodes, Status status) {
	}

	/** Sent instead of a session when a sign-in needs a code, or two-factor setup first. */
	public record Challenge(String token, Instant expiresAt, boolean setupRequired) {
	}

	/** A completed second step. The recovery codes are set when two-factor authentication was just turned on. */
	public record SignIn(User user, boolean remember, boolean usedRecoveryCode, List<String> recoveryCodes) {
	}

	@Transactional(readOnly = true)
	public Status status(User user) {
		boolean enabled = user.hasTwoFactor();
		return new Status(enabled, cipher.isConfigured(), requiredFor(user), enabled ? (int) recoveryCodes.countForUser(user.getId()) : 0);
	}

	/** Creates a new secret to scan. It replaces any earlier one that wasn't confirmed. */
	@Transactional
	public Setup startSetup(User actor) {
		User user = lock(actor);
		if (user.hasTwoFactor()) throw ApiException.conflict(ALREADY_ON);
		return newPendingSecret(user);
	}

	@Transactional
	public NewRecoveryCodes confirmSetup(User actor, String code) {
		User user = lock(actor);
		if (user.hasTwoFactor()) throw ApiException.conflict(ALREADY_ON);
		List<String> codes = enable(user, code);
		return new NewRecoveryCodes(codes, status(user));
	}

	/** Needs a current code or a recovery code, so a stolen session alone can't remove the second factor. */
	@Transactional(noRollbackFor = ApiException.class)
	public Status disable(User actor, String code) {
		User user = lock(actor);
		if (!user.hasTwoFactor()) throw ApiException.conflict("Two-factor authentication is already off.");
		if (requiredFor(user)) throw ApiException.badRequest("Your workspace requires two-factor authentication for admins, so it can't be turned off.");
		checkCode(user, code, HttpStatus.BAD_REQUEST);
		user.setTwoFactorSecret(null);
		user.setTwoFactorPendingSecret(null);
		user.setTwoFactorEnabledAt(null);
		user.setTwoFactorLastStep(null);
		users.save(user);
		recoveryCodes.deleteAllForUser(user.getId());
		challenges.deleteAllForUser(user.getId());
		recordAuth(user, "Turned Off Two-Factor Authentication");
		return status(user);
	}

	/** Replaces all recovery codes. Needs a current code or one of the old recovery codes. */
	@Transactional(noRollbackFor = ApiException.class)
	public NewRecoveryCodes regenerateRecoveryCodes(User actor, String code) {
		User user = lock(actor);
		if (!user.hasTwoFactor()) throw ApiException.badRequest("Turn on two-factor authentication first.");
		checkCode(user, code, HttpStatus.BAD_REQUEST);
		List<String> codes = replaceRecoveryCodes(user);
		recordAuth(user, "Created New Recovery Codes");
		return new NewRecoveryCodes(codes, status(user));
	}

	/**
	 * Starts a second step for an account that needs one: a code when it has two-factor authentication, or setup when
	 * it is an admin without it and the workspace requires it. Returns empty when a session can start straight away.
	 */
	@Transactional
	public Optional<Challenge> challengeFor(User user, boolean remember) {
		boolean setupRequired = !user.hasTwoFactor() && requiredFor(user);
		if (!user.hasTwoFactor() && !setupRequired) return Optional.empty();
		String token = Tokens.create();
		Instant expiresAt = clock.instant().plus(setupRequired ? SETUP_CHALLENGE_TTL : CODE_CHALLENGE_TTL);
		challenges.save(new LoginChallenge(Tokens.hash(token), user, remember, setupRequired, expiresAt));
		return Optional.of(new Challenge(token, expiresAt, setupRequired));
	}

	/** Completes a sign-in with an authenticator code or a recovery code. Wrong codes count toward the lockout. */
	@Transactional(noRollbackFor = ApiException.class)
	public SignIn completeSignIn(String token, String code) {
		LoginChallenge challenge = openChallenge(token, false);
		User user = challenge.getUser();
		boolean usedRecoveryCode = checkCode(user, code, HttpStatus.UNAUTHORIZED);
		challenges.delete(challenge);
		return new SignIn(user, challenge.isRemember(), usedRecoveryCode, List.of());
	}

	@Transactional
	public Setup startSetupForSignIn(String token) {
		return newPendingSecret(openChallenge(token, true).getUser());
	}

	/** Turns on two-factor authentication for an admin who had to set it up, and completes their sign-in. */
	@Transactional
	public SignIn confirmSetupForSignIn(String token, String code) {
		LoginChallenge challenge = openChallenge(token, true);
		User user = challenge.getUser();
		List<String> codes = enable(user, code);
		challenges.delete(challenge);
		return new SignIn(user, challenge.isRemember(), false, codes);
	}

	private boolean requiredFor(User user) {
		return user.getRole() == Role.ADMIN && workspace.adminTwoFactorRequired();
	}

	private User lock(User actor) {
		return users.lockById(actor.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please sign in again."));
	}

	private LoginChallenge openChallenge(String token, boolean setup) {
		LoginChallenge challenge = token.isEmpty() ? null : challenges.lockWithUser(Tokens.hash(token)).orElse(null);
		if (challenge == null || !challenge.getExpiresAt().isAfter(clock.instant()) || challenge.isSetupRequired() != setup) {
			throw new ApiException(HttpStatus.GONE, CHALLENGE_GONE);
		}
		User user = challenge.getUser();
		if (!user.isActive()) throw new ApiException(HttpStatus.FORBIDDEN, "This account has been deactivated. Contact your administrator.");
		// Two-factor authentication was turned on or off since the password was checked.
		if (user.hasTwoFactor() == setup) throw new ApiException(HttpStatus.GONE, CHALLENGE_GONE);
		return challenge;
	}

	private Setup newPendingSecret(User user) {
		if (!cipher.isConfigured()) throw ApiException.conflict(UNAVAILABLE);
		byte[] secret = Totp.newSecret();
		user.setTwoFactorPendingSecret(cipher.encrypt(secret, user.getId()));
		users.save(user);
		String issuer = workspace.getSettings().map(WorkspaceSettings::companyName).orElse("AyiPM");
		return new Setup(Totp.base32(secret), Totp.uri(issuer, user.getEmail(), secret));
	}

	private List<String> enable(User user, String rawCode) {
		if (!cipher.isConfigured()) throw ApiException.conflict(UNAVAILABLE);
		if (user.getTwoFactorPendingSecret() == null) throw ApiException.badRequest("Start the setup again to get a new QR code.");
		String code = normalize(rawCode);
		if (!AUTHENTICATOR_CODE.matcher(code).matches()) throw ApiException.badRequest("Enter the 6-digit code from your authenticator app.");
		OptionalLong step = Totp.matchingStep(decrypt(user.getTwoFactorPendingSecret(), user), code, clock.instant(), Long.MIN_VALUE);
		if (step.isEmpty()) throw ApiException.badRequest(WRONG_CODE);
		user.setTwoFactorSecret(user.getTwoFactorPendingSecret());
		user.setTwoFactorPendingSecret(null);
		user.setTwoFactorEnabledAt(clock.instant());
		user.setTwoFactorLastStep(step.getAsLong());
		users.save(user);
		recordAuth(user, "Turned On Two-Factor Authentication");
		return replaceRecoveryCodes(user);
	}

	/**
	 * Accepts a current authenticator code or an unused recovery code, and returns whether it was a recovery code. Both
	 * work only once: the accepted time step is recorded and the recovery code deleted, each in a single conditional
	 * statement, so concurrent requests can't reuse them. The caller's transaction must not roll back on ApiException,
	 * so that failures are counted.
	 */
	private boolean checkCode(User user, String rawCode, HttpStatus wrongCodeStatus) {
		String key = LoginLockout.keyFor(user);
		lockout.assertNotLocked(key);
		String code = normalize(rawCode);
		if (code.isEmpty()) throw ApiException.badRequest("Enter the code from your authenticator app, or a recovery code.");
		if (AUTHENTICATOR_CODE.matcher(code).matches()) {
			byte[] secret = decrypt(user.getTwoFactorSecret(), user);
			Instant now = clock.instant();
			long lastStep = user.getTwoFactorLastStep() == null ? Long.MIN_VALUE : user.getTwoFactorLastStep();
			OptionalLong step = Totp.matchingStep(secret, code, now, lastStep);
			if (step.isPresent() && users.markTwoFactorStepUsed(user.getId(), step.getAsLong()) == 1) return false;
			boolean reused = step.isPresent() || Totp.matchingStep(secret, code, now, Long.MIN_VALUE).isPresent();
			throw lockout.recordFailure(key, new ApiException(wrongCodeStatus, reused ? USED_CODE : WRONG_CODE));
		}
		if (recoveryCodes.use(user.getId(), hashRecoveryCode(user, code)) == 1) return true;
		throw lockout.recordFailure(key, new ApiException(wrongCodeStatus, WRONG_RECOVERY_CODE));
	}

	private byte[] decrypt(String stored, User user) {
		if (!cipher.isConfigured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, CANNOT_CHECK_CODES);
		try {
			return cipher.decrypt(stored, user.getId());
		} catch (GeneralSecurityException e) {
			log.error("Could not decrypt the two-factor secret of user {}. Was ayipm.two-factor.encryption-key changed?", user.getId(), e);
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, CANNOT_CHECK_CODES);
		}
	}

	private List<String> replaceRecoveryCodes(User user) {
		recoveryCodes.deleteAllForUser(user.getId());
		Set<String> codes = new LinkedHashSet<>();
		while (codes.size() < RECOVERY_CODE_COUNT) codes.add(newRecoveryCode());
		recoveryCodes.saveAll(codes.stream().map(code -> new RecoveryCode(user, hashRecoveryCode(user, code))).toList());
		int half = RECOVERY_CODE_LENGTH / 2;
		return codes.stream().map(code -> code.substring(0, half) + "-" + code.substring(half)).toList();
	}

	private static String newRecoveryCode() {
		StringBuilder code = new StringBuilder(RECOVERY_CODE_LENGTH);
		for (int i = 0; i < RECOVERY_CODE_LENGTH; i++) code.append(RECOVERY_CODE_ALPHABET.charAt(RANDOM.nextInt(RECOVERY_CODE_ALPHABET.length())));
		return code.toString();
	}

	// Salted with the account id, so equal codes on two accounts don't share a hash.
	private static String hashRecoveryCode(User user, String normalizedCode) {
		return Tokens.hash(user.getId() + ":" + normalizedCode);
	}

	// People type codes with spaces or copy them with the hyphen.
	private static String normalize(String code) {
		return code == null ? "" : code.replaceAll("[\\s-]", "").toLowerCase(Locale.ROOT);
	}

	private void recordAuth(User user, String action) {
		activity.record(user, action, ActivityService.AUTH, user.getId(), user.getName());
	}

}
