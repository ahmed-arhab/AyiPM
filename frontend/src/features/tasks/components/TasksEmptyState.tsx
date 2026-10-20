import { CheckSquare, FolderPlus, Plus } from 'lucide-react';
import { Button, ButtonLink, EmptyState } from '@/components/ui';
import { useT } from '@/translations';
import { ROUTES } from '@/constants/navigation';

interface TasksEmptyStateProps {
  hasProjects: boolean;
  canCreateTask: boolean;
  canCreateProject: boolean;
  onCreateTask: () => void;
}

export function TasksEmptyState({ hasProjects, canCreateTask, canCreateProject, onCreateTask }: TasksEmptyStateProps) {
  const { t } = useT();

  if (!hasProjects) {
    return (
      <div className="card">
        <EmptyState
          icon={FolderPlus}
          title="Create a project first"
          description={
            canCreateProject
              ? 'Every task belongs to a project. Set up your first project, then come back to plan its work.'
              : 'Every task belongs to a project. Ask a project manager to set one up and add you to it.'
          }
          action={
            canCreateProject && (
              <ButtonLink href={ROUTES.projects} icon={FolderPlus}>
                {t('Go to projects')}
              </ButtonLink>
            )
          }
        />
      </div>
    );
  }
  return (
    <div className="card">
      <EmptyState
        icon={CheckSquare}
        title="No tasks yet"
        description={
          canCreateTask
            ? 'Break your projects into tasks, assign owners and track them across the board.'
            : 'Tasks assigned to you will show up here once a project manager creates them.'
        }
        action={
          canCreateTask && (
            <Button icon={Plus} onClick={onCreateTask}>
              {t('Create the first task')}
            </Button>
          )
        }
      />
    </div>
  );
}
