package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.ayitrix.ayipm.employee.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A sign-in with Google that was sent to Google and hasn't come back yet. The browser that started it keeps the token
 * in a cookie; only its hash is stored, and the row is deleted when the browser comes back.
 */
@Entity
@Table(name = "google_sign_ins")
public class GoogleSignIn {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true, length = 64)
	private String tokenHash;

	/** The person whose invitation page the sign-in started on. Only their Google account may then sign in. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "invited_user_id")
	private User invitedUser;

	@Column(nullable = false)
	private Instant expiresAt;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected GoogleSignIn() {
	}

	GoogleSignIn(String tokenHash, User invitedUser, Instant expiresAt) {
		this.tokenHash = tokenHash;
		this.invitedUser = invitedUser;
		this.expiresAt = expiresAt;
	}

	public User getInvitedUser() {
		return invitedUser;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

}
