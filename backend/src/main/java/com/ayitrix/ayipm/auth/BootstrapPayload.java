package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.List;

import com.ayitrix.ayipm.employee.EmployeeResponse;
import com.ayitrix.ayipm.preferences.PreferencesResponse;
import com.ayitrix.ayipm.workspace.WorkspaceSettings;

/** Everything the frontend needs after sign-in. Matches BootstrapPayload in src/types/api.ts. */
public record BootstrapPayload(
		boolean needsSetup,
		EmployeeResponse user,
		Instant expiresAt,
		WorkspaceSettings workspace,
		List<EmployeeResponse> employees,
		PreferencesResponse preferences,
		TwoFactorService.Status twoFactor) {
}
