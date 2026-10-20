package com.ayitrix.ayipm.common;

import java.util.regex.Pattern;

public final class Text {

	// Same rule as EMAIL_PATTERN in the frontend's src/lib/validation.ts.
	private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

	private Text() {
	}

	/** Trims the value, treating null as an empty string. */
	public static String trim(String value) {
		return value == null ? "" : value.trim();
	}

	/** Trims the value and returns null when nothing is left. */
	public static String trimToNull(String value) {
		String trimmed = trim(value);
		return trimmed.isEmpty() ? null : trimmed;
	}

	public static String normalizeEmail(String value) {
		return trim(value).toLowerCase();
	}

	public static boolean isValidEmail(String value) {
		return value != null && EMAIL.matcher(value.trim()).matches();
	}

}
