package com.ayitrix.ayipm.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

interface LoginChallengeRepository extends JpaRepository<LoginChallenge, UUID> {

	@Query("select c from LoginChallenge c join fetch c.user where c.tokenHash = :tokenHash")
	Optional<LoginChallenge> findWithUser(String tokenHash);

	/** Locks the challenge until the transaction ends, so two requests can't both complete it. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select c from LoginChallenge c join fetch c.user where c.tokenHash = :tokenHash")
	Optional<LoginChallenge> lockWithUser(String tokenHash);

	@Modifying
	@Query("delete from LoginChallenge c where c.user.id = :userId")
	void deleteAllForUser(UUID userId);

	@Modifying
	@Query("delete from LoginChallenge c where c.expiresAt < :now")
	void deleteExpired(Instant now);

}
