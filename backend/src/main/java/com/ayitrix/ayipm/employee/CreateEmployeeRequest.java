package com.ayitrix.ayipm.employee;

/**
 * Matches EmployeeInput in the frontend's src/types/employee.ts. When {@code password} is set, the person can sign
 * in straight away and no invitation is issued.
 */
public record CreateEmployeeRequest(
		String name,
		String email,
		String password,
		String department,
		String designation,
		String role,
		String employeeId,
		String joinDate,
		String phone,
		String location) {
}
