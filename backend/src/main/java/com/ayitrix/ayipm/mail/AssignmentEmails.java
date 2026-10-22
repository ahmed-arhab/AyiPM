package com.ayitrix.ayipm.mail;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.ayitrix.ayipm.auth.AccessLinkEmails;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.preferences.PreferencesService;
import com.ayitrix.ayipm.project.Project;
import com.ayitrix.ayipm.task.Task;
import com.ayitrix.ayipm.workspace.WorkspaceService;
import com.ayitrix.ayipm.workspace.WorkspaceSettings;

/**
 * Sends notification emails when members are assigned to projects or tasks.
 */
@Component
public class AssignmentEmails {

	private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH);

	private final MailService mail;
	private final WorkspaceService workspace;
	private final PreferencesService preferences;
	private final String publicUrl;

	public AssignmentEmails(MailService mail, WorkspaceService workspace, PreferencesService preferences,
			@Value("${ayipm.public-url}") String publicUrl) {
		this.mail = mail;
		this.workspace = workspace;
		this.preferences = preferences;
		this.publicUrl = AccessLinkEmails.checkPublicUrl(publicUrl);
	}

	/**
	 * Notifies a team member that they have been assigned to a project, including any tasks in that project.
	 */
	public boolean sendProjectAssignment(User recipient, User actor, Project project, List<Task> memberTasks) {
		if (recipient == null || recipient.getEmail() == null || recipient.getEmail().isBlank()) return false;
		if (actor != null && recipient.getId().equals(actor.getId())) return false;
		if (!preferences.wants(recipient.getId(), "project")) return false;

		String company = companyName();
		String actorName = actor != null ? actor.getName() : "Project Administrator";
		String subject = "You have been assigned to project: " + project.getName() + " on AyiPM";

		List<Email.DetailRow> rows = new ArrayList<>();
		rows.add(new Email.DetailRow("Project", project.getName()));
		if (project.getClient() != null && !project.getClient().isBlank()) {
			rows.add(new Email.DetailRow("Client", project.getClient()));
		}
		rows.add(new Email.DetailRow("Status", project.getStatus().label()));
		if (project.getStartDate() != null && project.getEndDate() != null) {
			rows.add(new Email.DetailRow("Timeline", formatDate(project.getStartDate()) + " – " + formatDate(project.getEndDate())));
		}
		if (project.getDescription() != null && !project.getDescription().isBlank()) {
			rows.add(new Email.DetailRow("Description", project.getDescription()));
		}
		rows.add(new Email.DetailRow("Assigned By", actorName));

		Email.Builder builder = Email.builder(recipient.getEmail(), subject)
				.heading("Project Assignment")
				.paragraph("Hi " + recipient.getName() + ",")
				.paragraph(actorName + " has assigned you as a team member on \"" + project.getName() + "\" for " + company + ".")
				.detailsCard("Project Details", rows);

		if (memberTasks != null && !memberTasks.isEmpty()) {
			List<Email.TaskItem> taskItems = memberTasks.stream()
					.map(t -> new Email.TaskItem(t.getTitle(), t.getPriority().label(), t.getStatus().label(),
							t.getDueDate() != null ? formatDate(t.getDueDate()) : null))
					.toList();
			builder.taskSection(taskItems);
		}

		builder.button("View Project", publicUrl + "/projects/" + project.getId())
				.smallPrint("You received this email because you were assigned to this project on AyiPM.");

		return mail.sendAfterCommit(builder.build());
	}

	/**
	 * Notifies an assignee that a task in a project has been assigned to them.
	 */
	public boolean sendTaskAssignment(User recipient, User actor, Task task, Project project) {
		if (recipient == null || recipient.getEmail() == null || recipient.getEmail().isBlank()) return false;
		if (actor != null && recipient.getId().equals(actor.getId())) return false;
		if (!preferences.wants(recipient.getId(), "task")) return false;

		String company = companyName();
		String actorName = actor != null ? actor.getName() : "Task Administrator";
		String projectName = project != null ? project.getName() : "Project";
		String subject = "Task assigned to you: " + task.getTitle() + " (" + projectName + ")";

		List<Email.DetailRow> rows = new ArrayList<>();
		rows.add(new Email.DetailRow("Task", task.getTitle()));
		rows.add(new Email.DetailRow("Project", projectName));
		rows.add(new Email.DetailRow("Priority", task.getPriority().label()));
		rows.add(new Email.DetailRow("Status", task.getStatus().label()));
		if (task.getDueDate() != null) {
			rows.add(new Email.DetailRow("Due Date", formatDate(task.getDueDate())));
		}
		if (task.getDescription() != null && !task.getDescription().isBlank()) {
			rows.add(new Email.DetailRow("Description", task.getDescription()));
		}
		rows.add(new Email.DetailRow("Assigned By", actorName));

		Email.Builder builder = Email.builder(recipient.getEmail(), subject)
				.heading("Task Assignment")
				.paragraph("Hi " + recipient.getName() + ",")
				.paragraph(actorName + " assigned you a task in \"" + projectName + "\" for " + company + ".")
				.detailsCard("Task Details", rows)
				.button("View Task", publicUrl + "/tasks?task=" + task.getId())
				.smallPrint("You received this email because this task was assigned to you on AyiPM.");

		return mail.sendAfterCommit(builder.build());
	}

	private String companyName() {
		return workspace.getSettings().map(WorkspaceSettings::companyName).orElse("AyiPM");
	}

	private static String formatDate(LocalDate date) {
		return date == null ? "" : DATE_FORMAT.format(date);
	}

}
