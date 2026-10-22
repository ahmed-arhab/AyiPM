package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class TotpTests {

	private static final byte[] SHA1_SEED = "12345678901234567890".getBytes(StandardCharsets.US_ASCII);
	private static final byte[] SHA256_SEED = "12345678901234567890123456789012".getBytes(StandardCharsets.US_ASCII);
	private static final byte[] SHA512_SEED = "1234567890123456789012345678901234567890123456789012345678901234".getBytes(StandardCharsets.US_ASCII);

	// The test vectors from RFC 6238, appendix B.
	@ParameterizedTest
	@CsvSource({
			"59, 94287082, 46119246, 90693936",
			"1111111109, 07081804, 68084774, 25091201",
			"1111111111, 14050471, 67062674, 99943326",
			"1234567890, 89005924, 91819424, 93441116",
			"2000000000, 69279037, 90698825, 38618901",
			"20000000000, 65353130, 77737706, 47863826",
	})
	void matchesTheRfcTestVectors(long seconds, String sha1, String sha256, String sha512) {
		long step = Totp.step(Instant.ofEpochSecond(seconds));
		assertThat(Totp.code("HmacSHA1", SHA1_SEED, step, 8)).isEqualTo(sha1);
		assertThat(Totp.code("HmacSHA256", SHA256_SEED, step, 8)).isEqualTo(sha256);
		assertThat(Totp.code("HmacSHA512", SHA512_SEED, step, 8)).isEqualTo(sha512);
		// Authenticator apps show 6 digits, which are the last 6 of the 8-digit code.
		assertThat(Totp.code(SHA1_SEED, step)).isEqualTo(sha1.substring(2));
	}

	@Test
	void acceptsOneStepOfDriftAndNoMore() {
		Instant now = Instant.ofEpochSecond(1_111_111_111);
		long step = Totp.step(now);
		assertThat(Totp.matchingStep(SHA1_SEED, Totp.code(SHA1_SEED, step - 1), now, Long.MIN_VALUE)).hasValue(step - 1);
		assertThat(Totp.matchingStep(SHA1_SEED, Totp.code(SHA1_SEED, step), now, Long.MIN_VALUE)).hasValue(step);
		assertThat(Totp.matchingStep(SHA1_SEED, Totp.code(SHA1_SEED, step + 1), now, Long.MIN_VALUE)).hasValue(step + 1);
		assertThat(Totp.matchingStep(SHA1_SEED, Totp.code(SHA1_SEED, step - 2), now, Long.MIN_VALUE)).isEmpty();
		assertThat(Totp.matchingStep(SHA1_SEED, Totp.code(SHA1_SEED, step + 2), now, Long.MIN_VALUE)).isEmpty();
	}

	@Test
	void refusesTheLastUsedStepAndOlderOnes() {
		Instant now = Instant.ofEpochSecond(1_111_111_111);
		long step = Totp.step(now);
		assertThat(Totp.matchingStep(SHA1_SEED, Totp.code(SHA1_SEED, step), now, step)).isEmpty();
		assertThat(Totp.matchingStep(SHA1_SEED, Totp.code(SHA1_SEED, step - 1), now, step)).isEmpty();
		assertThat(Totp.matchingStep(SHA1_SEED, Totp.code(SHA1_SEED, step + 1), now, step)).hasValue(step + 1);
	}

	@Test
	void buildsTheOtpauthLinkWithABase32Secret() {
		assertThat(Totp.base32(SHA1_SEED)).isEqualTo("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
		assertThat(Totp.uri("Test Co", "owner@test.com", SHA1_SEED)).isEqualTo(
				"otpauth://totp/Test%20Co:owner%40test.com?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Test%20Co&algorithm=SHA1&digits=6&period=30");
	}

}
