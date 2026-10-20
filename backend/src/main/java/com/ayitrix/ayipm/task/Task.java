package com.ayitrix.ayipm.task;

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

@Entity
@Table(name = "tasks")
public class Task {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID projectId;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false)
	private String description = "";

	private UUID assigneeId;

	@Column(nullable = false)
	private TaskPriority priority;

	@Column(nullable = false)
	private TaskStatus status;

	@Column(nullable = false)
	private LocalDate dueDate;

	/** Order within the status column; called {@code order} in the API. */
	@Column(nullable = false)
	private int position;

	@Column(nullable = false, updatable = false)
	private UUID createdById;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected Task() {
	}

	Task(UUID createdById) {
		this.createdById = createdById;
	}

	public UUID getId() {
		return id;
	}

	public UUID getProjectId() {
		return projectId;
	}

	void setProjectId(UUID projectId) {
		this.projectId = projectId;
	}

	public String getTitle() {
		return title;
	}

	void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	void setDescription(String description) {
		this.description = description;
	}

	public UUID getAssigneeId() {
		return assigneeId;
	}

	void setAssigneeId(UUID assigneeId) {
		this.assigneeId = assigneeId;
	}

	public TaskPriority getPriority() {
		return priority;
	}

	void setPriority(TaskPriority priority) {
		this.priority = priority;
	}

	public TaskStatus getStatus() {
		return status;
	}

	void setStatus(TaskStatus status) {
		this.status = status;
	}

	public LocalDate getDueDate() {
		return dueDate;
	}

	void setDueDate(LocalDate dueDate) {
		this.dueDate = dueDate;
	}

	public int getPosition() {
		return position;
	}

	void setPosition(int position) {
		this.position = position;
	}

	public UUID getCreatedById() {
		return createdById;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

}
