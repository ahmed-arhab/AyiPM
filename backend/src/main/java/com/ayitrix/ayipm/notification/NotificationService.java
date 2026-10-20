package com.ayitrix.ayipm.notification;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.preferences.PreferencesService;

@Service
public class NotificationService {

	/** Same cap the browser used (MAX_NOTIFICATIONS_PER_USER). */
	static final int MAX_PER_USER = 100;

	private final NotificationRepository notifications;
	private final PreferencesService preferences;
	private final UserRepository users;

	public NotificationService(NotificationRepository notifications, PreferencesService preferences, UserRepository users) {
		this.notifications = notifications;
		this.preferences = preferences;
		this.users = users;
	}

	/**
	 * Sends a notification to each recipient once, skipping the sender and anyone who turned this category off. Runs
	 * inside the caller's transaction, so it is only sent if the change is saved.
	 */
	@Transactional
	public void notify(Collection<UUID> recipientIds, NotificationMessage message) {
		Set<UUID> unique = new LinkedHashSet<>(recipientIds);
		unique.remove(null);
		if (message.senderId() != null) unique.remove(message.senderId());
		for (UUID recipient : unique) {
			if (!preferences.wants(recipient, message.category())) continue;
			notifications.save(new Notification(recipient, message));
			notifications.flush();
			notifications.trim(recipient, MAX_PER_USER);
		}
	}

	/** Active people whose role has this permission, apart from {@code excluded}. */
	@Transactional(readOnly = true)
	public List<UUID> peopleWith(Permission permission, UUID excluded) {
		return users.findAll().stream()
				.filter(u -> u.isActive() && u.getRole().has(permission) && !u.getId().equals(excluded))
				.map(User::getId)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<NotificationResponse> list(UUID recipientId) {
		return notifications.findByRecipientIdOrderByCreatedAtDesc(recipientId, PageRequest.of(0, MAX_PER_USER)).stream()
				.map(NotificationResponse::from)
				.toList();
	}

	@Transactional
	public NotificationResponse setRead(UUID recipientId, UUID id, boolean read) {
		Notification notification = find(recipientId, id);
		notification.setRead(read);
		return NotificationResponse.from(notification);
	}

	@Transactional
	public void markAllRead(UUID recipientId) {
		notifications.markAllRead(recipientId);
	}

	@Transactional
	public void delete(UUID recipientId, UUID id) {
		notifications.delete(find(recipientId, id));
	}

	@Transactional
	public void clear(UUID recipientId) {
		notifications.deleteAllFor(recipientId);
	}

	private Notification find(UUID recipientId, UUID id) {
		return notifications.findByIdAndRecipientId(id, recipientId).orElseThrow(() -> ApiException.notFound("Notification not found."));
	}

}
