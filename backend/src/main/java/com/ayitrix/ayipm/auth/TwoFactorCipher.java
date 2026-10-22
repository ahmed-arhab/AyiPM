package com.ayitrix.ayipm.auth;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.UUID;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Encrypts authenticator secrets with AES-256-GCM under the key in {@code ayipm.two-factor.encryption-key}. Each value
 * is bound to its user, so it can't be copied to another account. Without a key, two-factor authentication can't be
 * turned on and everything else works as before.
 */
@Component
public class TwoFactorCipher {

	private static final Logger log = LoggerFactory.getLogger(TwoFactorCipher.class);
	private static final int KEY_BYTES = 32;
	private static final int IV_BYTES = 12;
	private static final int TAG_BITS = 128;
	private static final SecureRandom RANDOM = new SecureRandom();

	private final SecretKey key;

	public TwoFactorCipher(@Value("${ayipm.two-factor.encryption-key:}") String encodedKey) {
		this.key = parseKey(encodedKey);
		if (key == null) log.info("Two-factor authentication is unavailable because ayipm.two-factor.encryption-key is not set.");
	}

	public boolean isConfigured() {
		return key != null;
	}

	/** Returns base64 of the IV followed by the ciphertext and tag. */
	String encrypt(byte[] plaintext, UUID userId) {
		byte[] iv = new byte[IV_BYTES];
		RANDOM.nextBytes(iv);
		try {
			Cipher cipher = cipher(Cipher.ENCRYPT_MODE, iv, userId);
			byte[] ciphertext = cipher.doFinal(plaintext);
			return Base64.getEncoder().encodeToString(ByteBuffer.allocate(IV_BYTES + ciphertext.length).put(iv).put(ciphertext).array());
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException("Could not encrypt the two-factor secret.", e);
		}
	}

	/** Fails when the key is missing or isn't the one the value was encrypted with. */
	byte[] decrypt(String stored, UUID userId) throws GeneralSecurityException {
		byte[] bytes;
		try {
			bytes = Base64.getDecoder().decode(stored);
		} catch (IllegalArgumentException e) {
			throw new GeneralSecurityException("Encrypted value is not base64.", e);
		}
		if (bytes.length <= IV_BYTES) throw new GeneralSecurityException("Encrypted value is too short.");
		Cipher cipher = cipher(Cipher.DECRYPT_MODE, Arrays.copyOf(bytes, IV_BYTES), userId);
		return cipher.doFinal(bytes, IV_BYTES, bytes.length - IV_BYTES);
	}

	private Cipher cipher(int mode, byte[] iv, UUID userId) throws GeneralSecurityException {
		if (key == null) throw new GeneralSecurityException("ayipm.two-factor.encryption-key is not set.");
		Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
		cipher.init(mode, key, new GCMParameterSpec(TAG_BITS, iv));
		cipher.updateAAD(userId.toString().getBytes(StandardCharsets.US_ASCII));
		return cipher;
	}

	private static SecretKey parseKey(String encodedKey) {
		if (encodedKey == null || encodedKey.isBlank()) return null;
		byte[] bytes;
		try {
			bytes = Base64.getDecoder().decode(encodedKey.trim());
		} catch (IllegalArgumentException e) {
			bytes = new byte[0];
		}
		if (bytes.length != KEY_BYTES) {
			throw new IllegalStateException("ayipm.two-factor.encryption-key must be " + KEY_BYTES
					+ " random bytes in base64. Generate one with: openssl rand -base64 32");
		}
		return new SecretKeySpec(bytes, "AES");
	}

}
