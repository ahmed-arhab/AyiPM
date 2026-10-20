package com.ayitrix.ayipm.project;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Matches Project in the frontend's src/types/project.ts. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProjectResponse(
		String id,
		String name,
		String client,
		String description,
		String startDate,
		String endDate,
		String status,
		List<String> members,
		String managerId,
		String budget,
		String createdBy,
		Instant createdAt,
		Instant updatedAt) {

	public static ProjectResponse from(Project p) {
		return new ProjectResponse(
				p.getId().toString(),
				p.getName(),
				p.getClient(),
				p.getDescription(),
				p.getStartDate().toString(),
				p.getEndDate().toString(),
				p.getStatus().value(),
				p.getMemberIds().stream().map(UUID::toString).toList(),
				p.getManagerId() == null ? null : p.getManagerId().toString(),
				p.getBudget(),
				p.getCreatedById().toString(),
				p.getCreatedAt(),
				p.getUpdatedAt());
	}

}
