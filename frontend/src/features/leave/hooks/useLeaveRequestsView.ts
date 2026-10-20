import { useMemo, useState } from 'react';
import { useAppStore, useCurrentUser, useLeaveRequests, usePermission } from '@/store';
import { hasPermission } from '@/constants/roles';
import { compareRequests, countByStatus, type LeaveScope, type LeaveStatusTab } from '../utils';

export function useLeaveRequestsView() {
  const user = useCurrentUser();
  const canReview = usePermission('leave.review');
  const requests = useLeaveRequests();
  const [scopeState, setScope] = useState<LeaveScope>('mine');
  const [status, setStatus] = useState<LeaveStatusTab>('all');
  const scope: LeaveScope = canReview ? scopeState : 'mine';
  const hasOtherReviewer = useAppStore((s) =>
    s.employees.some((e) => e.id !== user.id && e.status === 'active' && hasPermission(e.role, 'leave.review'))
  );
  const canReviewOwn = canReview && !hasOtherReviewer;

  const scoped = useMemo(
    () => requests.filter((r) => (scope === 'mine' ? r.employeeId === user.id : r.employeeId !== user.id)),
    [requests, scope, user.id]
  );
  const counts = useMemo(() => countByStatus(scoped), [scoped]);
  const rows = useMemo(
    () => (status === 'all' ? scoped : scoped.filter((r) => r.status === status)).slice().sort(compareRequests),
    [scoped, status]
  );
  const teamPending = useMemo(
    () => (canReview ? requests.filter((r) => r.employeeId !== user.id && r.status === 'pending').length : 0),
    [requests, canReview, user.id]
  );

  return { canReview, canReviewOwn, scope, setScope, status, setStatus, rows, counts, teamPending };
}
