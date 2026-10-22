package com.ayitrix.ayipm;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * A clock that tests can stop at a chosen instant. It reads the real time until {@link #set} is called.
 * {@link IntegrationTest} puts it in place of the app's clock and resets it before each test.
 */
public class TestClock extends Clock {

	private final AtomicReference<Instant> fixed;
	private final ZoneId zone;

	public TestClock() {
		this(new AtomicReference<>(), ZoneOffset.UTC);
	}

	private TestClock(AtomicReference<Instant> fixed, ZoneId zone) {
		this.fixed = fixed;
		this.zone = zone;
	}

	public void set(Instant instant) {
		fixed.set(instant);
	}

	public void reset() {
		fixed.set(null);
	}

	@Override
	public Instant instant() {
		Instant instant = fixed.get();
		return instant != null ? instant : Instant.now();
	}

	@Override
	public ZoneId getZone() {
		return zone;
	}

	// Shares the time with this clock, so WorkspaceService.today() follows it too.
	@Override
	public Clock withZone(ZoneId zone) {
		return new TestClock(fixed, zone);
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class Config {

		@Bean
		@Primary
		TestClock testClock() {
			return new TestClock();
		}

	}

}
