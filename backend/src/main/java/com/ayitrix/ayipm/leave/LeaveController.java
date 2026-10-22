package com.ayitrix.ayipm.leave;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/leave")
public class LeaveController {

	private final LeaveService leave;
	private final SessionService sessions;

	public LeaveController(LeaveService leave, SessionService sessions) {
		this.leave = leave;
		this.sessions = sessions;
	}

	public record Rejection(String reason) {
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<LeaveResponse>>> list(HttpServletRequest request) {
		return ApiResponse.ok(leave.list(sessions.requireUser(request)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<LeaveResponse>> submit(HttpServletRequest request, @RequestBody LeaveResponse.Submission body) {
		return ApiResponse.created(leave.submit(sessions.requireUser(request), body));
	}

	@PostMapping("/{id}/approve")
	public ResponseEntity<ApiResponse<LeaveResponse>> approve(HttpServletRequest request, @PathVariable UUID id) {
		return ApiResponse.ok(leave.review(sessions.requireUser(request, Permission.LEAVE_REVIEW), id, LeaveStatus.APPROVED, null));
	}

	@PostMapping("/{id}/reject")
	public ResponseEntity<ApiResponse<LeaveResponse>> reject(HttpServletRequest request, @PathVariable UUID id, @RequestBody Rejection body) {
		return ApiResponse.ok(leave.review(sessions.requireUser(request, Permission.LEAVE_REVIEW), id, LeaveStatus.REJECTED, body.reason()));
	}

	@Operation(summary = "Cancel your own pending request")
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> cancel(HttpServletRequest request, @PathVariable UUID id) {
		leave.cancel(sessions.requireUser(request), id);
		return ApiResponse.ok(null);
	}

	@GetMapping("/balance")
	public ResponseEntity<ApiResponse<LeaveResponse.Balance>> balance(HttpServletRequest request, @RequestParam(required = false) UUID employeeId) {
		return ApiResponse.ok(leave.balance(sessions.requireUser(request), employeeId));
	}

}
