package com.ayitrix.ayipm.employee;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A member of the workspace. Called an "employee" in the API and the UI. */
@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true)
	private String employeeId;

	/** Always stored in lower case. */
	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String department;

	@Column(nullable = false)
	private String designation;

	@Column(nullable = false)
	private Role role;

	@Column(nullable = false)
	private EmployeeStatus status = EmployeeStatus.ACTIVE;

	@Column(nullable = false)
	private LocalDate joinDate;

	private String avatar;
	private String phone;
	private String location;
	private String bio;

	/** Null until the person accepts their invitation. */
	private String passwordHash;
	private Instant passwordUpdatedAt;
	private Instant passwordResetRequestedAt;

	/** The authenticator secret, encrypted; null while two-factor authentication is off. */
	private String twoFactorSecret;
	/** The secret shown during setup, encrypted, until it is confirmed with a code. */
	private String twoFactorPendingSecret;
	private Instant twoFactorEnabledAt;
	/** The last TOTP time step accepted, so a code can't be used twice. */
	private Long twoFactorLastStep;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	public boolean isActive() {
		return status == EmployeeStatus.ACTIVE;
	}

	public boolean hasJoined() {
		return passwordHash != null;
	}

	public boolean hasTwoFactor() {
		return twoFactorSecret != null;
	}

	public UUID getId() {
		return id;
	}

	public String getEmployeeId() {
		return employeeId;
	}

	public void setEmployeeId(String employeeId) {
		this.employeeId = employeeId;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getDesignation() {
		return designation;
	}

	public void setDesignation(String designation) {
		this.designation = designation;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}

	public EmployeeStatus getStatus() {
		return status;
	}

	public void setStatus(EmployeeStatus status) {
		this.status = status;
	}

	public LocalDate getJoinDate() {
		return joinDate;
	}

	public void setJoinDate(LocalDate joinDate) {
		this.joinDate = joinDate;
	}

	public String getAvatar() {
		return avatar;
	}

	public void setAvatar(String avatar) {
		this.avatar = avatar;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public String getBio() {
		return bio;
	}

	public void setBio(String bio) {
		this.bio = bio;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
		this.passwordUpdatedAt = Instant.now();
	}

	public Instant getPasswordUpdatedAt() {
		return passwordUpdatedAt;
	}

	public Instant getPasswordResetRequestedAt() {
		return passwordResetRequestedAt;
	}

	public void setPasswordResetRequestedAt(Instant passwordResetRequestedAt) {
		this.passwordResetRequestedAt = passwordResetRequestedAt;
	}

	public String getTwoFactorSecret() {
		return twoFactorSecret;
	}

	public void setTwoFactorSecret(String twoFactorSecret) {
		this.twoFactorSecret = twoFactorSecret;
	}

	public String getTwoFactorPendingSecret() {
		return twoFactorPendingSecret;
	}

	public void setTwoFactorPendingSecret(String twoFactorPendingSecret) {
		this.twoFactorPendingSecret = twoFactorPendingSecret;
	}

	public Instant getTwoFactorEnabledAt() {
		return twoFactorEnabledAt;
	}

	public void setTwoFactorEnabledAt(Instant twoFactorEnabledAt) {
		this.twoFactorEnabledAt = twoFactorEnabledAt;
	}

	public Long getTwoFactorLastStep() {
		return twoFactorLastStep;
	}

	public void setTwoFactorLastStep(Long twoFactorLastStep) {
		this.twoFactorLastStep = twoFactorLastStep;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

}
