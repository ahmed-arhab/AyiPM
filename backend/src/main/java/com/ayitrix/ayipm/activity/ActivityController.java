package com.ayitrix.ayipm.activity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

	private final ActivityService activity;
	private final SessionService sessions;

	public ActivityController(ActivityService activity, SessionService sessions) {
		this.activity = activity;
		this.sessions = sessions;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<ActivityResponse>>> search(
			HttpServletRequest request,
			@RequestParam(required = false) UUID actorId,
			@RequestParam(required = false) String entityType,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "100") int size) {
		return ApiResponse.ok(activity.search(sessions.requireUser(request), actorId, entityType, from, to, page, size));
	}

}
