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

@Entity
@Table(name = "task_comments")
public class TaskComment {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, updatable = false)
	private UUID taskId;

	@Column(nullable = false, updatable = false)
	private UUID authorId;

	@Column(nullable = false)
	private String text;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected TaskComment() {
	}

	TaskComment(UUID taskId, UUID authorId, String text) {
		this.taskId = taskId;
		this.authorId = authorId;
		this.text = text;
	}

	public UUID getId() {
		return id;
	}

	public UUID getTaskId() {
		return taskId;
	}

	public UUID getAuthorId() {
		return authorId;
	}

	public String getText() {
		return text;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

}
