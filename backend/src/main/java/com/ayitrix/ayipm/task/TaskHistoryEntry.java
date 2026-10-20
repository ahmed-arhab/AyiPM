package com.ayitrix.ayipm.task;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One line in a task's change history, such as "Moved to In Progress". */
@Entity
@Table(name = "task_history")
public class TaskHistoryEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, updatable = false)
	private UUID taskId;

	@Column(nullable = false, updatable = false)
	private UUID actorId;

	@Column(nullable = false)
	private String action;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected TaskHistoryEntry() {
	}

	TaskHistoryEntry(UUID taskId, UUID actorId, String action) {
		this.taskId = taskId;
		this.actorId = actorId;
		this.action = action;
	}

	public UUID getId() {
		return id;
	}

	public UUID getTaskId() {
		return taskId;
	}

	public UUID getActorId() {
		return actorId;
	}

	public String getAction() {
		return action;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

}
