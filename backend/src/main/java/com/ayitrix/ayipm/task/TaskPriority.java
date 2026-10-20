package com.ayitrix.ayipm.task;

import com.ayitrix.ayipm.common.ApiValue;

import jakarta.persistence.Converter;

/** Labels match TASK_PRIORITY in the frontend's src/constants/status.ts. */
public enum TaskPriority implements ApiValue {
	URGENT("urgent", "Urgent"),
	HIGH("high", "High"),
	MEDIUM("medium", "Medium"),
	LOW("low", "Low");

	private final String value;
	private final String label;

	TaskPriority(String value, String label) {
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

	/** Priority of the "Task assigned to you" notification. */
	String notificationPriority() {
		return switch (this) {
			case URGENT -> "urgent";
			case HIGH -> "high";
			default -> "normal";
		};
	}

	@Converter(autoApply = true)
	static class DbConverter extends ApiValue.DbConverter<TaskPriority> {
		DbConverter() {
			super(TaskPriority.class);
		}
	}

}
