package com.ayitrix.ayipm.employee;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findFirstByEmailOrEmployeeId(String email, String employeeId);

	List<User> findAllByOrderByCreatedAtAsc();

	List<User> findAllByEmployeeIdStartingWith(String prefix);

	List<User> findAllByEmailOrEmployeeId(String email, String employeeId);

	long countByRoleAndStatusAndIdNot(Role role, EmployeeStatus status, UUID excludedId);

	List<User> findAllByRoleAndTwoFactorSecretIsNull(Role role);

	/** Locks one person's row until the transaction ends, to serialise checks such as the leave balance. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select u from User u where u.id = :id")
	Optional<User> lockById(UUID id);

	@Modifying
	@Query("update User u set u.passwordResetRequestedAt = :at where u.email = :email and u.status = :status")
	int markResetRequested(String email, EmployeeStatus status, Instant at);

	/** Records an accepted TOTP step. Returns 0 if that step or a later one was already used, so a code works only once. */
	@Modifying
	@Query("update User u set u.twoFactorLastStep = :step where u.id = :id and (u.twoFactorLastStep is null or u.twoFactorLastStep < :step)")
	int markTwoFactorStepUsed(UUID id, long step);

}
