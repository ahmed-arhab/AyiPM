package com.ayitrix.ayipm.mail;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.ayitrix.ayipm.IntegrationTest;
import com.ayitrix.ayipm.auth.AuthCleanupJob;
import com.ayitrix.ayipm.mail.AssignmentEmailTests.CapturingMailSender;

import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.MimeMessage;

@Import(CapturingMailSender.class)
@TestPropertySource(properties = "ayipm.public-url=https://ayipm.test/")
class AssignmentEmailTests extends IntegrationTest {

	@Autowired
	private CapturingMailSender mail;

	@MockitoBean
	private AuthCleanupJob cleanupJob;

	@BeforeEach
	void clearMailbox() {
		mail.sent.clear();
	}

	@Test
	void assigningMemberToProjectSendsEmailWithHeadlineAndDetails() throws Exception {
		Client owner = signedInOwner();
		Client dev = signedInMember(owner, "dev@test.com", "employee");
		mail.next(); // invitation email
		String devId = idOf(dev);

		Response projectRes = owner.post("/api/projects", Map.of(
				"name", "E-Commerce Mobile App",
				"client", "Retail Corp",
				"description", "A modern iOS and Android shopping app",
				"startDate", "2026-05-01",
				"endDate", "2026-11-30",
				"status", "in_progress",
				"members", List.of(devId)
		)).expectStatus(201);
		String projectId = projectRes.data().path("id").asString();

		MimeMessage email = mail.next();
		assertThat(email.getRecipients(Message.RecipientType.TO)).extracting(Object::toString).containsExactly("dev@test.com");
		assertThat(email.getSubject()).isEqualTo("You have been assigned to project: E-Commerce Mobile App on AyiPM");

		String text = part(email, "text/plain");
		assertThat(text).contains("PROJECT ASSIGNMENT");
		assertThat(text).contains("E-Commerce Mobile App");
		assertThat(text).contains("Retail Corp");
		assertThat(text).contains("A modern iOS and Android shopping app");
		assertThat(text).contains("https://ayipm.test/projects/" + projectId);

		String html = part(email, "text/html");
		assertThat(html).contains("cid:company-headline");
		assertThat(html).contains("alt=\"AYITRIX\"");
		assertThat(html).contains("Project Assignment");
		assertThat(html).contains("E-Commerce Mobile App");
		assertThat(html).contains("href=\"https://ayipm.test/projects/" + projectId + "\"");
	}

	@Test
	void assigningTaskToMemberSendsEmailWithTaskAndProjectDetails() throws Exception {
		Client owner = signedInOwner();
		Client dev = signedInMember(owner, "frontend_dev@test.com", "employee");
		mail.next(); // invitation email
		String devId = idOf(dev);

		Response projectRes = owner.post("/api/projects", Map.of(
				"name", "Admin Dashboard",
				"client", "Internal",
				"startDate", "2026-01-01",
				"endDate", "2026-12-31",
				"status", "in_progress",
				"members", List.of(devId)
		)).expectStatus(201);
		mail.next(); // project assignment email
		String projectId = projectRes.data().path("id").asString();

		Response taskRes = owner.post("/api/tasks", Map.of(
				"projectId", projectId,
				"title", "Implement Dark Theme",
				"description", "Add support for system dark mode toggle",
				"priority", "urgent",
				"status", "backlog",
				"dueDate", "2026-06-15",
				"assigneeId", devId
		)).expectStatus(201);
		String taskId = taskRes.data().path("id").asString();

		MimeMessage email = mail.next();
		assertThat(email.getRecipients(Message.RecipientType.TO)).extracting(Object::toString).containsExactly("frontend_dev@test.com");
		assertThat(email.getSubject()).isEqualTo("Task assigned to you: Implement Dark Theme (Admin Dashboard)");

		String text = part(email, "text/plain");
		assertThat(text).contains("TASK ASSIGNMENT");
		assertThat(text).contains("Implement Dark Theme");
		assertThat(text).contains("Admin Dashboard");
		assertThat(text).contains("Urgent");
		assertThat(text).contains("Add support for system dark mode toggle");
		assertThat(text).contains("https://ayipm.test/tasks?task=" + taskId);

		String html = part(email, "text/html");
		assertThat(html).contains("cid:company-headline");
		assertThat(html).contains("alt=\"AYITRIX\"");
		assertThat(html).contains("Task Assignment");
		assertThat(html).contains("Implement Dark Theme");
		assertThat(html).contains("Urgent");
		assertThat(html).contains("href=\"https://ayipm.test/tasks?task=" + taskId + "\"");
	}

