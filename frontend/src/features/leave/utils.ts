import { Coffee, HeartPulse, PlaneTakeoff, type LucideIcon } from 'lucide-react';
import type { LeaveBalance, LeaveRequest, LeaveStatus, LeaveType } from '@/types';

export type LeaveScope = 'mine' | 'team';
export type LeaveStatusTab = 'all' | LeaveStatus;
export type BalanceKey = keyof LeaveBalance;

export const BALANCE_KEY_BY_TYPE: Partial<Record<LeaveType, BalanceKey>> = { Annual: 'annual', Sick: 'sick', Casual: 'casual' };

export const BALANCE_CARDS: { key: BalanceKey; type: LeaveType; label: string; icon: LucideIcon; accent: string }[] = [
  { key: 'annual', type: 'Annual', label: 'Annual leave', icon: PlaneTakeoff, accent: 'var(--primary)' },
  { key: 'sick', type: 'Sick', label: 'Sick leave', icon: HeartPulse, accent: 'var(--danger)' },
  { key: 'casual', type: 'Casual', label: 'Casual leave', icon: Coffee, accent: 'var(--warning)' },
];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  Annual: 'Annual leave',
  Sick: 'Sick leave',
  Casual: 'Casual leave',
  Unpaid: 'Unpaid leave',
};

export function pendingDaysByType(requests: LeaveRequest[], employeeId: string): Record<LeaveType, number> {
  const pending: Record<LeaveType, number> = { Annual: 0, Sick: 0, Casual: 0, Unpaid: 0 };
  requests.forEach((r) => {
    if (r.employeeId === employeeId && r.status === 'pending') pending[r.leaveType] += r.days;
  });
  return pending;
}

export function countByStatus(requests: LeaveRequest[]): Record<LeaveStatusTab, number> {
  const counts: Record<LeaveStatusTab, number> = { all: requests.length, pending: 0, approved: 0, rejected: 0 };
  requests.forEach((r) => {
    counts[r.status] += 1;
  });
  return counts;
}

export function compareRequests(a: LeaveRequest, b: LeaveRequest): number {
  if (a.status === 'pending' && b.status !== 'pending') return -1;
  if (b.status === 'pending' && a.status !== 'pending') return 1;
  return b.appliedOn.localeCompare(a.appliedOn) || b.startDate.localeCompare(a.startDate);
}
