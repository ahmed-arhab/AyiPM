package com.ayitrix.ayipm.leave;

import com.ayitrix.ayipm.common.ApiValue;

import jakarta.persistence.Converter;

/** Matches LeaveType in the frontend's src/types/leave.ts. Unpaid leave has no allowance. */
public enum LeaveType implements ApiValue {
	ANNUAL("Annual"),
	SICK("Sick"),
	CASUAL("Casual"),
	UNPAID("Unpaid");

	private final String value;

	LeaveType(String value) {
		this.value = value;
	}

	@Override
	public String value() {
		return value;
	}

	@Converter(autoApply = true)
	static class DbConverter extends ApiValue.DbConverter<LeaveType> {
		DbConverter() {
			super(LeaveType.class);
		}
	}

}
