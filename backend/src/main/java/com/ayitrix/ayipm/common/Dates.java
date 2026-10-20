package com.ayitrix.ayipm.common;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

public final class Dates {

	private Dates() {
	}

	/** Parses a {@code YYYY-MM-DD} date, failing with {@code requiredMessage} when it is missing or invalid. */
	public static LocalDate parse(String value, String requiredMessage) {
		if (value == null || value.isBlank()) throw ApiException.badRequest(requiredMessage);
		try {
			return LocalDate.parse(value.trim());
		} catch (DateTimeParseException e) {
			throw ApiException.badRequest(requiredMessage);
		}
	}

}
