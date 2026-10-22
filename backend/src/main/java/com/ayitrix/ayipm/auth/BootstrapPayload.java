package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.List;

import org.jspecify.annotations.Nullable;

import com.ayitrix.ayipm.employee.EmployeeResponse;
import com.ayitrix.ayipm.preferences.PreferencesResponse;
import com.ayitrix.ayipm.workspace.WorkspaceSettings;

/** Everything the frontend needs after sign-in. Matches BootstrapPayload in src/types/api.ts. */
public record BootstrapPayload(
		boolean needsSetup,
		@Nullable EmployeeResponse user,
		@Nullable Instant expiresAt,
		@Nullable WorkspaceSettings workspace,
		List<EmployeeResponse> employees,
		@Nullable PreferencesResponse preferences,
		TwoFactorService.@Nullable Status twoFactor) implements AuthController.SignInResult {
}
