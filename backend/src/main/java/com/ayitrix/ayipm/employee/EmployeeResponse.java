package com.ayitrix.ayipm.employee;

import java.time.Instant;

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
		String role,
		String status,
		String joinDate,
		String avatar,
		String phone,
		String location,
		String bio,
		boolean invited,
		Instant passwordResetRequestedAt,
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
				user.getRole().value(),
				user.getStatus().value(),
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
