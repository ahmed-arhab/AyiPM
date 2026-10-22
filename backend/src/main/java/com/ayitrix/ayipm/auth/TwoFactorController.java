package com.ayitrix.ayipm.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.common.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

/** The signed-in person's own two-factor authentication. Signing in with a code is in {@link AuthController}. */
@RestController
@RequestMapping("/api/auth/two-factor")
public class TwoFactorController {

	private final TwoFactorService twoFactor;
	private final SessionService sessions;

	public TwoFactorController(TwoFactorService twoFactor, SessionService sessions) {
		this.twoFactor = twoFactor;
		this.sessions = sessions;
	}

	public record CodeRequest(String code) {
	}

	@GetMapping
	public ResponseEntity<ApiResponse<TwoFactorService.Status>> status(HttpServletRequest request) {
		return ApiResponse.ok(twoFactor.status(sessions.requireUser(request)));
	}

	@PostMapping("/setup")
	public ResponseEntity<ApiResponse<TwoFactorService.Setup>> startSetup(HttpServletRequest request) {
		return ApiResponse.ok(twoFactor.startSetup(sessions.requireUser(request)));
	}

	@PostMapping("/confirm")
	public ResponseEntity<ApiResponse<TwoFactorService.NewRecoveryCodes>> confirmSetup(HttpServletRequest request, @RequestBody CodeRequest body) {
		return ApiResponse.ok(twoFactor.confirmSetup(sessions.requireUser(request), body.code()));
	}

	@PostMapping("/disable")
	public ResponseEntity<ApiResponse<TwoFactorService.Status>> disable(HttpServletRequest request, @RequestBody CodeRequest body) {
		return ApiResponse.ok(twoFactor.disable(sessions.requireUser(request), body.code()));
	}

	@PostMapping("/recovery-codes")
	public ResponseEntity<ApiResponse<TwoFactorService.NewRecoveryCodes>> regenerateRecoveryCodes(HttpServletRequest request, @RequestBody CodeRequest body) {
		return ApiResponse.ok(twoFactor.regenerateRecoveryCodes(sessions.requireUser(request), body.code()));
	}

}
