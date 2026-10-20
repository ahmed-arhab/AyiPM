import type { Employee, Project } from '@/types';
import { MemberCard, type MemberRowHandlers } from './MemberCard';
import styles from './MemberGrid.module.css';

interface MemberGridProps extends MemberRowHandlers {
  members: Employee[];
  currentUserId: string;
  projectsByMember: Map<string, Project[]>;
  openTaskCounts: Map<string, number>;
}

export function MemberGrid({ members, currentUserId, projectsByMember, openTaskCounts, ...handlers }: MemberGridProps) {
  return (
    <div className={styles.grid}>
      {members.map((m) => (
        <MemberCard
          key={m.id}
          member={m}
          isSelf={m.id === currentUserId}
          projectCount={projectsByMember.get(m.id)?.length ?? 0}
          openTasks={openTaskCounts.get(m.id) ?? 0}
          {...handlers}
        />
      ))}
    </div>
  );
}
