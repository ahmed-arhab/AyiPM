'use client';

import { useMemo } from 'react';
import { selectProjectsByMember, selectTasksByAssignee, useAppStore, useLeaveBalance } from '@/store';

export interface AccountSummary {
  projects: number;
  openTasks: number;
  leaveRemaining: number;
  leaveTotal: number;
}

export function useAccountSummary(userId: string): AccountSummary {
  const projects = useAppStore((s) => selectProjectsByMember(s.projects).get(userId)?.length ?? 0);
  const openTasks = useAppStore(
    (s) =>
      selectTasksByAssignee(s.tasks)
        .get(userId)
        ?.filter((t) => t.status !== 'done').length ?? 0
  );
  const balance = useLeaveBalance(userId);

  const leave = useMemo(() => {
    const buckets = [balance.annual, balance.sick, balance.casual];
    return {
      remaining: buckets.reduce((acc, b) => acc + Math.max(0, b.total - b.used), 0),
      total: buckets.reduce((acc, b) => acc + b.total, 0),
    };
  }, [balance]);

  return { projects, openTasks, leaveRemaining: leave.remaining, leaveTotal: leave.total };
}
