import { useMemo } from 'react';
import { CalendarCheck } from 'lucide-react';
import { useAttendance, useFormatters } from '@/store';
import { DataTable, EmptyState, StatusBadge, type Column } from '@/components/ui';
import { formatHours } from '@/lib/date';
import type { AttendanceRecord } from '@/types';

const RECENT_LIMIT = 10;

export function ProfileAttendanceTab({ memberId }: { memberId: string }) {
  const attendance = useAttendance();
  const { date, time } = useFormatters();

  const recent = useMemo(
    () =>
      attendance
        .filter((r) => r.employeeId === memberId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, RECENT_LIMIT),
    [attendance, memberId]
  );

  const columns = useMemo<Column<AttendanceRecord>[]>(
    () => [
      { key: 'date', header: 'Date', render: (r) => date(r.date) },
      { key: 'in', header: 'In', render: (r) => time(r.checkInAt) },
      { key: 'out', header: 'Out', render: (r) => time(r.checkOutAt) },
      { key: 'hours', header: 'Hours', render: (r) => formatHours(r.workingHours) },
      { key: 'status', header: 'Status', render: (r) => <StatusBadge kind="attendance" value={r.status} /> },
    ],
    [date, time]
  );

  return (
    <DataTable
      caption="Recent attendance"
      columns={columns}
      rows={recent}
      rowKey={(r) => r.id}
      minWidth={520}
      empty={<EmptyState compact icon={CalendarCheck} title="No attendance yet" description="Check-ins from the attendance page will appear here." />}
    />
  );
}
