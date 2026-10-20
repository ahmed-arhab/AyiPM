package com.ayitrix.ayipm.employee;

import java.util.Arrays;
import java.util.Optional;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

public enum EmployeeStatus {
	ACTIVE("active"),
	INACTIVE("inactive");

	private final String value;

	EmployeeStatus(String value) {
		this.value = value;
	}

	public String value() {
		return value;
	}

	public static Optional<EmployeeStatus> fromValue(String value) {
		return Arrays.stream(values()).filter(s -> s.value.equals(value)).findFirst();
	}

	@Converter(autoApply = true)
	static class DbConverter implements AttributeConverter<EmployeeStatus, String> {

		@Override
		public String convertToDatabaseColumn(EmployeeStatus status) {
			return status == null ? null : status.value;
		}

		@Override
		public EmployeeStatus convertToEntityAttribute(String value) {
			return value == null ? null : fromValue(value).orElseThrow();
		}

	}

}
