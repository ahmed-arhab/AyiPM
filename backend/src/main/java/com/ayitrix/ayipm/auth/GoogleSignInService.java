package com.ayitrix.ayipm.auth;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.ayitrix.ayipm.activity.ActivityService;
import com.ayitrix.ayipm.auth.GoogleSignInException.Failure;
import com.ayitrix.ayipm.common.Text;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.workspace.WorkspaceService;

/**
 * Sign-in with Google for people who already have an account or an invitation; it never creates accounts.
 *
 * <p>Starting a sign-in gives the browser a random token in a cookie. The state, nonce and PKCE verifier are derived
 * from that token, and only its hash is stored, so Google's answer is accepted once, only in the browser that started
 * the sign-in, and only within {@link #TTL}. That is what stops someone from sending their own Google answer to
 * another person's browser to sign them in to the wrong account.
 */
@Service
public class GoogleSignInService {

	static final Duration TTL = Duration.ofMinutes(10);
	static final String WITH_GOOGLE = "With Google";
	private static final Logger log = LoggerFactory.getLogger(GoogleSignInService.class);

	private final GoogleOidcClient google;
	private final GoogleSignInRepository signIns;
	private final UserRepository users;
	private final InviteRepository invites;
	private final AuthService auth;
	private final WorkspaceService workspace;
	private final ActivityService activity;
	private final Clock clock;
	private final TransactionTemplate transaction;

	GoogleSignInService(GoogleOidcClient google, GoogleSignInRepository signIns, UserRepository users, InviteRepository invites, AuthService auth,
			WorkspaceService workspace, ActivityService activity, Clock clock, PlatformTransactionManager transactionManager) {
		this.google = google;
		this.signIns = signIns;
		this.users = users;
		this.invites = invites;
		this.auth = auth;
		this.workspace = workspace;
		this.activity = activity;
		this.clock = clock;
		this.transaction = new TransactionTemplate(transactionManager);
	}

	/** Where to send the browser, and the token for its cookie. */
	record Started(URI authorizationUri, String browserToken) {
	}

	/** Starts a sign-in. With an invitation's token, only the invited person's Google account can finish it. */
	Started start(String inviteToken) {
		if (!google.isConfigured()) throw new GoogleSignInException(Failure.UNAVAILABLE);
		User invited = null;
		if (!inviteToken.isEmpty()) {
			invited = auth.findInvite(inviteToken).map(Invite::getUser).orElseThrow(() -> new GoogleSignInException(Failure.INVITE_EXPIRED));
		}
		String token = Tokens.create();
		URI uri = google.authorizationUri(derive("state", token), derive("nonce", token), derive("pkce", token),
				workspace.allowedGoogleDomain().orElse(null), invited == null ? null : invited.getEmail());
		signIns.save(new GoogleSignIn(Tokens.hash(token), invited, clock.instant().plus(TTL)));
		return new Started(uri, token);
	}

	/**
	 * Checks Google's answer and returns the account it signs in to, linking the Google account to it the first time
	 * and accepting a pending invitation. The caller still has to ask for a two-factor code if the account needs one.
	 */
	User finish(String browserToken, String state, String code, String error) {
		UUID invitedUserId = consume(browserToken, state);
		if (error != null) {
			if ("access_denied".equals(error)) throw new GoogleSignInException(Failure.CANCELLED);
			log.warn("Sign-in with Google failed. Google answered with the error \"{}\".", error);
			throw new GoogleSignInException(Failure.FAILED);
		}
		if (code == null || code.isBlank()) throw new GoogleSignInException(Failure.FAILED);
		GoogleOidcClient.Identity identity = google.exchange(code, derive("pkce", browserToken), derive("nonce", browserToken));
		return transaction.execute(status -> signInAs(identity, invitedUserId));
	}

	/** Uses up the sign-in started in this browser, and returns the invited person's id, if it started from an invitation. */
	private UUID consume(String browserToken, String state) {
		if (browserToken.isEmpty()) throw new GoogleSignInException(Failure.EXPIRED);
		record Consumed(Instant expiresAt, UUID invitedUserId) {
		}
		// Deleted in its own transaction, so it stays used up even when the rest fails.
		Optional<Consumed> consumed = transaction.execute(status -> signIns.lockByTokenHash(Tokens.hash(browserToken)).map(signIn -> {
			signIns.delete(signIn);
			return new Consumed(signIn.getExpiresAt(), signIn.getInvitedUser() == null ? null : signIn.getInvitedUser().getId());
		}));
		if (consumed.isEmpty() || !consumed.get().expiresAt().isAfter(clock.instant()) || state == null
				|| !MessageDigest.isEqual(derive("state", browserToken).getBytes(StandardCharsets.UTF_8), state.getBytes(StandardCharsets.UTF_8))) {
			throw new GoogleSignInException(Failure.EXPIRED);
		}
		return consumed.get().invitedUserId();
	}

	private User signInAs(GoogleOidcClient.Identity identity, UUID invitedUserId) {
		String email = Text.normalizeEmail(identity.email());
		if (!identity.emailVerified() || !Text.isValidEmail(email)) {
			log.warn("Sign-in with Google failed. Google hasn't verified the address {}.", email);
			throw new GoogleSignInException(Failure.FAILED);
		}
		Optional<String> domain = workspace.allowedGoogleDomain();
		if (domain.isPresent() && !domain.get().equalsIgnoreCase(Text.trim(identity.hostedDomain()))) throw refuse(Failure.WRONG_DOMAIN, email);
		if (invitedUserId != null && !users.findById(invitedUserId).map(User::getEmail).orElse("").equals(email)) {
			throw refuse(Failure.INVITE_MISMATCH, email);
		}

		User user = users.lockByEmail(email).orElseThrow(() -> refuse(Failure.NOT_INVITED, email));
		if (!user.isActive()) throw refuse(Failure.DEACTIVATED, email);
		boolean linkedToAnother = user.getGoogleSubject() != null && !user.getGoogleSubject().equals(identity.subject());
		boolean subjectTaken = users.findByGoogleSubject(identity.subject()).filter(other -> !other.getId().equals(user.getId())).isPresent();
		if (linkedToAnother || subjectTaken) throw refuse(Failure.LINKED_ELSEWHERE, email);

		if (!user.hasJoined()) {
			// Same check as AuthService.findInvite, except that any open invitation of this person will do.
			if (!invites.hasOpenInvite(user.getId(), Instant.now())) throw refuse(Failure.INVITE_EXPIRED, email);
			user.setGoogleSubject(identity.subject());
			users.save(user);
			invites.deleteAllForUser(user.getId());
			activity.record(user, "Accepted Invitation", ActivityService.AUTH, user.getId(), user.getName(), WITH_GOOGLE);
		} else if (user.getGoogleSubject() == null) {
			user.setGoogleSubject(identity.subject());
			users.save(user);
			activity.record(user, "Linked Google Account", ActivityService.AUTH, user.getId(), user.getName());
		}
		return user;
	}

	private static GoogleSignInException refuse(Failure failure, String email) {
		log.info("Refused sign-in with Google for {}: {}", email, failure.code());
		return new GoogleSignInException(failure);
	}

	// Each value is a hash of the cookie's token, so it can't be guessed without the cookie, and the token can't be worked
	// out from the state and nonce that pass through the browser's address bar.
	private static String derive(String purpose, String browserToken) {
		return Tokens.hash(purpose + ":" + browserToken);
	}

}
