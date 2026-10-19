package com.ayitrix.ayipm.employee;

/** Matches EmployeeInput in the frontend's src/types/employee.ts. */
public record CreateEmployeeRequest(
		String name,
		String email,
		String department,
		String designation,
		String role,
		String employeeId,
		String joinDate,
		String phone,
		String location) {
}
