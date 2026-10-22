package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.ApiResponse;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.workspace.WorkspaceService;
import com.ayitrix.ayipm.workspace.WorkspaceSettings;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
public class AuthController {

	private final AuthService auth;
	private final SessionService sessions;
	private final BootstrapService bootstrap;
	private final WorkspaceService workspace;
	private final TwoFactorService twoFactor;

	public AuthController(AuthService auth, SessionService sessions, BootstrapService bootstrap, WorkspaceService workspace, TwoFactorService twoFactor) {
		this.auth = auth;
		this.sessions = sessions;
		this.bootstrap = bootstrap;
		this.workspace = workspace;
		this.twoFactor = twoFactor;
	}

	public record SetupRequest(String companyName, String name, String email, String password) {
	}

	public record LoginRequest(String email, String password, Boolean remember) {
	}

	public record TokenPasswordRequest(String token, String password) {
	}

	public record ForgotRequest(String email) {
	}

	public record ChangePasswordRequest(String currentPassword, String newPassword) {
	}

	public record InviteDetails(String name, String email, String employeeId, String companyName, Instant expiresAt) {
	}

	public record ChallengeRequest(String challenge) {
	}

	public record ChallengeCodeRequest(String challenge, String code) {
	}

	/** Sent by login and invite acceptance instead of a session when a second step is needed. */
	public record TwoFactorRequired(TwoFactorService.Challenge twoFactorChallenge) {
	}

	public record TwoFactorSignIn(BootstrapPayload bootstrap, List<String> recoveryCodes) {
	}

	@GetMapping("/api/setup")
	public ResponseEntity<ApiResponse<Map<String, Boolean>>> setupStatus() {
		return ApiResponse.ok(Map.of("needsSetup", workspace.needsSetup()));
	}

	@PostMapping("/api/setup")
	public ResponseEntity<ApiResponse<BootstrapPayload>> setup(@RequestBody SetupRequest body, HttpServletRequest request, HttpServletResponse response) {
		User owner = auth.setupWorkspace(body.companyName(), body.name(), body.email(), orEmpty(body.password()));
		Instant expiresAt = sessions.start(owner, false, request, response);
		return ApiResponse.created(bootstrap.signedIn(owner, expiresAt));
	}

	/** Answers with the session, or with {@link TwoFactorRequired} when the account needs a code or two-factor setup. */
	@PostMapping("/api/auth/login")
	public ResponseEntity<ApiResponse<Object>> login(@RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
		User user = auth.authenticate(body.email(), orEmpty(body.password()));
		boolean remember = Boolean.TRUE.equals(body.remember());
		Optional<TwoFactorService.Challenge> challenge = twoFactor.challengeFor(user, remember);
		if (challenge.isPresent()) return ApiResponse.ok(new TwoFactorRequired(challenge.get()));
		return ApiResponse.ok(signIn(user, remember, false, request, response));
	}

	@PostMapping("/api/auth/login/two-factor")
	public ResponseEntity<ApiResponse<BootstrapPayload>> loginWithCode(@RequestBody ChallengeCodeRequest body, HttpServletRequest request,
			HttpServletResponse response) {
		TwoFactorService.SignIn done = twoFactor.completeSignIn(orEmpty(body.challenge()).trim(), orEmpty(body.code()));
		return ApiResponse.ok(signIn(done.user(), done.remember(), done.usedRecoveryCode(), request, response));
	}

	@PostMapping("/api/auth/login/two-factor/setup")
	public ResponseEntity<ApiResponse<TwoFactorService.Setup>> startTwoFactorSetupAtLogin(@RequestBody ChallengeRequest body) {
		return ApiResponse.ok(twoFactor.startSetupForSignIn(orEmpty(body.challenge()).trim()));
	}

