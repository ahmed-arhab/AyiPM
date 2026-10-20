package com.ayitrix.ayipm.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface SessionRepository extends JpaRepository<Session, UUID> {

	@Query("select s from Session s join fetch s.user where s.tokenHash = :tokenHash")
	Optional<Session> findWithUser(String tokenHash);

	@Modifying
	@Query("delete from Session s where s.tokenHash = :tokenHash")
	void deleteByTokenHash(String tokenHash);

	@Modifying
	@Query("delete from Session s where s.user.id = :userId")
	void deleteAllForUser(UUID userId);

}
