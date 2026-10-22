package com.ayitrix.ayipm.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Starts the app with the prod profile on its own database, with the credentials passed the way a server passes them,
 * and checks that the health endpoint says only UP or DOWN.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
		// The embedded database trusts local connections, so any password works.
		properties = { "DATABASE_USERNAME=postgres", "DATABASE_PASSWORD=set-by-the-test" })
@ActiveProfiles("prod")
class ProductionProfileTests {

	private static final EmbeddedPostgres POSTGRES = start();

	@Value("${local.server.port}")
	private int port;

	@DynamicPropertySource
	static void database(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
	}

	@Test
	void healthShowsOnlyTheStatus() throws Exception {
		HttpResponse<String> health = HttpClient.newHttpClient().send(
				HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/actuator/health")).build(),
				HttpResponse.BodyHandlers.ofString());

		JsonNode body = JsonMapper.builder().build().readTree(health.body());
		assertThat(health.statusCode()).isEqualTo(200);
		assertThat(body.path("status").asString()).isEqualTo("UP");
		assertThat(body.has("components")).as("components in %s", body).isFalse();
		assertThat(body.has("details")).as("details in %s", body).isFalse();
	}

	private static EmbeddedPostgres start() {
		try {
			return EmbeddedPostgres.builder().start();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

}
