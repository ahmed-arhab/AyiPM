package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

import tools.jackson.databind.json.JsonMapper;

/** Without GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, which the other tests don't set either. */
class GoogleSignInUnavailableTests extends IntegrationTest {

	@Test
	void theButtonIsHiddenAndTheEndpointsSaySoWithoutCredentials() {
		Client owner = signedInOwner();
		assertThat(owner.get("/api/auth/session").data().path("googleSignIn").asBoolean()).isFalse();
		Client browser = client();
		assertThat(browser.get("/api/auth/session").data().path("googleSignIn").asBoolean()).isFalse();

		Response start = browser.get("/api/auth/google/start").expectStatus(302);
		assertThat(start.header("Location")).isEqualTo("/login?google=unavailable");
		assertThat(start.headers().allValues("Set-Cookie")).isEmpty();
		assertThat(browser.get("/api/auth/google/callback?state=made-up&code=made-up").header("Location")).isEqualTo("/login?google=expired");
		assertThat(browser.post("/api/auth/google/two-factor", Map.of()).status()).isEqualTo(410);
	}

	@Test
	void aClientIdWithoutItsSecretStopsTheStart() {
		assertThatThrownBy(() -> client("1234.apps.googleusercontent.com", "", GoogleOidcClient.GOOGLE_ISSUER))
				.hasMessage("Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to offer sign-in with Google, or neither.");
		assertThatThrownBy(() -> client("", "secret", GoogleOidcClient.GOOGLE_ISSUER)).isInstanceOf(IllegalStateException.class);
		assertThatThrownBy(() -> client("id", "secret", "http://accounts.example.com"))
				.hasMessageStartingWith("ayipm.google.issuer (GOOGLE_ISSUER) must be an https address");
		assertThat(client("id", "secret", GoogleOidcClient.GOOGLE_ISSUER + "/").isConfigured()).isTrue();
		assertThat(client("", "", GoogleOidcClient.GOOGLE_ISSUER).isConfigured()).isFalse();
	}

	private static GoogleOidcClient client(String clientId, String clientSecret, String issuer) {
		return new GoogleOidcClient(clientId, clientSecret, issuer, "http://localhost:3000", JsonMapper.builder().build(), Clock.systemUTC());
	}

}
