package com.ayitrix.ayipm.common;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Allows {@code ayipm.rate-limit.max-requests} per key in each fixed window of {@code ayipm.rate-limit.window}. Counts
 * are kept in memory, so they start over when the backend restarts and aren't shared between instances. Memory stays
 * bounded: finished windows are dropped, and once {@link #MAX_KEYS} keys are tracked the oldest window makes room.
 */
@Component
public class InMemoryRateLimiter implements RateLimiter {

	static final int MAX_KEYS = 10_000;

	private final int maxRequests;
	private final Duration window;
	private final int maxKeys;
	private final Clock clock;
	// In the order the windows started, so the oldest are first.
	private final LinkedHashMap<String, Window> windows = new LinkedHashMap<>();

	@Autowired
	public InMemoryRateLimiter(@Value("${ayipm.rate-limit.max-requests}") int maxRequests,
			@Value("${ayipm.rate-limit.window}") Duration window, Clock clock) {
		this(maxRequests, window, MAX_KEYS, clock);
	}

	InMemoryRateLimiter(int maxRequests, Duration window, int maxKeys, Clock clock) {
		if (maxRequests < 1) throw new IllegalArgumentException("ayipm.rate-limit.max-requests must be at least 1.");
		if (!window.isPositive()) throw new IllegalArgumentException("ayipm.rate-limit.window must be positive.");
		this.maxRequests = maxRequests;
		this.window = window;
		this.maxKeys = maxKeys;
		this.clock = clock;
	}

	@Override
	public synchronized Optional<Duration> tryAcquire(String key) {
		Instant now = clock.instant();
		dropFinished(now);
		Window current = windows.get(key);
		if (current == null || !now.isBefore(current.end)) {
			windows.remove(key);
			if (windows.size() >= maxKeys) windows.pollFirstEntry();
			windows.put(key, new Window(now.plus(window)));
			return Optional.empty();
		}
		if (current.count >= maxRequests) return Optional.of(Duration.between(now, current.end));
		current.count++;
		return Optional.empty();
	}

	/** Forgets every count. */
	public synchronized void clear() {
		windows.clear();
	}

	synchronized int size() {
		return windows.size();
	}

	private void dropFinished(Instant now) {
		Iterator<Window> oldestFirst = windows.values().iterator();
		while (oldestFirst.hasNext()) {
			if (now.isBefore(oldestFirst.next().end)) return;
			oldestFirst.remove();
		}
	}

	private static final class Window {

		private final Instant end;
		private int count = 1;

		private Window(Instant end) {
			this.end = end;
		}

	}

}
