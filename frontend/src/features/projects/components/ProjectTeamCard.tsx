import { useMemo } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Avatar, Button, Card, CardHeader, EmptyState, RoleBadge } from '@/components/ui';
import { useEmployeesById } from '@/store';
import type { Project } from '@/types';
import { resolveMembers } from '../utils';
import styles from './ProjectTeamCard.module.css';

interface ProjectTeamCardProps {
  project: Project;
  canManage: boolean;
  onManage: () => void;
}

export function ProjectTeamCard({ project, canManage, onManage }: ProjectTeamCardProps) {
  const employeesById = useEmployeesById();
  const members = useMemo(
    () => resolveMembers(project.members, employeesById).sort((a, b) => a.name.localeCompare(b.name)),
    [project.members, employeesById]
  );

  const manageButton = canManage && (
    <Button variant="secondary" size="sm" icon={UserPlus} onClick={onManage}>
      Manage members
    </Button>
  );

  return (
    <Card as="section">
      <CardHeader icon={Users} title="Team" description={`${members.length} ${members.length === 1 ? 'member' : 'members'}`} actions={members.length > 0 && manageButton} />
      {members.length === 0 ? (
        <EmptyState compact icon={Users} title="No team members" description="Add people to this project so they can be assigned tasks." action={manageButton} />
      ) : (
        <ul className={styles.list}>
          {members.map((m) => (
            <li key={m.id} className={styles.member}>
              <Avatar name={m.name} src={m.avatar} size={34} />
              <div className={styles.text}>
                <span className={styles.name}>
                  {m.name}
                  {m.id === project.managerId && <span className={styles.lead}>Lead</span>}
                </span>
                <span className={styles.meta}>{m.designation || m.department || m.email}</span>
              </div>
              <RoleBadge role={m.role} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
