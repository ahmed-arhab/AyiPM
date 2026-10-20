package com.ayitrix.ayipm.project;

import com.ayitrix.ayipm.common.ApiValue;

import jakarta.persistence.Converter;

/** Labels match PROJECT_STATUS in the frontend's src/constants/status.ts. */
public enum ProjectStatus implements ApiValue {
	PLANNING("planning", "Planning"),
	IN_PROGRESS("in_progress", "In Progress"),
	IN_REVIEW("in_review", "In Review"),
	ON_HOLD("on_hold", "On Hold"),
	COMPLETED("completed", "Completed");

	private final String value;
	private final String label;

	ProjectStatus(String value, String label) {
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
	static class DbConverter extends ApiValue.DbConverter<ProjectStatus> {
		DbConverter() {
			super(ProjectStatus.class);
		}
	}

}
