package com.ayitrix.ayipm.notification;

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
@Table(name = "notifications")
public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID recipientId;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false)
	private String message;

	@Column(nullable = false)
	private String category;

	@Column(nullable = false)
	private String priority;

	@Column(nullable = false)
	private boolean read;

	private String link;

	private UUID senderId;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected Notification() {
	}

	Notification(UUID recipientId, NotificationMessage message) {
		this.recipientId = recipientId;
		this.title = message.title();
		this.message = message.message();
		this.category = message.category();
		this.priority = message.priority();
		this.link = message.link();
		this.senderId = message.senderId();
	}

	public UUID getId() {
		return id;
	}

	public UUID getRecipientId() {
		return recipientId;
	}

	public String getTitle() {
		return title;
	}

	public String getMessage() {
		return message;
	}

	public String getCategory() {
		return category;
	}

	public String getPriority() {
		return priority;
	}

	public boolean isRead() {
		return read;
	}

	void setRead(boolean read) {
		this.read = read;
	}

	public String getLink() {
		return link;
	}

	public UUID getSenderId() {
		return senderId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

}
