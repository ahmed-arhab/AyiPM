package com.ayitrix.ayipm.attendance;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.activity.ActivityService;
import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.Text;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.notification.NotificationMessage;
import com.ayitrix.ayipm.notification.NotificationService;
import com.ayitrix.ayipm.workspace.WorkspaceService;
import com.ayitrix.ayipm.workspace.WorkspaceSettings;

/**
 * The rules match what src/store/actions/attendance.ts enforced in the browser, but "now" comes from the server's
 * clock and "today" from the workspace time zone, so changing a computer's clock changes nothing.
 */
@Service
public class AttendanceService {

	// The browser's default formatTime, e.g. "09:05 AM".
	private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("hh:mm a", Locale.US);

	private final AttendanceRepository records;
	private final UserRepository users;
	private final WorkspaceService workspace;
	private final ActivityService activity;
	private final NotificationService notifications;
	private final Clock clock;

	public AttendanceService(AttendanceRepository records, UserRepository users, WorkspaceService workspace, ActivityService activity,
			NotificationService notifications, Clock clock) {
		this.records = records;
		this.users = users;
		this.workspace = workspace;
		this.activity = activity;
		this.notifications = notifications;
		this.clock = clock;
	}

	/** Everyone can read their own records. With {@code attendance.viewAll} you can read anyone's, and everyone's by default. */
	@Transactional(readOnly = true)
	public List<AttendanceResponse> list(User viewer, UUID employeeId, LocalDate from, LocalDate to) {
		boolean viewAll = viewer.getRole().has(Permission.ATTENDANCE_VIEW_ALL);
		if (employeeId != null && !employeeId.equals(viewer.getId()) && !viewAll) {
			throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to do that.");
		}
		if (from != null && to != null && to.isBefore(from)) throw ApiException.badRequest("End date must be on or after the start date.");
		UUID userId = employeeId != null ? employeeId : viewAll ? null : viewer.getId();
		return records.search(userId, from, to).stream().map(AttendanceResponse::from).toList();
	}

	@Transactional
	public AttendanceResponse checkIn(User actor, String rawNotes) {
		// Serialise one person's check-ins and check-outs so a double click can't get past the checks below twice.
		users.lockById(actor.getId());
		Instant now = clock.instant();
		ZoneId zone = workspace.zone();
		LocalDate today = LocalDate.ofInstant(now, zone);
		Optional<AttendanceRecord> existing = records.findByUserIdAndDate(actor.getId(), today);
		if (existing.isPresent()) {
			AttendanceRecord record = existing.get();
			// Approving leave writes a "leave" record for each day.
			if (record.getStatus() == AttendanceStatus.LEAVE) throw ApiException.badRequest("You are on approved leave today.");
			if (record.getCheckOutAt() != null) throw ApiException.badRequest("You've already completed today's shift.");
			if (record.getCheckInAt() != null) throw ApiException.badRequest("You are already checked in.");
		}

		WorkspaceSettings schedule = schedule();
		Instant deadline = today.atTime(LocalTime.parse(schedule.workDayStart()))
				.plusMinutes(schedule.gracePeriodMinutes())
				.atZone(zone)
				.toInstant();
		boolean late = now.isAfter(deadline);
		AttendanceRecord record = existing.orElseGet(() -> new AttendanceRecord(actor.getId(), today, AttendanceStatus.PRESENT, null));
		record.setCheckInAt(now);
		record.setStatus(late ? AttendanceStatus.LATE : AttendanceStatus.PRESENT);
		record.setNotes(Text.trimToNull(rawNotes));
		record = records.saveAndFlush(record);

		String time = TIME.format(now.atZone(zone));
		activity.record(actor, "Checked In", ActivityService.ATTENDANCE, record.getId(), actor.getName(), time + (late ? " (late)" : ""));
		if (late) {
			notifications.notify(notifications.peopleWith(Permission.ATTENDANCE_VIEW_ALL, actor.getId()), new NotificationMessage("Late check-in",
					actor.getName() + " checked in at " + time + ", after the grace period.", "attendance", "low", "/attendance", actor.getId()));
		}
		return AttendanceResponse.from(record);
	}

	@Transactional
	public AttendanceResponse checkOut(User actor) {
		users.lockById(actor.getId());
		Instant now = clock.instant();
		ZoneId zone = workspace.zone();
		AttendanceRecord record = records.findByUserIdAndDate(actor.getId(), LocalDate.ofInstant(now, zone))
				.filter(r -> r.getCheckInAt() != null)
				.orElseThrow(() -> ApiException.badRequest("You have not checked in today."));
		if (record.getCheckOutAt() != null) throw ApiException.badRequest("You have already checked out.");

		double workingHours = Math.round(Duration.between(record.getCheckInAt(), now).toMillis() / 3_600_000.0 * 100) / 100.0;
		record.setCheckOutAt(now);
		record.setWorkingHours(workingHours);
		if (workingHours < schedule().halfDayThresholdHours()) record.setStatus(AttendanceStatus.HALF_DAY);

		activity.record(actor, "Checked Out", ActivityService.ATTENDANCE, record.getId(), actor.getName(),
				TIME.format(now.atZone(zone)) + " · " + String.format(Locale.US, "%.2f", workingHours) + "h logged");
		return AttendanceResponse.from(record);
	}

	private WorkspaceSettings schedule() {
		return workspace.getSettings().orElseThrow(() -> ApiException.notFound("Workspace has not been set up."));
	}

}
