package com.ayitrix.ayipm.auth;

import java.time.Instant;

/** An invitation or reset token. The raw token is returned once; only its hash is stored. */
public record AccessLink(String token, Instant expiresAt) {
}
