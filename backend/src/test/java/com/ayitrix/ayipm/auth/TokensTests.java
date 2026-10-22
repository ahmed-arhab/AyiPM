package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;

class TokensTests {

	@Test
	void tokensAreDifferentEachTime() {
		Set<String> tokens = new HashSet<>();
		for (int i = 0; i < 100; i++) {
			tokens.add(Tokens.create());
		}
		assertThat(tokens).hasSize(100);
	}

	@Test
	void tokensAreUrlSafe() {
		// 32 random bytes as unpadded URL-safe Base64, so they can go in invite and reset links as they are.
		assertThat(Tokens.create()).matches("[A-Za-z0-9_-]{43}");
	}

	@Test
	void hashIsSha256AsSixtyFourLowercaseHexCharacters() {
		assertThat(Tokens.hash("abc")).isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
		String token = Tokens.create();
		assertThat(Tokens.hash(token)).matches("[0-9a-f]{64}").isEqualTo(Tokens.hash(token));
	}

}
