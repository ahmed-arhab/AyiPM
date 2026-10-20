package com.ayitrix.ayipm.activity;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.employee.User;

/**
 * The audit log. Services call {@link #record} inside their own transaction, so an entry exists exactly when the
 * change it describes was saved. Action names match what the browser used to log.
 */
@Service
public class ActivityService {

	public static final String EMPLOYEE = "employee";
	public static final String PROJECT = "project";
	public static final String TASK = "task";
	public static final String ATTENDANCE = "attendance";
	public static final String LEAVE = "leave";
	public static final String AUTH = "auth";
	public static final String SETTINGS = "settings";

	private static final Set<String> ENTITY_TYPES = Set.of(EMPLOYEE, PROJECT, TASK, ATTENDANCE, LEAVE, AUTH, SETTINGS);
	private static final int MAX_PAGE_SIZE = 500;

	private final ActivityRepository entries;

	public ActivityService(ActivityRepository entries) {
		this.entries = entries;
	}

	@Transactional
	public void record(User actor, String action, String entityType, Object entityId, String entityName, String details) {
		entries.save(new ActivityEntry(actor.getId(), actor.getName(), actor.getRole().value(), action, entityType,
				entityId == null ? null : entityId.toString(), entityName, details));
	}

	public void record(User actor, String action, String entityType, Object entityId, String entityName) {
		record(actor, action, entityType, entityId, entityName, null);
	}

	/** Newest first. People without {@code activity.viewAll} only see their own actions. */
	@Transactional(readOnly = true)
	public List<ActivityResponse> search(User viewer, UUID actorId, String entityType, Instant from, Instant to, int page, int size) {
		if (entityType != null && !ENTITY_TYPES.contains(entityType)) throw ApiException.badRequest("Unknown entity type.");
		if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) throw ApiException.badRequest("Page size must be between 1 and " + MAX_PAGE_SIZE + ".");
		UUID actor = viewer.getRole().has(Permission.ACTIVITY_VIEW_ALL) ? actorId : viewer.getId();
		return entries.search(actor, entityType, from, to, PageRequest.of(page, size)).stream().map(ActivityResponse::from).toList();
	}

}
