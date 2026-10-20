package com.ayitrix.ayipm.task;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Matches Task in the frontend's src/types/task.ts. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskResponse(
		String id,
		String projectId,
		String title,
		String description,
		String assigneeId,
		String priority,
		String status,
		String dueDate,
		int order,
		List<Comment> comments,
		List<HistoryEntry> history,
		String createdBy,
		Instant createdAt,
		Instant updatedAt) {

	public record Comment(String id, String authorId, String text, Instant createdAt) {

		static Comment from(TaskComment c) {
			return new Comment(c.getId().toString(), c.getAuthorId().toString(), c.getText(), c.getCreatedAt());
		}

	}

	public record HistoryEntry(String id, String actorId, String action, Instant createdAt) {

		static HistoryEntry from(TaskHistoryEntry h) {
			return new HistoryEntry(h.getId().toString(), h.getActorId().toString(), h.getAction(), h.getCreatedAt());
		}

	}

	static TaskResponse from(Task t, List<Comment> comments, List<HistoryEntry> history) {
		return new TaskResponse(
				t.getId().toString(),
				t.getProjectId().toString(),
				t.getTitle(),
				t.getDescription(),
				t.getAssigneeId() == null ? null : t.getAssigneeId().toString(),
				t.getPriority().value(),
				t.getStatus().value(),
				t.getDueDate().toString(),
				t.getPosition(),
				comments,
				history,
				t.getCreatedById().toString(),
				t.getCreatedAt(),
				t.getUpdatedAt());
	}

}
