import type { Metadata } from 'next';
import { ActivityView } from '@/features/activity/components/ActivityView';

export const metadata: Metadata = { title: 'Activity' };

export default function ActivityPage() {
  return <ActivityView />;
}
