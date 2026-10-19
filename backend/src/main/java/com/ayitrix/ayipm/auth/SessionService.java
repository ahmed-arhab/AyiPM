package com.ayitrix.ayipm.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.WebUtils;

import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.employee.User;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Sessions are random tokens in an httpOnly cookie. The database stores only the token's hash, so signing out or
 * deactivating someone ends their sessions everywhere.
 */
@Service
public class SessionService {

	public static final String COOKIE_NAME = "ayipm_session";
	private static final Duration SESSION_TTL = Duration.ofHours(12);
	private static final Duration REMEMBERED_SESSION_TTL = Duration.ofDays(30);
	private static final Duration TOUCH_INTERVAL = Duration.ofMinutes(5);

	private final SessionRepository sessions;

	public SessionService(SessionRepository sessions) {
		this.sessions = sessions;
	}

	public record CurrentSession(User user, Instant expiresAt) {
	}

	@Transactional
	public Instant start(User user, boolean remember, HttpServletRequest request, HttpServletResponse response) {
		String token = Tokens.create();
		Instant expiresAt = Instant.now().plus(remember ? REMEMBERED_SESSION_TTL : SESSION_TTL);
		sessions.save(new Session(Tokens.hash(token), user, expiresAt));
		writeCookie(request, response, token, Duration.between(Instant.now(), expiresAt));
		return expiresAt;
	}

	@Transactional
	public void end(HttpServletRequest request, HttpServletResponse response) {
		readToken(request).ifPresent(token -> sessions.deleteByTokenHash(Tokens.hash(token)));
		writeCookie(request, response, "", Duration.ZERO);
	}

	@Transactional
	public Optional<CurrentSession> current(HttpServletRequest request) {
		Optional<Session> found = readToken(request).flatMap(token -> sessions.findWithUser(Tokens.hash(token)));
		if (found.isEmpty()) return Optional.empty();
		Session session = found.get();
		User user = session.getUser();
		if (!session.getExpiresAt().isAfter(Instant.now()) || !user.isActive() || !user.hasJoined()) return Optional.empty();
		if (Duration.between(session.getLastSeenAt(), Instant.now()).compareTo(TOUCH_INTERVAL) > 0) session.touch();
		return Optional.of(new CurrentSession(user, session.getExpiresAt()));
	}

	/** Returns the signed-in user, or fails with 401/403. */
	@Transactional
	public User requireUser(HttpServletRequest request, Permission... permissions) {
		User user = current(request)
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please sign in again."))
				.user();
		for (Permission permission : permissions) {
			if (!user.getRole().has(permission)) throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to do that.");
		}
		return user;
	}

	@Transactional
	public void revokeAll(UUID userId) {
		sessions.deleteAllForUser(userId);
	}

	private static Optional<String> readToken(HttpServletRequest request) {
		Cookie cookie = WebUtils.getCookie(request, COOKIE_NAME);
		return cookie == null || cookie.getValue().isEmpty() ? Optional.empty() : Optional.of(cookie.getValue());
	}

	private static void writeCookie(HttpServletRequest request, HttpServletResponse response, String value, Duration maxAge) {
		ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, value)
				.httpOnly(true)
				.secure(request.isSecure())
				.sameSite("Lax")
				.path("/")
				.maxAge(maxAge)
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

}
