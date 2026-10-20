import { api } from '@/lib/api';
import type { NotificationItem } from '@/types';
import { getCurrentUser, setState } from '../appStore';
import { handleUnauthorized } from './session';

// Notifications are created by the backend when something changes. These actions only manage your own inbox; the
// store updates first so the bell responds instantly, then the server is told.

function updateMine(update: (items: NotificationItem[]) => NotificationItem[]) {
  const user = getCurrentUser();
  if (!user) return;
  setState((s) => ({ notifications: update(s.notifications) }));
}

export async function markNotificationRead(id: string, read = true): Promise<void> {
  updateMine((items) => items.map((item) => (item.id === id ? { ...item, read } : item)));
  handleUnauthorized(await api('PATCH', `/api/notifications/${id}`, { read }));
}

export async function markAllNotificationsRead(): Promise<void> {
  updateMine((items) => items.map((item) => (item.read ? item : { ...item, read: true })));
  handleUnauthorized(await api('POST', '/api/notifications/read-all'));
}

export async function deleteNotification(id: string): Promise<void> {
  updateMine((items) => items.filter((item) => item.id !== id));
  handleUnauthorized(await api('DELETE', `/api/notifications/${id}`));
}

export async function clearNotifications(): Promise<void> {
  updateMine(() => []);
  handleUnauthorized(await api('DELETE', '/api/notifications'));
}
