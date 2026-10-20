package com.ayitrix.ayipm.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface PasswordResetRepository extends JpaRepository<PasswordReset, UUID> {

	@Query("select r from PasswordReset r join fetch r.user where r.tokenHash = :tokenHash")
	Optional<PasswordReset> findWithUser(String tokenHash);

	@Modifying
	@Query("delete from PasswordReset r where r.user.id = :userId")
	void deleteAllForUser(UUID userId);

}
