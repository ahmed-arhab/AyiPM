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
 * A sign-in that passed the password check and still needs a two-factor code, or two-factor setup when the workspace
 * requires it. The token goes to the browser once; only its hash is stored, and the row is deleted when used.
 */
@Entity
@Table(name = "login_challenges")
public class LoginChallenge {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true, length = 64)
	private String tokenHash;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private User user;

	@Column(nullable = false)
	private boolean remember;

	@Column(nullable = false)
	private boolean setupRequired;

	@Column(nullable = false)
	private Instant expiresAt;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected LoginChallenge() {
	}

	LoginChallenge(String tokenHash, User user, boolean remember, boolean setupRequired, Instant expiresAt) {
		this.tokenHash = tokenHash;
		this.user = user;
		this.remember = remember;
		this.setupRequired = setupRequired;
		this.expiresAt = expiresAt;
	}

	public User getUser() {
		return user;
	}

	public boolean isRemember() {
		return remember;
	}

	public boolean isSetupRequired() {
		return setupRequired;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

}
