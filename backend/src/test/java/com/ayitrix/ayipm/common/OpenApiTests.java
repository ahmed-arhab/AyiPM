package com.ayitrix.ayipm.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Set;
import java.util.TreeSet;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import com.ayitrix.ayipm.IntegrationTest;
import com.ayitrix.ayipm.auth.SessionService;

import tools.jackson.databind.JsonNode;

class OpenApiTests extends IntegrationTest {

	@Value("${local.server.port}")
	private int serverPort;

	@Autowired
	@Qualifier("requestMappingHandlerMapping")
	private RequestMappingHandlerMapping mappings;

	@Test
	void specHasTheTitleVersionAndEveryEndpoint() {
		JsonNode spec = client().get("/v3/api-docs").expectStatus(200).body();
		assertThat(spec.path("info").path("title").asString()).isEqualTo("AyiPM API");
		assertThat(spec.path("info").path("version").asString()).matches("\\d+\\.\\d+\\.\\d+.*");

		Set<String> documented = new TreeSet<>();
		spec.path("paths").properties().forEach(path -> path.getValue().propertyNames()
				.forEach(method -> documented.add(method.toUpperCase() + " " + path.getKey())));
		// Every controller endpoint under /api, as Spring maps it. The others are springdoc's own.
		Set<String> endpoints = new TreeSet<>();
		mappings.getHandlerMethods().keySet().forEach(mapping -> mapping.getPatternValues().stream()
				.filter(pattern -> pattern.startsWith("/api/"))
				.forEach(pattern -> mapping.getMethodsCondition().getMethods().forEach(method -> endpoints.add(method.name() + " " + pattern))));
		assertThat(endpoints).contains("POST /api/auth/login", "POST /api/employees/{id}/reset-link");
		assertThat(documented).isEqualTo(endpoints);
	}

	@Test
	void signInEndpointsAreOpenAndEverythingElseNeedsTheSessionCookie() {
		JsonNode spec = client().get("/v3/api-docs").expectStatus(200).body();
		JsonNode cookie = spec.path("components").path("securitySchemes").path(SessionService.COOKIE_NAME);
		assertThat(cookie.path("type").asString()).isEqualTo("apiKey");
		assertThat(cookie.path("in").asString()).isEqualTo("cookie");
		assertThat(cookie.path("name").asString()).isEqualTo(SessionService.COOKIE_NAME);
		assertThat(spec.path("security").path(0).has(SessionService.COOKIE_NAME)).isTrue();

		JsonNode paths = spec.path("paths");
		JsonNode login = paths.path("/api/auth/login").path("post").path("security");
		assertThat(login.isArray() && login.isEmpty()).isTrue();
		assertThat(paths.path("/api/employees").path("get").has("security")).isFalse();
		assertThat(paths.path("/api/auth/password").path("post").path("security").path(0).has(SessionService.COOKIE_NAME)).isTrue();
	}

	@Test
	void swaggerUiLoadsAndPointsAtTheSpec() throws Exception {
		HttpResponse<String> page = send(HttpRequest.newBuilder(url("/swagger-ui.html")));
		assertThat(page.statusCode()).isEqualTo(200);
		assertThat(page.uri().getPath()).isEqualTo("/swagger-ui/index.html");
		assertThat(page.body()).contains("swagger-ui-bundle.js");
		assertThat(send(HttpRequest.newBuilder(url("/swagger-ui/swagger-ui-bundle.js"))).statusCode()).isEqualTo(200);

		JsonNode config = client().get("/v3/api-docs/swagger-config").expectStatus(200).body();
		assertThat(config.path("url").asString()).isEqualTo("/v3/api-docs");
	}

	// "Try it out" runs in the browser on the backend's own origin, so signing in stores the cookie the spec describes
	// and later calls from the page send it.
	@Test
	void tryItOutCanSignInAndCallAnEndpoint() throws Exception {
		signedInOwner();
		HttpResponse<String> login = send(fromSwaggerUi("/api/auth/login")
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"owner@test.com\",\"password\":\"Secret123!\"}")));
		assertThat(login.statusCode()).isEqualTo(200);
		String setCookie = login.headers().firstValue("Set-Cookie").orElseThrow();
		assertThat(setCookie).startsWith(SessionService.COOKIE_NAME + "=").contains("HttpOnly");
		String cookie = setCookie.substring(0, setCookie.indexOf(';'));

		assertThat(send(fromSwaggerUi("/api/employees").header("Cookie", cookie)).statusCode()).isEqualTo(200);
		assertThat(send(fromSwaggerUi("/api/notifications/read-all").header("Cookie", cookie)
				.POST(HttpRequest.BodyPublishers.noBody())).statusCode()).isEqualTo(200);
	}

	/** A request with the Origin and Referer headers the browser adds on the Swagger UI page. */
	private HttpRequest.Builder fromSwaggerUi(String path) {
		return HttpRequest.newBuilder(url(path))
				.header("Origin", "http://localhost:" + serverPort)
				.header("Referer", "http://localhost:" + serverPort + "/swagger-ui/index.html");
	}

	private URI url(String path) {
		return URI.create("http://localhost:" + serverPort + path);
	}

	private static HttpResponse<String> send(HttpRequest.Builder request) throws Exception {
		HttpClient http = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
		return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

}
