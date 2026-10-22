package com.ayitrix.ayipm.project;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiResponse;
import com.ayitrix.ayipm.employee.User;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class ProjectController {

	private final ProjectService projects;
	private final SessionService sessions;

	public ProjectController(ProjectService projects, SessionService sessions) {
		this.projects = projects;
		this.sessions = sessions;
	}

	public record Assignments(List<String> projectIds) {
	}

	@GetMapping("/api/projects")
	public ResponseEntity<ApiResponse<List<ProjectResponse>>> list(HttpServletRequest request) {
		sessions.requireUser(request);
		return ApiResponse.ok(projects.list().stream().map(ProjectResponse::from).toList());
	}

	@PostMapping("/api/projects")
	public ResponseEntity<ApiResponse<ProjectResponse>> create(HttpServletRequest request, @RequestBody ProjectRequest body) {
		User actor = sessions.requireUser(request, Permission.PROJECTS_MANAGE);
		return ApiResponse.created(ProjectResponse.from(projects.create(actor, body)));
	}

	@PatchMapping("/api/projects/{id}")
	public ResponseEntity<ApiResponse<ProjectResponse>> update(HttpServletRequest request, @PathVariable UUID id, @RequestBody ProjectRequest body) {
		User actor = sessions.requireUser(request, Permission.PROJECTS_MANAGE);
		return ApiResponse.ok(ProjectResponse.from(projects.update(actor, id, body)));
	}

	@DeleteMapping("/api/projects/{id}")
	public ResponseEntity<ApiResponse<Void>> delete(HttpServletRequest request, @PathVariable UUID id) {
		User actor = sessions.requireUser(request, Permission.PROJECTS_MANAGE);
		projects.delete(actor, id);
		return ApiResponse.ok(null);
	}

	@Operation(summary = "Replace the projects this person belongs to", description = "Returns every project, since several may have changed.")
	@PutMapping("/api/employees/{id}/projects")
	public ResponseEntity<ApiResponse<List<ProjectResponse>>> assign(HttpServletRequest request, @PathVariable UUID id, @RequestBody Assignments body) {
		User actor = sessions.requireUser(request, Permission.PROJECTS_MANAGE);
		projects.setAssignments(actor, id, body.projectIds());
		return ApiResponse.ok(projects.list().stream().map(ProjectResponse::from).toList());
	}

}
