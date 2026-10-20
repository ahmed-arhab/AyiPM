import { createId } from '@/lib/id';
import { hoursBetween, isLateCheckIn, toDateKey } from '@/lib/date';
import type { ActionResult, AttendanceRecord } from '@/types';
import { authorize, fail, getState, ok, setState } from '../appStore';

// Attendance is still kept in the browser. The attendance API (#103) moves check-in and check-out to the server,
// including their activity entries and the "Late check-in" notification.

export function checkIn(notes?: string): ActionResult<AttendanceRecord> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const user = auth.data;
  const { attendance, workspace, leaveRequests } = getState();
  const today = toDateKey();
  const existing = attendance.find((r) => r.employeeId === user.id && r.date === today);
  const onLeave = leaveRequests.some((r) => r.employeeId === user.id && r.status === 'approved' && r.startDate <= today && r.endDate >= today);

  if (existing?.status === 'leave' || onLeave) return fail('You are on approved leave today.');
  if (existing?.checkOutAt) return fail("You've already completed today's shift.");
  if (existing?.checkInAt) return fail('You are already checked in.');

  const now = new Date();
  const late = isLateCheckIn(now, workspace.workDayStart, workspace.gracePeriodMinutes);
  const record: AttendanceRecord = {
    id: createId('att'),
    employeeId: user.id,
    date: today,
    checkInAt: now.toISOString(),
    status: late ? 'late' : 'present',
    notes: notes?.trim() || undefined,
  };
  setState((s) => ({ attendance: [record, ...s.attendance.filter((r) => r !== existing)] }));

  return ok(record);
}

export function checkOut(): ActionResult<AttendanceRecord> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const user = auth.data;
  const { attendance, workspace } = getState();
  const today = toDateKey();
  const existing = attendance.find((r) => r.employeeId === user.id && r.date === today);
  if (!existing?.checkInAt) return fail('You have not checked in today.');
  if (existing.checkOutAt) return fail('You have already checked out.');

  const now = new Date();
  const workingHours = Math.round(hoursBetween(existing.checkInAt, now) * 100) / 100;
  const updated: AttendanceRecord = {
    ...existing,
    checkOutAt: now.toISOString(),
    workingHours,
    status: workingHours < workspace.halfDayThresholdHours ? 'half_day' : existing.status,
  };
  setState((s) => ({ attendance: s.attendance.map((r) => (r.id === existing.id ? updated : r)) }));
  return ok(updated);
}

export function addLeaveAttendance(employeeId: string, dates: string[], note: string): void {
  const existing = new Set(getState().attendance.filter((r) => r.employeeId === employeeId).map((r) => r.date));
  const records: AttendanceRecord[] = dates
    .filter((date) => !existing.has(date))
    .map((date) => ({ id: createId('att'), employeeId, date, status: 'leave', notes: note }));
  if (records.length > 0) {
    setState((s) => ({ attendance: [...records, ...s.attendance] }));
  }
}

export function getTodayRecord(employeeId: string): AttendanceRecord | undefined {
  const today = toDateKey();
  return getState().attendance.find((r) => r.employeeId === employeeId && r.date === today);
}
