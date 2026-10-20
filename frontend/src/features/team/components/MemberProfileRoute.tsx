'use client';

import { useSearchParams } from 'next/navigation';
import { useEmployee } from '@/store';
import { MEMBER_PARAM } from '../hooks/useMemberParam';
import { MemberProfileModal } from './MemberProfileModal';
import type { ProfileAdminHandlers } from './ProfileOverviewTab';

interface MemberProfileRouteProps extends ProfileAdminHandlers {
  hidden: boolean;
  onClose: () => void;
}

export function MemberProfileRoute({ hidden, onClose, ...handlers }: MemberProfileRouteProps) {
  const memberId = useSearchParams()?.get(MEMBER_PARAM) ?? undefined;
  const member = useEmployee(memberId);
  if (!member) return null;
  return <MemberProfileModal key={member.id} member={member} isOpen={!hidden} onClose={onClose} {...handlers} />;
}
