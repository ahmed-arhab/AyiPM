package com.ayitrix.ayipm.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface InviteRepository extends JpaRepository<Invite, UUID> {

	@Query("select i from Invite i join fetch i.user where i.tokenHash = :tokenHash")
	Optional<Invite> findWithUser(String tokenHash);

	@Modifying
	@Query("delete from Invite i where i.user.id = :userId")
	void deleteAllForUser(UUID userId);

}
