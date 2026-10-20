package com.ayitrix.ayipm.leave;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.activity.ActivityService;
import com.ayitrix.ayipm.attendance.AttendanceRecord;
import com.ayitrix.ayipm.attendance.AttendanceRepository;
import com.ayitrix.ayipm.attendance.AttendanceStatus;
import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.ApiValue;
import com.ayitrix.ayipm.common.Dates;
import com.ayitrix.ayipm.common.Text;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.notification.NotificationMessage;
import com.ayitrix.ayipm.notification.NotificationService;
import com.ayitrix.ayipm.workspace.WorkspaceService;
import com.ayitrix.ayipm.workspace.WorkspaceSettings;

/** The rules match what src/store/actions/leave.ts enforced in the browser. */
@Service
public class LeaveService {

	private final LeaveRepository requests;
	private final AttendanceRepository attendance;
	private final UserRepository users;
	private final WorkspaceService workspace;
	private final ActivityService activity;
	private final NotificationService notifications;
	private final Clock clock;

	public LeaveService(LeaveRepository requests, AttendanceRepository attendance, UserRepository users, WorkspaceService workspace,
			ActivityService activity, NotificationService notifications, Clock clock) {
		this.requests = requests;
		this.attendance = attendance;
		this.users = users;
		this.workspace = workspace;
		this.activity = activity;
		this.notifications = notifications;
		this.clock = clock;
	}

	/** Reviewers see every request; everyone else sees their own. */
	@Transactional(readOnly = true)
	public List<LeaveResponse> list(User viewer) {
		List<LeaveRequest> found = canReview(viewer) ? requests.findAllByOrderByCreatedAtDesc() : requests.findByUserIdOrderByCreatedAtDesc(viewer.getId());
		return found.stream().map(LeaveResponse::from).toList();
	}

	@Transactional
	public LeaveResponse submit(User actor, LeaveResponse.Submission input) {
		if (input.employeeId() != null && !input.employeeId().equals(actor.getId().toString())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "You can only request leave for yourself.");
		}
		LocalDate start = Dates.parse(input.startDate(), "Start and end dates are required.");
		LocalDate end = Dates.parse(input.endDate(), "Start and end dates are required.");
		String reason = Text.trim(input.reason());
		if (reason.isEmpty()) throw ApiException.badRequest("Please provide a reason.");
		if (end.isBefore(start)) throw ApiException.badRequest("End date must be on or after the start date.");
		LeaveType type = ApiValue.parse(LeaveType.class, input.leaveType()).orElseThrow(() -> ApiException.badRequest("Choose a valid leave type."));
		// Calendar days, both ends included, as before. Counting working days instead is a separate decision.
		int days = (int) ChronoUnit.DAYS.between(start, end) + 1;

		// Serialise one person's submissions so two at once can't both pass the overlap and balance checks.
		users.lockById(actor.getId());
		List<LeaveRequest> mine = requests.findByUserIdOrderByCreatedAtDesc(actor.getId());
		if (mine.stream().anyMatch(r -> r.getStatus() != LeaveStatus.REJECTED && r.overlaps(start, end))) {
			throw ApiException.badRequest("You already have a leave request covering these dates.");
		}
		if (type != LeaveType.UNPAID) {
			LeaveResponse.Bucket bucket = bucket(balanceOf(mine), type);
			int pending = mine.stream().filter(r -> r.getStatus() == LeaveStatus.PENDING && r.getLeaveType() == type).mapToInt(LeaveRequest::getDays).sum();
			if (bucket.used() + pending + days > bucket.total()) {
				int available = Math.max(0, bucket.total() - bucket.used() - pending);
				throw ApiException.badRequest("Not enough " + type.value().toLowerCase() + " leave remaining (" + available + " day(s) available).");
			}
		}

