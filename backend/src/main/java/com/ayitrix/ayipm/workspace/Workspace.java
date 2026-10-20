package com.ayitrix.ayipm.workspace;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** The single workspace this installation serves; its id is always {@link #DEFAULT_ID}. */
@Entity
@Table(name = "workspace")
public class Workspace {

	public static final String DEFAULT_ID = "default";

	@Id
	private String id = DEFAULT_ID;

	@Column(nullable = false)
	private String companyName;

	@Column(nullable = false)
	private String timezone = "Asia/Colombo";

	@Column(nullable = false)
	private String workDayStart = "09:00";

	@Column(nullable = false)
	private int gracePeriodMinutes = 15;

	@Column(nullable = false)
	private double halfDayThresholdHours = 4.5;

	@Column(nullable = false)
	private int annualLeaveDays = 20;

	@Column(nullable = false)
	private int sickLeaveDays = 10;

	@Column(nullable = false)
	private int casualLeaveDays = 7;

	@Column(nullable = false)
	private String employeeIdPrefix = "AX";

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected Workspace() {
	}

	public Workspace(String companyName) {
		this.companyName = companyName;
	}

	public String getId() {
		return id;
	}

	public String getCompanyName() {
		return companyName;
	}

	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}

	public String getTimezone() {
		return timezone;
	}

	public void setTimezone(String timezone) {
		this.timezone = timezone;
	}

	public String getWorkDayStart() {
		return workDayStart;
	}

	public void setWorkDayStart(String workDayStart) {
		this.workDayStart = workDayStart;
	}

	public int getGracePeriodMinutes() {
		return gracePeriodMinutes;
	}

	public void setGracePeriodMinutes(int gracePeriodMinutes) {
		this.gracePeriodMinutes = gracePeriodMinutes;
	}

	public double getHalfDayThresholdHours() {
		return halfDayThresholdHours;
	}

	public void setHalfDayThresholdHours(double halfDayThresholdHours) {
		this.halfDayThresholdHours = halfDayThresholdHours;
	}

	public int getAnnualLeaveDays() {
		return annualLeaveDays;
	}

	public void setAnnualLeaveDays(int annualLeaveDays) {
		this.annualLeaveDays = annualLeaveDays;
	}

	public int getSickLeaveDays() {
		return sickLeaveDays;
	}

	public void setSickLeaveDays(int sickLeaveDays) {
		this.sickLeaveDays = sickLeaveDays;
	}

	public int getCasualLeaveDays() {
		return casualLeaveDays;
	}

	public void setCasualLeaveDays(int casualLeaveDays) {
		this.casualLeaveDays = casualLeaveDays;
	}

	public String getEmployeeIdPrefix() {
		return employeeIdPrefix;
	}

	public void setEmployeeIdPrefix(String employeeIdPrefix) {
		this.employeeIdPrefix = employeeIdPrefix;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

}
