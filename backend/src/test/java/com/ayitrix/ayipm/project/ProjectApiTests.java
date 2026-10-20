package com.ayitrix.ayipm.project;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

class ProjectApiTests extends IntegrationTest {

	static Map<String, Object> project(String name, List<String> members) {
		return Map.of("name", name, "client", "Acme", "description", "", "startDate", "2026-01-01", "endDate", "2026-03-31", "status", "planning",
				"members", members);
	}

	@Test
	void managersCreateUpdateAndDeleteProjects() {
		Client owner = signedInOwner();
		Client employee = signedInMember(owner, "emp@test.com", "employee");
		String employeeId = idOf(employee);

		Response created = owner.post("/api/projects", project("  Website  ", List.of(employeeId, employeeId))).expectStatus(201);
		String id = created.data().path("id").asString();
		assertThat(created.data().path("name").asString()).isEqualTo("Website");
		assertThat(created.data().path("members").size()).isEqualTo(1);
		assertThat(created.data().has("managerId")).isFalse();
		assertThat(notificationTitles(employee)).containsExactly("Added to project");

		assertThat(employee.get("/api/projects").expectStatus(200).data().size()).isEqualTo(1);
		assertThat(employee.post("/api/projects", project("Mine", List.of())).status()).isEqualTo(403);

		Response updated = owner.patch("/api/projects/" + id, Map.of("status", "in_review", "budget", "$5k")).expectStatus(200);
		assertThat(updated.data().path("status").asString()).isEqualTo("in_review");
		assertThat(updated.data().path("budget").asString()).isEqualTo("$5k");
		assertThat(updated.data().path("client").asString()).isEqualTo("Acme");

		owner.delete("/api/projects/" + id).expectStatus(200);
		assertThat(owner.get("/api/projects").data().size()).isZero();
		assertThat(owner.get("/api/projects/" + id + "/nope").status()).isEqualTo(404);
	}

	@Test
	void projectInputIsValidated() {
		Client owner = signedInOwner();
		assertThat(owner.post("/api/projects", project(" ", List.of())).error()).isEqualTo("Project name is required.");

		Map<String, Object> backwards = new java.util.HashMap<>(project("X", List.of()));
		backwards.put("endDate", "2025-12-31");
		assertThat(owner.post("/api/projects", backwards).error()).isEqualTo("Deadline must be on or after the start date.");

		assertThat(owner.post("/api/projects", project("X", List.of("not-a-user"))).error()).isEqualTo("Choose valid project members.");
		assertThat(owner.patch("/api/projects/00000000-0000-0000-0000-000000000000", Map.of("name", "X")).status()).isEqualTo(404);
	}

	@Test
	void assigningSomeoneToProjectsReplacesTheirMemberships() {
		Client owner = signedInOwner();
		Client employee = signedInMember(owner, "emp@test.com", "employee");
		String employeeId = idOf(employee);
		owner.post("/api/projects", project("First", List.of(employeeId))).expectStatus(201);
		String second = owner.post("/api/projects", project("Second", List.of())).data().path("id").asString();

		Response all = owner.put("/api/employees/" + employeeId + "/projects", Map.of("projectIds", List.of(second))).expectStatus(200);
		all.data().forEach(p -> {
			boolean member = p.path("members").toString().contains(employeeId);
			assertThat(member).isEqualTo(p.path("id").asString().equals(second));
		});
		assertThat(notificationTitles(employee)).first().isEqualTo("Added to project");
		assertThat(employee.put("/api/employees/" + employeeId + "/projects", Map.of("projectIds", List.of())).status()).isEqualTo(403);
	}

}
