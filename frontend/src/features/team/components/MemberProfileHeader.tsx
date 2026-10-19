import { Copy } from 'lucide-react';
import { IconButton, RoleBadge } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import type { Employee } from '@/types';
import { MemberIdentity } from './MemberIdentity';
import { MemberStatusBadge } from './MemberStatusBadge';
import styles from './MemberProfileHeader.module.css';

export function MemberProfileHeader({ member, isSelf }: { member: Employee; isSelf: boolean }) {
  const toast = useToast();

  const copyEmployeeId = async () => {
    try {
      await navigator.clipboard.writeText(member.employeeId);
      toast.success('Employee ID copied.');
    } catch {
      toast.error('Could not access the clipboard. Copy the ID manually.');
    }
  };

  return (
    <div className={styles.hero}>
      <MemberIdentity member={member} isSelf={isSelf} size={64} large subtitle={`${member.designation} · ${member.department}`} />
      <div className={styles.badges}>
        <span className={styles.idGroup}>
          <span className={styles.badgeId}>{member.employeeId}</span>
          <IconButton icon={Copy} size={14} label={`Copy employee ID ${member.employeeId}`} className={styles.copyButton} onClick={copyEmployeeId} />
        </span>
        <RoleBadge role={member.role} />
        <MemberStatusBadge member={member} />
      </div>
    </div>
  );
}
