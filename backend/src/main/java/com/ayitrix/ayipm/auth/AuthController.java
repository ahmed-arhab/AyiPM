package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.Map;

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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Setup and sign-in work without a session, so unlike the rest of the API these endpoints don't require one. */
@RestController
@SecurityRequirements
public class AuthController {

	private final AuthService auth;
	private final SessionService sessions;
	private final BootstrapService bootstrap;
	private final WorkspaceService workspace;

	public AuthController(AuthService auth, SessionService sessions, BootstrapService bootstrap, WorkspaceService workspace) {
		this.auth = auth;
		this.sessions = sessions;
		this.bootstrap = bootstrap;
		this.workspace = workspace;
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

	@Operation(summary = "Check whether the workspace still needs to be set up")
	@GetMapping("/api/setup")
	public ResponseEntity<ApiResponse<Map<String, Boolean>>> setupStatus() {
		return ApiResponse.ok(Map.of("needsSetup", workspace.needsSetup()));
	}

	@Operation(summary = "Create the workspace and its owner account, and sign in as the owner", description = "Works only once; after that it fails with 409.")
	@PostMapping("/api/setup")
	public ResponseEntity<ApiResponse<BootstrapPayload>> setup(@RequestBody SetupRequest body, HttpServletRequest request, HttpServletResponse response) {
		User owner = auth.setupWorkspace(body.companyName(), body.name(), body.email(), orEmpty(body.password()));
		Instant expiresAt = sessions.start(owner, false, request, response);
		return ApiResponse.created(bootstrap.signedIn(owner, expiresAt));
	}

	@Operation(summary = "Sign in with an email or Employee ID", description = "Sets the session cookie, which the browser then sends with every request.")
	@PostMapping("/api/auth/login")
	public ResponseEntity<ApiResponse<BootstrapPayload>> login(@RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
		User user = auth.authenticate(body.email(), orEmpty(body.password()));
		Instant expiresAt = sessions.start(user, Boolean.TRUE.equals(body.remember()), request, response);
		return ApiResponse.ok(bootstrap.signedIn(user, expiresAt));
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

	@Operation(summary = "Look up an invitation by its token")
	@GetMapping("/api/auth/invite")
	public ResponseEntity<ApiResponse<InviteDetails>> inviteDetails(@RequestParam(defaultValue = "") String token) {
		Invite invite = auth.findInvite(token).orElseThrow(() -> new ApiException(HttpStatus.GONE, "This invitation is invalid or has expired."));
		User user = invite.getUser();
		String companyName = workspace.getSettings().map(WorkspaceSettings::companyName).orElse("AyiPM");
		return ApiResponse.ok(new InviteDetails(user.getName(), user.getEmail(), user.getEmployeeId(), companyName, invite.getExpiresAt()));
	}

	@Operation(summary = "Accept an invitation by choosing a password, and sign in")
	@PostMapping("/api/auth/invite")
	public ResponseEntity<ApiResponse<BootstrapPayload>> acceptInvite(@RequestBody TokenPasswordRequest body, HttpServletRequest request, HttpServletResponse response) {
		User user = auth.acceptInvite(orEmpty(body.token()).trim(), orEmpty(body.password()));
		Instant expiresAt = sessions.start(user, false, request, response);
		return ApiResponse.ok(bootstrap.signedIn(user, expiresAt));
	}

	@Operation(summary = "Look up a password reset link by its token")
	@GetMapping("/api/auth/reset")
	public ResponseEntity<ApiResponse<Map<String, String>>> resetDetails(@RequestParam(defaultValue = "") String token) {
		PasswordReset reset = auth.findPasswordReset(token).orElseThrow(() -> new ApiException(HttpStatus.GONE, "This reset link is invalid or has expired."));
		return ApiResponse.ok(Map.of("name", reset.getUser().getName()));
	}

	@Operation(summary = "Set a new password with a reset link's token")
	@PostMapping("/api/auth/reset")
	public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody TokenPasswordRequest body) {
		auth.resetPassword(orEmpty(body.token()).trim(), orEmpty(body.password()));
		return ApiResponse.ok(null);
	}

	@Operation(summary = "Ask an admin for a password reset link", description = "Marks the person's profile as Reset requested.")
	@PostMapping("/api/auth/forgot")
	public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody ForgotRequest body) {
		auth.requestPasswordReset(body.email());
		return ApiResponse.ok(null);
	}

	@SecurityRequirement(name = SessionService.COOKIE_NAME)
	@PostMapping("/api/auth/password")
	public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody ChangePasswordRequest body, HttpServletRequest request) {
		User user = sessions.requireUser(request);
		auth.changePassword(user, orEmpty(body.currentPassword()), orEmpty(body.newPassword()));
		return ApiResponse.ok(null);
	}

	private static String orEmpty(String value) {
		return value == null ? "" : value;
	}

}
