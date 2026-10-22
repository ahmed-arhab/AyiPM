package com.ayitrix.ayipm.auth;

import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.OptionalLong;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.bouncycastle.util.encoders.Base32;

/** Time-based one-time passwords (RFC 6238) as authenticator apps make them: HMAC-SHA1, 6 digits, 30-second steps. */
final class Totp {

	static final int DIGITS = 6;
	static final long STEP_SECONDS = 30;
	private static final int SECRET_BYTES = 20;
	private static final SecureRandom RANDOM = new SecureRandom();

	private Totp() {
	}

	static byte[] newSecret() {
		byte[] secret = new byte[SECRET_BYTES];
		RANDOM.nextBytes(secret);
		return secret;
	}

	static long step(Instant instant) {
		return Math.floorDiv(instant.getEpochSecond(), STEP_SECONDS);
	}

	static String code(byte[] secret, long step) {
		return code("HmacSHA1", secret, step, DIGITS);
	}

	/** HOTP (RFC 4226) with the time step as the counter. The algorithm and length vary only for the RFC test vectors. */
	static String code(String algorithm, byte[] secret, long step, int digits) {
		byte[] hash;
		try {
			Mac mac = Mac.getInstance(algorithm);
			mac.init(new SecretKeySpec(secret, algorithm));
			hash = mac.doFinal(ByteBuffer.allocate(Long.BYTES).putLong(step).array());
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException(e);
		}
		int offset = hash[hash.length - 1] & 0x0f;
		int binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8)
				| (hash[offset + 3] & 0xff);
		int modulus = (int) Math.pow(10, digits);
		return String.format("%0" + digits + "d", binary % modulus);
	}

	/**
	 * The step whose code matches, allowing one step of clock drift either way. Steps up to {@code lastUsedStep} are
	 * skipped, so a code that was already accepted, or an older one, is refused.
	 */
	static OptionalLong matchingStep(byte[] secret, String code, Instant now, long lastUsedStep) {
		byte[] given = code.getBytes(StandardCharsets.US_ASCII);
		long current = step(now);
		for (long step = current - 1; step <= current + 1; step++) {
			if (step <= lastUsedStep) continue;
			if (MessageDigest.isEqual(code(secret, step).getBytes(StandardCharsets.US_ASCII), given)) return OptionalLong.of(step);
		}
		return OptionalLong.empty();
	}

	static String base32(byte[] secret) {
		return Base32.toBase32String(secret).replace("=", "");
	}

	/** The otpauth:// link that authenticator apps read from the QR code. */
	static String uri(String issuer, String account, byte[] secret) {
		return "otpauth://totp/" + encode(issuer) + ":" + encode(account)
				+ "?secret=" + base32(secret)
				+ "&issuer=" + encode(issuer)
				+ "&algorithm=SHA1&digits=" + DIGITS + "&period=" + STEP_SECONDS;
	}

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
	}

}
