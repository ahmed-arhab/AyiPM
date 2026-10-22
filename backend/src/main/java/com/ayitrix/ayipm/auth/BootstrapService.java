package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.employee.EmployeeResponse;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.preferences.PreferencesService;
import com.ayitrix.ayipm.workspace.WorkspaceService;

@Service
public class BootstrapService {

	private final UserRepository users;
	private final WorkspaceService workspace;
	private final PreferencesService preferences;
	private final TwoFactorService twoFactor;
	private final GoogleOidcClient google;

	public BootstrapService(UserRepository users, WorkspaceService workspace, PreferencesService preferences, TwoFactorService twoFactor,
			GoogleOidcClient google) {
		this.users = users;
		this.workspace = workspace;
		this.preferences = preferences;
		this.twoFactor = twoFactor;
		this.google = google;
	}

	@Transactional(readOnly = true)
	public BootstrapPayload signedIn(User user, Instant expiresAt) {
		List<EmployeeResponse> employees = users.findAllByOrderByCreatedAtAsc().stream().map(EmployeeResponse::from).toList();
		return new BootstrapPayload(false, EmployeeResponse.from(user), expiresAt, workspace.getSettings().orElse(null), employees,
				preferences.get(user.getId()), twoFactor.status(user), google.isConfigured());
	}

	@Transactional(readOnly = true)
	public BootstrapPayload signedOut() {
		return new BootstrapPayload(workspace.needsSetup(), null, null, null, List.of(), null, null, google.isConfigured());
	}

}
