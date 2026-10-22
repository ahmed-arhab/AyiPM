package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

interface GoogleSignInRepository extends JpaRepository<GoogleSignIn, UUID> {

	/** Locks the sign-in until the transaction ends, so two requests can't both use it. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select s from GoogleSignIn s where s.tokenHash = :tokenHash")
	Optional<GoogleSignIn> lockByTokenHash(String tokenHash);

	@Modifying
	@Query("delete from GoogleSignIn s where s.expiresAt < :now")
	void deleteExpired(Instant now);

}
