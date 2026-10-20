package com.ayitrix.ayipm.workspace;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.ApiResponse;
import com.ayitrix.ayipm.employee.User;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/workspace")
public class WorkspaceController {

	private final WorkspaceService workspace;
	private final SessionService sessions;

	public WorkspaceController(WorkspaceService workspace, SessionService sessions) {
		this.workspace = workspace;
		this.sessions = sessions;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<WorkspaceSettings>> get(HttpServletRequest request) {
		sessions.requireUser(request);
		return ApiResponse.ok(workspace.getSettings()
				.orElseThrow(() -> ApiException.notFound("Workspace has not been set up.")));
	}

	@PatchMapping
	public ResponseEntity<ApiResponse<WorkspaceSettings>> update(HttpServletRequest request, @RequestBody WorkspaceSettings body) {
		User actor = sessions.requireUser(request, Permission.WORKSPACE_MANAGE);
		return ApiResponse.ok(workspace.update(actor, body));
	}

}
