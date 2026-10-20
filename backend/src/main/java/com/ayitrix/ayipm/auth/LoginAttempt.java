package com.ayitrix.ayipm.auth;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Failed sign-ins for one account (or unknown email), used for the temporary lockout. */
@Entity
@Table(name = "login_attempts")
public class LoginAttempt {

	@Id
	private String key;

	@Column(nullable = false)
	private int failures;

	@Column(nullable = false)
	private Instant firstFailedAt;

	private Instant lockedUntil;

	protected LoginAttempt() {
	}

	LoginAttempt(String key) {
		this.key = key;
	}

	int getFailures() {
		return failures;
	}

	Instant getFirstFailedAt() {
		return firstFailedAt;
	}

	Instant getLockedUntil() {
		return lockedUntil;
	}

	void update(int failures, Instant firstFailedAt, Instant lockedUntil) {
		this.failures = failures;
		this.firstFailedAt = firstFailedAt;
		this.lockedUntil = lockedUntil;
	}

}
