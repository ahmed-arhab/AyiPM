package com.ayitrix.ayipm.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuthCleanupJob {

    private static final Duration LOGIN_ATTEMPT_TTL = Duration.ofMinutes(15);

    private final SessionRepository sessions;
    private final InviteRepository invites;
    private final PasswordResetRepository resets;
    private final LoginAttemptRepository attempts;
    private final Clock clock;

    public AuthCleanupJob(
            SessionRepository sessions,
            InviteRepository invites,
            PasswordResetRepository resets,
            LoginAttemptRepository attempts,
            Clock clock) {
        this.sessions = sessions;
        this.invites = invites;
        this.resets = resets;
        this.attempts = attempts;
        this.clock = clock;
    }

    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void cleanupExpiredRecords() {
        Instant now = clock.instant();

        sessions.deleteExpired(now);
        invites.deleteExpired(now);
        resets.deleteExpired(now);
        attempts.deleteExpired(now.minus(LOGIN_ATTEMPT_TTL), now);
    }
}