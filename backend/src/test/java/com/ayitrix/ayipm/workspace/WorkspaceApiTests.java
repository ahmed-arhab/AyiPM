package com.ayitrix.ayipm.workspace;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

class WorkspaceApiTests extends IntegrationTest {

	@Test
	void adminsUpdateSettingsWithValidation() {
		Client owner = signedInOwner();
		Response updated = owner.patch("/api/workspace", Map.of("workDayStart", "08:30", "employeeIdPrefix", "ac", "leaveAllowance", Map.of("annual", 25)))
				.expectStatus(200);
		assertThat(updated.data().path("workDayStart").asString()).isEqualTo("08:30");
		assertThat(updated.data().path("employeeIdPrefix").asString()).isEqualTo("AC");
		assertThat(updated.data().path("leaveAllowance").path("annual").asInt()).isEqualTo(25);
		assertThat(updated.data().path("leaveAllowance").path("sick").asInt()).isEqualTo(10);

		Response invalid = owner.patch("/api/workspace", Map.of("workDayStart", "25:00"));
		assertThat(invalid.status()).isEqualTo(400);
		assertThat(invalid.error()).isEqualTo("Work day start must be a time like 09:00.");
	}

	@Test
	void newEmployeeIdsUseTheCurrentPrefix() {
		Client owner = signedInOwner();
		owner.patch("/api/workspace", Map.of("employeeIdPrefix", "AC")).expectStatus(200);
		Response created = owner.post("/api/employees", Map.of(
				"name", "X", "email", "x@test.com", "department", "Engineering", "designation", "Dev", "role", "employee"))
				.expectStatus(201);
		assertThat(created.data().path("employee").path("employeeId").asString()).isEqualTo("AC001");
	}

	@Test
	void projectManagersCanReadButNotChangeSettings() {
		Client owner = signedInOwner();
		Client manager = signedInMember(owner, "pm@test.com", "project_manager");
		manager.get("/api/workspace").expectStatus(200);
		assertThat(manager.patch("/api/workspace", Map.of("companyName", "Mine")).status()).isEqualTo(403);
	}

}
