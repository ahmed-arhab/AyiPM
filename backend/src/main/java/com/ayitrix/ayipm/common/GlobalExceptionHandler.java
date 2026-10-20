package com.ayitrix.ayipm.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ApiResponse.Error> handleApi(ApiException e) {
		return error(e.getStatus(), e.getMessage());
	}

	@ExceptionHandler({ HttpMessageNotReadableException.class, HttpMediaTypeNotSupportedException.class })
	ResponseEntity<ApiResponse.Error> handleUnreadable(Exception e) {
		return error(HttpStatus.BAD_REQUEST, "Invalid request body.");
	}

	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<ApiResponse.Error> handleNotFound(NoResourceFoundException e) {
		return error(HttpStatus.NOT_FOUND, "Not found.");
	}

	// A malformed id in the path means the thing doesn't exist; a malformed query parameter is a bad request.
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	ResponseEntity<ApiResponse.Error> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
		if (e.getParameter().hasParameterAnnotation(PathVariable.class)) return error(HttpStatus.NOT_FOUND, "Not found.");
		return error(HttpStatus.BAD_REQUEST, "Invalid value for " + e.getName() + ".");
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	ResponseEntity<ApiResponse.Error> handleMethod(HttpRequestMethodNotSupportedException e) {
		return error(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed.");
	}

	// Unique constraints catch races that the service-level checks can miss.
	@ExceptionHandler(DataIntegrityViolationException.class)
	ResponseEntity<ApiResponse.Error> handleConflict(DataIntegrityViolationException e) {
		return error(HttpStatus.CONFLICT, "This conflicts with an existing record. Refresh and try again.");
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ApiResponse.Error> handleUnexpected(Exception e) {
		log.error("Unhandled error", e);
		return error(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please try again.");
	}

	private static ResponseEntity<ApiResponse.Error> error(HttpStatus status, String message) {
		return ResponseEntity.status(status).body(new ApiResponse.Error(message));
	}

}
