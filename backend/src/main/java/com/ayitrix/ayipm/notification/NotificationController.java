package com.ayitrix.ayipm.notification;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

/** Every endpoint works only on the signed-in person's own notifications. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

	private final NotificationService notifications;
	private final SessionService sessions;

	public NotificationController(NotificationService notifications, SessionService sessions) {
		this.notifications = notifications;
		this.sessions = sessions;
	}

	public record ReadChange(boolean read) {
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<NotificationResponse>>> list(HttpServletRequest request) {
		return ApiResponse.ok(notifications.list(me(request)));
	}

	@PatchMapping("/{id}")
	public ResponseEntity<ApiResponse<NotificationResponse>> setRead(HttpServletRequest request, @PathVariable UUID id, @RequestBody ReadChange body) {
		return ApiResponse.ok(notifications.setRead(me(request), id, body.read()));
	}

	@PostMapping("/read-all")
	public ResponseEntity<ApiResponse<Void>> markAllRead(HttpServletRequest request) {
		notifications.markAllRead(me(request));
		return ApiResponse.ok(null);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> delete(HttpServletRequest request, @PathVariable UUID id) {
		notifications.delete(me(request), id);
		return ApiResponse.ok(null);
	}

	@DeleteMapping
	public ResponseEntity<ApiResponse<Void>> clear(HttpServletRequest request) {
		notifications.clear(me(request));
		return ApiResponse.ok(null);
	}

	private UUID me(HttpServletRequest request) {
		return sessions.requireUser(request).getId();
	}

}
