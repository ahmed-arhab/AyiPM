package com.ayitrix.ayipm.auth;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.Text;
import com.ayitrix.ayipm.employee.EmployeeStatus;
import com.ayitrix.ayipm.employee.Role;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.workspace.Workspace;
import com.ayitrix.ayipm.workspace.WorkspaceRepository;

@Service
public class AuthService {

	private static final Duration INVITE_TTL = Duration.ofDays(7);
	private static final Duration RESET_TTL = Duration.ofMinutes(30);
	private static final int MAX_FAILED_ATTEMPTS = 5;
	private static final Duration ATTEMPT_WINDOW = Duration.ofMinutes(15);
	private static final Duration LOCKOUT = Duration.ofMinutes(15);
	private static final String INVALID_CREDENTIALS = "Incorrect email or password.";

	private final UserRepository users;
	private final WorkspaceRepository workspaces;
	private final InviteRepository invites;
	private final PasswordResetRepository resets;
	private final LoginAttemptRepository attempts;
	private final SessionService sessions;
	private final PasswordHasher hasher;

	public AuthService(UserRepository users, WorkspaceRepository workspaces, InviteRepository invites, PasswordResetRepository resets,
			LoginAttemptRepository attempts, SessionService sessions, PasswordHasher hasher) {
		this.users = users;
		this.workspaces = workspaces;
		this.invites = invites;
		this.resets = resets;
		this.attempts = attempts;
		this.sessions = sessions;
		this.hasher = hasher;
	}

	/** Creates the workspace and its owner. Only allowed while there are no accounts. */
	@Transactional
	public User setupWorkspace(String rawCompanyName, String rawName, String rawEmail, String password) {
		String companyName = Text.trim(rawCompanyName);
		String name = Text.trim(rawName);
		String email = Text.normalizeEmail(rawEmail);
		if (companyName.isEmpty()) throw ApiException.badRequest("Company name is required.");
		if (name.isEmpty()) throw ApiException.badRequest("Your name is required.");
		if (!Text.isValidEmail(email)) throw ApiException.badRequest("Enter a valid work email.");
		PasswordHasher.assertAcceptable(password);
		if (users.count() > 0) throw ApiException.conflict("This workspace has already been set up.");

		Workspace workspace = workspaces.findById(Workspace.DEFAULT_ID).orElseGet(() -> new Workspace(companyName));
		workspace.setCompanyName(companyName);
		workspace = workspaces.save(workspace);

		User owner = new User();
		owner.setName(name);
		owner.setEmail(email);
		owner.setEmployeeId(workspace.getEmployeeIdPrefix() + "001");
		owner.setDepartment("Management");
		owner.setDesignation("Workspace Owner");
		owner.setRole(Role.ADMIN);
		owner.setJoinDate(LocalDate.now());
		owner.setPasswordHash(hasher.hash(password));
		return users.saveAndFlush(owner);
	}

	/**
	 * Checks the credentials. The identifier is a work email or an employee ID. Failed attempts are recorded even
	 * though the request fails.
	 */
	@Transactional(noRollbackFor = ApiException.class)
	public User authenticate(String rawIdentifier, String password) {
		String email = Text.normalizeEmail(rawIdentifier);
		if (email.isEmpty() || password.isEmpty()) throw ApiException.badRequest("Enter your email and password.");
		Optional<User> user = users.findFirstByEmailOrEmployeeId(email, Text.trim(rawIdentifier).toUpperCase());
		String key = user.map(u -> "user:" + u.getId()).orElse("email:" + email);

		Optional<LoginAttempt> attempt = attempts.findById(key);
		Instant lockedUntil = attempt.map(LoginAttempt::getLockedUntil).orElse(null);
		if (lockedUntil != null && lockedUntil.isAfter(Instant.now())) {
			throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, lockedMessage(Duration.between(Instant.now(), lockedUntil)));
		}

