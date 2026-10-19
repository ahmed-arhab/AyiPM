import type { Metadata } from 'next';
import { NotificationsView } from '@/features/notifications/components/NotificationsView';

export const metadata: Metadata = { title: 'Notifications' };

export default function NotificationsPage() {
  return <NotificationsView />;
}
