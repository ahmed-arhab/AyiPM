package com.ayitrix.ayipm.auth;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface RecoveryCodeRepository extends JpaRepository<RecoveryCode, UUID> {

	@Query("select count(c) from RecoveryCode c where c.user.id = :userId")
	long countForUser(UUID userId);

	/** Deletes the code if it is still unused. Returns 1 when it was, so two requests can't both use it. */
	@Modifying
	@Query("delete from RecoveryCode c where c.user.id = :userId and c.codeHash = :codeHash")
	int use(UUID userId, String codeHash);

	@Modifying
	@Query("delete from RecoveryCode c where c.user.id = :userId")
	void deleteAllForUser(UUID userId);

}
