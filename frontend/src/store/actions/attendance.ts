import { api } from '@/lib/api';
import { addDaysKey } from '@/lib/date';
import type { ActionResult, AttendanceRecord } from '@/types';
import { authorize, getState, ok, setState } from '../appStore';
import { fetchAttendance, handleUnauthorized, refreshActivity, withAttendance } from './session';

// The backend works out late and half days from its clock and the workspace schedule, records activity and sends the
// "Late check-in" notification.

function upsertRecord(record: AttendanceRecord) {
  setState((s) => ({
    attendance: s.attendance.some((r) => r.id === record.id)
      ? s.attendance.map((r) => (r.id === record.id ? record : r))
      : [record, ...s.attendance],
  }));
}

export async function checkIn(notes?: string): Promise<ActionResult<AttendanceRecord>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<AttendanceRecord>('POST', '/api/attendance/check-in', { notes }));
  if (!result.ok) return result;
  upsertRecord(result.data);
  void refreshActivity();
  return ok(result.data);
}

export async function checkOut(): Promise<ActionResult<AttendanceRecord>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<AttendanceRecord>('POST', '/api/attendance/check-out'));
  if (!result.ok) return result;
  upsertRecord(result.data);
  void refreshActivity();
  return ok(result.data);
}

/** Loads the records from `from` up to the ones already loaded, for pages that need older ones. */
export async function loadAttendanceSince(from: string): Promise<ActionResult> {
  const { attendanceSince } = getState();
  if (!attendanceSince || from >= attendanceSince) return ok();
  const to = addDaysKey(attendanceSince, -1);
  const result = handleUnauthorized(await fetchAttendance(from, to));
  if (!result.ok) return result;
  setState((s) => withAttendance(s, from, to, result.data));
  return ok();
}

/** One person's records between two dates, without adding them to the store. */
export async function fetchAttendanceHistory(employeeId: string, from: string, to: string): Promise<ActionResult<AttendanceRecord[]>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  return handleUnauthorized(await fetchAttendance(from, to, employeeId));
}
