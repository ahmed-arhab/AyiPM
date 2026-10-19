import { FolderKanban, Shield, UserCheck, Users } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui';
import { useT } from '@/translations';
import { percent } from '@/lib/format';
import type { TeamStats as TeamStatsData } from '../utils';
import styles from './TeamStats.module.css';

export function TeamStats({ stats }: { stats: TeamStatsData }) {
  const { t, formatNumber } = useT();

  return (
    <StatGrid>
      <StatCard
        label="Total members"
        value={stats.total}
        icon={Users}
        hint={
          stats.inactive > 0
            ? `${formatNumber(stats.inactive)} ${stats.inactive === 1 ? t('inactive account') : t('inactive accounts')}`
            : t('Everyone is active')
        }
      />
      <StatCard
        label="Active"
        value={stats.active}
        icon={UserCheck}
        accent="var(--success)"
        hint={t('{percent}% of the workspace', { percent: formatNumber(percent(stats.active, stats.total)) })}
      />
      <StatCard
        label="Roles"
        icon={Shield}
        accent="var(--warning)"
        value={
          <span className={styles.roles}>
            <span className="badge badge-role-admin">
              {t(stats.admins === 1 ? '{count} Admin' : '{count} Admins', { count: formatNumber(stats.admins) })}
            </span>
            <span className="badge badge-role-pm">
              {t(stats.managers === 1 ? '{count} PM' : '{count} PMs', { count: formatNumber(stats.managers) })}
            </span>
            <span className="badge badge-role-employee">
              {t(stats.staff === 1 ? '{count} Employee' : '{count} Employees', { count: formatNumber(stats.staff) })}
            </span>
          </span>
        }
      />
      <StatCard
        label="Allocated to projects"
        value={`${formatNumber(stats.allocated)}/${formatNumber(stats.total)}`}
        icon={FolderKanban}
        accent="var(--accent-strong)"
        hint={t('{percent}% assigned to at least one project', {
          percent: formatNumber(percent(stats.allocated, stats.total)),
        })}
      />
    </StatGrid>
  );
}
