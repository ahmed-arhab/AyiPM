import type { ApiSchema, Narrowed } from './api-schema';

// The backend sends these as strings; its database only allows these values.
export type NotificationCategory = 'task' | 'leave' | 'attendance' | 'project' | 'system';
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export type NotificationItem = Narrowed<
  ApiSchema<'NotificationResponse'>,
  { category: NotificationCategory; priority: NotificationPriority }
>;

export type NotificationInput = Omit<NotificationItem, 'id' | 'recipientId' | 'read' | 'createdAt'>;
