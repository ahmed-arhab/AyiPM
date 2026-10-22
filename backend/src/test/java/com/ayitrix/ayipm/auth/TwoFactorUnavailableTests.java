package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

/** Without ayipm.two-factor.encryption-key, which the other tests don't set either. */
class TwoFactorUnavailableTests extends IntegrationTest {

	@Test
	void setupExplainsThatTheServerIsNotConfigured() {
		Client owner = signedInOwner();
		assertThat(owner.get("/api/auth/two-factor").data().path("available").asBoolean()).isFalse();

		Response setup = owner.post("/api/auth/two-factor/setup", Map.of());
		assertThat(setup.status()).isEqualTo(409);
		assertThat(setup.error()).isEqualTo("Two-factor authentication isn't set up on this server yet. Ask the person who runs AyiPM to turn it on.");

		Response require = owner.patch("/api/workspace", Map.of("requireAdminTwoFactor", true));
		assertThat(require.status()).isEqualTo(409);
		assertThat(owner.get("/api/workspace").data().path("requireAdminTwoFactor").asBoolean()).isFalse();

		Response login = client().post("/api/auth/login", Map.of("email", "owner@test.com", "password", "Secret123!")).expectStatus(200);
		assertThat(login.data().path("user").path("email").asString()).isEqualTo("owner@test.com");
		assertThat(login.data().path("twoFactor").path("enabled").asBoolean()).isFalse();
	}

}
