package com.ayitrix.ayipm.project;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

	List<Project> findAllByOrderByCreatedAtDesc();

	@Query("select p from Project p where :userId member of p.memberIds")
	List<Project> findAllWithMember(UUID userId);

}
