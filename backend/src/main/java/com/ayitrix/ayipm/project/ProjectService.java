package com.ayitrix.ayipm.project;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.activity.ActivityService;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.ApiValue;
import com.ayitrix.ayipm.common.Dates;
import com.ayitrix.ayipm.common.Text;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.mail.AssignmentEmails;
import com.ayitrix.ayipm.notification.NotificationMessage;
import com.ayitrix.ayipm.notification.NotificationService;
import com.ayitrix.ayipm.task.Task;
import com.ayitrix.ayipm.task.TaskRepository;

/** The rules match what src/store/actions/projects.ts enforced in the browser. */
@Service
public class ProjectService {

	private final ProjectRepository projects;
	private final UserRepository users;
	private final ActivityService activity;
	private final NotificationService notifications;
	private final AssignmentEmails assignmentEmails;
	private final TaskRepository tasks;

	public ProjectService(ProjectRepository projects, UserRepository users, ActivityService activity,
			NotificationService notifications, AssignmentEmails assignmentEmails, TaskRepository tasks) {
		this.projects = projects;
		this.users = users;
		this.activity = activity;
		this.notifications = notifications;
		this.assignmentEmails = assignmentEmails;
		this.tasks = tasks;
	}

	@Transactional(readOnly = true)
	public List<Project> list() {
		return projects.findAllByOrderByCreatedAtDesc();
	}

	@Transactional(readOnly = true)
	public Project get(UUID id) {
		return projects.findById(id).orElseThrow(() -> ApiException.notFound("Project not found."));
	}

	@Transactional
	public Project create(User actor, ProjectRequest input) {
		Project project = new Project(actor.getId());
		apply(project, input, true);
		projects.saveAndFlush(project);

		String client = project.getClient();
		activity.record(actor, "Created Project", ActivityService.PROJECT, project.getId(), project.getName(), client.isEmpty() ? null : "Client: " + client);
		notifyAdded(actor, project, project.getMemberIds());
		return project;
	}

	@Transactional
	public Project update(User actor, UUID id, ProjectRequest update) {
		Project project = get(id);
		ProjectStatus previousStatus = project.getStatus();
		Set<UUID> previousMembers = new HashSet<>(project.getMemberIds());
		apply(project, update, false);
		project.touch();
		projects.saveAndFlush(project);

		boolean statusChanged = project.getStatus() != previousStatus;
		activity.record(actor, statusChanged ? "Updated Project Status" : "Updated Project", ActivityService.PROJECT, id, project.getName(),
				statusChanged ? "Status set to " + project.getStatus().label() : null);
		Set<UUID> added = new LinkedHashSet<>(project.getMemberIds());
		added.removeAll(previousMembers);
		notifyAdded(actor, project, added);
		return project;
	}

	@Transactional
	public void delete(User actor, UUID id) {
		Project project = get(id);
		projects.delete(project);
		activity.record(actor, "Deleted Project", ActivityService.PROJECT, id, project.getName());
	}

	/** Replaces the projects one person is a member of (the "Assign to projects" dialog on the Team page). */
	@Transactional
	public void setAssignments(User actor, UUID employeeId, List<String> projectIds) {
		User employee = users.findById(employeeId).orElseThrow(() -> ApiException.notFound("Employee not found."));
		Set<UUID> wanted = new HashSet<>();
		for (String id : projectIds == null ? List.<String>of() : projectIds) {
			UUID projectId = parseId(id, "Choose valid projects.");
			if (!projects.existsById(projectId)) throw ApiException.badRequest("Choose valid projects.");
			wanted.add(projectId);
		}

		List<String> addedTo = new ArrayList<>();
		List<Project> addedProjects = new ArrayList<>();
		for (Project project : projects.findAll()) {
			boolean member = project.getMemberIds().contains(employeeId);
			if (wanted.contains(project.getId()) && !member) {
				project.getMemberIds().add(employeeId);
				project.touch();
				addedTo.add(project.getName());
				addedProjects.add(project);
			} else if (!wanted.contains(project.getId()) && member) {
				project.getMemberIds().remove(employeeId);
				project.touch();
			}
		}
		activity.record(actor, "Updated Project Assignments", ActivityService.EMPLOYEE, employeeId, employee.getName(),
				"Assigned to " + wanted.size() + " project(s)");
		if (!addedTo.isEmpty()) {
			notifications.notify(List.of(employeeId), new NotificationMessage("Added to project",
					"You were added to " + String.join(", ", addedTo) + ".", "project", "normal", "/projects", actor.getId()));
			for (Project project : addedProjects) {
				List<Task> memberTasks = tasks.findByProjectIdAndAssigneeIdOrderByDueDateAsc(project.getId(), employeeId);
				assignmentEmails.sendProjectAssignment(employee, actor, project, memberTasks);
			}
		}
	}

	/** Used when someone is assigned a task in a project they aren't a member of yet. */
	@Transactional
	public void ensureMember(UUID projectId, UUID userId) {
		Project project = get(projectId);
		if (project.getMemberIds().add(userId)) project.touch();
	}

	private void apply(Project project, ProjectRequest input, boolean creating) {
		if (creating || input.name() != null) {
			String name = Text.trim(input.name());
			if (name.isEmpty()) throw ApiException.badRequest("Project name is required.");
			project.setName(name);
		}
		if (input.client() != null) project.setClient(input.client().trim());
		if (input.description() != null) project.setDescription(input.description().trim());
		if (creating || input.startDate() != null) project.setStartDate(Dates.parse(input.startDate(), "Start date is required."));
		if (creating || input.endDate() != null) project.setEndDate(Dates.parse(input.endDate(), "Deadline is required."));
		LocalDate start = project.getStartDate();
		if (project.getEndDate().isBefore(start)) throw ApiException.badRequest("Deadline must be on or after the start date.");
		if (input.status() != null) {
			project.setStatus(ApiValue.parse(ProjectStatus.class, input.status()).orElseThrow(() -> ApiException.badRequest("Choose a valid status.")));
		}
		if (input.members() != null) {
			Set<UUID> members = new LinkedHashSet<>();
			for (String id : input.members()) members.add(parseId(id, "Choose valid project members."));
			if (users.findAllById(members).size() != members.size()) throw ApiException.badRequest("Choose valid project members.");
			project.getMemberIds().clear();
			project.getMemberIds().addAll(members);
		}
		if (input.managerId() != null) {
			UUID manager = input.managerId().isBlank() ? null : parseId(input.managerId(), "Choose a valid project manager.");
			if (manager != null && !users.existsById(manager)) throw ApiException.badRequest("Choose a valid project manager.");
			project.setManagerId(manager);
		}
		if (input.budget() != null) project.setBudget(Text.trimToNull(input.budget()));
	}

	private void notifyAdded(User actor, Project project, Set<UUID> memberIds) {
		notifications.notify(memberIds, new NotificationMessage("Added to project", "You were added to " + project.getName() + ".", "project",
				"normal", "/projects/" + project.getId(), actor.getId()));
		for (UUID memberId : memberIds) {
			if (actor != null && memberId.equals(actor.getId())) continue;
			users.findById(memberId).ifPresent(member -> {
				List<Task> memberTasks = tasks.findByProjectIdAndAssigneeIdOrderByDueDateAsc(project.getId(), memberId);
				assignmentEmails.sendProjectAssignment(member, actor, project, memberTasks);
			});
		}
	}

	private static UUID parseId(String value, String message) {
		try {
			return UUID.fromString(value);
		} catch (IllegalArgumentException | NullPointerException e) {
			throw ApiException.badRequest(message);
		}
	}

}