		boolean valid = hasher.matches(password, user.map(User::getPasswordHash).orElse(null));
		if (!valid || user.isEmpty()) {
			boolean locked = recordFailure(key, attempt);
			if (locked) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, lockedMessage(LOCKOUT));
			throw new ApiException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
		}
		if (!user.get().isActive()) throw new ApiException(HttpStatus.FORBIDDEN, "This account has been deactivated. Contact your administrator.");

		attempt.ifPresent(attempts::delete);
		return user.get();
	}

	@Transactional
	public AccessLink issueInvite(User user, User createdBy) {
		String token = Tokens.create();
		Instant expiresAt = Instant.now().plus(INVITE_TTL);
		invites.deleteAllForUser(user.getId());
		invites.save(new Invite(Tokens.hash(token), user, createdBy, expiresAt));
		return new AccessLink(token, expiresAt);
	}

	@Transactional
	public AccessLink resendInvite(User user, User createdBy) {
		if (user.hasJoined()) throw ApiException.conflict("This person has already joined. Send a password reset link instead.");
		if (!user.isActive()) throw ApiException.badRequest("Reactivate this account before sending an invitation.");
		return issueInvite(user, createdBy);
	}

	@Transactional
	public AccessLink issuePasswordReset(User user) {
		if (!user.isActive()) throw ApiException.badRequest("Reactivate this account before sending a reset link.");
		if (!user.hasJoined()) throw ApiException.conflict("This person has not accepted their invitation yet. Share a new invite link instead.");
		String token = Tokens.create();
		Instant expiresAt = Instant.now().plus(RESET_TTL);
		resets.deleteAllForUser(user.getId());
		resets.save(new PasswordReset(Tokens.hash(token), user, expiresAt));
		user.setPasswordResetRequestedAt(null);
		users.save(user);
		return new AccessLink(token, expiresAt);
	}

	@Transactional(readOnly = true)
	public Optional<Invite> findInvite(String token) {
		if (token == null || token.isEmpty()) return Optional.empty();
		return invites.findWithUser(Tokens.hash(token))
				.filter(i -> i.getExpiresAt().isAfter(Instant.now()) && !i.getUser().hasJoined() && i.getUser().isActive());
	}

	@Transactional
	public User acceptInvite(String token, String password) {
		PasswordHasher.assertAcceptable(password);
		Invite invite = findInvite(token)
				.orElseThrow(() -> new ApiException(HttpStatus.GONE, "This invitation is invalid or has expired. Ask your admin for a new link."));
		User user = invite.getUser();
		user.setPasswordHash(hasher.hash(password));
		users.save(user);
		invites.deleteAllForUser(user.getId());
		return user;
	}

	@Transactional(readOnly = true)
	public Optional<PasswordReset> findPasswordReset(String token) {
		if (token == null || token.isEmpty()) return Optional.empty();
		return resets.findWithUser(Tokens.hash(token))
				.filter(r -> r.getExpiresAt().isAfter(Instant.now()) && r.getUser().isActive());
	}

	@Transactional
	public void resetPassword(String token, String password) {
		PasswordHasher.assertAcceptable(password);
		PasswordReset reset = findPasswordReset(token)
				.orElseThrow(() -> new ApiException(HttpStatus.GONE, "This reset link is invalid or has expired. Ask your admin for a new one."));
		User user = reset.getUser();
		user.setPasswordHash(hasher.hash(password));
		user.setPasswordResetRequestedAt(null);
		users.save(user);
		resets.deleteAllForUser(user.getId());
		attempts.deleteById("user:" + user.getId());
		sessions.revokeAll(user.getId());
	}

	@Transactional
	public void changePassword(User user, String currentPassword, String newPassword) {
		if (!hasher.matches(currentPassword, user.getPasswordHash())) throw ApiException.badRequest("Current password is incorrect.");
		PasswordHasher.assertAcceptable(newPassword);
		if (newPassword.equals(currentPassword)) throw ApiException.badRequest("New password must be different from the current one.");
		user.setPasswordHash(hasher.hash(newPassword));
		users.save(user);
	}

	/** Flags the account for admins. Never reveals whether the account exists. */
	@Transactional
	public void requestPasswordReset(String rawEmail) {
		String email = Text.normalizeEmail(rawEmail);
		if (!Text.isValidEmail(email)) return;
		users.markResetRequested(email, EmployeeStatus.ACTIVE, Instant.now());
	}

	private boolean recordFailure(String key, Optional<LoginAttempt> previous) {
		Instant now = Instant.now();
		boolean withinWindow = previous.isPresent()
				&& previous.get().getFirstFailedAt() != null
				&& Duration.between(previous.get().getFirstFailedAt(), now).compareTo(ATTEMPT_WINDOW) < 0;
		int failures = withinWindow ? previous.get().getFailures() + 1 : 1;
		boolean locked = failures >= MAX_FAILED_ATTEMPTS;
		LoginAttempt attempt = previous.orElseGet(() -> new LoginAttempt(key));
		attempt.update(locked ? 0 : failures, withinWindow ? previous.get().getFirstFailedAt() : now, locked ? now.plus(LOCKOUT) : null);
		attempts.save(attempt);
		return locked;
	}

	private static String lockedMessage(Duration remaining) {
		long minutes = Math.max(1, (long) Math.ceil(remaining.toMillis() / 60_000.0));
		return "Too many failed attempts. Try again in " + minutes + " minute" + (minutes == 1 ? "" : "s") + ", or ask your admin for a reset link.";
	}

}
