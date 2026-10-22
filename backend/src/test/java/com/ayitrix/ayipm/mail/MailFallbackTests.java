package com.ayitrix.ayipm.mail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import com.ayitrix.ayipm.IntegrationTest;

/** Without spring.mail.host, as in every other test, emails are logged and the admin still gets the link. */
@ExtendWith(OutputCaptureExtension.class)
class MailFallbackTests extends IntegrationTest {

	@Test
	void withoutAMailServerTheEmailIsLoggedInstead(CapturedOutput output) {
		Client owner = signedInOwner();
		Response created = owner.post("/api/employees", Map.of(
				"name", "Dana Lee", "email", "dana@test.com", "department", "Engineering", "designation", "Dev", "role", "employee"))
				.expectStatus(201);
		assertThat(created.data().path("invite").path("emailed").asBoolean()).isFalse();

		String link = "http://localhost:3000/accept-invite?token=" + created.data().path("invite").path("token").asString();
		await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(output.getOut())
				.contains("Email is not configured, so this email was not sent:\nTo: dana@test.com\nSubject: Owner invited you to join Test Co on AyiPM")
				.contains(link));
	}

}
