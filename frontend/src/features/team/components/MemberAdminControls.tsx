import { useId } from 'react';
import { FolderKanban, KeyRound, Pencil, Send, UserCheck, UserX } from 'lucide-react';
import { useIsPendingInvite, usePermission } from '@/store';
import { Button, Select } from '@/components/ui';
import { ROLE_OPTIONS } from '@/constants/roles';
import type { Employee, UserRole } from '@/types';
import { useMemberActions } from '../hooks/useMemberActions';
import type { ProfileAdminHandlers } from './ProfileOverviewTab';
import styles from './MemberAdminControls.module.css';

interface MemberAdminControlsProps extends ProfileAdminHandlers {
  member: Employee;
  isSelf: boolean;
}

export function MemberAdminControls({ member, isSelf, onEdit, onAssign, onResetPassword }: MemberAdminControlsProps) {
  const roleId = useId();
  const canManage = usePermission('employees.manage');
  const { toggleStatus, changeRole } = useMemberActions();
  const active = member.status === 'active';
  const pending = useIsPendingInvite(member.id);

  return (
    <section className={styles.panel} aria-label="Member administration">
      <h3 className={styles.title}>Manage member</h3>
      {canManage && !isSelf && (
        <div className={styles.roleRow}>
          <label htmlFor={roleId} className={styles.label}>
            Role
          </label>
          <Select<UserRole> id={roleId} options={ROLE_OPTIONS} value={member.role} onChange={(role) => changeRole(member, role)} />
        </div>
      )}
      <div className={styles.actions}>
        {canManage && onEdit && (
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit(member)}>
            Edit profile
          </Button>
        )}
        {onAssign && (
          <Button variant="secondary" size="sm" icon={FolderKanban} onClick={() => onAssign(member)}>
            Manage projects
          </Button>
        )}
        {canManage && onResetPassword && active && !isSelf && (
          <Button variant="secondary" size="sm" icon={pending ? Send : KeyRound} onClick={() => onResetPassword(member)}>
            {pending ? 'Resend invite' : 'Send reset link'}
          </Button>
        )}
        {canManage && !isSelf && (
          <Button
            variant={active ? 'ghost' : 'success'}
            size="sm"
            icon={active ? UserX : UserCheck}
            className={active ? styles.danger : undefined}
            onClick={() => toggleStatus(member)}
          >
            {active ? 'Deactivate' : 'Reactivate'}
          </Button>
        )}
      </div>
    </section>
  );
}
