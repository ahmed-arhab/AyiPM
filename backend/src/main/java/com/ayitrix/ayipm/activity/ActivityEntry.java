package com.ayitrix.ayipm.activity;

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
@Table(name = "activity_log")
public class ActivityEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private UUID actorId;

	@Column(nullable = false)
	private String actorName;

	@Column(nullable = false)
	private String actorRole;

	@Column(nullable = false)
	private String action;

	@Column(nullable = false)
	private String entityType;

	private String entityId;

	@Column(nullable = false)
	private String entityName;

	private String details;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected ActivityEntry() {
	}

	ActivityEntry(UUID actorId, String actorName, String actorRole, String action, String entityType, String entityId, String entityName,
			String details) {
		this.actorId = actorId;
		this.actorName = actorName;
		this.actorRole = actorRole;
		this.action = action;
		this.entityType = entityType;
		this.entityId = entityId;
		this.entityName = entityName;
		this.details = details;
	}

	public UUID getId() {
		return id;
	}

	public UUID getActorId() {
		return actorId;
	}

	public String getActorName() {
		return actorName;
	}

	public String getActorRole() {
		return actorRole;
	}

	public String getAction() {
		return action;
	}

	public String getEntityType() {
		return entityType;
	}

	public String getEntityId() {
		return entityId;
	}

	public String getEntityName() {
		return entityName;
	}

	public String getDetails() {
		return details;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

}
