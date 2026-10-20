import { api } from '@/lib/api';
import { eachDateKey } from '@/lib/date';
import type { ActionResult, LeaveRequest, LeaveRequestInput } from '@/types';
import { authorize, fail, getState, ok, setState } from '../appStore';
import { addLeaveAttendance } from './attendance';
import { handleUnauthorized, refreshActivity } from './session';

// The backend checks balances and overlaps, records activity and notifies reviewers and the employee.

function upsertLeave(request: LeaveRequest) {
  setState((s) => ({
    leaveRequests: s.leaveRequests.some((r) => r.id === request.id)
      ? s.leaveRequests.map((r) => (r.id === request.id ? request : r))
      : [request, ...s.leaveRequests],
  }));
}

export async function submitLeaveRequest(input: LeaveRequestInput): Promise<ActionResult<LeaveRequest>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  if (input.employeeId !== auth.data.id) return fail('You can only request leave for yourself.');
  const result = handleUnauthorized(await api<LeaveRequest>('POST', '/api/leave', input));
  if (!result.ok) return result;
  upsertLeave(result.data);
  void refreshActivity();
  return ok(result.data);
}

export async function reviewLeaveRequest(id: string, decision: 'approved' | 'rejected', reason?: string): Promise<ActionResult> {
  const auth = authorize('leave.review');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(
    decision === 'approved'
      ? await api<LeaveRequest>('POST', `/api/leave/${id}/approve`)
      : await api<LeaveRequest>('POST', `/api/leave/${id}/reject`, { reason })
  );
  if (!result.ok) return result;
  upsertLeave(result.data);
  // The server also writes these leave days; attendance is read from the browser until the attendance API (#103).
  if (decision === 'approved') {
    const request = result.data;
    addLeaveAttendance(request.employeeId, eachDateKey(request.startDate, request.endDate), `Approved ${request.leaveType} leave`);
  }
  void refreshActivity();
  return ok();
}

export async function cancelLeaveRequest(id: string): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const request = getState().leaveRequests.find((r) => r.id === id);
  if (!request) return fail('Leave request not found.');
  const result = handleUnauthorized(await api<null>('DELETE', `/api/leave/${id}`));
  if (!result.ok) return result;
  setState((s) => ({ leaveRequests: s.leaveRequests.filter((r) => r.id !== id) }));
  void refreshActivity();
  return ok();
}
