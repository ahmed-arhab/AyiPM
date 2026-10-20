package com.ayitrix.ayipm.task;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiResponse;
import com.ayitrix.ayipm.employee.User;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

	private final TaskService tasks;
	private final SessionService sessions;

	public TaskController(TaskService tasks, SessionService sessions) {
		this.tasks = tasks;
		this.sessions = sessions;
	}

	public record Move(String status, Integer index) {
	}

	public record NewComment(String text) {
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<TaskResponse>>> list(HttpServletRequest request, @RequestParam(required = false) UUID projectId) {
		sessions.requireUser(request);
		return ApiResponse.ok(tasks.list(projectId));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<TaskResponse>> create(HttpServletRequest request, @RequestBody TaskRequest body) {
		User actor = sessions.requireUser(request, Permission.TASKS_MANAGE);
		return ApiResponse.created(tasks.create(actor, body));
	}

	/** Managers can change any field; an assignee may only change the status of their own task. */
	@PatchMapping("/{id}")
	public ResponseEntity<ApiResponse<TaskResponse>> update(HttpServletRequest request, @PathVariable UUID id, @RequestBody TaskRequest body) {
		return ApiResponse.ok(tasks.update(sessions.requireUser(request), id, body));
	}

	/** Drag and drop on the board. Returns every task in the target column. */
	@PostMapping("/{id}/move")
	public ResponseEntity<ApiResponse<List<TaskResponse>>> move(HttpServletRequest request, @PathVariable UUID id, @RequestBody Move body) {
		return ApiResponse.ok(tasks.move(sessions.requireUser(request), id, body.status(), body.index()));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> delete(HttpServletRequest request, @PathVariable UUID id) {
		tasks.delete(sessions.requireUser(request, Permission.TASKS_MANAGE), id);
		return ApiResponse.ok(null);
	}

	@PostMapping("/{id}/comments")
	public ResponseEntity<ApiResponse<TaskResponse>> comment(HttpServletRequest request, @PathVariable UUID id, @RequestBody NewComment body) {
		return ApiResponse.created(tasks.addComment(sessions.requireUser(request), id, body.text()));
	}

}