		LeaveRequest request = requests.saveAndFlush(new LeaveRequest(actor.getId(), type, start, end, days, reason, workspace.today()));
		activity.record(actor, "Submitted Leave Request", ActivityService.LEAVE, request.getId(), actor.getName() + " · " + days + "d " + type.value(),
				start + " → " + end);
		notifications.notify(notifications.peopleWith(Permission.LEAVE_REVIEW, actor.getId()), new NotificationMessage("New leave request",
				actor.getName() + " requested " + days + " day(s) of " + type.value().toLowerCase() + " leave.", "leave", "high", "/leave", actor.getId()));
		return LeaveResponse.from(request);
	}

	@Transactional
	public LeaveResponse review(User reviewer, UUID id, LeaveStatus decision, String rawReason) {
		LeaveRequest request = find(id);
		if (request.getStatus() != LeaveStatus.PENDING) throw ApiException.badRequest("This request has already been reviewed.");
		if (request.getUserId().equals(reviewer.getId()) && !notifications.peopleWith(Permission.LEAVE_REVIEW, reviewer.getId()).isEmpty()) {
			throw ApiException.badRequest("Another reviewer must approve your own leave request.");
		}
		String reason = Text.trimToNull(rawReason);
		if (decision == LeaveStatus.REJECTED && reason == null) throw ApiException.badRequest("Please provide a reason for rejecting.");

		request.review(decision, reviewer.getId(), clock.instant(), decision == LeaveStatus.REJECTED ? reason : null);
		if (decision == LeaveStatus.APPROVED) markOnLeave(request);

		String employeeName = users.findById(request.getUserId()).map(User::getName).orElse("Employee");
		boolean approved = decision == LeaveStatus.APPROVED;
		activity.record(reviewer, approved ? "Approved Leave Request" : "Rejected Leave Request", ActivityService.LEAVE, id,
				employeeName + " · " + request.getLeaveType().value(), approved ? request.getDays() + " day(s)" : "Reason: " + reason);
		notifications.notify(List.of(request.getUserId()), new NotificationMessage("Leave " + decision.value(),
				"Your " + request.getDays() + "-day " + request.getLeaveType().value().toLowerCase() + " leave was " + decision.value() + " by "
						+ reviewer.getName() + ".",
				"leave", approved ? "normal" : "high", "/leave", reviewer.getId()));
		return LeaveResponse.from(request);
	}

	@Transactional
	public void cancel(User actor, UUID id) {
		LeaveRequest request = find(id);
		if (!request.getUserId().equals(actor.getId())) throw new ApiException(HttpStatus.FORBIDDEN, "You can only cancel your own requests.");
		if (request.getStatus() != LeaveStatus.PENDING) throw ApiException.badRequest("Only pending requests can be cancelled.");
		requests.delete(request);
		activity.record(actor, "Cancelled Leave Request", ActivityService.LEAVE, id, actor.getName());
	}

	@Transactional(readOnly = true)
	public LeaveResponse.Balance balance(User viewer, UUID employeeId) {
		UUID target = employeeId == null ? viewer.getId() : employeeId;
		if (!target.equals(viewer.getId()) && !canReview(viewer)) throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to do that.");
		return balanceOf(requests.findByUserIdOrderByCreatedAtDesc(target));
	}

	/** Approved days this year per type, against the workspace allowance. */
	private LeaveResponse.Balance balanceOf(List<LeaveRequest> mine) {
		int year = workspace.today().getYear();
		WorkspaceSettings.LeaveAllowance allowance = workspace.leaveAllowance();
		return new LeaveResponse.Balance(
				new LeaveResponse.Bucket(allowance.annual(), used(mine, LeaveType.ANNUAL, year)),
				new LeaveResponse.Bucket(allowance.sick(), used(mine, LeaveType.SICK, year)),
				new LeaveResponse.Bucket(allowance.casual(), used(mine, LeaveType.CASUAL, year)));
	}

	private static int used(List<LeaveRequest> mine, LeaveType type, int year) {
		return mine.stream()
				.filter(r -> r.getStatus() == LeaveStatus.APPROVED && r.getLeaveType() == type && r.getStartDate().getYear() == year)
				.mapToInt(LeaveRequest::getDays)
				.sum();
	}

	private static LeaveResponse.Bucket bucket(LeaveResponse.Balance balance, LeaveType type) {
		return switch (type) {
			case ANNUAL -> balance.annual();
			case SICK -> balance.sick();
			default -> balance.casual();
		};
	}

	/** Adds an "on leave" attendance record for each approved day that doesn't have one yet. */
	private void markOnLeave(LeaveRequest request) {
		Set<LocalDate> existing = attendance.findByUserIdAndDateBetween(request.getUserId(), request.getStartDate(), request.getEndDate()).stream()
				.map(AttendanceRecord::getDate)
				.collect(Collectors.toSet());
		String note = "Approved " + request.getLeaveType().value() + " leave";
		request.getStartDate().datesUntil(request.getEndDate().plusDays(1))
				.filter(date -> !existing.contains(date))
				.forEach(date -> attendance.save(new AttendanceRecord(request.getUserId(), date, AttendanceStatus.LEAVE, note)));
	}

	private LeaveRequest find(UUID id) {
		return requests.findById(id).orElseThrow(() -> ApiException.notFound("Leave request not found."));
	}

	private static boolean canReview(User user) {
		return user.getRole().has(Permission.LEAVE_REVIEW);
	}

}
