package com.ayitrix.ayipm.task;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface TaskHistoryRepository extends JpaRepository<TaskHistoryEntry, UUID> {

	List<TaskHistoryEntry> findByTaskIdInOrderByCreatedAtAsc(Collection<UUID> taskIds);

}
