package com.ayitrix.ayipm.attendance;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Matches AttendanceRecord in the frontend's src/types/attendance.ts. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AttendanceResponse(
		String id,
		String employeeId,
		String date,
		Instant checkInAt,
		Instant checkOutAt,
		Double workingHours,
		String status,
		String notes) {

	static AttendanceResponse from(AttendanceRecord r) {
		return new AttendanceResponse(
				r.getId().toString(),
				r.getUserId().toString(),
				r.getDate().toString(),
				r.getCheckInAt(),
				r.getCheckOutAt(),
				r.getWorkingHours(),
				r.getStatus().value(),
				r.getNotes());
	}

	/** The optional body of a check-in. */
	public record CheckIn(String notes) {
	}

}
