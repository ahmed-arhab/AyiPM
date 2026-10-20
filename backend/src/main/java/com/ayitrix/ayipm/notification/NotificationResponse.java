package com.ayitrix.ayipm.notification;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Matches NotificationItem in the frontend's src/types/notification.ts. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationResponse(
		String id,
		String recipientId,
		String title,
		String message,
		String category,
		String priority,
		boolean read,
		String link,
		String senderId,
		Instant createdAt) {

	static NotificationResponse from(Notification n) {
		return new NotificationResponse(n.getId().toString(), n.getRecipientId().toString(), n.getTitle(), n.getMessage(), n.getCategory(),
				n.getPriority(), n.isRead(), n.getLink(), n.getSenderId() == null ? null : n.getSenderId().toString(), n.getCreatedAt());
	}

}
