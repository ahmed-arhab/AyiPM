package com.ayitrix.ayipm.activity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

class ActivityApiTests extends IntegrationTest {

	private static List<String> actions(Response response) {
		List<String> actions = new ArrayList<>();
		response.data().forEach(entry -> actions.add(entry.path("action").asString()));
		return actions;
	}

	@Test
	void changesAreRecordedOnTheServer() {
		Client owner = signedInOwner();
		Client employee = signedInMember(owner, "emp@test.com", "employee");
		owner.patch("/api/workspace", Map.of("companyName", "Renamed Co")).expectStatus(200);
		owner.put("/api/employees/" + idOf(employee) + "/role", Map.of("role", "project_manager")).expectStatus(200);

		List<String> all = actions(owner.get("/api/activity").expectStatus(200));
		assertThat(all).containsSubsequence("Updated Employee Role", "Updated Workspace Settings", "Accepted Invitation", "Invited Employee",
				"Created Workspace");
		assertThat(notificationTitles(employee)).contains("Your role was updated");

		Response roleChange = owner.get("/api/activity?entityType=employee&size=1").expectStatus(200);
		assertThat(roleChange.data().get(0).path("details").asString()).isEqualTo("Employee → Project Manager");
		assertThat(roleChange.data().get(0).path("actorName").asString()).isEqualTo("Owner");
	}

	@Test
	void employeesOnlySeeTheirOwnActions() {
		Client owner = signedInOwner();
		Client employee = signedInMember(owner, "emp@test.com", "employee");
		String employeeId = idOf(employee);

		Response mine = employee.get("/api/activity?actorId=" + idOf(owner)).expectStatus(200);
		assertThat(mine.data().size()).isPositive();
		mine.data().forEach(entry -> assertThat(entry.path("actorId").asString()).isEqualTo(employeeId));
		assertThat(owner.get("/api/activity?size=501").status()).isEqualTo(400);
		assertThat(owner.get("/api/activity?entityType=nope").status()).isEqualTo(400);
	}

	@Test
	void signingInAndOutIsRecorded() {
		Client owner = signedInOwner();
		owner.post("/api/auth/logout", Map.of()).expectStatus(200);
		owner.post("/api/auth/login", Map.of("email", "owner@test.com", "password", "Secret123!")).expectStatus(200);
		assertThat(actions(owner.get("/api/activity?entityType=auth"))).containsSequence("Signed In", "Signed Out", "Created Workspace");
	}

}
