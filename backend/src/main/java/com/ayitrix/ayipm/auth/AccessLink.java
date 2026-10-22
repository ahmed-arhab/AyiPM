package com.ayitrix.ayipm.auth;

import java.time.Instant;

/**
 * An invitation or reset token. The raw token is returned once; only its hash is stored. {@code emailed} is false when
 * email isn't configured, so the admin has to share the link themselves.
 */
public record AccessLink(String token, Instant expiresAt, boolean emailed) {
}
