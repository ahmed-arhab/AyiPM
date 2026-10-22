package com.ayitrix.ayipm.common;

import java.util.Optional;

import com.fasterxml.jackson.annotation.JsonValue;

import jakarta.persistence.AttributeConverter;

/**
 * An enum that is stored in the database and sent in JSON as a fixed string, such as {@code "in_progress"}. The OpenAPI
 * spec lists the strings, so they become union types in the frontend's src/types/api.generated.ts.
 */
public interface ApiValue {

	@JsonValue
	String value();

	static <E extends Enum<E> & ApiValue> Optional<E> parse(Class<E> type, String value) {
		for (E constant : type.getEnumConstants()) {
			if (constant.value().equals(value)) return Optional.of(constant);
		}
		return Optional.empty();
	}

	/** Base for the {@code @Converter(autoApply = true)} class each enum declares. */
	abstract class DbConverter<E extends Enum<E> & ApiValue> implements AttributeConverter<E, String> {

		private final Class<E> type;

		protected DbConverter(Class<E> type) {
			this.type = type;
		}

		@Override
		public String convertToDatabaseColumn(E value) {
			return value == null ? null : value.value();
		}

		@Override
		public E convertToEntityAttribute(String value) {
			return value == null ? null : parse(type, value).orElseThrow();
		}

	}

}
