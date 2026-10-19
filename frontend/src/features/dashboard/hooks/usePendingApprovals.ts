import { useMemo } from 'react';
import { useCurrentUser, useLeaveRequests } from '@/store';

export function usePendingApprovals() {
  const me = useCurrentUser();
  const requests = useLeaveRequests();
  return useMemo(
    () =>
      requests
        .filter((r) => r.status === 'pending' && r.employeeId !== me.id)
        .sort((a, b) => a.appliedOn.localeCompare(b.appliedOn)),
    [requests, me.id]
  );
}
