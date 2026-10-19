package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

class AuthFlowTests extends IntegrationTest {

	@Test
	void setupCreatesOwnerOnceAndSignsThemIn() {
		Client owner = client();
		assertThat(owner.get("/api/setup").expectStatus(200).data().path("needsSetup").asBoolean()).isTrue();

		Response setup = owner.post("/api/setup", Map.of("companyName", "Test Co", "name", "Owner", "email", " Owner@Test.com ", "password", "Secret123!"))
				.expectStatus(201);
		assertThat(setup.data().path("user").path("email").asString()).isEqualTo("owner@test.com");
		assertThat(setup.data().path("user").path("role").asString()).isEqualTo("admin");
		assertThat(setup.data().path("user").path("employeeId").asString()).isEqualTo("AX001");
		assertThat(setup.data().path("workspace").path("companyName").asString()).isEqualTo("Test Co");

		assertThat(owner.get("/api/auth/session").data().path("user").path("name").asString()).isEqualTo("Owner");
		Response again = client().post("/api/setup", Map.of("companyName", "X", "name", "X", "email", "x@x.com", "password", "Secret123!"));
		assertThat(again.status()).isEqualTo(409);
		assertThat(again.error()).isEqualTo("This workspace has already been set up.");
	}

	@Test
	void loginIsCaseInsensitiveAndLogoutEndsTheSession() {
		signedInOwner();
		Client browser = client();
		browser.post("/api/auth/login", Map.of("email", "OWNER@test.com", "password", "Secret123!", "remember", true)).expectStatus(200);
		assertThat(browser.get("/api/auth/session").data().path("user").isObject()).isTrue();

		browser.post("/api/auth/logout", Map.of()).expectStatus(200);
		Response session = browser.get("/api/auth/session").expectStatus(200);
		assertThat(session.data().path("user").isNull()).isTrue();
		assertThat(session.data().path("needsSetup").asBoolean()).isFalse();
		assertThat(browser.get("/api/employees").status()).isEqualTo(401);
	}

	@Test
	void wrongPasswordsLockTheAccountAfterFiveAttempts() {
		signedInOwner();
		Client browser = client();
		for (int i = 1; i <= 4; i++) {
			Response attempt = browser.post("/api/auth/login", Map.of("email", "owner@test.com", "password", "wrong"));
			assertThat(attempt.status()).isEqualTo(401);
			assertThat(attempt.error()).isEqualTo("Incorrect email or password.");
		}
		assertThat(browser.post("/api/auth/login", Map.of("email", "owner@test.com", "password", "wrong")).status()).isEqualTo(429);
		Response locked = browser.post("/api/auth/login", Map.of("email", "owner@test.com", "password", "Secret123!"));
		assertThat(locked.status()).isEqualTo(429);
		assertThat(locked.error()).startsWith("Too many failed attempts. Try again in 15 minutes");
	}

	@Test
	void unknownEmailGetsTheSameErrorAsAWrongPassword() {
		signedInOwner();
		Response response = client().post("/api/auth/login", Map.of("email", "nobody@test.com", "password", "whatever1"));
		assertThat(response.status()).isEqualTo(401);
		assertThat(response.error()).isEqualTo("Incorrect email or password.");
	}

	@Test
	void invitedMemberCanOnlySignInAfterAcceptingTheInvitation() {
		Client owner = signedInOwner();
		Response created = owner.post("/api/employees", Map.of(
				"name", "Emp One", "email", "Emp@Test.com", "department", "Engineering", "designation", "Dev", "role", "employee"))
				.expectStatus(201);
		assertThat(created.data().path("employee").path("employeeId").asString()).isEqualTo("AX002");
		assertThat(created.data().path("employee").path("invited").asBoolean()).isTrue();
		String token = created.data().path("invite").path("token").asString();

		assertThat(client().post("/api/auth/login", Map.of("email", "emp@test.com", "password", "EmpPass123")).status()).isEqualTo(401);

		Response details = client().get("/api/auth/invite?token=" + token).expectStatus(200);
		assertThat(details.data().path("email").asString()).isEqualTo("emp@test.com");
		assertThat(details.data().path("companyName").asString()).isEqualTo("Test Co");

		Client member = client();
		member.post("/api/auth/invite", Map.of("token", token, "password", "EmpPass123")).expectStatus(200);
		assertThat(member.get("/api/auth/session").data().path("user").path("invited").asBoolean()).isFalse();
		assertThat(client().get("/api/auth/invite?token=" + token).status()).isEqualTo(410);
		client().post("/api/auth/login", Map.of("email", "emp@test.com", "password", "EmpPass123")).expectStatus(200);
	}

	@Test
	void resetLinkSetsANewPasswordAndEndsOldSessions() {
		Client owner = signedInOwner();
		Client member = signedInMember(owner, "member@test.com", "employee");
		String memberId = member.get("/api/auth/session").data().path("user").path("id").asString();

		client().post("/api/auth/forgot", Map.of("email", "member@test.com")).expectStatus(200);
		Response flagged = owner.get("/api/employees").expectStatus(200);
		assertThat(flagged.data().get(1).path("passwordResetRequestedAt").isMissingNode()).isFalse();

		String token = owner.post("/api/employees/" + memberId + "/reset-link", Map.of()).expectStatus(200).data().path("token").asString();
		assertThat(client().get("/api/auth/reset?token=" + token).data().path("name").asString()).isEqualTo("Member member@test.com");
		client().post("/api/auth/reset", Map.of("token", token, "password", "BrandNew123")).expectStatus(200);

		assertThat(member.get("/api/employees").status()).isEqualTo(401);
		client().post("/api/auth/login", Map.of("email", "member@test.com", "password", "BrandNew123")).expectStatus(200);
		assertThat(client().post("/api/auth/reset", Map.of("token", token, "password", "Another123")).status()).isEqualTo(410);
	}

	@Test
	void changePasswordChecksTheCurrentPassword() {
		Client owner = signedInOwner();
		Response wrong = owner.post("/api/auth/password", Map.of("currentPassword", "nope", "newPassword", "Another123"));
		assertThat(wrong.status()).isEqualTo(400);
		assertThat(wrong.error()).isEqualTo("Current password is incorrect.");
		owner.post("/api/auth/password", Map.of("currentPassword", "Secret123!", "newPassword", "Another123")).expectStatus(200);
		client().post("/api/auth/login", Map.of("email", "owner@test.com", "password", "Another123")).expectStatus(200);
	}

	@Test
	void malformedRequestsGetJsonErrors() {
		Response invalid = client().postRaw("/api/auth/login", "{not json");
		assertThat(invalid.status()).isEqualTo(400);
		assertThat(invalid.error()).isEqualTo("Invalid request body.");
		Response missing = client().get("/api/nope");
		assertThat(missing.status()).isEqualTo(404);
		assertThat(missing.error()).isEqualTo("Not found.");
	}

}
