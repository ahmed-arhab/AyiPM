import type { Metadata } from 'next';
import { LeaveView } from '@/features/leave/components/LeaveView';

export const metadata: Metadata = { title: 'Leave' };

export default function LeavePage() {
  return <LeaveView />;
}
