package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;

import com.ayitrix.ayipm.IntegrationTest;

/**
 * Behind an HTTPS reverse proxy, the backend only sees plain HTTP plus an X-Forwarded-Proto header. The session cookie
 * must be Secure when that header says https, and only then, so signing in still works on http://localhost.
 */
class SessionCookieTests extends IntegrationTest {

	@Value("${local.server.port}")
	private int port;

	private final HttpClient http = HttpClient.newHttpClient();

	@Test
	void sessionCookieIsSecureOnlyWhenTheProxyReportsHttps() throws Exception {
		signedInOwner();

		assertThat(sessionCookieAttributes(login())).contains("httponly").doesNotContain("secure");
		assertThat(sessionCookieAttributes(login("X-Forwarded-Proto", "https"))).contains("httponly", "secure");
	}

	private HttpResponse<String> login(String... headers) throws IOException, InterruptedException {
		HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/auth/login"))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"owner@test.com\",\"password\":\"Secret123!\"}"));
		if (headers.length > 0) request.headers(headers);
		HttpResponse<String> response = http.send(request.build(), HttpResponse.BodyHandlers.ofString());
		assertThat(response.statusCode()).isEqualTo(200);
		return response;
	}

	/** The attributes after the value in the session's Set-Cookie header, lower-cased, such as "path=/" or "secure". */
	private static List<String> sessionCookieAttributes(HttpResponse<String> response) {
		String header = response.headers().allValues("Set-Cookie").stream()
				.filter(value -> value.startsWith(SessionService.COOKIE_NAME + "="))
				.findFirst()
				.orElseThrow(() -> new AssertionError("No session cookie in " + response.headers().map()));
		return Arrays.stream(header.split(";")).skip(1).map(part -> part.trim().toLowerCase(Locale.ROOT)).toList();
	}

}
