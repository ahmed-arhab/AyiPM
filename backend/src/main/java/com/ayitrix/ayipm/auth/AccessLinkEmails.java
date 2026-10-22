package com.ayitrix.ayipm.auth;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.mail.Email;
import com.ayitrix.ayipm.mail.MailService;
import com.ayitrix.ayipm.workspace.WorkspaceService;
import com.ayitrix.ayipm.workspace.WorkspaceSettings;

/** The emails that carry invitation and password reset links. Each is sent only if the transaction commits. */
@Component
public class AccessLinkEmails {

	// Same pages as ROUTES.acceptInvite and ROUTES.resetPassword in the frontend's src/constants/navigation.ts.
	private static final String INVITE_PATH = "/accept-invite";
	private static final String RESET_PATH = "/reset-password";
	private static final DateTimeFormatter EXPIRY = DateTimeFormatter.ofPattern("d MMMM yyyy 'at' HH:mm", Locale.ENGLISH);

	private final MailService mail;
	private final WorkspaceService workspace;
	private final String publicUrl;

	public AccessLinkEmails(MailService mail, WorkspaceService workspace, @Value("${ayipm.public-url}") String publicUrl) {
		this.mail = mail;
		this.workspace = workspace;
		this.publicUrl = checkPublicUrl(publicUrl);
	}

	/** Returns whether the email is really sent, rather than only written to the log. */
	boolean sendInvite(User user, User invitedBy, String token, Instant expiresAt) {
		String company = companyName();
		String inviter = invitedBy.getName();
		return mail.sendAfterCommit(Email.builder(user.getEmail(), inviter + " invited you to join " + company + " on AyiPM")
				.paragraph("Hi " + user.getName() + ",")
				.paragraph(inviter + " has invited you to join " + company + " on AyiPM. Choose a password to set up your account.")
				.button("Accept invitation", link(INVITE_PATH, token))
				.smallPrint("This invitation expires on " + expiry(expiresAt) + ". After that, ask " + inviter + " for a new one.")
				.smallPrint("If you weren't expecting this invitation, you can ignore this email.")
				.build());
	}

	/** Returns whether the email is really sent, rather than only written to the log. */
	boolean sendPasswordReset(User user, User sentBy, String token, Instant expiresAt) {
		String company = companyName();
		return mail.sendAfterCommit(Email.builder(user.getEmail(), "Reset your password for " + company + " on AyiPM")
				.paragraph("Hi " + user.getName() + ",")
				.paragraph(sentBy.getName() + " sent you a link to choose a new password for your " + company + " account on AyiPM.")
				.button("Choose a new password", link(RESET_PATH, token))
				.smallPrint("The link works once and expires on " + expiry(expiresAt) + ". Your current password keeps working until you "
						+ "choose a new one.")
				.smallPrint("If you didn't ask for a new password, you can ignore this email.")
				.build());
	}

	private String companyName() {
		return workspace.getSettings().map(WorkspaceSettings::companyName).orElse("AyiPM");
	}

	private String link(String path, String token) {
		return publicUrl + path + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
	}

	/** For example "29 October 2026 at 14:30 (Asia/Colombo time)", in the workspace's time zone. */
	private String expiry(Instant expiresAt) {
		ZoneId zone = workspace.zone();
		String zoneName = zone.equals(ZoneOffset.UTC) ? "UTC" : zone.getId();
		return EXPIRY.format(expiresAt.atZone(zone)) + " (" + zoneName + " time)";
	}

	/** Returns ayipm.public-url without a trailing slash, or fails when it isn't an http(s) address. */
	static String checkPublicUrl(String value) {
		String url = value.strip().replaceAll("/+$", "");
		URI uri;
		try {
			uri = URI.create(url);
		} catch (IllegalArgumentException e) {
			uri = null;
		}
		if (uri == null || uri.getHost() == null || !("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))) {
			throw new IllegalStateException("ayipm.public-url (PUBLIC_URL) must be the app's address, such as https://ayipm.example.com, not \""
					+ value + "\".");
		}
		return url;
	}

}
