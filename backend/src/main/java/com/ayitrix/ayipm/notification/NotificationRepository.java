package com.ayitrix.ayipm.notification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface NotificationRepository extends JpaRepository<Notification, UUID> {

	List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable page);

	Optional<Notification> findByIdAndRecipientId(UUID id, UUID recipientId);

	@Modifying
	@Query("update Notification n set n.read = true where n.recipientId = :recipientId and n.read = false")
	int markAllRead(UUID recipientId);

	@Modifying
	@Query("delete from Notification n where n.recipientId = :recipientId")
	int deleteAllFor(UUID recipientId);

	// Keeps the newest `keep` notifications for one person and deletes the rest.
	@Modifying
	@Query(value = """
			delete from notifications where recipient_id = :recipientId and id not in (
			  select id from notifications where recipient_id = :recipientId order by created_at desc, id desc limit :keep)
			""", nativeQuery = true)
	int trim(UUID recipientId, int keep);

}
