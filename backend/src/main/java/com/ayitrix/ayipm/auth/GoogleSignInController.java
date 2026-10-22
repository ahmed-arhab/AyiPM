package com.ayitrix.ayipm.auth;

import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

import com.ayitrix.ayipm.auth.GoogleSignInException.Failure;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.ApiResponse;
import com.ayitrix.ayipm.common.TooManyRequestsException;
import com.ayitrix.ayipm.employee.User;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * "Continue with Google". The browser navigates to these endpoints rather than calling them with fetch, so they answer
 * with redirects: to Google, to the dashboard, or to the login page with {@code ?google=} and a code that the login page
 * turns into a message. The Origin check doesn't apply to these GET requests; the cookie that the start sets is what
 * ties Google's answer to the browser that asked for it.
 */
@RestController
@SecurityRequirements
public class GoogleSignInController {

	static final String SIGN_IN_COOKIE = "ayipm_google_sign_in";
	static final String TWO_FACTOR_COOKIE = "ayipm_google_two_factor";
	// The cookies are only sent to these endpoints.
	private static final String COOKIE_PATH = "/api/auth/google";
	// The same pages as ROUTES.login and ROUTES.dashboard in the frontend's src/constants/navigation.ts. Relative, so the
	// browser stays at the address it uses.
	private static final String LOGIN_PATH = "/login";
	private static final String DASHBOARD_PATH = "/dashboard";
	private static final Logger log = LoggerFactory.getLogger(GoogleSignInController.class);

	private final GoogleSignInService google;
	private final TwoFactorService twoFactor;
	private final AuthService auth;
	private final SessionService sessions;
	private final SignInRateLimit rateLimit;
	private final Clock clock;

	public GoogleSignInController(GoogleSignInService google, TwoFactorService twoFactor, AuthService auth, SessionService sessions,
			SignInRateLimit rateLimit, Clock clock) {
		this.google = google;
		this.twoFactor = twoFactor;
		this.auth = auth;
		this.sessions = sessions;
		this.rateLimit = rateLimit;
		this.clock = clock;
	}

	@Operation(summary = "Start signing in with Google", description = "Redirects to Google, which sends the browser back to "
			+ GoogleOidcClient.CALLBACK_PATH + ". With an invitation's token, accepts that invitation.")
	@GetMapping("/api/auth/google/start")
	public ResponseEntity<Void> start(@RequestParam(defaultValue = "") String invite, HttpServletRequest request, HttpServletResponse response) {
		try {
			rateLimit.check("google", request);
			GoogleSignInService.Started started = google.start(invite.trim());
			writeCookie(request, response, SIGN_IN_COOKIE, started.browserToken(), GoogleSignInService.TTL);
			return redirect(started.authorizationUri());
		} catch (TooManyRequestsException e) {
			return toLogin(Failure.TOO_MANY_ATTEMPTS);
		} catch (GoogleSignInException e) {
			return toLogin(e.failure());
		} catch (RuntimeException e) {
			log.error("Could not start a sign-in with Google.", e);
			return toLogin(Failure.FAILED);
		}
	}

	@Operation(summary = "Finish signing in with Google", description = "Google sends the browser here. Starts a session and redirects to the "
			+ "dashboard, or redirects to the login page for a two-factor code or with what went wrong.")
	@GetMapping(GoogleOidcClient.CALLBACK_PATH)
	public ResponseEntity<Void> callback(@RequestParam(required = false) String state, @RequestParam(required = false) String code,
			@RequestParam(required = false) String error, HttpServletRequest request, HttpServletResponse response) {
		String browserToken = readCookie(request, SIGN_IN_COOKIE);
		writeCookie(request, response, SIGN_IN_COOKIE, "", Duration.ZERO);
		try {
			User user = google.finish(browserToken, state, code, error);
			// Like a password, Google only replaces the first step: an account with two-factor authentication still needs a code.
			Optional<TwoFactorService.Challenge> challenge = twoFactor.challengeFor(user, false);
			if (challenge.isPresent()) {
				Duration left = Duration.between(clock.instant(), challenge.get().expiresAt());
				writeCookie(request, response, TWO_FACTOR_COOKIE, challenge.get().token(), left);
				return redirect(URI.create(LOGIN_PATH + "?google=two-factor"));
			}
			auth.signedIn(user, GoogleSignInService.WITH_GOOGLE);
			sessions.start(user, false, request, response);
			return redirect(URI.create(DASHBOARD_PATH));
		} catch (GoogleSignInException e) {
			return toLogin(e.failure());
		} catch (RuntimeException e) {
			log.error("Sign-in with Google failed.", e);
			return toLogin(Failure.FAILED);
		}
	}

	/** Hands the login page the challenge that the callback started, once. */
	@Operation(summary = "Get the two-factor step of a sign-in with Google", description = "After the callback redirected to the login page with "
			+ "google=two-factor. Finish it like a password sign-in, with /api/auth/login/two-factor or its setup steps.")
	@PostMapping("/api/auth/google/two-factor")
	public ResponseEntity<ApiResponse<TwoFactorService.PendingSignIn>> twoFactorStep(HttpServletRequest request, HttpServletResponse response) {
		String token = readCookie(request, TWO_FACTOR_COOKIE);
		writeCookie(request, response, TWO_FACTOR_COOKIE, "", Duration.ZERO);
		return ApiResponse.ok(twoFactor.pendingSignIn(token)
				.orElseThrow(() -> new ApiException(HttpStatus.GONE, "This sign-in has expired. Continue with Google again.")));
	}

	private static ResponseEntity<Void> toLogin(Failure failure) {
		return redirect(URI.create(failure == Failure.CANCELLED ? LOGIN_PATH : LOGIN_PATH + "?google=" + failure.code()));
	}

	private static ResponseEntity<Void> redirect(URI location) {
		return ResponseEntity.status(HttpStatus.FOUND).location(location).cacheControl(CacheControl.noStore()).build();
	}

	private static String readCookie(HttpServletRequest request, String name) {
		Cookie cookie = WebUtils.getCookie(request, name);
		return cookie == null ? "" : cookie.getValue();
	}

	// SameSite=Lax, so the browser sends it when Google redirects back, which is a top-level navigation from another site.
	private static void writeCookie(HttpServletRequest request, HttpServletResponse response, String name, String value, Duration maxAge) {
		ResponseCookie cookie = ResponseCookie.from(name, value)
				.httpOnly(true)
				.secure(request.isSecure())
				.sameSite("Lax")
				.path(COOKIE_PATH)
				.maxAge(maxAge.isNegative() ? Duration.ZERO : maxAge)
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

}
