package com.ayitrix.ayipm.common;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.boot.context.logging.LoggingApplicationListener;
import org.springframework.boot.diagnostics.AbstractFailureAnalyzer;
import org.springframework.boot.diagnostics.FailureAnalysis;
import org.springframework.context.ApplicationListener;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

/**
 * Stops a start with the "prod" profile when the database credentials are missing or the demo profile is on, and
 * says so in one short message. Without it, Spring passes an unset password through as the literal text
 * "${DATABASE_PASSWORD}" and the start fails later with a long database connection error.
 *
 * <p>Registered in META-INF/spring.factories, because it has to run before any bean touches the database.
 */
public class ProductionSettingsCheck implements ApplicationListener<ApplicationEnvironmentPreparedEvent>, Ordered {

	@Override
	public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
		check(event.getEnvironment());
	}

	/** Runs right after logging is set up, so the message is printed in the normal log format. */
	@Override
	public int getOrder() {
		return LoggingApplicationListener.DEFAULT_ORDER + 1;
	}

	static void check(Environment environment) {
		if (!environment.matchesProfiles("prod")) return;

		List<String> missing = new ArrayList<>();
		if (!StringUtils.hasText(environment.getProperty("spring.datasource.username"))) missing.add("DATABASE_USERNAME");
		if (!StringUtils.hasText(environment.getProperty("spring.datasource.password"))) missing.add("DATABASE_PASSWORD");
		if (!missing.isEmpty()) {
			String names = String.join(" and ", missing);
			throw new Failure(names + (missing.size() == 1 ? " is" : " are") + " not set. The prod profile has no default database credentials.",
					"Set " + names + ", for example in the .env file next to compose.yaml (see docs/self-hosting.md).");
		}
		if (environment.matchesProfiles("demo")) {
			throw new Failure("The demo profile can't be used with prod, because it creates accounts with a known password.",
					"Remove demo from SPRING_PROFILES_ACTIVE.");
		}
	}

	/** A setting that makes a production start unsafe. */
	public static class Failure extends RuntimeException {

		private final String action;

		Failure(String description, String action) {
			super(description);
			this.action = action;
		}

		public String getAction() {
			return action;
		}

	}

	/** Prints a {@link Failure} as Spring Boot's short "APPLICATION FAILED TO START" report instead of a stack trace. */
	public static class Analyzer extends AbstractFailureAnalyzer<Failure> {

		@Override
		protected FailureAnalysis analyze(Throwable rootFailure, Failure cause) {
			return new FailureAnalysis(cause.getMessage(), cause.getAction(), cause);
		}

	}

}
