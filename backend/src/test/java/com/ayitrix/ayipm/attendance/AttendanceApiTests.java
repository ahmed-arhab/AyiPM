package com.ayitrix.ayipm.attendance;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

import tools.jackson.databind.JsonNode;

class AttendanceApiTests extends IntegrationTest {

	// A Monday in Colombo (UTC+05:30), the default workspace time zone. The default schedule starts at 09:00 with a
	// 15-minute grace period, and a day shorter than 4.5 hours is a half day.
	private static final LocalDate DAY = LocalDate.of(2026, 3, 2);
	private static final ZoneId COLOMBO = ZoneId.of("Asia/Colombo");

	private Client owner;
	private Client manager;
	private Client employee;

	@BeforeEach
	void createTeam() {
		clock.set(at(8, 0));
		owner = signedInOwner();
		manager = signedInMember(owner, "pm@test.com", "project_manager");
		employee = signedInMember(owner, "emp@test.com", "employee");
	}

	private static Instant at(int hour, int minute) {
		return DAY.atTime(hour, minute).atZone(COLOMBO).toInstant();
	}

	private static Response checkIn(Client client) {
		return client.post("/api/attendance/check-in", Map.of());
	}

	private static Response checkOut(Client client) {
		return client.post("/api/attendance/check-out", Map.of());
	}

	@Test
	void checkingInWithinTheGracePeriodIsOnTime() {
		clock.set(at(9, 15));
		Response in = employee.post("/api/attendance/check-in", Map.of("notes", "  At the office  ")).expectStatus(200);
		assertThat(in.data().path("date").asString()).isEqualTo("2026-03-02");
		assertThat(in.data().path("employeeId").asString()).isEqualTo(idOf(employee));
		assertThat(in.data().path("checkInAt").asString()).isEqualTo("2026-03-02T03:45:00Z");
		assertThat(in.data().path("status").asString()).isEqualTo("present");
		assertThat(in.data().path("notes").asString()).isEqualTo("At the office");
		assertThat(in.data().has("checkOutAt")).isFalse();

		clock.set(at(17, 35));
		Response out = checkOut(employee).expectStatus(200);
		assertThat(out.data().path("checkOutAt").asString()).isEqualTo("2026-03-02T12:05:00Z");
		assertThat(out.data().path("workingHours").asDouble()).isEqualTo(8.33);
		assertThat(out.data().path("status").asString()).isEqualTo("present");
		assertThat(notificationTitles(manager)).doesNotContain("Late check-in");
	}

	@Test
	void checkingInAfterTheGracePeriodIsLateAndTellsManagers() {
		clock.set(at(9, 16));
		assertThat(checkIn(employee).expectStatus(200).data().path("status").asString()).isEqualTo("late");
		assertThat(notificationTitles(manager)).contains("Late check-in");
		assertThat(notificationTitles(owner)).contains("Late check-in");

		// A full day keeps the late mark.
		clock.set(at(18, 0));
		assertThat(checkOut(employee).expectStatus(200).data().path("status").asString()).isEqualTo("late");
	}

	@Test
	void leavingBeforeTheHalfDayThresholdIsAHalfDay() {
		clock.set(at(9, 0));
		checkIn(employee).expectStatus(200);
		clock.set(at(13, 29));
		Response out = checkOut(employee).expectStatus(200);
		assertThat(out.data().path("workingHours").asDouble()).isEqualTo(4.48);
		assertThat(out.data().path("status").asString()).isEqualTo("half_day");
	}

