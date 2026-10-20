package com.ayitrix.ayipm.task;

import com.ayitrix.ayipm.common.ApiValue;

import jakarta.persistence.Converter;

/** Labels match TASK_STATUS in the frontend's src/constants/status.ts; they appear in task history. */
public enum TaskStatus implements ApiValue {
	BACKLOG("backlog", "To Do"),
	IN_PROGRESS("in_progress", "In Progress"),
	REVIEW("review", "Review"),
	DONE("done", "Completed");

	private final String value;
	private final String label;

	TaskStatus(String value, String label) {
		this.value = value;
		this.label = label;
	}

	@Override
	public String value() {
		return value;
	}

	public String label() {
		return label;
	}

	@Converter(autoApply = true)
	static class DbConverter extends ApiValue.DbConverter<TaskStatus> {
		DbConverter() {
			super(TaskStatus.class);
		}
	}

}
