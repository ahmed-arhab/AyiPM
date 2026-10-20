package com.ayitrix.ayipm.task;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {

	List<TaskComment> findByTaskIdInOrderByCreatedAtAsc(Collection<UUID> taskIds);

}
