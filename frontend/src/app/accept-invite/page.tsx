import type { Metadata } from 'next';
import { AcceptInviteView } from '@/features/auth/components/AcceptInviteView';

export const metadata: Metadata = { title: 'Join your workspace' };

export default function AcceptInvitePage() {
  return <AcceptInviteView />;
}
