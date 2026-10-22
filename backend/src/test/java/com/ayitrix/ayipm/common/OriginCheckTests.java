package com.ayitrix.ayipm.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.ayitrix.ayipm.IntegrationTest;

import tools.jackson.databind.json.JsonMapper;

class OriginCheckTests extends IntegrationTest {

	private static final String BLOCKED = "Requests from other sites are not allowed.";

	@Value("${local.server.port}")
	private int port;

	private static Map<String, String> member(String email) {
		return Map.of("name", "Member", "email", email, "department", "Engineering", "designation", "Developer", "role", "employee");
	}

	private static int employeeCount(Client client) {
		return client.get("/api/employees").expectStatus(200).data().size();
	}

	@Test
	void theConfiguredFrontendCanChangeData() {
		Client browser = client().withHeader("Origin", "http://localhost:3000");
		browser.post("/api/setup", Map.of("companyName", "Test Co", "name", "Owner", "email", "owner@test.com", "password", "Secret123!"))
				.expectStatus(201);
		browser.post("/api/employees", member("emp@test.com")).expectStatus(201);
		browser.post("/api/auth/logout", Map.of()).expectStatus(200);
	}

	@Test
	void anotherSiteCannotChangeDataWithTheSessionCookie() {
		Client owner = signedInOwner().withHeader("Origin", "https://evil.example");
		Response blocked = owner.post("/api/employees", member("emp@test.com"));
		assertThat(blocked.status()).isEqualTo(403);
		assertThat(blocked.error()).isEqualTo(BLOCKED);
		assertThat(owner.post("/api/auth/logout", Map.of()).status()).isEqualTo(403);

		assertThat(employeeCount(owner)).isEqualTo(1);
		assertThat(owner.get("/api/auth/session").data().path("user").isObject()).isTrue();
	}

	@Test
	void anotherPortOnTheSameHostCountsAsAnotherSite() {
		// SameSite=Lax still sends the cookie here, because ports don't make a different site.
		Client owner = signedInOwner().withHeader("Origin", "http://localhost:3001");
		assertThat(owner.post("/api/employees", member("emp@test.com")).status()).isEqualTo(403);
		assertThat(owner.delete("/api/me/preferences").status()).isEqualTo(403);
		assertThat(employeeCount(owner)).isEqualTo(1);
	}

	@Test
	void nullOriginIsRejectedEvenWithAnAllowedReferer() {
		Client owner = signedInOwner().withHeader("Origin", "null").withHeader("Referer", "http://localhost:3000/team");
		Response blocked = owner.post("/api/employees", member("emp@test.com"));
		assertThat(blocked.status()).isEqualTo(403);
		assertThat(blocked.error()).isEqualTo(BLOCKED);
	}

	@Test
	void refererIsCheckedWhenOriginIsMissing() {
		Client owner = signedInOwner().withHeader("Referer", "http://localhost:3000/team?status=active");
		owner.post("/api/employees", member("first@test.com")).expectStatus(201);

		owner.withHeader("Referer", "https://evil.example/localhost:3000");
		assertThat(owner.post("/api/employees", member("second@test.com")).status()).isEqualTo(403);
		assertThat(employeeCount(owner)).isEqualTo(2);
	}

	@Test
	void requestsWithoutOriginOrRefererAreAllowed() {
		// What curl, scripts and server-to-server calls send.
		Client owner = signedInOwner();
		owner.post("/api/employees", member("emp@test.com")).expectStatus(201);
		owner.delete("/api/me/preferences").expectStatus(200);
	}

	@Test
	void theBackendsOwnAddressIsAllowed() {
		// For pages the backend serves itself, such as the API docs.
		Client owner = signedInOwner().withHeader("Origin", "http://localhost:" + port);
		owner.post("/api/employees", member("emp@test.com")).expectStatus(201);
	}

	@Test
	void theAddressTheBrowserUsedThroughTheProxyIsAllowed() {
		// The Next.js proxy forwards the browser's Host as X-Forwarded-Host, here with FRONTEND_PORT=3005.
		Client owner = signedInOwner().withHeader("X-Forwarded-Host", "localhost:3005").withHeader("Origin", "http://localhost:3005");
		owner.post("/api/employees", member("first@test.com")).expectStatus(201);

		// An HTTPS proxy in front of it adds X-Forwarded-Proto, and the scheme has to match too.
		owner.withHeader("X-Forwarded-Host", "pm.example.com").withHeader("X-Forwarded-Proto", "https").withHeader("Origin", "https://pm.example.com");
		owner.post("/api/employees", member("second@test.com")).expectStatus(201);
		owner.withHeader("Origin", "http://pm.example.com");
		assertThat(owner.post("/api/employees", member("third@test.com")).status()).isEqualTo(403);
	}

	@Test
	void readingIsNotAffected() {
		Client owner = signedInOwner().withHeader("Origin", "https://evil.example");
		assertThat(employeeCount(owner)).isEqualTo(1);
		owner.get("/api/auth/session").expectStatus(200);
	}

	@Test
	void allowedOriginsAreNormalisedAndMustBeOrigins() throws Exception {
		JsonMapper json = JsonMapper.builder().build();
		OriginCheckFilter filter = new OriginCheckFilter(" HTTPS://PM.example.com:443/ , http://localhost:3000,", json);
		MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/employees");
		request.addHeader("Origin", "https://pm.example.com");
		MockFilterChain chain = new MockFilterChain();
		filter.doFilter(request, new MockHttpServletResponse(), chain);
		assertThat(chain.getRequest()).isNotNull();

		assertThatThrownBy(() -> new OriginCheckFilter("http://localhost:3000,localhost:3005", json))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("\"localhost:3005\"");
	}

}
