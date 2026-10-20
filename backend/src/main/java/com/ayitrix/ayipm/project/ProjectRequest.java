package com.ayitrix.ayipm.project;

import java.util.List;

/**
 * Matches ProjectInput in the frontend's src/types/project.ts. For PATCH, a null field means "leave unchanged"; an
 * empty string clears {@code managerId} or {@code budget}.
 */
public record ProjectRequest(
		String name,
		String client,
		String description,
		String startDate,
		String endDate,
		String status,
		List<String> members,
		String managerId,
		String budget) {
}
