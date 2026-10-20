package com.ayitrix.ayipm.attendance;

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

/**
 * One person's attendance for one day. Approved leave creates {@code leave} records; check-in and check-out are
 * added by the attendance API (#103).
 */
@Entity
@Table(name = "attendance_records")
public class AttendanceRecord {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, updatable = false)
	private UUID userId;

	@Column(nullable = false, updatable = false)
	private LocalDate date;

	private Instant checkInAt;

	private Instant checkOutAt;

	private Double workingHours;

	@Column(nullable = false)
	private AttendanceStatus status;

	private String notes;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected AttendanceRecord() {
	}

	public AttendanceRecord(UUID userId, LocalDate date, AttendanceStatus status, String notes) {
		this.userId = userId;
		this.date = date;
		this.status = status;
		this.notes = notes;
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public LocalDate getDate() {
		return date;
	}

	public Instant getCheckInAt() {
		return checkInAt;
	}

	public void setCheckInAt(Instant checkInAt) {
		this.checkInAt = checkInAt;
	}

	public Instant getCheckOutAt() {
		return checkOutAt;
	}

	public void setCheckOutAt(Instant checkOutAt) {
		this.checkOutAt = checkOutAt;
	}

	public Double getWorkingHours() {
		return workingHours;
	}

	public void setWorkingHours(Double workingHours) {
		this.workingHours = workingHours;
	}

	public AttendanceStatus getStatus() {
		return status;
	}

	public void setStatus(AttendanceStatus status) {
		this.status = status;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

}
