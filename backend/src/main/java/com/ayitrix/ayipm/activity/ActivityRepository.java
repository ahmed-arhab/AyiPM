package com.ayitrix.ayipm.activity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface ActivityRepository extends JpaRepository<ActivityEntry, UUID> {

	// Every filter is optional; a null parameter matches everything.
	@Query("""
			select a from ActivityEntry a
			where (:actorId is null or a.actorId = :actorId)
			  and (:entityType is null or a.entityType = :entityType)
			  and (cast(:from as java.time.Instant) is null or a.createdAt >= :from)
			  and (cast(:to as java.time.Instant) is null or a.createdAt < :to)
			order by a.createdAt desc
			""")
	List<ActivityEntry> search(UUID actorId, String entityType, Instant from, Instant to, Pageable page);

}