	@PostMapping("/api/auth/login/two-factor/confirm")
	public ResponseEntity<ApiResponse<TwoFactorSignIn>> confirmTwoFactorSetupAtLogin(@RequestBody ChallengeCodeRequest body, HttpServletRequest request,
			HttpServletResponse response) {
		TwoFactorService.SignIn done = twoFactor.confirmSetupForSignIn(orEmpty(body.challenge()).trim(), orEmpty(body.code()));
		return ApiResponse.ok(new TwoFactorSignIn(signIn(done.user(), done.remember(), false, request, response), done.recoveryCodes()));
	}

	@PostMapping("/api/auth/logout")
	public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) {
		sessions.current(request).ifPresent(s -> auth.signedOut(s.user()));
		sessions.end(request, response);
		return ApiResponse.ok(null);
	}

	@GetMapping("/api/auth/session")
	public ResponseEntity<ApiResponse<BootstrapPayload>> session(HttpServletRequest request) {
		return ApiResponse.ok(sessions.current(request)
				.map(s -> bootstrap.signedIn(s.user(), s.expiresAt()))
				.orElseGet(bootstrap::signedOut));
	}

	@GetMapping("/api/auth/invite")
	public ResponseEntity<ApiResponse<InviteDetails>> inviteDetails(@RequestParam(defaultValue = "") String token) {
		Invite invite = auth.findInvite(token).orElseThrow(() -> new ApiException(HttpStatus.GONE, "This invitation is invalid or has expired."));
		User user = invite.getUser();
		String companyName = workspace.getSettings().map(WorkspaceSettings::companyName).orElse("AyiPM");
		return ApiResponse.ok(new InviteDetails(user.getName(), user.getEmail(), user.getEmployeeId(), companyName, invite.getExpiresAt()));
	}

	/** Like login, answers with {@link TwoFactorRequired} when a new admin has to set up two-factor authentication first. */
	@PostMapping("/api/auth/invite")
	public ResponseEntity<ApiResponse<Object>> acceptInvite(@RequestBody TokenPasswordRequest body, HttpServletRequest request, HttpServletResponse response) {
		User user = auth.acceptInvite(orEmpty(body.token()).trim(), orEmpty(body.password()));
		Optional<TwoFactorService.Challenge> challenge = twoFactor.challengeFor(user, false);
		if (challenge.isPresent()) return ApiResponse.ok(new TwoFactorRequired(challenge.get()));
		Instant expiresAt = sessions.start(user, false, request, response);
		return ApiResponse.ok(bootstrap.signedIn(user, expiresAt));
	}

	@GetMapping("/api/auth/reset")
	public ResponseEntity<ApiResponse<Map<String, String>>> resetDetails(@RequestParam(defaultValue = "") String token) {
		PasswordReset reset = auth.findPasswordReset(token).orElseThrow(() -> new ApiException(HttpStatus.GONE, "This reset link is invalid or has expired."));
		return ApiResponse.ok(Map.of("name", reset.getUser().getName()));
	}

	@PostMapping("/api/auth/reset")
	public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody TokenPasswordRequest body) {
		auth.resetPassword(orEmpty(body.token()).trim(), orEmpty(body.password()));
		return ApiResponse.ok(null);
	}

	@PostMapping("/api/auth/forgot")
	public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody ForgotRequest body) {
		auth.requestPasswordReset(body.email());
		return ApiResponse.ok(null);
	}

	@PostMapping("/api/auth/password")
	public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody ChangePasswordRequest body, HttpServletRequest request) {
		User user = sessions.requireUser(request);
		auth.changePassword(user, orEmpty(body.currentPassword()), orEmpty(body.newPassword()));
		return ApiResponse.ok(null);
	}

	private BootstrapPayload signIn(User user, boolean remember, boolean usedRecoveryCode, HttpServletRequest request, HttpServletResponse response) {
		auth.signedIn(user, usedRecoveryCode);
		Instant expiresAt = sessions.start(user, remember, request, response);
		return bootstrap.signedIn(user, expiresAt);
	}

	private static String orEmpty(String value) {
		return value == null ? "" : value;
	}

}
