package com.ayitrix.ayipm.auth;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface LoginAttemptRepository extends JpaRepository<LoginAttempt, String> {

    @Modifying
    @Query("""
            delete from LoginAttempt a
            where a.firstFailedAt < :cutoff
              and (a.lockedUntil is null or a.lockedUntil <= :now)
            """)
    void deleteExpired(Instant cutoff, Instant now);
}