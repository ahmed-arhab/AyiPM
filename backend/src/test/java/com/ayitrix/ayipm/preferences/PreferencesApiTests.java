package com.ayitrix.ayipm.preferences;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

class PreferencesApiTests extends IntegrationTest {

	@Test
	void defaultsComeWithTheSessionAndChangesAreSaved() {
		Client owner = signedInOwner();
		assertThat(owner.get("/api/auth/session").data().path("preferences").path("dateFormat").asString()).isEqualTo("YYYY-MM-DD");

		Response updated = owner.patch("/api/me/preferences", Map.of("dateFormat", "DD/MM/YYYY", "notificationCategories", Map.of("task", false)))
				.expectStatus(200);
		assertThat(updated.data().path("dateFormat").asString()).isEqualTo("DD/MM/YYYY");
		assertThat(updated.data().path("timeFormat").asString()).isEqualTo("12h");
		assertThat(updated.data().path("notificationCategories").path("task").asBoolean()).isFalse();
		assertThat(updated.data().path("notificationCategories").path("leave").asBoolean()).isTrue();

		Client otherDevice = client();
		otherDevice.post("/api/auth/login", Map.of("email", "owner@test.com", "password", "Secret123!")).expectStatus(200);
		assertThat(otherDevice.get("/api/me/preferences").data().path("dateFormat").asString()).isEqualTo("DD/MM/YYYY");

		assertThat(owner.delete("/api/me/preferences").expectStatus(200).data().path("dateFormat").asString()).isEqualTo("YYYY-MM-DD");
	}

	@Test
	void invalidValuesAreRejected() {
		Client owner = signedInOwner();
		assertThat(owner.patch("/api/me/preferences", Map.of("language", "Klingon")).error()).isEqualTo("Choose a supported language.");
		assertThat(owner.patch("/api/me/preferences", Map.of("notificationCategories", Map.of("gossip", true))).status()).isEqualTo(400);
	}

	@Test
	void turnedOffCategoriesAreNotNotified() {
		Client owner = signedInOwner();
		Client employee = signedInMember(owner, "emp@test.com", "employee");
		employee.patch("/api/me/preferences", Map.of("notificationCategories", Map.of("project", false))).expectStatus(200);
		owner.post("/api/projects", Map.of("name", "Quiet", "startDate", "2026-01-01", "endDate", "2026-02-01", "status", "planning",
				"members", List.of(idOf(employee)))).expectStatus(201);
		assertThat(notificationTitles(employee)).isEmpty();
	}

}
