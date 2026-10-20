package com.ayitrix.ayipm.workspace;

/**
 * Matches WorkspaceSettings in the frontend's src/types/settings.ts. Also used as the PATCH body, where a
 * null field means "leave unchanged".
 */
public record WorkspaceSettings(
		String companyName,
		String timezone,
		String workDayStart,
		Integer gracePeriodMinutes,
		Double halfDayThresholdHours,
		LeaveAllowance leaveAllowance,
		String employeeIdPrefix) {

	public record LeaveAllowance(Integer annual, Integer sick, Integer casual) {
	}

	public static WorkspaceSettings from(Workspace w) {
		return new WorkspaceSettings(
				w.getCompanyName(),
				w.getTimezone(),
				w.getWorkDayStart(),
				w.getGracePeriodMinutes(),
				w.getHalfDayThresholdHours(),
				new LeaveAllowance(w.getAnnualLeaveDays(), w.getSickLeaveDays(), w.getCasualLeaveDays()),
				w.getEmployeeIdPrefix());
	}

}
