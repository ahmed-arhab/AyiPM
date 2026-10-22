import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadAttendanceSince, useAttendance, useAttendanceSince, useCurrentUser, usePermission } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { startOfMonthKey } from '@/lib/date';
import { compareRecordsDesc, DEFAULT_ATTENDANCE_FILTERS, filterAttendance, type AttendanceFilters } from '../utils';

export function useAttendanceRecords() {
  const user = useCurrentUser();
  const canViewAll = usePermission('attendance.viewAll');
  const attendance = useAttendance();
  const since = useAttendanceSince();
  const toast = useToast();
  const [filters, setFilters] = useState<AttendanceFilters>(DEFAULT_ATTENDANCE_FILTERS);
  const [loadingEarlier, setLoadingEarlier] = useState(false);

  // Only recent months are loaded, so a date before them loads from the start of its month. Debounced, so the years a
  // date input passes through while someone types one (0002, 0020, ...) don't each load.
  const dateFilter = useDebouncedValue(filters.date, 400);
  useEffect(() => {
    if (!dateFilter || !since || dateFilter >= since) return;
    void loadAttendanceSince(startOfMonthKey(dateFilter)).then((result) => {
      if (!result.ok) toast.error(result.error);
    });
  }, [dateFilter, since, toast]);

  const loadEarlier = useCallback(async () => {
    if (!since) return;
    setLoadingEarlier(true);
    const result = await loadAttendanceSince(startOfMonthKey(since, -1));
    setLoadingEarlier(false);
    if (!result.ok) toast.error(result.error);
  }, [since, toast]);

  const visible = useMemo(
    () => (canViewAll ? attendance : attendance.filter((r) => r.employeeId === user.id)).slice().sort(compareRecordsDesc),
    [attendance, canViewAll, user.id]
  );

  const effectiveFilters = useMemo(() => (canViewAll ? filters : { ...filters, employeeId: 'all' }), [filters, canViewAll]);
  const filtered = useMemo(() => filterAttendance(visible, effectiveFilters), [visible, effectiveFilters]);

  const updateFilter = useCallback(<K extends keyof AttendanceFilters>(key: K, value: AttendanceFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);
  const resetFilters = useCallback(() => setFilters(DEFAULT_ATTENDANCE_FILTERS), []);

  const hasActiveFilters = filters.date !== '' || filters.status !== 'all' || (canViewAll && filters.employeeId !== 'all');

  return { canViewAll, visible, filtered, filters, updateFilter, resetFilters, hasActiveFilters, since, loadEarlier, loadingEarlier };
}
