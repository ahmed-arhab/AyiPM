import { selectWorkspaceToday, useAppStore } from '@/store';
import type { AttendanceRecord } from '@/types';

export function useTodayRecord(employeeId: string): AttendanceRecord | undefined {
  return useAppStore((s) => {
    const today = selectWorkspaceToday(s);
    return s.attendance.find((r) => r.employeeId === employeeId && r.date === today);
  });
}
