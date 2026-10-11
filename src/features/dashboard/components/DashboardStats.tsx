import { useMemo } from 'react';
import { CheckSquare, Clock, FolderKanban, PlaneTakeoff } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui';
import { ATTENDANCE_STATUS } from '@/constants/status';
import { toDateKey } from '@/lib/date';
import { percent, pluralize } from '@/lib/format';
import {
  computeLeaveBalance,
  selectActiveEmployees,
  selectTodayAttendanceCount,
  useAppStore,
  useCurrentUser,
  useLeaveRequests,
  usePermission,
  useWorkspace,
} from '@/store';
import { useT } from '@/translations';
import { usePendingApprovals } from '../hooks/usePendingApprovals';
import type { DashboardScope } from '../hooks/useDashboardScope';
import { isOpenTask, isTaskOverdue } from '../utils';

function AttendanceStat() {
  const me = useCurrentUser();
  const t = useT();
  const seesAll = usePermission('attendance.viewAll');
  const present = useAppStore(selectTodayAttendanceCount);
  const active = useAppStore((s) => selectActiveEmployees(s.employees).length);
  const myStatus = useAppStore((s) => {
    const today = toDateKey();
    return s.attendance.find((a) => a.employeeId === me.id && a.date === today)?.status;
  });

  if (seesAll) {
    return (
      <StatCard
        label={t('Attendance today')}
        value={`${t.formatNumber(present)}/${t.formatNumber(active)}`}
        icon={Clock}
        accent="var(--success)"
        hint={active > 0 ? t('{percent}% of active members checked in', { percent: t.formatNumber(percent(present, active)) }) : t('No active members yet')}
      />
    );
  }
  return (
    <StatCard
      label={t('My attendance today')}
      value={myStatus ? t(ATTENDANCE_STATUS[myStatus].label) : t('Not checked in')}
      icon={Clock}
      accent="var(--success)"
      hint={myStatus ? t('Recorded for today') : t('Use Check In in the top bar to start your day')}
    />
  );
}

function PendingApprovalsStat() {
  const pending = usePendingApprovals();
  const t = useT();
  return (
    <StatCard
      label={t('Pending leave approvals')}
      value={t.formatNumber(pending.length)}
      icon={PlaneTakeoff}
      accent="var(--warning)"
      hint={pending.length > 0 ? t('Awaiting your review') : t('Nothing waiting on you')}
    />
  );
}

function LeaveBalanceStat() {
  const me = useCurrentUser();
  const t = useT();
  const requests = useLeaveRequests();
  const { leaveAllowance } = useWorkspace();
  const balance = useMemo(() => computeLeaveBalance(requests, me.id, leaveAllowance), [requests, me.id, leaveAllowance]);
  const remaining = (b: { total: number; used: number }) => Math.max(0, b.total - b.used);
  return (
    <StatCard
      label={t('Annual leave remaining')}
      value={`${t.formatNumber(remaining(balance.annual))} / ${t.formatNumber(balance.annual.total)}`}
      icon={PlaneTakeoff}
      accent="var(--accent-strong)"
      hint={t('{sick} sick · {casual} casual days left', { sick: t.formatNumber(remaining(balance.sick)), casual: t.formatNumber(remaining(balance.casual)) })}
    />
  );
}

export function DashboardStats({ scope }: { scope: DashboardScope }) {
  const t = useT();
  const canReview = usePermission('leave.review');
  const { projects, tasks, seesAllProjects, seesAllTasks } = scope;

  const projectStats = useMemo(() => {
    const active = projects.filter((p) => p.status !== 'completed').length;
    return { active, completed: projects.length - active };
  }, [projects]);

  const taskStats = useMemo(() => {
    const now = new Date();
    let open = 0;
    let overdue = 0;
    tasks.forEach((item) => {
      if (isOpenTask(item)) open += 1;
      if (isTaskOverdue(item, now)) overdue += 1;
    });
    return { open, overdue };
  }, [tasks]);

  return (
    <StatGrid>
      <StatCard
        label={t(seesAllProjects ? 'Active projects' : 'My active projects')}
        value={t.formatNumber(projectStats.active)}
        icon={FolderKanban}
        hint={
          projects.length > 0
            ? `${t.formatNumber(projectStats.completed)} ${t('completed')} · ${t.formatNumber(projects.length)} ${t('projects total')}`
            : t('No projects yet')
        }
      />
      <StatCard
        label={t(seesAllTasks ? 'Open tasks' : 'My open tasks')}
        value={t.formatNumber(taskStats.open)}
        icon={CheckSquare}
        accent="var(--accent-soft)"
        hint={
          taskStats.overdue > 0 ? (
            <span className="text-danger">{t('{overdue} overdue', { overdue: t.formatNumber(taskStats.overdue) })}</span>
          ) : (
            t('Nothing overdue')
          )
        }
      />
      <AttendanceStat />
      {canReview ? <PendingApprovalsStat /> : <LeaveBalanceStat />}
    </StatGrid>
  );
}
