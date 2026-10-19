package com.ayitrix.ayipm.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** Every successful response is {@code {"data": ...}}; errors are {@code {"error": "..."}}. */
public record ApiResponse<T>(T data) {

	public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
		return ResponseEntity.ok(new ApiResponse<>(data));
	}

	public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
		return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(data));
	}

	public record Error(String error) {
	}

}
