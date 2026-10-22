package com.ayitrix.ayipm.auth;

import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface InviteRepository extends JpaRepository<Invite, UUID> {

	@Query("select i from Invite i join fetch i.user where i.tokenHash = :tokenHash")
	Optional<Invite> findWithUser(String tokenHash);

	@Query("select count(i) > 0 from Invite i where i.user.id = :userId and i.expiresAt > :now")
	boolean hasOpenInvite(UUID userId, Instant now);

	@Modifying
	@Query("delete from Invite i where i.user.id = :userId")
	void deleteAllForUser(UUID userId);

	@Modifying
	@Query("delete from Invite i where i.expiresAt < :now")
	void deleteExpired(Instant now);

}
