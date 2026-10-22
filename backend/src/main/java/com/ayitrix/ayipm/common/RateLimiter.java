package com.ayitrix.ayipm.common;

import java.time.Duration;
import java.util.Optional;

/** Counts requests per key, such as an endpoint and a client address, and refuses them past a limit. */
public interface RateLimiter {

	/** Counts a request. Returns empty if it is within the limit, otherwise how long until the key may try again. */
	Optional<Duration> tryAcquire(String key);

}
