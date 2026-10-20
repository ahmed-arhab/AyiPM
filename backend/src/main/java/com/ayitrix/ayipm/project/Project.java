package com.ayitrix.ayipm.project;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "projects")
public class Project {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String client = "";

	@Column(nullable = false)
	private String description = "";

	@Column(nullable = false)
	private LocalDate startDate;

	@Column(nullable = false)
	private LocalDate endDate;

	@Column(nullable = false)
	private ProjectStatus status = ProjectStatus.PLANNING;

	private UUID managerId;

	private String budget;

	// Loaded with one extra query for all projects in a list, instead of one per project.
	@ElementCollection(fetch = FetchType.EAGER)
	@Fetch(FetchMode.SUBSELECT)
	@CollectionTable(name = "project_members", joinColumns = @JoinColumn(name = "project_id"))
	@Column(name = "user_id")
	private Set<UUID> memberIds = new LinkedHashSet<>();

	@Column(nullable = false, updatable = false)
	private UUID createdById;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	protected Project() {
	}

	Project(UUID createdById) {
		this.createdById = createdById;
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	void setName(String name) {
		this.name = name;
	}

	public String getClient() {
		return client;
	}

	void setClient(String client) {
		this.client = client;
	}

	public String getDescription() {
		return description;
	}

	void setDescription(String description) {
		this.description = description;
	}

	public LocalDate getStartDate() {
		return startDate;
	}

	void setStartDate(LocalDate startDate) {
		this.startDate = startDate;
	}

	public LocalDate getEndDate() {
		return endDate;
	}

	void setEndDate(LocalDate endDate) {
		this.endDate = endDate;
	}

	public ProjectStatus getStatus() {
		return status;
	}

	void setStatus(ProjectStatus status) {
		this.status = status;
	}

	public UUID getManagerId() {
		return managerId;
	}

	void setManagerId(UUID managerId) {
		this.managerId = managerId;
	}

	public String getBudget() {
		return budget;
	}

	void setBudget(String budget) {
		this.budget = budget;
	}

	public Set<UUID> getMemberIds() {
		return memberIds;
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

	/** Marks the project as changed when only its members changed, which Hibernate doesn't count as an update. */
	void touch() {
		this.updatedAt = Instant.now();
	}

}
