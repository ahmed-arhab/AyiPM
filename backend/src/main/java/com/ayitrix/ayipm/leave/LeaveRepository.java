package com.ayitrix.ayipm.leave;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface LeaveRepository extends JpaRepository<LeaveRequest, UUID> {

	List<LeaveRequest> findAllByOrderByCreatedAtDesc();

	List<LeaveRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

}
