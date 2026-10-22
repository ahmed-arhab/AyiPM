package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.ConnectException;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Value;

import com.ayitrix.ayipm.IntegrationTest;

class SignInRateLimitTests extends IntegrationTest {

	private static final HttpClient HTTP = HttpClient.newHttpClient();
	private static final String OWNER_LOGIN = "{\"email\":\"owner@test.com\",\"password\":\"Secret123!\"}";

	@Value("${local.server.port}")
	private int port;

	@ParameterizedTest
	@ValueSource(strings = { "/api/setup", "/api/auth/login", "/api/auth/forgot", "/api/auth/invite", "/api/auth/reset" })
	void eachSignInEndpointAllowsTenRequestsAMinutePerAddress(String path) throws Exception {
		for (int i = 1; i <= 10; i++) {
			assertThat(post("localhost", path, "{}").statusCode()).as("request " + i).isNotEqualTo(429);
		}
		HttpResponse<String> limited = post("localhost", path, "{}");
		assertThat(limited.statusCode()).isEqualTo(429);
		assertThat(limited.headers().firstValueAsLong("Retry-After").orElseThrow()).isBetween(1L, 60L);
		assertThat(limited.body()).startsWith("{\"error\":\"Too many attempts. Try again in ");
	}

	@Test
	void eachEndpointHasItsOwnLimit() throws Exception {
		signedInOwner();
		exhaustLogins(client());
		assertThat(post("localhost", "/api/auth/login", OWNER_LOGIN).statusCode()).isEqualTo(429);
		client().post("/api/auth/forgot", Map.of("email", "owner@test.com")).expectStatus(200);
	}

	@Test
	void anotherAddressIsNotAffected() throws Exception {
		signedInOwner();
		exhaustLogins(client());
		assertThat(post("localhost", "/api/auth/login", OWNER_LOGIN).statusCode()).isEqualTo(429);

		// The same test machine over IPv6 counts as a different client.
		HttpResponse<String> other;
		try {
			other = post("[::1]", "/api/auth/login", OWNER_LOGIN);
		} catch (ConnectException e) {
			Assumptions.abort("IPv6 loopback is not available");
			return;
		}
		assertThat(other.statusCode()).isEqualTo(200);
	}

	@Test
	void forwardedHeadersFromAnUntrustedPeerDoNotChangeTheBucket() {
		signedInOwner();
		for (int i = 1; i <= 10; i++) {
			Client spoofer = client().withHeader("X-Forwarded-For", "203.0.113." + i).withHeader("Forwarded", "for=198.51.100." + i);
			assertThat(spoofer.post("/api/auth/login", Map.of("email", "nobody" + i + "@test.com", "password", "wrong")).status()).isEqualTo(401);
		}
		Response limited = client().withHeader("X-Forwarded-For", "203.0.113.200").post("/api/auth/login",
				Map.of("email", "owner@test.com", "password", "Secret123!"));
		assertThat(limited.status()).isEqualTo(429);
		assertThat(limited.error()).startsWith("Too many attempts. Try again in ");
	}

	@Test
	void theLimitStartsOverAfterAMinute() throws Exception {
		signedInOwner();
		Instant start = Instant.parse("2026-03-02T09:00:00Z");
		clock.set(start);
		exhaustLogins(client());

		HttpResponse<String> limited = post("localhost", "/api/auth/login", OWNER_LOGIN);
		assertThat(limited.statusCode()).isEqualTo(429);
		assertThat(limited.headers().firstValue("Retry-After")).contains("60");
		assertThat(limited.body()).contains("Try again in 1 minute.");

		clock.set(start.plusSeconds(59));
		limited = post("localhost", "/api/auth/login", OWNER_LOGIN);
		assertThat(limited.headers().firstValue("Retry-After")).contains("1");
		assertThat(limited.body()).contains("Try again in 1 second.");

		clock.set(start.plusSeconds(60));
		assertThat(post("localhost", "/api/auth/login", OWNER_LOGIN).statusCode()).isEqualTo(200);
	}

	@Test
	void theAccountLockoutStillAppliesWithinTheLimit() {
		signedInOwner();
		Client browser = client();
		for (int i = 1; i <= 4; i++) {
			assertThat(browser.post("/api/auth/login", Map.of("email", "owner@test.com", "password", "wrong")).status()).isEqualTo(401);
		}
		Response locked = browser.post("/api/auth/login", Map.of("email", "owner@test.com", "password", "wrong"));
		assertThat(locked.status()).isEqualTo(429);
		assertThat(locked.error()).startsWith("Too many failed attempts.");
	}

	@Test
	void ipv6ClientsAreGroupedByTheirSlash64() throws Exception {
		String key = SignInRateLimit.clientKey(InetAddress.getByName("2001:db8:1:2::1"));
		assertThat(SignInRateLimit.clientKey(InetAddress.getByName("2001:db8:1:2:ffff:ffff:ffff:ffff"))).isEqualTo(key);
		assertThat(SignInRateLimit.clientKey(InetAddress.getByName("2001:db8:1:3::1"))).isNotEqualTo(key);
		assertThat(SignInRateLimit.clientKey(InetAddress.getByName("203.0.113.9"))).isEqualTo("203.0.113.9");
	}

	/** Fails ten sign-ins for accounts that don't exist, so no account gets locked. */
	private static void exhaustLogins(Client client) {
		for (int i = 1; i <= 10; i++) {
			assertThat(client.post("/api/auth/login", Map.of("email", "nobody" + i + "@test.com", "password", "wrong")).status()).isEqualTo(401);
		}
	}

	/** Posts JSON to the given host, so a request can come from the IPv6 loopback address instead of 127.0.0.1. */
	private HttpResponse<String> post(String host, String path, String json) throws Exception {
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://" + host + ":" + port + path))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(json))
				.build();
		return HTTP.send(request, HttpResponse.BodyHandlers.ofString());
	}

}
