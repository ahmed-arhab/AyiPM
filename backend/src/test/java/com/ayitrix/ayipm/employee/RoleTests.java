package com.ayitrix.ayipm.employee;

import static com.ayitrix.ayipm.auth.Permission.ACTIVITY_VIEW_ALL;
import static com.ayitrix.ayipm.auth.Permission.ATTENDANCE_EXPORT;
import static com.ayitrix.ayipm.auth.Permission.ATTENDANCE_VIEW_ALL;
import static com.ayitrix.ayipm.auth.Permission.EMPLOYEES_MANAGE;
import static com.ayitrix.ayipm.auth.Permission.LEAVE_REVIEW;
import static com.ayitrix.ayipm.auth.Permission.PROJECTS_MANAGE;
import static com.ayitrix.ayipm.auth.Permission.TASKS_MANAGE;
import static com.ayitrix.ayipm.auth.Permission.WORKSPACE_MANAGE;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.auth.Permission;

class RoleTests {

	@Test
	void fromValueFindsEveryRoleByItsApiName() {
		assertThat(Role.fromValue("admin")).contains(Role.ADMIN);
		assertThat(Role.fromValue("project_manager")).contains(Role.PROJECT_MANAGER);
		assertThat(Role.fromValue("employee")).contains(Role.EMPLOYEE);
		for (Role role : Role.values()) {
			assertThat(Role.fromValue(role.value())).contains(role);
		}
	}

	@Test
	void fromValueIsEmptyForUnknownValues() {
		assertThat(Role.fromValue("owner")).isEmpty();
		assertThat(Role.fromValue("Admin")).isEmpty();
		assertThat(Role.fromValue("PROJECT_MANAGER")).isEmpty();
		assertThat(Role.fromValue(" admin ")).isEmpty();
		assertThat(Role.fromValue("")).isEmpty();
		assertThat(Role.fromValue(null)).isEmpty();
	}

	// The same sets as PERMISSIONS in the frontend's src/constants/roles.ts.
	@Test
	void eachRoleHasExactlyThePermissionsTheFrontendExpects() {
		assertThat(permissionsOf(Role.ADMIN)).isEqualTo(EnumSet.of(
				EMPLOYEES_MANAGE, ATTENDANCE_VIEW_ALL, ATTENDANCE_EXPORT, LEAVE_REVIEW, PROJECTS_MANAGE, TASKS_MANAGE, ACTIVITY_VIEW_ALL,
				WORKSPACE_MANAGE));
		assertThat(permissionsOf(Role.PROJECT_MANAGER)).isEqualTo(EnumSet.of(
				ATTENDANCE_VIEW_ALL, ATTENDANCE_EXPORT, LEAVE_REVIEW, PROJECTS_MANAGE, TASKS_MANAGE, ACTIVITY_VIEW_ALL));
		assertThat(permissionsOf(Role.EMPLOYEE)).isEmpty();
	}

	private static Set<Permission> permissionsOf(Role role) {
		return Arrays.stream(Permission.values()).filter(role::has).collect(Collectors.toCollection(() -> EnumSet.noneOf(Permission.class)));
	}

}
