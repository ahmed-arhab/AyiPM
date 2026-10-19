package com.ayitrix.ayipm.employee;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

class EmployeeApiTests extends IntegrationTest {

	@Test
	void responsesNeverExposePasswordsAndOmitEmptyFields() {
		Client owner = signedInOwner();
		Response list = owner.get("/api/employees").expectStatus(200);
		assertThat(list.data().get(0).has("passwordHash")).isFalse();
		assertThat(list.data().get(0).has("avatar")).isFalse();
		assertThat(list.data().get(0).path("joinDate").asString()).matches("\\d{4}-\\d{2}-\\d{2}");
	}

	@Test
	void employeesCannotManageMembers() {
		Client owner = signedInOwner();
		Client employee = signedInMember(owner, "emp@test.com", "employee");
		Response denied = employee.post("/api/employees", Map.of(
				"name", "X", "email", "x@test.com", "department", "Engineering", "designation", "Dev", "role", "employee"));
		assertThat(denied.status()).isEqualTo(403);
		assertThat(denied.error()).isEqualTo("You do not have permission to do that.");
	}

	@Test
	void duplicateEmailsAndEmployeeIdsAreRejected() {
		Client owner = signedInOwner();
		Response email = owner.post("/api/employees", Map.of(
				"name", "X", "email", "OWNER@test.com", "department", "Engineering", "designation", "Dev", "role", "employee"));
		assertThat(email.status()).isEqualTo(409);
		assertThat(email.error()).isEqualTo("An account with this email address already exists.");

		Response id = owner.post("/api/employees", Map.of(
				"name", "X", "email", "x@test.com", "department", "Engineering", "designation", "Dev", "role", "employee", "employeeId", "ax001"));
		assertThat(id.status()).isEqualTo(409);
		assertThat(id.error()).isEqualTo("Employee ID \"AX001\" is already in use.");
	}

	@Test
	void membersEditOnlyTheirOwnProfileAndOnlySafeFields() {
		Client owner = signedInOwner();
		Client member = signedInMember(owner, "emp@test.com", "employee");
		String memberId = member.get("/api/auth/session").data().path("user").path("id").asString();
		String ownerId = owner.get("/api/auth/session").data().path("user").path("id").asString();

		Response updated = member.patch("/api/employees/" + memberId, Map.of("bio", "  Hello  ", "designation", "CEO", "phone", ""))
				.expectStatus(200);
		assertThat(updated.data().path("bio").asString()).isEqualTo("Hello");
		assertThat(updated.data().path("designation").asString()).isEqualTo("Developer");
		assertThat(updated.data().has("phone")).isFalse();

		assertThat(member.patch("/api/employees/" + ownerId, Map.of("bio", "hacked")).status()).isEqualTo(403);

		Response taken = member.patch("/api/employees/" + memberId, Map.of("email", "owner@test.com"));
		assertThat(taken.status()).isEqualTo(409);
		assertThat(taken.error()).isEqualTo("An account with this email address already exists.");
	}

	@Test
	void theLastActiveAdminCannotBeDemotedOrDeactivated() {
		Client owner = signedInOwner();
		String ownerId = owner.get("/api/auth/session").data().path("user").path("id").asString();
		Response demote = owner.put("/api/employees/" + ownerId + "/role", Map.of("role", "employee"));
		assertThat(demote.status()).isEqualTo(400);
		assertThat(demote.error()).isEqualTo("The workspace needs at least one active admin.");
		assertThat(owner.put("/api/employees/" + ownerId + "/status", Map.of("status", "inactive")).error())
				.isEqualTo("You cannot change your own account status.");
	}

	@Test
	void deactivatingAMemberEndsTheirSessions() {
		Client owner = signedInOwner();
		Client member = signedInMember(owner, "emp@test.com", "project_manager");
		String memberId = member.get("/api/auth/session").data().path("user").path("id").asString();

		owner.put("/api/employees/" + memberId + "/status", Map.of("status", "inactive")).expectStatus(200);
		assertThat(member.get("/api/employees").status()).isEqualTo(401);
		Response login = client().post("/api/auth/login", Map.of("email", "emp@test.com", "password", "MemberPass1!"));
		assertThat(login.status()).isEqualTo(403);
	}

	@Test
	void unknownEmployeeIdsReturn404() {
		Client owner = signedInOwner();
		assertThat(owner.post("/api/employees/not-a-uuid/reset-link", Map.of()).status()).isEqualTo(404);
		assertThat(owner.put("/api/employees/00000000-0000-0000-0000-000000000000/role", Map.of("role", "employee")).status()).isEqualTo(404);
	}

}
