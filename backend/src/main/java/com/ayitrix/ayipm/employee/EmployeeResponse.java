package com.ayitrix.ayipm.employee;

import java.time.Instant;

import org.jspecify.annotations.Nullable;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Matches the Employee type in the frontend's src/types/employee.ts. Never includes the password hash. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EmployeeResponse(
		String id,
		String employeeId,
		String name,
		String email,
		String department,
		String designation,
		Role role,
		EmployeeStatus status,
		String joinDate,
		@Nullable String avatar,
		@Nullable String phone,
		@Nullable String location,
		@Nullable String bio,
		boolean invited,
		@Nullable Instant passwordResetRequestedAt,
		Instant createdAt,
		Instant updatedAt) {

	public static EmployeeResponse from(User user) {
		return new EmployeeResponse(
				user.getId().toString(),
				user.getEmployeeId(),
				user.getName(),
				user.getEmail(),
				user.getDepartment(),
				user.getDesignation(),
				user.getRole(),
				user.getStatus(),
				user.getJoinDate().toString(),
				user.getAvatar(),
				user.getPhone(),
				user.getLocation(),
				user.getBio(),
				!user.hasJoined(),
				user.getPasswordResetRequestedAt(),
				user.getCreatedAt(),
				user.getUpdatedAt());
	}

}
