package com.ayitrix.ayipm.leave;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Matches LeaveRequest in the frontend's src/types/leave.ts. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LeaveResponse(
		String id,
		String employeeId,
		String leaveType,
		String startDate,
		String endDate,
		int days,
		String reason,
		String status,
		String appliedOn,
		String reviewedBy,
		Instant reviewedAt,
		String rejectionReason) {

	static LeaveResponse from(LeaveRequest r) {
		return new LeaveResponse(
				r.getId().toString(),
				r.getUserId().toString(),
				r.getLeaveType().value(),
				r.getStartDate().toString(),
				r.getEndDate().toString(),
				r.getDays(),
				r.getReason(),
				r.getStatus().value(),
				r.getAppliedOn().toString(),
				r.getReviewedById() == null ? null : r.getReviewedById().toString(),
				r.getReviewedAt(),
				r.getRejectionReason());
	}

	/** Matches LeaveBalance in src/types/leave.ts. */
	public record Balance(Bucket annual, Bucket sick, Bucket casual) {
	}

	public record Bucket(int total, int used) {
	}

	/** Matches LeaveRequestInput in src/types/leave.ts. */
	public record Submission(String employeeId, String leaveType, String startDate, String endDate, String reason) {
	}

}
