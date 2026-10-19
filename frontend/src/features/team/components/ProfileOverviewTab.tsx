import { useMemo } from 'react';
import { Briefcase, Calendar, IdCard, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import { usePermission, useFormatters } from '@/store';
import { ROLE_LABELS } from '@/constants/roles';
import type { Employee, Project, Task } from '@/types';
import { ROLE_DESCRIPTIONS } from '../utils';
import { MemberAdminControls } from './MemberAdminControls';
import styles from './ProfileOverviewTab.module.css';

export interface ProfileAdminHandlers {
  onEdit?: (member: Employee) => void;
  onAssign?: (member: Employee) => void;
  onResetPassword?: (member: Employee) => void;
}

interface ProfileOverviewTabProps extends ProfileAdminHandlers {
  member: Employee;
  isSelf: boolean;
  projects: Project[];
  tasks: Task[];
}

export function ProfileOverviewTab({ member, isSelf, projects, tasks, ...handlers }: ProfileOverviewTabProps) {
  const { date } = useFormatters();
  const canManage = usePermission('employees.manage');
  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);

  const details: { icon: LucideIcon; label: string; value: string; href?: string }[] = [
    { icon: Mail, label: 'Work email', value: member.email, href: `mailto:${member.email}` },
    { icon: Phone, label: 'Phone', value: member.phone || 'Not provided', href: member.phone ? `tel:${member.phone}` : undefined },
    { icon: MapPin, label: 'Location', value: member.location || 'Not provided' },
    { icon: Calendar, label: 'Joined', value: date(member.joinDate) },
    { icon: IdCard, label: 'Employee ID', value: member.employeeId },
    { icon: Briefcase, label: 'Department', value: member.department },
  ];

  return (
    <div className={styles.overview}>
      <dl className={styles.details}>
        {details.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className={styles.detail}>
            <Icon size={16} className={styles.detailIcon} />
            <div className={styles.detailText}>
              <dt>{label}</dt>
              <dd>{href ? <a href={href} className="link">{value}</a> : value}</dd>
            </div>
          </div>
        ))}
      </dl>

      {member.bio && <p className={styles.bio}>{member.bio}</p>}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{projects.length}</strong>
          <span>Projects</span>
        </div>
        <div className={styles.stat}>
          <strong className={styles.success}>{doneCount}</strong>
          <span>Tasks completed</span>
        </div>
        <div className={styles.stat}>
          <strong className={styles.warning}>{tasks.length - doneCount}</strong>
          <span>Tasks in progress</span>
        </div>
      </div>

      <div className={styles.role}>
        <span className={styles.roleTitle}>{ROLE_LABELS[member.role]} access</span>
        <p>{ROLE_DESCRIPTIONS[member.role]}</p>
      </div>

      {(canManage || handlers.onAssign) && <MemberAdminControls member={member} isSelf={isSelf} {...handlers} />}
    </div>
  );
}
