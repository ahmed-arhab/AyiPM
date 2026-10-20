import { useCallback, useMemo, useState } from 'react';
import { useAttendance, useCurrentUser, usePermission } from '@/store';
import { compareRecordsDesc, DEFAULT_ATTENDANCE_FILTERS, filterAttendance, type AttendanceFilters } from '../utils';

export function useAttendanceRecords() {
  const user = useCurrentUser();
  const canViewAll = usePermission('attendance.viewAll');
  const attendance = useAttendance();
  const [filters, setFilters] = useState<AttendanceFilters>(DEFAULT_ATTENDANCE_FILTERS);

  const visible = useMemo(
    () => (canViewAll ? attendance : attendance.filter((r) => r.employeeId === user.id)).slice().sort(compareRecordsDesc),
    [attendance, canViewAll, user.id]
  );

  const effectiveFilters = useMemo(
    () => (canViewAll ? filters : { ...filters, employeeId: 'all' }),
    [filters, canViewAll]
  );
  const filtered = useMemo(() => filterAttendance(visible, effectiveFilters), [visible, effectiveFilters]);

  const updateFilter = useCallback(<K extends keyof AttendanceFilters>(key: K, value: AttendanceFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);
  const resetFilters = useCallback(() => setFilters(DEFAULT_ATTENDANCE_FILTERS), []);

  const hasActiveFilters = filters.date !== '' || filters.status !== 'all' || (canViewAll && filters.employeeId !== 'all');

  return { canViewAll, visible, filtered, filters, updateFilter, resetFilters, hasActiveFilters };
}
