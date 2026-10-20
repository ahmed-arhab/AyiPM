package com.ayitrix.ayipm.notification;

import java.util.UUID;

/**
 * What to send. Category is one of task, leave, attendance, project or system; priority is one of urgent, high,
 * normal or low (see src/types/notification.ts).
 */
public record NotificationMessage(String title, String message, String category, String priority, String link, UUID senderId) {
}
