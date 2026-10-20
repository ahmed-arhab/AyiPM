package com.ayitrix.ayipm.task;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.IntegrationTest;

import tools.jackson.databind.JsonNode;

class TaskApiTests extends IntegrationTest {

	private Client owner;
	private Client assignee;
	private Client other;
	private String projectId;

	@BeforeEach
	void createProject() {
		owner = signedInOwner();
		assignee = signedInMember(owner, "assignee@test.com", "employee");
		other = signedInMember(owner, "other@test.com", "employee");
		projectId = owner.post("/api/projects", Map.of("name", "Board", "startDate", "2026-01-01", "endDate", "2026-12-31", "status", "in_progress",
				"members", List.of())).expectStatus(201).data().path("id").asString();
	}

	private String createTask(String title, String assigneeId) {
		Map<String, Object> body = new java.util.HashMap<>(Map.of("projectId", projectId, "title", title, "description", "", "priority", "high",
				"status", "backlog", "dueDate", "2026-06-01"));
		if (assigneeId != null) body.put("assigneeId", assigneeId);
		return owner.post("/api/tasks", body).expectStatus(201).data().path("id").asString();
	}

	private List<String> backlogTitles() {
		List<JsonNode> backlog = new ArrayList<>();
		owner.get("/api/tasks").data().forEach(t -> {
			if (t.path("status").asString().equals("backlog")) backlog.add(t);
		});
		backlog.sort((a, b) -> Integer.compare(a.path("order").asInt(), b.path("order").asInt()));
		return backlog.stream().map(t -> t.path("title").asString()).toList();
	}

	@Test
	void creatingATaskAddsTheAssigneeToTheProjectAndNotifiesThem() {
		String id = createTask("Design login", idOf(assignee));
		JsonNode task = owner.get("/api/tasks?projectId=" + projectId).data().get(0);
		assertThat(task.path("id").asString()).isEqualTo(id);
		assertThat(task.path("history").get(0).path("action").asString()).isEqualTo("Created task");
		assertThat(owner.get("/api/projects").data().get(0).path("members").toString()).contains(idOf(assignee));
		assertThat(notificationTitles(assignee)).contains("Task assigned to you");
		assertThat(assignee.post("/api/tasks", Map.of("projectId", projectId, "title", "X", "priority", "low", "status", "backlog", "dueDate", "2026-06-01"))
				.status()).isEqualTo(403);
	}

	@Test
	void assigneesCanOnlyChangeTheStatusOfTheirOwnTasks() {
		String id = createTask("Write tests", idOf(assignee));
		Response moved = assignee.patch("/api/tasks/" + id, Map.of("status", "in_progress")).expectStatus(200);
		assertThat(moved.data().path("history").get(1).path("action").asString()).isEqualTo("Moved to In Progress");
		assertThat(notificationTitles(owner)).contains("Task status updated");

		Response rename = assignee.patch("/api/tasks/" + id, Map.of("title", "Something else"));
		assertThat(rename.status()).isEqualTo(403);
		assertThat(rename.error()).isEqualTo("You can only change the status of tasks assigned to you.");
		assertThat(other.post("/api/tasks/" + id + "/move", Map.of("status", "done")).error()).isEqualTo("You can only move tasks assigned to you.");
	}

	@Test
	void managerEditsAreRecordedInHistory() {
		String id = createTask("Old title", null);
		Response updated = owner.patch("/api/tasks/" + id, Map.of("title", "New title", "priority", "urgent", "assigneeId", idOf(other))).expectStatus(200);
		List<String> actions = new ArrayList<>();
		updated.data().path("history").forEach(h -> actions.add(h.path("action").asString()));
		assertThat(actions).containsExactly("Created task", "Renamed task", "Priority set to Urgent", "Assigned to Member other@test.com");

		Response unassigned = owner.patch("/api/tasks/" + id, Map.of("assigneeId", "")).expectStatus(200);
		assertThat(unassigned.data().has("assigneeId")).isFalse();
		assertThat(owner.patch("/api/tasks/" + id, Map.of("title", " ")).error()).isEqualTo("Task title is required.");
		assertThat(owner.patch("/api/tasks/" + id, Map.of("assigneeId", "00000000-0000-0000-0000-000000000000")).error())
				.isEqualTo("Select an active assignee.");
	}

	@Test
	void movingWithAnIndexReordersTheColumn() {
		createTask("A", null);
		createTask("B", null);
		String c = createTask("C", null);
		assertThat(backlogTitles()).containsExactly("A", "B", "C");

		Response column = owner.post("/api/tasks/" + c + "/move", Map.of("status", "backlog", "index", 0)).expectStatus(200);
		assertThat(column.data().size()).isEqualTo(3);
		assertThat(backlogTitles()).containsExactly("C", "A", "B");

		owner.post("/api/tasks/" + c + "/move", Map.of("status", "done")).expectStatus(200);
		assertThat(backlogTitles()).containsExactly("A", "B");
	}

	@Test
	void commentsNotifyTheAssigneeAndCreator() {
		String id = createTask("Discuss", idOf(assignee));
		assertThat(other.post("/api/tasks/" + id + "/comments", Map.of("text", "  ")).error()).isEqualTo("Comment cannot be empty.");
		Response commented = other.post("/api/tasks/" + id + "/comments", Map.of("text", "Looks good")).expectStatus(201);
		assertThat(commented.data().path("comments").get(0).path("text").asString()).isEqualTo("Looks good");
		assertThat(notificationTitles(assignee)).contains("New comment");
		assertThat(notificationTitles(owner)).contains("New comment");
	}

	@Test
	void deletingAProjectDeletesItsTasks() {
		String id = createTask("Gone soon", null);
		owner.post("/api/tasks/" + id + "/comments", Map.of("text", "note")).expectStatus(201);
		owner.delete("/api/projects/" + projectId).expectStatus(200);
		assertThat(owner.get("/api/tasks").data().size()).isZero();
		assertThat(owner.delete("/api/tasks/" + id).status()).isEqualTo(404);
	}

}
