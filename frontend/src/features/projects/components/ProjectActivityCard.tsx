import { History } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { useEmployeesById } from '@/store';
import type { Task } from '@/types';
import { useProjectActivity } from '../hooks/useProjectDetails';
import { ActivityList } from './ActivityList';

interface ProjectActivityCardProps {
  projectId: string;
  tasks: Task[];
}

export function ProjectActivityCard({ projectId, tasks }: ProjectActivityCardProps) {
  const items = useProjectActivity(projectId, tasks);
  const employeesById = useEmployeesById();
  return (
    <Card as="section">
      <CardHeader icon={History} title="Activity" description="Latest changes to this project and its tasks" />
      {items.length === 0 ? (
        <EmptyState compact icon={History} title="No activity yet" description="Updates to the project and its tasks will show up here." />
      ) : (
        <ActivityList items={items} employeesById={employeesById} />
      )}
    </Card>
  );
}
