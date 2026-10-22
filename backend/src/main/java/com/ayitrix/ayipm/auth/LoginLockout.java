package com.ayitrix.ayipm.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.employee.User;

/**
 * The temporary lockout after repeated failed sign-ins. Wrong passwords and wrong two-factor codes count together, so
 * knowing the password doesn't allow unlimited guesses at the code.
 */
@Component
class LoginLockout {

	private static final int MAX_FAILED_ATTEMPTS = 5;
	private static final Duration ATTEMPT_WINDOW = Duration.ofMinutes(15);
	private static final Duration LOCKOUT = Duration.ofMinutes(15);

	private final LoginAttemptRepository attempts;
	private final Clock clock;

	LoginLockout(LoginAttemptRepository attempts, Clock clock) {
		this.attempts = attempts;
		this.clock = clock;
	}

	static String keyFor(User user) {
		return "user:" + user.getId();
	}

	/** Fails with 429 while the key is locked. */
	void assertNotLocked(String key) {
		Instant now = clock.instant();
		Instant lockedUntil = attempts.findById(key).map(LoginAttempt::getLockedUntil).orElse(null);
		if (lockedUntil != null && lockedUntil.isAfter(now)) throw locked(Duration.between(now, lockedUntil));
	}

	/**
	 * Counts a failure and returns the error to throw: 429 when this failure locks the key, {@code otherwise} before
	 * that. The caller's transaction must not roll back, or the failure is lost.
	 */
	ApiException recordFailure(String key, ApiException otherwise) {
		Instant now = clock.instant();
		Optional<LoginAttempt> previous = attempts.findById(key);
		boolean withinWindow = previous.isPresent()
				&& previous.get().getFirstFailedAt() != null
				&& Duration.between(previous.get().getFirstFailedAt(), now).compareTo(ATTEMPT_WINDOW) < 0;
		int failures = withinWindow ? previous.get().getFailures() + 1 : 1;
		boolean locked = failures >= MAX_FAILED_ATTEMPTS;
		LoginAttempt attempt = previous.orElseGet(() -> new LoginAttempt(key));
		attempt.update(locked ? 0 : failures, withinWindow ? previous.get().getFirstFailedAt() : now, locked ? now.plus(LOCKOUT) : null);
		attempts.save(attempt);
		return locked ? locked(LOCKOUT) : otherwise;
	}

	void clear(String key) {
		attempts.deleteById(key);
	}

	private static ApiException locked(Duration remaining) {
		long minutes = Math.max(1, (long) Math.ceil(remaining.toMillis() / 60_000.0));
		return new ApiException(HttpStatus.TOO_MANY_REQUESTS,
				"Too many failed attempts. Try again in " + minutes + " minute" + (minutes == 1 ? "" : "s") + ", or ask your admin for a reset link.");
	}

}
