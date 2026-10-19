import { createId, nowIso } from '@/lib/id';
import { daysBetweenInclusive, eachDateKey, toDateKey } from '@/lib/date';
import type { ActionResult, LeaveRequest, LeaveRequestInput } from '@/types';
import { authorize, fail, getState, ok, setState } from '../appStore';
import { computeLeaveBalance } from '../selectors';
import { logActivity } from './activity';
import { notify, recipientsWithPermission } from './notifications';
import { addLeaveAttendance } from './attendance';

const BALANCE_KEY = { Annual: 'annual', Sick: 'sick', Casual: 'casual' } as const;

export function submitLeaveRequest(input: LeaveRequestInput): ActionResult<LeaveRequest> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const user = auth.data;
  if (input.employeeId !== user.id) return fail('You can only request leave for yourself.');
  if (!input.startDate || !input.endDate) return fail('Start and end dates are required.');
  if (!input.reason.trim()) return fail('Please provide a reason.');

  const days = daysBetweenInclusive(input.startDate, input.endDate);
  if (days <= 0) return fail('End date must be on or after the start date.');

  const { leaveRequests, workspace } = getState();
  const overlaps = leaveRequests.some(
    (r) => r.employeeId === user.id && r.status !== 'rejected' && r.startDate <= input.endDate && r.endDate >= input.startDate
  );
  if (overlaps) return fail('You already have a leave request covering these dates.');

  if (input.leaveType !== 'Unpaid') {
    const balance = computeLeaveBalance(leaveRequests, user.id, workspace.leaveAllowance);
    const bucket = balance[BALANCE_KEY[input.leaveType]];
    const pending = leaveRequests
      .filter((r) => r.employeeId === user.id && r.status === 'pending' && r.leaveType === input.leaveType)
      .reduce((acc, r) => acc + r.days, 0);
    if (bucket.used + pending + days > bucket.total) {
      return fail(`Not enough ${input.leaveType.toLowerCase()} leave remaining (${Math.max(0, bucket.total - bucket.used - pending)} day(s) available).`);
    }
  }

  const request: LeaveRequest = {
    ...input,
    id: createId('lv'),
    reason: input.reason.trim(),
    days,
    status: 'pending',
    appliedOn: toDateKey(),
  };
  setState((s) => ({ leaveRequests: [request, ...s.leaveRequests] }));
  logActivity({
    actor: user,
    action: 'Submitted Leave Request',
    entityType: 'leave',
    entityId: request.id,
    entityName: `${user.name} · ${days}d ${input.leaveType}`,
    details: `${input.startDate} → ${input.endDate}`,
  });
  notify(recipientsWithPermission('leave.review', user.id), {
    title: 'New leave request',
    message: `${user.name} requested ${days} day(s) of ${input.leaveType.toLowerCase()} leave.`,
    category: 'leave',
    priority: 'high',
    link: '/leave',
    senderId: user.id,
  });
  return ok(request);
}

export function reviewLeaveRequest(id: string, decision: 'approved' | 'rejected', reason?: string): ActionResult {
  const auth = authorize('leave.review');
  if (!auth.ok) return auth;
  const reviewer = auth.data;
  const { leaveRequests, employees } = getState();
  const request = leaveRequests.find((r) => r.id === id);
  if (!request) return fail('Leave request not found.');
  if (request.status !== 'pending') return fail('This request has already been reviewed.');
  if (request.employeeId === reviewer.id && recipientsWithPermission('leave.review', reviewer.id).length > 0) {
    return fail('Another reviewer must approve your own leave request.');
  }
  if (decision === 'rejected' && !reason?.trim()) return fail('Please provide a reason for rejecting.');

  const updated: LeaveRequest = {
    ...request,
    status: decision,
    reviewedBy: reviewer.id,
    reviewedAt: nowIso(),
    rejectionReason: decision === 'rejected' ? reason?.trim() : undefined,
  };
  setState((s) => ({ leaveRequests: s.leaveRequests.map((r) => (r.id === id ? updated : r)) }));
  if (decision === 'approved') {
    addLeaveAttendance(request.employeeId, eachDateKey(request.startDate, request.endDate), `Approved ${request.leaveType} leave`);
  }

  const employeeName = employees.find((e) => e.id === request.employeeId)?.name ?? 'Employee';
  logActivity({
    actor: reviewer,
    action: decision === 'approved' ? 'Approved Leave Request' : 'Rejected Leave Request',
    entityType: 'leave',
    entityId: id,
    entityName: `${employeeName} · ${request.leaveType}`,
    details: decision === 'rejected' ? `Reason: ${reason}` : `${request.days} day(s)`,
  });
  notify([request.employeeId], {
    title: `Leave ${decision}`,
    message: `Your ${request.days}-day ${request.leaveType.toLowerCase()} leave was ${decision} by ${reviewer.name}.`,
    category: 'leave',
    priority: decision === 'approved' ? 'normal' : 'high',
    link: '/leave',
    senderId: reviewer.id,
  });
  return ok();
}

export function cancelLeaveRequest(id: string): ActionResult {
  const auth = authorize();
  if (!auth.ok) return auth;
  const request = getState().leaveRequests.find((r) => r.id === id);
  if (!request) return fail('Leave request not found.');
  if (request.employeeId !== auth.data.id) return fail('You can only cancel your own requests.');
  if (request.status !== 'pending') return fail('Only pending requests can be cancelled.');

  setState((s) => ({ leaveRequests: s.leaveRequests.filter((r) => r.id !== id) }));
  logActivity({ actor: auth.data, action: 'Cancelled Leave Request', entityType: 'leave', entityId: id, entityName: auth.data.name });
  return ok();
}
