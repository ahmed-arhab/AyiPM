package com.ayitrix.ayipm.workspace;

import java.util.Optional;
import java.util.function.IntConsumer;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.employee.UserRepository;

@Service
public class WorkspaceService {

	private static final Pattern TIME = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");
	private static final Pattern ID_PREFIX = Pattern.compile("^[A-Za-z]{1,5}$");

	private final WorkspaceRepository workspaces;
	private final UserRepository users;

	public WorkspaceService(WorkspaceRepository workspaces, UserRepository users) {
		this.workspaces = workspaces;
		this.users = users;
	}

	@Transactional(readOnly = true)
	public boolean needsSetup() {
		return users.count() == 0;
	}

	@Transactional(readOnly = true)
	public Optional<WorkspaceSettings> getSettings() {
		return workspaces.findById(Workspace.DEFAULT_ID).map(WorkspaceSettings::from);
	}

	@Transactional(readOnly = true)
	public String getEmployeeIdPrefix() {
		return workspaces.findById(Workspace.DEFAULT_ID).map(Workspace::getEmployeeIdPrefix).orElse("AX");
	}

	@Transactional
	public WorkspaceSettings update(WorkspaceSettings update) {
		Workspace workspace = workspaces.findById(Workspace.DEFAULT_ID)
				.orElseThrow(() -> ApiException.notFound("Workspace has not been set up."));

		if (update.companyName() != null) {
			if (update.companyName().isBlank()) throw ApiException.badRequest("Company name is required.");
			workspace.setCompanyName(update.companyName().trim());
		}
		if (update.timezone() != null) {
			workspace.setTimezone(update.timezone());
		}
		if (update.workDayStart() != null) {
			if (!TIME.matcher(update.workDayStart()).matches()) {
				throw ApiException.badRequest("Work day start must be a time like 09:00.");
			}
			workspace.setWorkDayStart(update.workDayStart());
		}
		if (update.gracePeriodMinutes() != null) {
			int minutes = update.gracePeriodMinutes();
			if (minutes < 0 || minutes > 180) throw ApiException.badRequest("Grace period must be between 0 and 180 minutes.");
			workspace.setGracePeriodMinutes(minutes);
		}
		if (update.halfDayThresholdHours() != null) {
			double hours = update.halfDayThresholdHours();
			if (!(hours > 0 && hours <= 12)) throw ApiException.badRequest("Half-day threshold must be between 0 and 12 hours.");
			workspace.setHalfDayThresholdHours(hours);
		}
		if (update.employeeIdPrefix() != null) {
			if (!ID_PREFIX.matcher(update.employeeIdPrefix()).matches()) {
				throw ApiException.badRequest("Employee ID prefix must be 1–5 letters.");
			}
			workspace.setEmployeeIdPrefix(update.employeeIdPrefix().toUpperCase());
		}
		WorkspaceSettings.LeaveAllowance allowance = update.leaveAllowance();
		if (allowance != null) {
			setLeaveDays(allowance.annual(), workspace::setAnnualLeaveDays);
			setLeaveDays(allowance.sick(), workspace::setSickLeaveDays);
			setLeaveDays(allowance.casual(), workspace::setCasualLeaveDays);
		}
		return WorkspaceSettings.from(workspaces.saveAndFlush(workspace));
	}

	private static void setLeaveDays(Integer days, IntConsumer setter) {
		if (days == null) return;
		if (days < 0 || days > 365) throw ApiException.badRequest("Leave allowance must be between 0 and 365 days.");
		setter.accept(days);
	}

}
