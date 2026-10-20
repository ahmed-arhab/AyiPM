package com.ayitrix.ayipm.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

class NotificationApiTests extends IntegrationTest {

	private Client owner;
	private Client employee;

	@BeforeEach
	void sendTwoNotifications() {
		owner = signedInOwner();
		employee = signedInMember(owner, "emp@test.com", "employee");
		for (String name : List.of("One", "Two")) {
			owner.post("/api/projects", Map.of("name", name, "startDate", "2026-01-01", "endDate", "2026-02-01", "status", "planning",
					"members", List.of(idOf(employee)))).expectStatus(201);
		}
	}

	@Test
	void peopleManageTheirOwnNotifications() {
		Response list = employee.get("/api/notifications").expectStatus(200);
		assertThat(list.data().size()).isEqualTo(2);
		assertThat(list.data().get(0).path("message").asString()).isEqualTo("You were added to Two.");
		assertThat(list.data().get(0).path("senderId").asString()).isEqualTo(idOf(owner));
		String id = list.data().get(0).path("id").asString();

		assertThat(employee.patch("/api/notifications/" + id, Map.of("read", true)).expectStatus(200).data().path("read").asBoolean()).isTrue();
		employee.post("/api/notifications/read-all", Map.of()).expectStatus(200);
		employee.get("/api/notifications").data().forEach(n -> assertThat(n.path("read").asBoolean()).isTrue());

		employee.delete("/api/notifications/" + id).expectStatus(200);
		assertThat(employee.get("/api/notifications").data().size()).isEqualTo(1);
		employee.delete("/api/notifications").expectStatus(200);
		assertThat(employee.get("/api/notifications").data().size()).isZero();
	}

	@Test
	void nobodyCanTouchSomeoneElsesNotifications() {
		String id = employee.get("/api/notifications").data().get(0).path("id").asString();
		assertThat(owner.patch("/api/notifications/" + id, Map.of("read", true)).status()).isEqualTo(404);
		assertThat(owner.delete("/api/notifications/" + id).status()).isEqualTo(404);
		assertThat(notificationTitles(owner)).isEmpty();
	}

}
