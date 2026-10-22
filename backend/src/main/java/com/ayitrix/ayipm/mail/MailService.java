package com.ayitrix.ayipm.mail;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.annotation.PreDestroy;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

/**
 * Sends email through the SMTP server set in the standard {@code spring.mail.*} settings. Without
 * {@code spring.mail.host} there is no mail sender, and each email is written to the log instead.
 */
@Service
public class MailService {

	private static final Logger log = LoggerFactory.getLogger(MailService.class);

	private final JavaMailSender sender;
	private final InternetAddress from;
	// One background thread, so emails go out in order and a slow mail server never holds up a request.
	private final ExecutorService executor = Executors.newSingleThreadExecutor(Thread.ofPlatform().name("mail").daemon().factory());

	public MailService(ObjectProvider<JavaMailSender> sender, @Value("${ayipm.mail.from}") String from) {
		this.sender = sender.getIfAvailable();
		this.from = parseAddress(from);
		if (this.sender == null) log.info("Email is not configured (spring.mail.host is not set), so emails are written to this log instead.");
	}

	/**
	 * Sends the email in the background once the current transaction commits, so a change that is rolled back sends
	 * nothing, and a slow or failing mail server can't delay or fail the request. Failures are logged.
	 *
	 * @return whether the email is really sent, rather than only written to the log
	 */
	public boolean sendAfterCommit(Email email) {
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				try {
					executor.execute(() -> deliver(email));
				} catch (RejectedExecutionException e) {
					log.warn("Did not send \"{}\" to {} because the app is shutting down.", email.subject(), email.to());
				}
			}
		});
		return sender != null;
	}

	private void deliver(Email email) {
		if (sender == null) {
			log.info("Email is not configured, so this email was not sent:\nTo: {}\nSubject: {}\n\n{}", email.to(), email.subject(), email.text());
			return;
		}
		try {
			MimeMessage message = sender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
			helper.setFrom(from);
			helper.setTo(email.to());
			helper.setSubject(email.subject());
			helper.setText(email.text(), email.html());
			ClassPathResource banner = new ClassPathResource("mail/banner.jpg");
			if (banner.exists() && email.html().contains("cid:company-headline")) {
				helper.addInline("company-headline", banner, "image/jpeg");
			}
			sender.send(message);
			log.info("Sent \"{}\" to {}.", email.subject(), email.to());
		} catch (MessagingException | RuntimeException e) {
			log.warn("Could not send \"{}\" to {}.", email.subject(), email.to(), e);
		}
	}

	/** Gives queued emails a little time to go out when the app stops. */
	@PreDestroy
	void stop() throws InterruptedException {
		executor.shutdown();
		executor.awaitTermination(30, TimeUnit.SECONDS);
	}

	private static InternetAddress parseAddress(String value) {
		try {
			return new InternetAddress(value, true);
		} catch (AddressException e) {
			throw new IllegalStateException("ayipm.mail.from (MAIL_FROM) is not a valid email address: " + value, e);
		}
	}

}
