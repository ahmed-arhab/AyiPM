package com.ayitrix.ayipm.auth;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.stereotype.Component;

import com.ayitrix.ayipm.common.ApiException;

@Component
public class PasswordHasher {

	public static final int MIN_LENGTH = 8;
	public static final int MAX_LENGTH = 200;

	private final Argon2PasswordEncoder encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

	// Compared against when an account has no password, so the response time doesn't reveal that.
	private final String dummyHash = encoder.encode("not-a-real-password");

	public String hash(String password) {
		return encoder.encode(password);
	}

	public boolean matches(String password, String storedHash) {
		if (storedHash == null) {
			encoder.matches(password, dummyHash);
			return false;
		}
		return encoder.matches(password, storedHash);
	}

	public static void assertAcceptable(String password) {
		if (password.length() < MIN_LENGTH) throw ApiException.badRequest("Password must be at least " + MIN_LENGTH + " characters.");
		if (password.length() > MAX_LENGTH) throw ApiException.badRequest("Password is too long.");
	}

}
