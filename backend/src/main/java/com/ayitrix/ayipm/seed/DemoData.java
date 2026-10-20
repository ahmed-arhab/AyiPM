package com.ayitrix.ayipm.seed;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.ayitrix.ayipm.attendance.AttendanceRecord;
import com.ayitrix.ayipm.attendance.AttendanceRepository;
import com.ayitrix.ayipm.attendance.AttendanceStatus;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.leave.LeaveResponse;
import com.ayitrix.ayipm.leave.LeaveService;
import com.ayitrix.ayipm.leave.LeaveStatus;
import com.ayitrix.ayipm.project.Project;
import com.ayitrix.ayipm.project.ProjectRequest;
import com.ayitrix.ayipm.project.ProjectService;
import com.ayitrix.ayipm.task.TaskRequest;
import com.ayitrix.ayipm.task.TaskResponse;
import com.ayitrix.ayipm.task.TaskService;
import com.ayitrix.ayipm.workspace.WorkspaceService;

/**
 * Sample projects, tasks, attendance and leave for the demo accounts. Created through the normal services, so they
 * follow the same rules as real data and also fill the activity log and notifications.
 */
@Component
@Profile("demo")
class DemoData {

	private final ProjectService projects;
	private final TaskService tasks;
	private final LeaveService leave;
	private final AttendanceRepository attendance;
	private final WorkspaceService workspace;

	DemoData(ProjectService projects, TaskService tasks, LeaveService leave, AttendanceRepository attendance, WorkspaceService workspace) {
		this.projects = projects;
		this.tasks = tasks;
		this.leave = leave;
		this.attendance = attendance;
		this.workspace = workspace;
	}

	void create(User admin, User manager, User employee) {
		LocalDate today = workspace.today();
		Project website = project(admin, "Website redesign", "Acme Corp", "in_progress", today.minusDays(30), today.plusDays(45), manager, admin, manager, employee);
		Project app = project(admin, "Mobile app", "Internal", "planning", today.plusDays(7), today.plusDays(120), manager, admin, manager);
		Project report = project(admin, "Q3 report", "Finance", "completed", today.minusDays(90), today.minusDays(10), manager, manager, employee);

		TaskResponse homepage = task(manager, website, "Design the new homepage", employee, "high", "in_progress", today.plusDays(5));
		task(manager, website, "Set up the staging server", manager, "medium", "done", today.minusDays(3));
		task(manager, website, "Write content for the About page", employee, "low", "backlog", today.plusDays(12));
		task(manager, website, "Review accessibility", manager, "high", "review", today.plusDays(2));
		task(manager, website, "Fix broken links", employee, "urgent", "backlog", today.plusDays(1));
		task(admin, app, "Draft the feature list", manager, "medium", "backlog", today.plusDays(14));
		task(admin, app, "Choose a framework", admin, "medium", "in_progress", today.plusDays(10));
		task(manager, report, "Compile the figures", employee, "medium", "done", today.minusDays(12));
		tasks.addComment(manager, UUID.fromString(homepage.id()), "The first draft looks great. Can we try a darker header?");
		tasks.addComment(employee, UUID.fromString(homepage.id()), "Sure, I'll share two options tomorrow.");

		ZoneId zone = workspace.zone();
		for (User user : List.of(admin, manager, employee)) {
			for (int daysAgo = 14; daysAgo >= 1; daysAgo--) {
				LocalDate date = today.minusDays(daysAgo);
				if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) continue;
				boolean late = user == employee && daysAgo % 5 == 0;
				boolean halfDay = user == employee && daysAgo == 3;
				Instant in = date.atTime(LocalTime.of(9, late ? 40 : 5)).atZone(zone).toInstant();
				Instant out = date.atTime(halfDay ? LocalTime.of(12, 30) : LocalTime.of(17, 30)).atZone(zone).toInstant();
				AttendanceRecord record = new AttendanceRecord(user.getId(), date,
						halfDay ? AttendanceStatus.HALF_DAY : late ? AttendanceStatus.LATE : AttendanceStatus.PRESENT, null);
				record.setCheckInAt(in);
				record.setCheckOutAt(out);
				record.setWorkingHours(Math.round(Duration.between(in, out).toMinutes() / 60.0 * 100) / 100.0);
				attendance.save(record);
			}
		}

		LocalDate holiday = today.plusDays(7);
		LeaveResponse approved = leave.submit(employee, new LeaveResponse.Submission(employee.getId().toString(), "Annual", holiday.toString(),
				holiday.plusDays(1).toString(), "Family visit"));
		leave.review(admin, UUID.fromString(approved.id()), LeaveStatus.APPROVED, null);
		LocalDate dayOff = today.plusDays(14);
		leave.submit(manager, new LeaveResponse.Submission(manager.getId().toString(), "Casual", dayOff.toString(), dayOff.toString(), "Personal errand"));
	}

	private Project project(User actor, String name, String client, String status, LocalDate start, LocalDate end, User manager, User... members) {
		List<String> memberIds = Arrays.stream(members).map(u -> u.getId().toString()).toList();
		return projects.create(actor, new ProjectRequest(name, client, "", start.toString(), end.toString(), status, memberIds,
				manager.getId().toString(), null));
	}

	private TaskResponse task(User actor, Project project, String title, User assignee, String priority, String status, LocalDate due) {
		return tasks.create(actor, new TaskRequest(project.getId().toString(), title, "", assignee.getId().toString(), priority, status, due.toString()));
	}

}
