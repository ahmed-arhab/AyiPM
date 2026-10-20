package com.ayitrix.ayipm.task;

/**
 * Matches TaskInput in the frontend's src/types/task.ts. For PATCH, a null field means "leave unchanged"; an empty
 * {@code assigneeId} unassigns the task.
 */
public record TaskRequest(
		String projectId,
		String title,
		String description,
		String assigneeId,
		String priority,
		String status,
		String dueDate) {

	boolean onlyChangesStatus() {
		return projectId == null && title == null && description == null && assigneeId == null && priority == null && dueDate == null;
	}

}
