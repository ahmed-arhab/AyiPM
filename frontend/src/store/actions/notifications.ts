import { createId, nowIso } from '@/lib/id';
import { DEFAULT_PREFERENCES, MAX_NOTIFICATIONS_PER_USER } from '@/constants/defaults';
import { hasPermission, type Permission } from '@/constants/roles';
import type { NotificationInput, NotificationItem } from '@/types';
import { getCurrentUser, getState, setState } from '../appStore';

function capPerRecipient(items: NotificationItem[]): NotificationItem[] {
  const counts = new Map<string, number>();
  return items.filter((item) => {
    const count = (counts.get(item.recipientId) ?? 0) + 1;
    counts.set(item.recipientId, count);
    return count <= MAX_NOTIFICATIONS_PER_USER;
  });
}

export function notify(recipientIds: string[], input: NotificationInput): void {
  const { preferences } = getState();
  const unique = Array.from(new Set(recipientIds)).filter((id) => {
    const prefs = preferences[id] ?? DEFAULT_PREFERENCES;
    return prefs.notificationCategories[input.category] !== false;
  });
  if (unique.length === 0) return;

  const createdAt = nowIso();
  const items: NotificationItem[] = unique.map((recipientId) => ({
    ...input,
    id: createId('ntf'),
    recipientId,
    read: false,
    createdAt,
  }));
  setState((s) => ({ notifications: capPerRecipient([...items, ...s.notifications]) }));
}

export function recipientsWithPermission(permission: Permission, excludeId?: string): string[] {
  return getState()
    .employees.filter((e) => e.status === 'active' && e.id !== excludeId && hasPermission(e.role, permission))
    .map((e) => e.id);
}

function updateMine(update: (item: NotificationItem) => NotificationItem | null) {
  const user = getCurrentUser();
  if (!user) return;
  setState((s) => {
    let changed = false;
    const notifications = s.notifications.flatMap((item) => {
      if (item.recipientId !== user.id) return [item];
      const next = update(item);
      if (next !== item) changed = true;
      return next ? [next] : [];
    });
    return changed ? { notifications } : null;
  });
}

export function markNotificationRead(id: string, read = true): void {
  updateMine((item) => (item.id === id && item.read !== read ? { ...item, read } : item));
}

export function markAllNotificationsRead(): void {
  updateMine((item) => (item.read ? item : { ...item, read: true }));
}

export function deleteNotification(id: string): void {
  updateMine((item) => (item.id === id ? null : item));
}

export function clearNotifications(): void {
  updateMine(() => null);
}
