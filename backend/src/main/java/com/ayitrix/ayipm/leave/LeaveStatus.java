package com.ayitrix.ayipm.leave;

import com.ayitrix.ayipm.common.ApiValue;

import jakarta.persistence.Converter;

public enum LeaveStatus implements ApiValue {
	PENDING("pending"),
	APPROVED("approved"),
	REJECTED("rejected");

	private final String value;

	LeaveStatus(String value) {
		this.value = value;
	}

	@Override
	public String value() {
		return value;
	}

	@Converter(autoApply = true)
	static class DbConverter extends ApiValue.DbConverter<LeaveStatus> {
		DbConverter() {
			super(LeaveStatus.class);
		}
	}

}
