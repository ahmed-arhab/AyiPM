import { useMemo } from 'react';
import { CalendarRange } from 'lucide-react';
import { useEmployees } from '@/store';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { monthLabel } from '@/lib/date';
import type { AttendanceRecord, Employee } from '@/types';
import { summarizeMonth, type MonthlySummaryRow } from '../utils';
import { MonthlySummaryCard } from './MonthlySummaryCard';
import styles from './MonthlySummary.module.css';

interface MonthlySummaryProps {
  records: AttendanceRecord[];
  scopeToId?: string;
}

export function MonthlySummary({ records, scopeToId }: MonthlySummaryProps) {
  const employees = useEmployees();

  const rows = useMemo(() => {
    const summary = summarizeMonth(records);
    const people = employees.filter((e) =>
      scopeToId ? e.id === scopeToId : e.status === 'active' || summary.has(e.id)
    );
    return people
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((employee): { employee: Employee; row: MonthlySummaryRow } => ({
        employee,
        row: summary.get(employee.id) ?? { employeeId: employee.id, present: 0, late: 0, halfDay: 0, leave: 0, hours: 0 },
      }));
  }, [records, employees, scopeToId]);

  const hasData = rows.some(({ row }) => row.present + row.late + row.halfDay + row.leave > 0);

  return (
    <Card>
      <CardHeader icon={CalendarRange} title={monthLabel()} description="Days present, late, half days and leave this month, with total hours logged." />
      {hasData ? (
        <div className={styles.grid}>
          {rows.map(({ employee, row }) => (
            <MonthlySummaryCard key={employee.id} employee={employee} row={row} />
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon={CalendarRange}
          title="Nothing logged this month yet"
          description="Check-ins and approved leave for this month will be summarised here."
        />
      )}
    </Card>
  );
}
