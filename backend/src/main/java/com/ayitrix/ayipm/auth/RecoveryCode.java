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

/** A one-time code that replaces an authenticator code. Only its hash is stored, and it is deleted once used. */
@Entity
@Table(name = "recovery_codes")
public class RecoveryCode {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private User user;

	@Column(nullable = false, length = 64)
	private String codeHash;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected RecoveryCode() {
	}

	RecoveryCode(User user, String codeHash) {
		this.user = user;
		this.codeHash = codeHash;
	}

}
