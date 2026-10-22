package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.annotation.Import;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;

import com.ayitrix.ayipm.IntegrationTest;
import com.ayitrix.ayipm.auth.AccessLinkEmailTests.CapturingMailSender;
import com.ayitrix.ayipm.employee.UserRepository;

import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.MimeMessage;

/** Runs with a mail sender that keeps messages instead of sending them, so it gets its own application context. */
@Import(CapturingMailSender.class)
@TestPropertySource(properties = "ayipm.public-url=https://ayipm.test/")
@ExtendWith(OutputCaptureExtension.class)
class AccessLinkEmailTests extends IntegrationTest {

	private static final Pattern INVITE_LINK = Pattern.compile("https://ayipm\\.test/accept-invite\\?token=([\\w-]+)");
	private static final Pattern RESET_LINK = Pattern.compile("https://ayipm\\.test/reset-password\\?token=([\\w-]+)");
	private static final DateTimeFormatter EXPIRY = DateTimeFormatter.ofPattern("d MMMM yyyy 'at' HH:mm", Locale.ENGLISH);

	@Autowired
	private CapturingMailSender mail;

	@Autowired
	private AuthService auth;

	@Autowired
	private UserRepository users;

	@Autowired
	private TransactionTemplate transactions;

	// The job runs as soon as a context starts, and in this class's own context that first run can deadlock with the
	// table cleanup before the first test.
	@MockitoBean
	private AuthCleanupJob cleanupJob;

	@BeforeEach
	void clearMailbox() {
		mail.sent.clear();
		mail.outage = null;
	}

	@Test
	void invitingSomeoneEmailsThemALinkThatWorks() throws Exception {
		Client owner = signedInOwner();
		Response created = owner.post("/api/employees", Map.of(
				"name", "Dana <b>Lee</b>", "email", "dana@test.com", "department", "Engineering", "designation", "Dev", "role", "employee"))
				.expectStatus(201);
		assertThat(created.data().path("invite").path("emailed").asBoolean()).isTrue();

		MimeMessage email = mail.next();
		assertThat(email.getRecipients(Message.RecipientType.TO)).extracting(Object::toString).containsExactly("dana@test.com");
		assertThat(email.getFrom()).extracting(Object::toString).containsExactly("AyiPM <no-reply@localhost>");
		assertThat(email.getSubject()).isEqualTo("Owner invited you to join Test Co on AyiPM");

		String text = part(email, "text/plain");
		assertThat(text).contains("Hi Dana <b>Lee</b>,", "Owner has invited you to join Test Co on AyiPM.");
		assertThat(text).contains("This invitation expires on " + expiry(created.data().path("invite").path("expiresAt").asString()));
		String html = part(email, "text/html");
		assertThat(html).contains("Hi Dana &lt;b&gt;Lee&lt;/b&gt;,").doesNotContain("<b>Lee</b>");

		String token = token(INVITE_LINK, text);
		assertThat(token).isEqualTo(created.data().path("invite").path("token").asString());
		assertThat(html).contains("href=\"https://ayipm.test/accept-invite?token=" + token + "\"");
		Client invitee = client();
		invitee.post("/api/auth/invite", Map.of("token", token, "password", "DanaPass123")).expectStatus(200);
		assertThat(invitee.get("/api/auth/session").data().path("user").path("email").asString()).isEqualTo("dana@test.com");
		assertThat(mail.sent).isEmpty();
	}

	@Test
	void issuingAResetLinkEmailsItToThePerson() throws Exception {
		Client owner = signedInOwner();
		Client member = signedInMember(owner, "member@test.com", "employee");
		mail.next(); // the invitation
		String memberId = idOf(member);

		Response reset = owner.post("/api/employees/" + memberId + "/reset-link", Map.of()).expectStatus(200);
		assertThat(reset.data().path("emailed").asBoolean()).isTrue();

		MimeMessage email = mail.next();
		assertThat(email.getRecipients(Message.RecipientType.TO)).extracting(Object::toString).containsExactly("member@test.com");
		assertThat(email.getSubject()).isEqualTo("Reset your password for Test Co on AyiPM");
		String text = part(email, "text/plain");
		assertThat(text).contains("Owner sent you a link to choose a new password");
		assertThat(text).contains("expires on " + expiry(reset.data().path("expiresAt").asString()));

		String token = token(RESET_LINK, text);
		client().post("/api/auth/reset", Map.of("token", token, "password", "BrandNew123")).expectStatus(200);
		client().post("/api/auth/login", Map.of("email", "member@test.com", "password", "BrandNew123")).expectStatus(200);
		assertThat(mail.sent).isEmpty();
	}

