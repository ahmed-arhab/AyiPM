'use client';

import { useMemo } from 'react';
import { computeLeaveBalance, selectProjectsByMember, selectTasksByAssignee, useAppStore, useLeaveRequests } from '@/store';

export interface AccountSummary {
  projects: number;
  openTasks: number;
  leaveRemaining: number;
  leaveTotal: number;
}

export function useAccountSummary(userId: string): AccountSummary {
  const projects = useAppStore((s) => selectProjectsByMember(s.projects).get(userId)?.length ?? 0);
  const openTasks = useAppStore((s) => selectTasksByAssignee(s.tasks).get(userId)?.filter((t) => t.status !== 'done').length ?? 0);
  const leaveRequests = useLeaveRequests();
  const allowance = useAppStore((s) => s.workspace.leaveAllowance);

  const leave = useMemo(() => {
    const balance = computeLeaveBalance(leaveRequests, userId, allowance);
    const buckets = [balance.annual, balance.sick, balance.casual];
    return {
      remaining: buckets.reduce((acc, b) => acc + Math.max(0, b.total - b.used), 0),
      total: buckets.reduce((acc, b) => acc + b.total, 0),
    };
  }, [leaveRequests, userId, allowance]);

  return { projects, openTasks, leaveRemaining: leave.remaining, leaveTotal: leave.total };
}
