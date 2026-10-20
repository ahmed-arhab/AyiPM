import { isSameMonth } from '@/lib/date';
import { toCsv } from '@/lib/csv';
import { ATTENDANCE_STATUS } from '@/constants/status';
import type { AttendanceRecord, AttendanceStatus, Employee } from '@/types';

export type StatusFilter = 'all' | AttendanceStatus;

export interface AttendanceFilters {
  date: string;
  status: StatusFilter;
  employeeId: string;
}

export const DEFAULT_ATTENDANCE_FILTERS: AttendanceFilters = { date: '', status: 'all', employeeId: 'all' };

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  ...(Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[]).map((value) => ({ value, label: ATTENDANCE_STATUS[value].label })),
];

export function compareRecordsDesc(a: AttendanceRecord, b: AttendanceRecord): number {
  return b.date.localeCompare(a.date) || (b.checkInAt ?? '').localeCompare(a.checkInAt ?? '');
}

export function filterAttendance(records: AttendanceRecord[], filters: AttendanceFilters): AttendanceRecord[] {
  return records.filter(
    (r) =>
      (!filters.date || r.date === filters.date) &&
      (filters.status === 'all' || r.status === filters.status) &&
      (filters.employeeId === 'all' || r.employeeId === filters.employeeId)
  );
}

interface CsvFormatters {
  date: (value?: string) => string;
  time: (value?: string) => string;
}

export function buildAttendanceCsv(records: AttendanceRecord[], employeesById: Map<string, Employee>, fmt: CsvFormatters): string {
  const header = ['Date', 'Employee ID', 'Employee', 'Check in', 'Check out', 'Hours', 'Status', 'Notes'];
  const rows = records.map((r) => {
    const employee = employeesById.get(r.employeeId);
    return [
      fmt.date(r.date),
      employee?.employeeId ?? '',
      employee?.name ?? 'Former member',
      r.checkInAt ? fmt.time(r.checkInAt) : '',
      r.checkOutAt ? fmt.time(r.checkOutAt) : '',
      r.workingHours !== undefined ? r.workingHours.toFixed(2) : '',
      ATTENDANCE_STATUS[r.status].label,
      r.notes ?? '',
    ];
  });
  return toCsv([header, ...rows]);
}

export interface MonthlySummaryRow {
  employeeId: string;
  present: number;
  late: number;
  halfDay: number;
  leave: number;
  hours: number;
}

export function summarizeMonth(records: AttendanceRecord[], ref: Date = new Date()): Map<string, MonthlySummaryRow> {
  const summary = new Map<string, MonthlySummaryRow>();
  records.forEach((r) => {
    if (!isSameMonth(r.date, ref)) return;
    let row = summary.get(r.employeeId);
    if (!row) {
      row = { employeeId: r.employeeId, present: 0, late: 0, halfDay: 0, leave: 0, hours: 0 };
      summary.set(r.employeeId, row);
    }
    if (r.status === 'present') row.present += 1;
    else if (r.status === 'late') row.late += 1;
    else if (r.status === 'half_day') row.halfDay += 1;
    else if (r.status === 'leave') row.leave += 1;
    row.hours += r.workingHours ?? 0;
  });
  return summary;
}
