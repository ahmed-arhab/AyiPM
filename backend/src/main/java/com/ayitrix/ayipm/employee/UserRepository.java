package com.ayitrix.ayipm.employee;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findFirstByEmailOrEmployeeId(String email, String employeeId);

	List<User> findAllByOrderByCreatedAtAsc();

	List<User> findAllByEmployeeIdStartingWith(String prefix);

	List<User> findAllByEmailOrEmployeeId(String email, String employeeId);

	long countByRoleAndStatusAndIdNot(Role role, EmployeeStatus status, UUID excludedId);

	@Modifying
	@Query("update User u set u.passwordResetRequestedAt = :at where u.email = :email and u.status = :status")
	int markResetRequested(String email, EmployeeStatus status, Instant at);

}
