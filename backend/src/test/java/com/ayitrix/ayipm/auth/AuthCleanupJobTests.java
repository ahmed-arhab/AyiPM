package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.Clock;
import java.util.UUID;
import java.sql.Timestamp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.ayitrix.ayipm.IntegrationTest;

class AuthCleanupJobTests extends IntegrationTest {

    @Autowired
    private Clock clock;

    @Autowired
    private AuthCleanupJob cleanupJob;

    @Autowired
    private JdbcTemplate jdbc;

    private Timestamp timestamp(Instant instant) {
        return Timestamp.from(instant);
    }

    @Test
    void removesExpiredRecordsAndPreservesValidOnes() {
        Client owner = signedInOwner();
        UUID userId = UUID.fromString(idOf(owner));

        Instant now = clock.instant();
        Instant expired = now.minusSeconds(3600);
        Instant future = now.plusSeconds(3600);

        jdbc.update("""
                insert into sessions (id, token_hash, user_id, expires_at)
                values
                    (gen_random_uuid(), 'expired-session', ?, ?),
                    (gen_random_uuid(), 'valid-session', ?, ?)
                """,
                userId, timestamp(expired),
                userId, timestamp(future));

        jdbc.update("""
                insert into invites (id, token_hash, user_id, created_by_id, expires_at)
                values
                    (gen_random_uuid(), 'expired-invite', ?, ?, ?),
                    (gen_random_uuid(), 'valid-invite', ?, ?, ?)
                """,
                userId, userId, timestamp(expired),
                userId, userId, timestamp(future));

        jdbc.update("""
                insert into password_resets (id, token_hash, user_id, expires_at)
                values
                    (gen_random_uuid(), 'expired-reset', ?, ?),
                    (gen_random_uuid(), 'valid-reset', ?, ?)
                """,
                userId, timestamp(expired),
                userId, timestamp(future));

        jdbc.update("""
                insert into login_attempts (key, failures, first_failed_at, locked_until)
                values
                    ('old-unlocked', 2, ?, null),
                    ('old-expired-lock', 0, ?, ?),
                    ('old-active-lock', 0, ?, ?),
                    ('recent-attempt', 1, ?, null)
                """,
                timestamp(expired),
                timestamp(expired), timestamp(expired),
                timestamp(expired), timestamp(future),
                timestamp(now));

        cleanupJob.cleanupExpiredRecords();

        assertThat(jdbc.queryForObject("select count(*) from sessions where token_hash = 'expired-session'",
                Integer.class)).isZero();
        assertThat(
                jdbc.queryForObject("select count(*) from sessions where token_hash = 'valid-session'", Integer.class))
                .isEqualTo(1);

        assertThat(
                jdbc.queryForObject("select count(*) from invites where token_hash = 'expired-invite'", Integer.class))
                .isZero();
        assertThat(jdbc.queryForObject("select count(*) from invites where token_hash = 'valid-invite'", Integer.class))
                .isEqualTo(1);

        assertThat(jdbc.queryForObject("select count(*) from password_resets where token_hash = 'expired-reset'",
                Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from password_resets where token_hash = 'valid-reset'",
                Integer.class)).isEqualTo(1);

        assertThat(jdbc.queryForObject("select count(*) from login_attempts where key = 'old-unlocked'", Integer.class))
                .isZero();
        assertThat(jdbc.queryForObject("select count(*) from login_attempts where key = 'old-expired-lock'",
                Integer.class)).isZero();
        assertThat(
                jdbc.queryForObject("select count(*) from login_attempts where key = 'old-active-lock'", Integer.class))
                .isEqualTo(1);
        assertThat(
                jdbc.queryForObject("select count(*) from login_attempts where key = 'recent-attempt'", Integer.class))
                .isEqualTo(1);
    }
}