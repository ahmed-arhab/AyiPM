package com.ayitrix.ayipm.attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, UUID> {

	List<AttendanceRecord> findByUserIdAndDateBetween(UUID userId, LocalDate from, LocalDate to);

	Optional<AttendanceRecord> findByUserIdAndDate(UUID userId, LocalDate date);

	// Every filter is optional; a null parameter matches everything. Both dates are inclusive.
	@Query("""
			select r from AttendanceRecord r
			where (:userId is null or r.userId = :userId)
			  and (cast(:from as java.time.LocalDate) is null or r.date >= :from)
			  and (cast(:to as java.time.LocalDate) is null or r.date <= :to)
			order by r.date desc, r.createdAt desc
			""")
	List<AttendanceRecord> search(UUID userId, LocalDate from, LocalDate to);

}
