import { memo, type ReactNode } from 'react';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Employee } from '@/types';
import styles from './MemberIdentity.module.css';

interface MemberIdentityProps {
  member: Pick<Employee, 'name' | 'avatar' | 'status'>;
  subtitle?: ReactNode;
  isSelf?: boolean;
  size?: number;
  large?: boolean;
}

export const MemberIdentity = memo(function MemberIdentity({ member, subtitle, isSelf, size = 40, large }: MemberIdentityProps) {
  const active = member.status === 'active';
  return (
    <span className={styles.identity}>
      <span className={styles.avatarWrap}>
        <Avatar name={member.name} src={member.avatar} size={size} />
        <span className={cn(styles.dot, active ? styles.dotActive : styles.dotInactive)} title={active ? 'Active' : 'Inactive'} />
      </span>
      <span className={styles.text}>
        <span className={cn(styles.name, large && styles.large)}>
          <span className={styles.nameText}>{member.name}</span>
          {isSelf && <span className={styles.self}>You</span>}
        </span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
    </span>
  );
});
