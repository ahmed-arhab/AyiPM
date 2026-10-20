package com.ayitrix.ayipm.preferences;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One row per person who changed a setting; everyone else uses the defaults. */
@Entity
@Table(name = "user_preferences")
public class Preferences {

	@Id
	private UUID userId;

	@Column(nullable = false)
	private String language = PreferencesService.DEFAULT_LANGUAGE;

	@Column(nullable = false)
	private String dateFormat = "YYYY-MM-DD";

	@Column(nullable = false)
	private String timeFormat = "12h";

	@Column(nullable = false)
	private String weekStart = "Monday";

	@Column(nullable = false)
	private boolean notifyTask = true;

	@Column(nullable = false)
	private boolean notifyProject = true;

	@Column(nullable = false)
	private boolean notifyLeave = true;

	@Column(nullable = false)
	private boolean notifyAttendance = true;

	@Column(nullable = false)
	private boolean notifySystem = true;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected Preferences() {
	}

	Preferences(UUID userId) {
		this.userId = userId;
	}

	static Preferences defaults() {
		return new Preferences(null);
	}

	public boolean wants(String category) {
		return switch (category) {
			case "task" -> notifyTask;
			case "project" -> notifyProject;
			case "leave" -> notifyLeave;
			case "attendance" -> notifyAttendance;
			default -> notifySystem;
		};
	}

	void setWants(String category, boolean value) {
		switch (category) {
			case "task" -> notifyTask = value;
			case "project" -> notifyProject = value;
			case "leave" -> notifyLeave = value;
			case "attendance" -> notifyAttendance = value;
			case "system" -> notifySystem = value;
			default -> throw new IllegalArgumentException(category);
		}
	}

	public String getLanguage() {
		return language;
	}

	void setLanguage(String language) {
		this.language = language;
	}

	public String getDateFormat() {
		return dateFormat;
	}

	void setDateFormat(String dateFormat) {
		this.dateFormat = dateFormat;
	}

	public String getTimeFormat() {
		return timeFormat;
	}

	void setTimeFormat(String timeFormat) {
		this.timeFormat = timeFormat;
	}

	public String getWeekStart() {
		return weekStart;
	}

	void setWeekStart(String weekStart) {
		this.weekStart = weekStart;
	}

}
