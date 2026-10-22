package com.ayitrix.ayipm.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.ayitrix.ayipm.TestClock;

class InMemoryRateLimiterTests {

	private static final Instant START = Instant.parse("2026-03-02T09:00:00Z");

	private final TestClock clock = new TestClock();

	@BeforeEach
	void stopTheClock() {
		clock.set(START);
	}

	@Test
	void allowsTheLimitThenSaysHowLongToWait() {
		InMemoryRateLimiter limiter = new InMemoryRateLimiter(3, Duration.ofMinutes(1), 100, clock);
		for (int i = 0; i < 3; i++) {
			assertThat(limiter.tryAcquire("login 203.0.113.9")).isEmpty();
		}
		assertThat(limiter.tryAcquire("login 203.0.113.9")).contains(Duration.ofMinutes(1));
		clock.set(START.plusSeconds(20));
		assertThat(limiter.tryAcquire("login 203.0.113.9")).contains(Duration.ofSeconds(40));
	}

	@Test
	void countsEachKeySeparately() {
		InMemoryRateLimiter limiter = new InMemoryRateLimiter(1, Duration.ofMinutes(1), 100, clock);
		assertThat(limiter.tryAcquire("login 203.0.113.9")).isEmpty();
		assertThat(limiter.tryAcquire("login 203.0.113.9")).isPresent();
		assertThat(limiter.tryAcquire("login 198.51.100.7")).isEmpty();
		assertThat(limiter.tryAcquire("forgot 203.0.113.9")).isEmpty();
	}

	@Test
	void startsOverOnceTheWindowEnds() {
		InMemoryRateLimiter limiter = new InMemoryRateLimiter(2, Duration.ofMinutes(1), 100, clock);
		limiter.tryAcquire("login 203.0.113.9");
		limiter.tryAcquire("login 203.0.113.9");
		clock.set(START.plusSeconds(59));
		assertThat(limiter.tryAcquire("login 203.0.113.9")).contains(Duration.ofSeconds(1));

		clock.set(START.plusSeconds(60));
		assertThat(limiter.tryAcquire("login 203.0.113.9")).isEmpty();
		assertThat(limiter.tryAcquire("login 203.0.113.9")).isEmpty();
		assertThat(limiter.tryAcquire("login 203.0.113.9")).contains(Duration.ofSeconds(60));
	}

	@Test
	void dropsFinishedWindows() {
		InMemoryRateLimiter limiter = new InMemoryRateLimiter(5, Duration.ofMinutes(1), 100, clock);
		limiter.tryAcquire("login 203.0.113.1");
		limiter.tryAcquire("login 203.0.113.2");
		clock.set(START.plusSeconds(30));
		limiter.tryAcquire("login 203.0.113.3");
		assertThat(limiter.size()).isEqualTo(3);

		clock.set(START.plusSeconds(60));
		limiter.tryAcquire("login 203.0.113.4");
		assertThat(limiter.size()).isEqualTo(2);
	}

	@Test
	void dropsTheOldestWindowWhenFull() {
		InMemoryRateLimiter limiter = new InMemoryRateLimiter(1, Duration.ofMinutes(1), 2, clock);
		limiter.tryAcquire("login 203.0.113.1");
		clock.set(START.plusSeconds(1));
		limiter.tryAcquire("login 203.0.113.2");
		clock.set(START.plusSeconds(2));
		limiter.tryAcquire("login 203.0.113.3");

		assertThat(limiter.size()).isEqualTo(2);
		assertThat(limiter.tryAcquire("login 203.0.113.3")).isPresent();
		assertThat(limiter.tryAcquire("login 203.0.113.1")).isEmpty();
	}

	@Test
	void clearForgetsEveryCount() {
		InMemoryRateLimiter limiter = new InMemoryRateLimiter(1, Duration.ofMinutes(1), 100, clock);
		limiter.tryAcquire("login 203.0.113.9");
		limiter.clear();
		assertThat(limiter.tryAcquire("login 203.0.113.9")).isEmpty();
	}

	@Test
	void rejectsSettingsThatCouldNeverAllowARequest() {
		assertThatThrownBy(() -> new InMemoryRateLimiter(0, Duration.ofMinutes(1), clock)).isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> new InMemoryRateLimiter(10, Duration.ZERO, clock)).isInstanceOf(IllegalArgumentException.class);
	}

}
