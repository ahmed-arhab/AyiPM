package com.ayitrix.ayipm.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.env.MockEnvironment;

import com.ayitrix.ayipm.AyipmApplication;

/** A start with the prod profile stops early, with a short message, when its settings aren't safe. */
@ExtendWith(OutputCaptureExtension.class)
class ProductionSettingsCheckTests {

	@Test
	void prodWithoutDatabasePasswordStopsWithAShortMessage(CapturedOutput output) {
		assumeTrue(System.getenv("DATABASE_PASSWORD") == null, "DATABASE_PASSWORD is set in this environment");

		assertThatThrownBy(() -> start("--spring.profiles.active=prod", "--DATABASE_USERNAME=ayipm"))
				.isInstanceOf(ProductionSettingsCheck.Failure.class)
				.hasMessage("DATABASE_PASSWORD is not set. The prod profile has no default database credentials.");
		assertThat(output).contains("APPLICATION FAILED TO START", "Set DATABASE_PASSWORD").doesNotContain("Caused by");
	}

	@Test
	void prodRefusesTheDemoProfile() {
		assertThatThrownBy(() -> start("--spring.profiles.active=prod,demo", "--DATABASE_USERNAME=ayipm", "--DATABASE_PASSWORD=secret"))
				.isInstanceOf(ProductionSettingsCheck.Failure.class)
				.hasMessageContaining("The demo profile can't be used with prod");
	}

	@Test
	void prodWithDatabaseCredentialsPasses() {
		MockEnvironment environment = new MockEnvironment()
				.withProperty("spring.datasource.username", "ayipm")
				.withProperty("spring.datasource.password", "secret");
		environment.setActiveProfiles("prod");

		assertThatNoException().isThrownBy(() -> ProductionSettingsCheck.check(environment));
	}

	@Test
	void withoutProdTheDevelopmentDefaultsStillWork() {
		MockEnvironment environment = new MockEnvironment();
		environment.setActiveProfiles("demo");

		assertThatNoException().isThrownBy(() -> ProductionSettingsCheck.check(environment));
	}

	private static void start(String... args) {
		SpringApplication application = new SpringApplication(AyipmApplication.class);
		application.setWebApplicationType(WebApplicationType.NONE);
		application.run(args);
	}

}
