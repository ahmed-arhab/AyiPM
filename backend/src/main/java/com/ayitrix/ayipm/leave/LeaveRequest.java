package com.ayitrix.ayipm.leave;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, updatable = false)
	private UUID userId;

	@Column(nullable = false, updatable = false)
	private LeaveType leaveType;

	@Column(nullable = false, updatable = false)
	private LocalDate startDate;

	@Column(nullable = false, updatable = false)
	private LocalDate endDate;

	@Column(nullable = false, updatable = false)
	private int days;

	@Column(nullable = false, updatable = false)
	private String reason;

	@Column(nullable = false)
	private LeaveStatus status = LeaveStatus.PENDING;

	@Column(nullable = false, updatable = false)
	private LocalDate appliedOn;

	private UUID reviewedById;

	private Instant reviewedAt;

	private String rejectionReason;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected LeaveRequest() {
	}

	LeaveRequest(UUID userId, LeaveType leaveType, LocalDate startDate, LocalDate endDate, int days, String reason, LocalDate appliedOn) {
		this.userId = userId;
		this.leaveType = leaveType;
		this.startDate = startDate;
		this.endDate = endDate;
		this.days = days;
		this.reason = reason;
		this.appliedOn = appliedOn;
	}

	void review(LeaveStatus decision, UUID reviewerId, Instant at, String rejectionReason) {
		this.status = decision;
		this.reviewedById = reviewerId;
		this.reviewedAt = at;
		this.rejectionReason = rejectionReason;
	}

	boolean overlaps(LocalDate start, LocalDate end) {
		return !startDate.isAfter(end) && !endDate.isBefore(start);
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public LeaveType getLeaveType() {
		return leaveType;
	}

	public LocalDate getStartDate() {
		return startDate;
	}

	public LocalDate getEndDate() {
		return endDate;
	}

	public int getDays() {
		return days;
	}

	public String getReason() {
		return reason;
	}

	public LeaveStatus getStatus() {
		return status;
	}

	public LocalDate getAppliedOn() {
		return appliedOn;
	}

	public UUID getReviewedById() {
		return reviewedById;
	}

	public Instant getReviewedAt() {
		return reviewedAt;
	}

	public String getRejectionReason() {
		return rejectionReason;
	}

}