	@Test
	void projectAssignmentIncludesAssignedTasksIfAnyExist() throws Exception {
		Client owner = signedInOwner();
		Client dev = signedInMember(owner, "designer@test.com", "employee");
		mail.next(); // invitation email
		String devId = idOf(dev);

		Response projectRes = owner.post("/api/projects", Map.of(
				"name", "Marketing Landing Page",
				"startDate", "2026-03-01",
				"endDate", "2026-07-01",
				"status", "planning",
				"members", List.of()
		)).expectStatus(201);
		String projectId = projectRes.data().path("id").asString();

		// Assign task to designer (adds designer as member, sends task assignment email)
		owner.post("/api/tasks", Map.of(
				"projectId", projectId,
				"title", "Design Hero Section",
				"priority", "high",
				"status", "backlog",
				"dueDate", "2026-03-15",
				"assigneeId", devId
		)).expectStatus(201);
		mail.next(); // task assignment email

		// Unassign designer from project so they are no longer a project member
		owner.put("/api/employees/" + devId + "/projects", Map.of("projectIds", List.of())).expectStatus(200);

		// Now add designer back to project via setAssignments
		owner.put("/api/employees/" + devId + "/projects", Map.of("projectIds", List.of(projectId))).expectStatus(200);

		MimeMessage email = mail.next();
		assertThat(email.getSubject()).contains("Marketing Landing Page");
		String text = part(email, "text/plain");
		assertThat(text).contains("ASSIGNED TASKS (1):");
		assertThat(text).contains("Design Hero Section");

		String html = part(email, "text/html");
		assertThat(html).contains("Assigned Tasks (1)");
		assertThat(html).contains("Design Hero Section");
	}

	@Test
	void respectsUserNotificationPreferences() throws Exception {
		Client owner = signedInOwner();
		Client dev = signedInMember(owner, "optout@test.com", "employee");
		mail.next(); // invitation email
		String devId = idOf(dev);

		// Dev turns off project and task notifications
		dev.patch("/api/me/preferences", Map.of(
				"notificationCategories", Map.of("project", false, "task", false)
		)).expectStatus(200);

		Response projectRes = owner.post("/api/projects", Map.of(
				"name", "Silent Project",
				"startDate", "2026-01-01",
				"endDate", "2026-12-31",
				"status", "planning",
				"members", List.of(devId)
		)).expectStatus(201);
		String projectId = projectRes.data().path("id").asString();

		owner.post("/api/tasks", Map.of(
				"projectId", projectId,
				"title", "Silent Task",
				"priority", "low",
				"status", "backlog",
				"dueDate", "2026-08-01",
				"assigneeId", devId
		)).expectStatus(201);

		// No email should be sent
		assertThat(mail.sent).isEmpty();
	}

	private static String part(Part part, String type) throws MessagingException, IOException {
		if (part.isMimeType(type)) return (String) part.getContent();
		if (part.getContent() instanceof Multipart multipart) {
			for (int i = 0; i < multipart.getCount(); i++) {
				String found = part(multipart.getBodyPart(i), type);
				if (found != null) return found;
			}
		}
		return null;
	}

	static class CapturingMailSender extends JavaMailSenderImpl {
		final BlockingQueue<MimeMessage> sent = new LinkedBlockingQueue<>();

		@Override
		protected void doSend(MimeMessage[] messages, Object[] originalMessages) {
			for (MimeMessage message : messages) {
				try {
					ByteArrayOutputStream raw = new ByteArrayOutputStream();
					message.writeTo(raw);
					sent.add(new MimeMessage(getSession(), new ByteArrayInputStream(raw.toByteArray())));
				} catch (MessagingException | IOException e) {
					throw new MailPreparationException(e);
				}
			}
		}

		MimeMessage next() throws InterruptedException {
			MimeMessage message = sent.poll(10, TimeUnit.SECONDS);
			assertThat(message).as("an email").isNotNull();
			return message;
		}
	}

}
