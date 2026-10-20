package com.ayitrix.ayipm.leave;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

class LeaveApiTests extends IntegrationTest {

	// Balances count approved leave that starts this year, so use a date in this year.
	private static final LocalDate START = LocalDate.of(LocalDate.now().getYear(), 3, 2);

	private Client owner;
	private Client manager;
	private Client employee;

	@BeforeEach
	void createTeam() {
		owner = signedInOwner();
		manager = signedInMember(owner, "pm@test.com", "project_manager");
		employee = signedInMember(owner, "emp@test.com", "employee");
	}

	private Response request(Client client, String type, LocalDate start, int days) {
		return client.post("/api/leave", Map.of("employeeId", idOf(client), "leaveType", type, "startDate", start.toString(),
				"endDate", start.plusDays(days - 1).toString(), "reason", "Family trip"));
	}

	@Test
	void reviewersSeeEveryRequestAndEmployeesOnlyTheirOwn() {
		request(employee, "Annual", START, 2).expectStatus(201);
		request(manager, "Casual", START, 1).expectStatus(201);
		assertThat(owner.get("/api/leave").data().size()).isEqualTo(2);
		assertThat(manager.get("/api/leave").data().size()).isEqualTo(2);
		assertThat(employee.get("/api/leave").data().size()).isEqualTo(1);
		assertThat(notificationTitles(owner)).contains("New leave request");
		assertThat(notificationTitles(manager)).contains("New leave request");
	}

	@Test
	void requestsAreValidated() {
		Response other = employee.post("/api/leave", Map.of("employeeId", idOf(owner), "leaveType", "Annual", "startDate", START.toString(),
				"endDate", START.toString(), "reason", "x"));
		assertThat(other.status()).isEqualTo(403);
		assertThat(request(employee, "Annual", START, 0).error()).isEqualTo("End date must be on or after the start date.");

		request(employee, "Annual", START, 3).expectStatus(201);
		assertThat(request(employee, "Sick", START.plusDays(2), 1).error()).isEqualTo("You already have a leave request covering these dates.");
		// 20 annual days a year by default; 3 are pending.
		assertThat(request(employee, "Annual", START.plusDays(10), 18).error()).isEqualTo("Not enough annual leave remaining (17 day(s) available).");
		request(employee, "Unpaid", START.plusDays(10), 30).expectStatus(201);
	}

	@Test
	void approvingWritesLeaveAttendanceAndNotifiesTheEmployee() {
		String id = request(employee, "Annual", START, 3).expectStatus(201).data().path("id").asString();
		Response approved = manager.post("/api/leave/" + id + "/approve", Map.of()).expectStatus(200);
		assertThat(approved.data().path("status").asString()).isEqualTo("approved");
		assertThat(approved.data().path("reviewedBy").asString()).isEqualTo(idOf(manager));

		Integer leaveDays = jdbc.queryForObject("select count(*) from attendance_records where user_id = ? and status = 'leave'", Integer.class,
				UUID.fromString(idOf(employee)));
		assertThat(leaveDays).isEqualTo(3);
		assertThat(notificationTitles(employee)).contains("Leave approved");
		assertThat(employee.get("/api/leave/balance").data().path("annual").path("used").asInt()).isEqualTo(3);
		assertThat(manager.post("/api/leave/" + id + "/approve", Map.of()).error()).isEqualTo("This request has already been reviewed.");
	}

	@Test
	void rejectingNeedsAReasonAndYouCantApproveYourOwnRequest() {
		String mine = request(manager, "Casual", START, 1).expectStatus(201).data().path("id").asString();
		assertThat(manager.post("/api/leave/" + mine + "/approve", Map.of()).error()).isEqualTo("Another reviewer must approve your own leave request.");
		assertThat(owner.post("/api/leave/" + mine + "/reject", Map.of("reason", " ")).error()).isEqualTo("Please provide a reason for rejecting.");
		Response rejected = owner.post("/api/leave/" + mine + "/reject", Map.of("reason", "Busy week")).expectStatus(200);
		assertThat(rejected.data().path("rejectionReason").asString()).isEqualTo("Busy week");
		assertThat(employee.post("/api/leave/" + mine + "/approve", Map.of()).status()).isEqualTo(403);
	}

	@Test
	void peopleCanCancelTheirOwnPendingRequests() {
		String id = request(employee, "Sick", START, 1).expectStatus(201).data().path("id").asString();
		assertThat(manager.delete("/api/leave/" + id).status()).isEqualTo(403);
		employee.delete("/api/leave/" + id).expectStatus(200);
		assertThat(employee.get("/api/leave").data().size()).isZero();
	}

	@Test
	void balancesOfOthersNeedTheReviewPermission() {
		assertThat(employee.get("/api/leave/balance?employeeId=" + idOf(manager)).status()).isEqualTo(403);
		Response balance = manager.get("/api/leave/balance?employeeId=" + idOf(employee)).expectStatus(200);
		assertThat(balance.data().path("sick").path("total").asInt()).isEqualTo(10);
	}

}
