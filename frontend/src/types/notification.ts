export type NotificationCategory = 'task' | 'leave' | 'attendance' | 'project' | 'system';
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  link?: string;
  senderId?: string;
  createdAt: string;
}

export type NotificationInput = Omit<NotificationItem, 'id' | 'recipientId' | 'read' | 'createdAt'>;
