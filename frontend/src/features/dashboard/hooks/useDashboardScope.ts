import { useMemo } from 'react';
import { useCurrentUser, usePermission, useProjects, useTasks } from '@/store';
import type { Project, Task } from '@/types';

export interface DashboardScope {
  seesAllProjects: boolean;
  seesAllTasks: boolean;
  projects: Project[];
  tasks: Task[];
  myTasks: Task[];
}

export function useDashboardScope(): DashboardScope {
  const me = useCurrentUser();
  const allProjects = useProjects();
  const allTasks = useTasks();
  const seesAllProjects = usePermission('projects.manage');
  const seesAllTasks = usePermission('tasks.manage');

  const projects = useMemo(
    () => (seesAllProjects ? allProjects : allProjects.filter((p) => p.members.includes(me.id) || p.managerId === me.id)),
    [allProjects, seesAllProjects, me.id]
  );
  const myTasks = useMemo(() => allTasks.filter((t) => t.assigneeId === me.id), [allTasks, me.id]);
  const tasks = seesAllTasks ? allTasks : myTasks;

  return { seesAllProjects, seesAllTasks, projects, tasks, myTasks };
}
