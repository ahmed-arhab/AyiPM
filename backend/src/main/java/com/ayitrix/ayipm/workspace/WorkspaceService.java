package com.ayitrix.ayipm.workspace;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Optional;
import java.util.function.IntConsumer;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.activity.ActivityService;
import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.auth.TwoFactorCipher;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.employee.Role;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;

@Service
public class WorkspaceService {

	private static final Pattern TIME = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");
	private static final Pattern ID_PREFIX = Pattern.compile("^[A-Za-z]{1,5}$");
	// A host name with at least two labels, such as example.com. International names in their xn-- form.
	private static final Pattern DOMAIN = Pattern.compile("^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$");

	private final WorkspaceRepository workspaces;
	private final UserRepository users;
	private final Clock clock;
	private final ActivityService activity;
	private final SessionService sessions;
	private final TwoFactorCipher twoFactorCipher;

	public WorkspaceService(WorkspaceRepository workspaces, UserRepository users, Clock clock, ActivityService activity, SessionService sessions,
			TwoFactorCipher twoFactorCipher) {
		this.workspaces = workspaces;
		this.users = users;
		this.clock = clock;
		this.activity = activity;
		this.sessions = sessions;
		this.twoFactorCipher = twoFactorCipher;
	}

	/** The workspace's time zone, or UTC if it isn't set up or the stored value isn't a valid zone. */
	@Transactional(readOnly = true)
	public ZoneId zone() {
		try {
			return workspaces.findById(Workspace.DEFAULT_ID).map(w -> ZoneId.of(w.getTimezone())).orElse(ZoneOffset.UTC);
		} catch (DateTimeException e) {
			return ZoneOffset.UTC;
		}
	}

	/** Today's date in the workspace's time zone. */
	public LocalDate today() {
		return LocalDate.now(clock.withZone(zone()));
	}

	@Transactional(readOnly = true)
	public WorkspaceSettings.LeaveAllowance leaveAllowance() {
		return workspaces.findById(Workspace.DEFAULT_ID)
				.map(w -> new WorkspaceSettings.LeaveAllowance(w.getAnnualLeaveDays(), w.getSickLeaveDays(), w.getCasualLeaveDays()))
				.orElse(new WorkspaceSettings.LeaveAllowance(20, 10, 7));
	}

	@Transactional(readOnly = true)
	public boolean needsSetup() {
		return users.count() == 0;
	}

	@Transactional(readOnly = true)
	public Optional<WorkspaceSettings> getSettings() {
		return workspaces.findById(Workspace.DEFAULT_ID).map(WorkspaceSettings::from);
	}

	/**
	 * Whether admins must use two-factor authentication. The requirement is suspended while the server has no
	 * encryption key, because nobody could set it up and admins without it would be locked out.
	 */
	@Transactional(readOnly = true)
	public boolean adminTwoFactorRequired() {
		return twoFactorCipher.isConfigured()
				&& workspaces.findById(Workspace.DEFAULT_ID).map(Workspace::isRequireAdminTwoFactor).orElse(false);
	}

	/** The Google Workspace domain that sign-in with Google is limited to, if the workspace sets one. */
	@Transactional(readOnly = true)
	public Optional<String> allowedGoogleDomain() {
		return workspaces.findById(Workspace.DEFAULT_ID).map(Workspace::getAllowedGoogleDomain);
	}

	@Transactional(readOnly = true)
	public String getEmployeeIdPrefix() {
		return workspaces.findById(Workspace.DEFAULT_ID).map(w -> w.getEmployeeIdPrefix()).orElse("AX");
	}

	@Transactional
	public WorkspaceSettings update(User actor, WorkspaceSettings update) {
		Workspace workspace = workspaces.findById(Workspace.DEFAULT_ID)
				.orElseThrow(() -> ApiException.notFound("Workspace has not been set up."));

		if (update.companyName() != null) {
			if (update.companyName().isBlank()) throw ApiException.badRequest("Company name is required.");
			workspace.setCompanyName(update.companyName().trim());
		}
		if (update.timezone() != null) {
			// Region ids only, like Europe/London. ZoneId.of also takes fixed offsets like +05:30, but those ignore daylight saving.
			if (!ZoneId.getAvailableZoneIds().contains(update.timezone())) throw ApiException.badRequest("Choose a valid time zone.");
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
		if (update.allowedGoogleDomain() != null) workspace.setAllowedGoogleDomain(googleDomain(update.allowedGoogleDomain()));
		boolean nowRequiringTwoFactor = Boolean.TRUE.equals(update.requireAdminTwoFactor()) && !workspace.isRequireAdminTwoFactor();
		if (nowRequiringTwoFactor) assertCanRequireTwoFactor(actor);
		if (update.requireAdminTwoFactor() != null) workspace.setRequireAdminTwoFactor(update.requireAdminTwoFactor());
		WorkspaceSettings saved = WorkspaceSettings.from(workspaces.saveAndFlush(workspace));
		if (nowRequiringTwoFactor) signOutAdminsWithoutTwoFactor();
		activity.record(actor, "Updated Workspace Settings", ActivityService.SETTINGS, null, "Workspace");
		return saved;
	}

	// Requiring it is only possible when it can be set up, and once the admin turning it on uses it, so the workspace
	// always keeps an admin who can sign in.
	private void assertCanRequireTwoFactor(User actor) {
		if (!twoFactorCipher.isConfigured()) {
			throw ApiException.conflict("Two-factor authentication isn't set up on this server yet, so it can't be required.");
		}
		if (!actor.hasTwoFactor()) {
			throw ApiException.badRequest("Turn on two-factor authentication for your own account before requiring it for admins.");
		}
	}

	// Admins without two-factor authentication set it up the next time they sign in.
	private void signOutAdminsWithoutTwoFactor() {
		users.findAllByRoleAndTwoFactorSecretIsNull(Role.ADMIN).forEach(admin -> sessions.revokeAll(admin.getId()));
	}

	// People paste "@example.com" or "Example.com"; Google sends the domain in lower case.
	private static String googleDomain(String value) {
		String domain = value.trim().toLowerCase(Locale.ROOT).replaceFirst("^@", "");
		if (domain.isEmpty()) return null;
		if (!DOMAIN.matcher(domain).matches()) {
			throw ApiException.badRequest("Enter a domain like example.com, or leave it empty to allow any Google account.");
		}
		return domain;
	}

	private static void setLeaveDays(Integer days, IntConsumer setter) {
		if (days == null) return;
		if (days < 0 || days > 365) throw ApiException.badRequest("Leave allowance must be between 0 and 365 days.");
		setter.accept(days);
	}

}
