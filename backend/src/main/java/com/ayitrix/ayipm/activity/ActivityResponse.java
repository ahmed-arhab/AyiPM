package com.ayitrix.ayipm.activity;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Matches ActivityLogItem in the frontend's src/types/activity.ts. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActivityResponse(
		String id,
		String actorId,
		String actorName,
		String actorRole,
		String action,
		String entityType,
		String entityId,
		String entityName,
		String details,
		Instant createdAt) {

	static ActivityResponse from(ActivityEntry e) {
		return new ActivityResponse(e.getId().toString(), e.getActorId().toString(), e.getActorName(), e.getActorRole(), e.getAction(),
				e.getEntityType(), e.getEntityId(), e.getEntityName(), e.getDetails(), e.getCreatedAt());
	}

}