	@Test
	void youCheckInAndOutOnceADay() {
		Response early = checkOut(employee);
		assertThat(early.status()).isEqualTo(400);
		assertThat(early.error()).isEqualTo("You have not checked in today.");

		clock.set(at(9, 0));
		checkIn(employee).expectStatus(200);
		assertThat(checkIn(employee).error()).isEqualTo("You are already checked in.");
		clock.set(at(17, 0));
		checkOut(employee).expectStatus(200);
		assertThat(checkOut(employee).error()).isEqualTo("You have already checked out.");
		assertThat(checkIn(employee).error()).isEqualTo("You've already completed today's shift.");

		// The next day starts fresh.
		clock.set(at(9, 0).plus(Duration.ofDays(1)));
		checkIn(employee).expectStatus(200);
		assertThat(employee.get("/api/attendance").data().size()).isEqualTo(2);
	}

	@Test
	void youCantCheckInOnApprovedLeave() {
		String id = employee.post("/api/leave", Map.of("employeeId", idOf(employee), "leaveType", "Casual", "startDate", DAY.toString(),
				"endDate", DAY.toString(), "reason", "Doctor's appointment")).expectStatus(201).data().path("id").asString();
		manager.post("/api/leave/" + id + "/approve", Map.of()).expectStatus(200);

		clock.set(at(9, 0));
		assertThat(checkIn(employee).error()).isEqualTo("You are on approved leave today.");
	}

	@Test
	void todayAndLatenessFollowTheWorkspaceTimeZone() {
		owner.patch("/api/workspace", Map.of("timezone", "Pacific/Auckland")).expectStatus(200);

		// 20:05 UTC on 2 March is 09:05 on 3 March in Auckland (UTC+13): on time, and dated the 3rd.
		clock.set(Instant.parse("2026-03-02T20:05:00Z"));
		Response in = checkIn(employee).expectStatus(200);
		assertThat(in.data().path("date").asString()).isEqualTo("2026-03-03");
		assertThat(in.data().path("status").asString()).isEqualTo("present");
	}

	@Test
	void everyoneSeesTheirOwnRecordsAndManagersSeeEveryones() {
		clock.set(at(9, 0));
		checkIn(employee).expectStatus(200);
		checkIn(manager).expectStatus(200);
		String employeeId = idOf(employee);

		assertThat(client().get("/api/attendance").status()).isEqualTo(401);
		assertThat(employee.get("/api/attendance").data().size()).isEqualTo(1);
		assertThat(employee.get("/api/attendance?employeeId=" + employeeId).data().size()).isEqualTo(1);
		assertThat(employee.get("/api/attendance?employeeId=" + idOf(manager)).status()).isEqualTo(403);

		assertThat(manager.get("/api/attendance").data().size()).isEqualTo(2);
		JsonNode theirs = manager.get("/api/attendance?employeeId=" + employeeId).expectStatus(200).data();
		assertThat(theirs.size()).isEqualTo(1);
		assertThat(theirs.get(0).path("employeeId").asString()).isEqualTo(employeeId);

		// Both ends of the range are included.
		assertThat(manager.get("/api/attendance?from=2026-03-02&to=2026-03-02").data().size()).isEqualTo(2);
		assertThat(manager.get("/api/attendance?from=2026-03-03").data().size()).isZero();
		assertThat(manager.get("/api/attendance?from=2026-03-03&to=2026-03-02").error()).isEqualTo("End date must be on or after the start date.");
		assertThat(manager.get("/api/attendance?from=yesterday").error()).isEqualTo("Invalid value for from.");
	}

	@Test
	void checkInAndCheckOutAreInTheActivityLog() {
		clock.set(at(9, 20));
		checkIn(employee).expectStatus(200);
		clock.set(at(17, 30));
		checkOut(employee).expectStatus(200);

		JsonNode entries = owner.get("/api/activity?entityType=attendance").expectStatus(200).data();
		assertThat(entries.size()).isEqualTo(2);
		assertThat(entries.get(0).path("action").asString()).isEqualTo("Checked Out");
		assertThat(entries.get(0).path("details").asString()).isEqualTo("05:30 PM · 8.17h logged");
		assertThat(entries.get(1).path("action").asString()).isEqualTo("Checked In");
		assertThat(entries.get(1).path("details").asString()).isEqualTo("09:20 AM (late)");
	}

}
