package com.ayitrix.ayipm.preferences;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

/** The signed-in person's own preferences. The theme stays in the browser, because it's chosen per device. */
@RestController
@RequestMapping("/api/me/preferences")
public class PreferencesController {

	private final PreferencesService preferences;
	private final SessionService sessions;

	public PreferencesController(PreferencesService preferences, SessionService sessions) {
		this.preferences = preferences;
		this.sessions = sessions;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<PreferencesResponse>> get(HttpServletRequest request) {
		return ApiResponse.ok(preferences.get(sessions.requireUser(request).getId()));
	}

	@PatchMapping
	public ResponseEntity<ApiResponse<PreferencesResponse>> update(HttpServletRequest request, @RequestBody PreferencesResponse body) {
		return ApiResponse.ok(preferences.update(sessions.requireUser(request).getId(), body));
	}

	@DeleteMapping
	public ResponseEntity<ApiResponse<PreferencesResponse>> reset(HttpServletRequest request) {
		return ApiResponse.ok(preferences.reset(sessions.requireUser(request).getId()));
	}

}
