package com.ayitrix.ayipm.employee;

import java.util.List;
import java.util.Map;

import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.AccessLink;
import com.ayitrix.ayipm.auth.AuthService;
import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

	private final EmployeeService employees;
	private final AuthService auth;
	private final SessionService sessions;

	public EmployeeController(EmployeeService employees, AuthService auth, SessionService sessions) {
		this.employees = employees;
		this.auth = auth;
		this.sessions = sessions;
	}

	/** {@code invite} is null when the person was given a password and can sign in straight away. */
	public record CreatedEmployee(EmployeeResponse employee, @Nullable AccessLink invite) {
	}

	public record RoleChange(String role) {
	}

	public record StatusChange(String status) {
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<EmployeeResponse>>> list(HttpServletRequest request) {
		sessions.requireUser(request);
		return ApiResponse.ok(employees.listAll().stream().map(EmployeeResponse::from).toList());
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ResponseEntity<ApiResponse<CreatedEmployee>> create(HttpServletRequest request, @RequestBody CreateEmployeeRequest body) {
		User actor = sessions.requireUser(request, Permission.EMPLOYEES_MANAGE);
		User user = employees.create(actor, body);
		AccessLink invite = user.hasJoined() ? null : auth.issueInvite(user, actor);
		return ApiResponse.created(new CreatedEmployee(EmployeeResponse.from(user), invite));
	}

	@PatchMapping("/{id}")
	public ResponseEntity<ApiResponse<EmployeeResponse>> update(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> body) {
		User actor = sessions.requireUser(request);
		return ApiResponse.ok(EmployeeResponse.from(employees.updateProfile(actor, id, body)));
	}

	@PutMapping("/{id}/role")
	public ResponseEntity<ApiResponse<EmployeeResponse>> changeRole(HttpServletRequest request, @PathVariable String id, @RequestBody RoleChange body) {
		User actor = sessions.requireUser(request, Permission.EMPLOYEES_MANAGE);
		return ApiResponse.ok(EmployeeResponse.from(employees.changeRole(actor, id, body.role())));
	}

	@PutMapping("/{id}/status")
	public ResponseEntity<ApiResponse<EmployeeResponse>> changeStatus(HttpServletRequest request, @PathVariable String id, @RequestBody StatusChange body) {
		User actor = sessions.requireUser(request, Permission.EMPLOYEES_MANAGE);
		return ApiResponse.ok(EmployeeResponse.from(employees.changeStatus(actor, id, body.status())));
	}

	@Operation(summary = "Issue a fresh invitation link for someone who hasn't joined yet")
	@PostMapping("/{id}/invite")
	public ResponseEntity<ApiResponse<AccessLink>> resendInvite(HttpServletRequest request, @PathVariable String id) {
		User actor = sessions.requireUser(request, Permission.EMPLOYEES_MANAGE);
		return ApiResponse.ok(auth.resendInvite(employees.get(id), actor));
	}

	@Operation(summary = "Issue a one-time password reset link", description = "Emails the link to the person when email is set up. The admin can also share it themselves.")
	@PostMapping("/{id}/reset-link")
	public ResponseEntity<ApiResponse<AccessLink>> resetLink(HttpServletRequest request, @PathVariable String id) {
		User actor = sessions.requireUser(request, Permission.EMPLOYEES_MANAGE);
		return ApiResponse.ok(auth.issuePasswordReset(actor, employees.get(id)));
	}

}
