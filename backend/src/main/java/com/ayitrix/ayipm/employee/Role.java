package com.ayitrix.ayipm.employee;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

import com.ayitrix.ayipm.auth.Permission;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Keep the permissions in sync with src/constants/roles.ts in the frontend. */
public enum Role {
	ADMIN("admin", EnumSet.allOf(Permission.class)),
	PROJECT_MANAGER("project_manager", EnumSet.of(
			Permission.ATTENDANCE_VIEW_ALL,
			Permission.ATTENDANCE_EXPORT,
			Permission.LEAVE_REVIEW,
			Permission.PROJECTS_MANAGE,
			Permission.TASKS_MANAGE,
			Permission.ACTIVITY_VIEW_ALL)),
	EMPLOYEE("employee", EnumSet.noneOf(Permission.class));

	private final String value;
	private final Set<Permission> permissions;

	Role(String value, Set<Permission> permissions) {
		this.value = value;
		this.permissions = permissions;
	}

	/** The name used in the API and the database, e.g. "project_manager". */
	public String value() {
		return value;
	}

	public boolean has(Permission permission) {
		return permissions.contains(permission);
	}

	public static Optional<Role> fromValue(String value) {
		return Arrays.stream(values()).filter(r -> r.value.equals(value)).findFirst();
	}

	@Converter(autoApply = true)
	static class DbConverter implements AttributeConverter<Role, String> {

		@Override
		public String convertToDatabaseColumn(Role role) {
			return role == null ? null : role.value;
		}

		@Override
		public Role convertToEntityAttribute(String value) {
			return value == null ? null : fromValue(value).orElseThrow();
		}

	}

}
