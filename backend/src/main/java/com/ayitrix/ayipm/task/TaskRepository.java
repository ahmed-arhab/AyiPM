package com.ayitrix.ayipm.task;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

interface TaskRepository extends JpaRepository<Task, UUID> {

	List<Task> findAllByOrderByStatusAscPositionAsc();

	List<Task> findByProjectIdOrderByStatusAscPositionAsc(UUID projectId);

	/**
	 * Locks every task in one column until the transaction ends, so two people reordering the same column at once
	 * take turns instead of writing conflicting positions.
	 */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select t from Task t where t.status = :status order by t.position, t.createdAt")
	List<Task> lockColumn(TaskStatus status);

}
