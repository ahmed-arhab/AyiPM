package com.ayitrix.ayipm.common;

import org.springframework.http.HttpStatus;

/** A 429 response that also tells the client, in a Retry-After header, how many seconds to wait. */
public class TooManyRequestsException extends ApiException {

	private final long retryAfterSeconds;

	public TooManyRequestsException(String message, long retryAfterSeconds) {
		super(HttpStatus.TOO_MANY_REQUESTS, message);
		this.retryAfterSeconds = retryAfterSeconds;
	}

	public long getRetryAfterSeconds() {
		return retryAfterSeconds;
	}

}
