package com.ayitrix.ayipm.attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, UUID> {

	List<AttendanceRecord> findByUserIdAndDateBetween(UUID userId, LocalDate from, LocalDate to);

}
