package com.ayitrix.ayipm;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Starts the app on a random port against a real Postgres that runs in-process (no Docker needed), and talks to it
 * over HTTP with a cookie jar, the same way the browser does.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestClock.Config.class)
public abstract class IntegrationTest {

	private static final EmbeddedPostgres POSTGRES = startPostgres();
	private static final JsonMapper JSON = JsonMapper.builder().build();

	@Value("${local.server.port}")
	private int port;

	@Autowired
	protected JdbcTemplate jdbc;

	/** The app's clock. It reads the real time unless a test sets it. */
	@Autowired
	protected TestClock clock;

	@DynamicPropertySource
	static void database(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
		registry.add("spring.datasource.username", () -> "postgres");
		registry.add("spring.datasource.password", () -> "");
	}

	@BeforeEach
	void cleanDatabase() {
		clock.reset();
		jdbc.execute("truncate table login_attempts, users, workspace cascade");
	}

	/** A browser-like client with its own cookies. */
	protected Client client() {
		return new Client("http://localhost:" + port);
	}

	/** Runs setup and returns a client signed in as the workspace owner. */
	protected Client signedInOwner() {
		Client owner = client();
		owner.post("/api/setup", Map.of("companyName", "Test Co", "name", "Owner", "email", "owner@test.com", "password", "Secret123!"))
				.expectStatus(201);
		return owner;
	}

	/** Creates and onboards a member, returning a client signed in as them. */
	protected Client signedInMember(Client admin, String email, String role) {
		Response created = admin.post("/api/employees", Map.of(
				"name", "Member " + email, "email", email, "department", "Engineering", "designation", "Developer", "role", role))
				.expectStatus(201);
		Client member = client();
		member.post("/api/auth/invite", Map.of("token", created.data().path("invite").path("token").asString(), "password", "MemberPass1!"))
				.expectStatus(200);
		return member;
	}

	/** The signed-in user's id. */
	protected static String idOf(Client client) {
		return client.get("/api/auth/session").data().path("user").path("id").asString();
	}

	/** The titles of the signed-in user's notifications, newest first. */
	protected static java.util.List<String> notificationTitles(Client client) {
		java.util.List<String> titles = new java.util.ArrayList<>();
		client.get("/api/notifications").expectStatus(200).data().forEach(n -> titles.add(n.path("title").asString()));
		return titles;
	}

	private static EmbeddedPostgres startPostgres() {
		try {
			return EmbeddedPostgres.builder().start();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	public record Response(int status, JsonNode body) {

		public JsonNode data() {
			return body.path("data");
		}

		public String error() {
			return body.path("error").asString();
		}

		public Response expectStatus(int expected) {
			if (status != expected) throw new AssertionError("Expected HTTP " + expected + " but got " + status + ": " + body);
			return this;
		}

	}

	public static class Client {

		private final String baseUrl;
		private final HttpClient http;

		private final Map<String, String> headers = new LinkedHashMap<>();

		Client(String baseUrl) {
			this.baseUrl = baseUrl;
			this.http = HttpClient.newBuilder().cookieHandler(new CookieManager()).build();
		}

		/** Sends this header with every request from this client. */
		public Client withHeader(String name, String value) {
			headers.put(name, value);
			return this;
		}

		public Response get(String path) {
			return send(HttpRequest.newBuilder(URI.create(baseUrl + path)).GET());
		}

		public Response delete(String path) {
			return send(HttpRequest.newBuilder(URI.create(baseUrl + path)).DELETE());
		}

		public Response post(String path, Object body) {
			return send(withJson(path, "POST", body));
		}

		public Response put(String path, Object body) {
			return send(withJson(path, "PUT", body));
		}

		public Response patch(String path, Object body) {
			return send(withJson(path, "PATCH", body));
		}

		public Response postRaw(String path, String rawBody) {
			return send(HttpRequest.newBuilder(URI.create(baseUrl + path))
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(rawBody)));
		}

		private HttpRequest.Builder withJson(String path, String method, Object body) {
			return HttpRequest.newBuilder(URI.create(baseUrl + path))
					.header("Content-Type", "application/json")
					.method(method, HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
		}

		private Response send(HttpRequest.Builder request) {
			headers.forEach(request::header);
			try {
				HttpResponse<String> response = http.send(request.build(), HttpResponse.BodyHandlers.ofString());
				String body = response.body();
				return new Response(response.statusCode(), JSON.readTree(body.isEmpty() ? "{}" : body));
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				throw new IllegalStateException(e);
			}
		}

	}

}
