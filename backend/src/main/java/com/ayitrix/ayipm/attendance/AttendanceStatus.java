package com.ayitrix.ayipm.attendance;

import com.ayitrix.ayipm.common.ApiValue;

import jakarta.persistence.Converter;

/** Matches AttendanceStatus in the frontend's src/types/attendance.ts. */
public enum AttendanceStatus implements ApiValue {
	PRESENT("present"),
	LATE("late"),
	HALF_DAY("half_day"),
	ABSENT("absent"),
	LEAVE("leave");

	private final String value;

	AttendanceStatus(String value) {
		this.value = value;
	}

	@Override
	public String value() {
		return value;
	}

	@Converter(autoApply = true)
	static class DbConverter extends ApiValue.DbConverter<AttendanceStatus> {
		DbConverter() {
			super(AttendanceStatus.class);
		}
	}

}
