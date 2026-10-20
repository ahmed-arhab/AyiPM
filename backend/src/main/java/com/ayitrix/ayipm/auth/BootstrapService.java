package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.employee.EmployeeResponse;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.workspace.WorkspaceService;

@Service
public class BootstrapService {

	private final UserRepository users;
	private final WorkspaceService workspace;

	public BootstrapService(UserRepository users, WorkspaceService workspace) {
		this.users = users;
		this.workspace = workspace;
	}

	@Transactional(readOnly = true)
	public BootstrapPayload signedIn(User user, Instant expiresAt) {
		List<EmployeeResponse> employees = users.findAllByOrderByCreatedAtAsc().stream().map(EmployeeResponse::from).toList();
		return new BootstrapPayload(false, EmployeeResponse.from(user), expiresAt, workspace.getSettings().orElse(null), employees);
	}

	@Transactional(readOnly = true)
	public BootstrapPayload signedOut() {
		return new BootstrapPayload(workspace.needsSetup(), null, null, null, List.of());
	}

}
