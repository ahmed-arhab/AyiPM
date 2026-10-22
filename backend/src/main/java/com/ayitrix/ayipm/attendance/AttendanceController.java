package com.ayitrix.ayipm.attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

	private final AttendanceService attendance;
	private final SessionService sessions;

	public AttendanceController(AttendanceService attendance, SessionService sessions) {
		this.attendance = attendance;
		this.sessions = sessions;
	}

	/** Newest first. {@code from} and {@code to} are inclusive {@code YYYY-MM-DD} dates. */
	@GetMapping
	public ResponseEntity<ApiResponse<List<AttendanceResponse>>> list(
			HttpServletRequest request,
			@RequestParam(required = false) UUID employeeId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		return ApiResponse.ok(attendance.list(sessions.requireUser(request), employeeId, from, to));
	}

	@PostMapping("/check-in")
	public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(HttpServletRequest request,
			@RequestBody(required = false) AttendanceResponse.CheckIn body) {
		return ApiResponse.ok(attendance.checkIn(sessions.requireUser(request), body == null ? null : body.notes()));
	}

	@PostMapping("/check-out")
	public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(HttpServletRequest request) {
		return ApiResponse.ok(attendance.checkOut(sessions.requireUser(request)));
	}

}
