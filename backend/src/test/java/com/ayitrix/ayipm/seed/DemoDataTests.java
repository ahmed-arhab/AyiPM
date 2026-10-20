package com.ayitrix.ayipm.seed;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/** Starts the app with the demo profile on its own empty database, the way a new contributor would. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("demo")
class DemoDataTests {

	private static final EmbeddedPostgres POSTGRES = start();

	@Autowired
	private JdbcTemplate jdbc;

	@DynamicPropertySource
	static void database(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
		registry.add("spring.datasource.username", () -> "postgres");
		registry.add("spring.datasource.password", () -> "");
	}

	private int count(String table) {
		return jdbc.queryForObject("select count(*) from " + table, Integer.class);
	}

	@Test
	void theDemoProfileCreatesAccountsAndSampleData() {
		assertThat(count("users")).isEqualTo(3);
		assertThat(count("projects")).isEqualTo(3);
		assertThat(count("tasks")).isEqualTo(8);
		assertThat(count("task_comments")).isEqualTo(2);
		assertThat(count("leave_requests")).isEqualTo(2);
		assertThat(jdbc.queryForObject("select count(*) from attendance_records where status = 'leave'", Integer.class)).isEqualTo(2);
		assertThat(jdbc.queryForObject("select count(*) from attendance_records where status in ('present', 'late', 'half_day')", Integer.class))
				.isGreaterThanOrEqualTo(27);
		assertThat(count("activity_log")).isPositive();
		assertThat(count("notifications")).isPositive();
	}

	private static EmbeddedPostgres start() {
		try {
			return EmbeddedPostgres.builder().start();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

}