	@Test
	void nothingIsSentWhenTheActionFails() throws Exception {
		Client owner = signedInOwner();
		Client member = signedInMember(owner, "member@test.com", "employee");
		mail.next(); // the invitation
		String pendingId = owner.post("/api/employees", Map.of(
				"name", "Pending", "email", "pending@test.com", "department", "Engineering", "designation", "Dev", "role", "employee"))
				.expectStatus(201).data().path("employee").path("id").asString();
		mail.next(); // the invitation

		assertThat(owner.post("/api/employees/" + idOf(member) + "/invite", Map.of()).status()).isEqualTo(409);
		assertThat(owner.post("/api/employees/" + pendingId + "/reset-link", Map.of()).status()).isEqualTo(409);
		assertThat(owner.post("/api/employees", Map.of(
				"name", "Again", "email", "pending@test.com", "department", "Engineering", "designation", "Dev", "role", "employee"))
				.status()).isEqualTo(409);

		// A link issued in a transaction that rolls back is never sent.
		transactions.executeWithoutResult(status -> {
			auth.issueInvite(users.findById(UUID.fromString(pendingId)).orElseThrow(), users.findById(UUID.fromString(idOf(owner))).orElseThrow());
			status.setRollbackOnly();
		});

		// Emails go out one at a time in order, so anything sent above would arrive before this one.
		String token = owner.post("/api/employees/" + pendingId + "/invite", Map.of()).expectStatus(200).data().path("token").asString();
		assertThat(token(INVITE_LINK, part(mail.next(), "text/plain"))).isEqualTo(token);
		assertThat(mail.sent).isEmpty();
	}

	@Test
	void aMailServerThatHangsAndFailsDoesNotHoldUpOrFailTheRequest(CapturedOutput output) throws Exception {
		Client owner = signedInOwner();
		mail.outage = new CountDownLatch(1);
		Response created;
		try {
			created = assertTimeoutPreemptively(Duration.ofSeconds(5), () -> owner.post("/api/employees", Map.of(
					"name", "Dana Lee", "email", "dana@test.com", "department", "Engineering", "designation", "Dev", "role", "employee")));
		} finally {
			mail.outage.countDown();
		}
		assertThat(created.expectStatus(201).data().path("invite").path("token").asString()).isNotEmpty();
		await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(output.getOut())
				.contains("Could not send \"Owner invited you to join Test Co on AyiPM\" to dana@test.com."));

		mail.outage = null;
		owner.post("/api/employees/" + created.data().path("employee").path("id").asString() + "/invite", Map.of()).expectStatus(200);
		assertThat(mail.next().getRecipients(Message.RecipientType.TO)).extracting(Object::toString).containsExactly("dana@test.com");
	}

	private static String expiry(String instant) {
		return EXPIRY.format(Instant.parse(instant).atZone(ZoneId.of("Asia/Colombo"))) + " (Asia/Colombo time)";
	}

	private static String token(Pattern link, String text) {
		Matcher matcher = link.matcher(text);
		assertThat(matcher.find()).as("link in %s", text).isTrue();
		return matcher.group(1);
	}

	/** The decoded body of the first part with this type. */
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

	/** Keeps each message, as the recipient would receive it, instead of connecting to a mail server. */
	static class CapturingMailSender extends JavaMailSenderImpl {

		final BlockingQueue<MimeMessage> sent = new LinkedBlockingQueue<>();

		/** While set, sending waits until it counts down and then fails, like a mail server that hangs and drops the connection. */
		volatile CountDownLatch outage;

		@Override
		protected void doSend(MimeMessage[] messages, Object[] originalMessages) {
			CountDownLatch outage = this.outage;
			if (outage != null) {
				try {
					outage.await();
				} catch (InterruptedException e) {
					Thread.currentThread().interrupt();
				}
				throw new MailSendException("Connection timed out");
			}
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

		/** Waits for the next message, since emails are sent in the background. */
		MimeMessage next() throws InterruptedException {
			MimeMessage message = sent.poll(10, TimeUnit.SECONDS);
			assertThat(message).as("an email").isNotNull();
			return message;
		}

	}

}
