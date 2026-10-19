import { useAppStore } from '@/store';
import { toDateKey } from '@/lib/date';
import type { AttendanceRecord } from '@/types';

export function useTodayRecord(employeeId: string): AttendanceRecord | undefined {
  return useAppStore((s) => {
    const today = toDateKey();
    return s.attendance.find((r) => r.employeeId === employeeId && r.date === today);
  });
}
