package com.ayitrix.ayipm.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TextTests {

	@Test
	void trimTreatsNullAsEmptyAndRemovesPadding() {
		assertThat(Text.trim(null)).isEmpty();
		assertThat(Text.trim("")).isEmpty();
		assertThat(Text.trim("   ")).isEmpty();
		assertThat(Text.trim("  Jane Doe \t")).isEqualTo("Jane Doe");
	}

	@Test
	void trimToNullReturnsNullWhenNothingIsLeft() {
		assertThat(Text.trimToNull(null)).isNull();
		assertThat(Text.trimToNull("")).isNull();
		assertThat(Text.trimToNull("   ")).isNull();
		assertThat(Text.trimToNull("  Engineering ")).isEqualTo("Engineering");
	}

	@Test
	void normalizeEmailTrimsAndLowercases() {
		assertThat(Text.normalizeEmail("  Jane.Doe@Example.COM ")).isEqualTo("jane.doe@example.com");
		assertThat(Text.normalizeEmail("jane@example.com")).isEqualTo("jane@example.com");
		assertThat(Text.normalizeEmail(null)).isEmpty();
		assertThat(Text.normalizeEmail("   ")).isEmpty();
	}

	@Test
	void isValidEmailAcceptsPaddedAddressesAndRejectsMalformedOnes() {
		assertThat(Text.isValidEmail("jane@example.com")).isTrue();
		assertThat(Text.isValidEmail("  jane@example.com  ")).isTrue();
		assertThat(Text.isValidEmail("jane.doe+work@mail.example.co")).isTrue();

		assertThat(Text.isValidEmail(null)).isFalse();
		assertThat(Text.isValidEmail("")).isFalse();
		assertThat(Text.isValidEmail("   ")).isFalse();
		assertThat(Text.isValidEmail("jane")).isFalse();
		assertThat(Text.isValidEmail("jane@example")).isFalse();
		assertThat(Text.isValidEmail("@example.com")).isFalse();
		assertThat(Text.isValidEmail("jane@@example.com")).isFalse();
		assertThat(Text.isValidEmail("jane doe@example.com")).isFalse();
	}

}
