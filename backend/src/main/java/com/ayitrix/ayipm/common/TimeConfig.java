package com.ayitrix.ayipm.common;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Services take the current time from this clock, so tests can replace it. */
@EnableScheduling
@Configuration
public class TimeConfig {

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
