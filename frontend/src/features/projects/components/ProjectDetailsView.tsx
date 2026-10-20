'use client';

import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Columns3, FolderSearch, LayoutGrid, ListTodo } from 'lucide-react';
import { ButtonLink, Card, EmptyState, SegmentedControl, Spinner, type SegmentOption } from '@/components/ui';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useToast } from '@/components/feedback/ToastProvider';
import { ROUTES } from '@/constants/navigation';
import { pluralize } from '@/lib/format';
import { deleteProject, useAppStore, useHydrated, usePermission } from '@/store';
import { TaskDetailModal } from '@/features/tasks/components/TaskDetailModal';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { useProject, useProjectTasks } from '../hooks/useProjectDetails';
import { ProjectActivityCard } from './ProjectActivityCard';
import { ProjectDeadlineCard } from './ProjectDeadlineCard';
import { ProjectDetailsHeader } from './ProjectDetailsHeader';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectInfoCard } from './ProjectInfoCard';
import { ProjectKanbanTab } from './ProjectKanbanTab';
import { ProjectProgressCard } from './ProjectProgressCard';
import { ProjectTasksCard } from './ProjectTasksCard';
import { ProjectTeamCard } from './ProjectTeamCard';
import { ProjectTodoList } from './ProjectTodoList';
import { startSlideTransition } from '@/components/animate-ui/primitives/effects/theme-toggler';
import { cn } from '@/lib/cn';
import styles from './ProjectDetailsView.module.css';

type EditMode = 'closed' | 'details' | 'members';
type ProjectTab = 'todo' | 'board' | 'overview';

export function ProjectDetailsView({ projectId }: { projectId?: string }) {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Spinner size={28} label="Loading project details" />
        </div>
      }
    >
      <ProjectDetailsContent projectId={projectId} />
    </Suspense>
  );
}

function ProjectDetailsContent({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const hydrated = useHydrated();

  const paramId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const resolvedProjectId = projectId && projectId !== 'undefined' ? projectId : (paramId ? decodeURIComponent(paramId) : '');

  const canManageProjects = usePermission('projects.manage');
  const canManageTasks = usePermission('tasks.manage');
  const project = useProject(resolvedProjectId);
  const tasks = useProjectTasks(resolvedProjectId);

  const initialTab = searchParams.get('tab') as ProjectTab | null;
  const [activeTab, setActiveTab] = useState<ProjectTab>(
    initialTab === 'board' || initialTab === 'overview' ? initialTab : 'todo'
  );
  const hasViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document;

  const [editMode, setEditMode] = useState<EditMode>('closed');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(searchParams.get('task') || null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(searchParams.get('new') === '1');
  const leavingRef = useRef(false);

  const editingTask = useAppStore((s) => (editingTaskId ? s.tasks.find((t) => t.id === editingTaskId) : undefined));

  const closeEditor = useCallback(() => setEditMode('closed'), []);

  const handleTabChange = useCallback(
    (nextTab: ProjectTab) => {
      if (nextTab === activeTab) return;

      startSlideTransition(
        () => {
          setActiveTab(nextTab);
        },
        { direction: 'ltr', duration: 650, easing: 'ease-in-out' }
      );

      const params = new URLSearchParams(window.location.search);
      if (nextTab === 'todo') {
        params.delete('tab');
      } else {
        params.set('tab', nextTab);
      }
      const query = params.toString();
      router.replace(`${window.location.pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [activeTab, router]
  );

  const openTask = useCallback(
    (id: string) => {
      setActiveTaskId(id);
      const params = new URLSearchParams(window.location.search);
      params.set('task', id);
      const query = params.toString();
      router.replace(`${window.location.pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [router]
  );

  const closeTask = useCallback(() => {
    setActiveTaskId(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has('task')) {
      params.delete('task');
      const query = params.toString();
      router.replace(`${window.location.pathname}${query ? `?${query}` : ''}`, { scroll: false });
    }
  }, [router]);

  const openCreateTask = useCallback(() => {
    setIsCreatingTask(true);
  }, []);

  const closeCreateTask = useCallback(() => {
    setIsCreatingTask(false);
  }, []);

  const startEditTask = useCallback((id: string) => {
    setEditingTaskId(id);
    setActiveTaskId(null);
  }, []);

  const finishEditTask = useCallback(() => {
    if (editingTaskId) setActiveTaskId(editingTaskId);
    setEditingTaskId(null);
  }, [editingTaskId]);

  const handleDelete = useCallback(async () => {
    if (!project) return;
    const confirmed = await confirm({
      title: 'Delete project?',
      message: `“${project.name}” and its ${pluralize(tasks.length, 'task')} will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete project',
      tone: 'danger',
    });
    if (!confirmed) return;
    leavingRef.current = true;
    const result = await deleteProject(project.id);
    if (!result.ok) {
      leavingRef.current = false;
      toast.error(result.error);
      return;
    }
    toast.success('Project deleted');
    router.push(ROUTES.projects);
  }, [project, tasks.length, confirm, toast, router]);

  const openTasksCount = useMemo(() => tasks.filter((t) => t.status !== 'done').length, [tasks]);

  const tabOptions = useMemo<SegmentOption<ProjectTab>[]>(
    () => [
      { value: 'todo', label: 'Things To Do', icon: ListTodo, count: openTasksCount },
      { value: 'board', label: 'Kanban Board', icon: Columns3, count: tasks.length },
      { value: 'overview', label: 'Overview', icon: LayoutGrid },
    ],
    [openTasksCount, tasks.length]
  );

  if (!hydrated) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '320px' }}>
        <Spinner size={32} label="Loading project details" />
      </div>
    );
  }

  if (!project) {
    if (leavingRef.current) return null;
    return (
      <div className="page-container">
        <Card>
          <EmptyState
            icon={FolderSearch}
            title="Project not found"
            description="This project may have been deleted, or the link is incorrect."
            action={
              <ButtonLink href={ROUTES.projects} variant="secondary" icon={ArrowLeft}>
                Back to projects
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <ProjectDetailsHeader
        project={project}
        canManage={canManageProjects}
        onEdit={() => setEditMode('details')}
        onDelete={handleDelete}
      />

      {/* View switcher tabs: Things To Do | Kanban Board | Overview */}
      <div className={styles.tabBar}>
        <SegmentedControl
          label="Project view"
          options={tabOptions}
          value={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <div key={activeTab} className={cn(styles.tabContent, !hasViewTransition && styles.tabFallback)}>
        {/* Tab: Things To Do (Organized by Due Date Timeline) */}
        {activeTab === 'todo' && (
          <div className={styles.todoLayout}>
            <div className={styles.todoMain}>
              <ProjectTodoList
                projectId={project.id}
                tasks={tasks}
                canManage={canManageTasks}
                onOpenTask={openTask}
                onEditTask={startEditTask}
                onCreateTask={openCreateTask}
              />
            </div>
            <aside className={styles.todoSide}>
              <ProjectProgressCard projectId={project.id} tasks={tasks} />
              <ProjectDeadlineCard project={project} />
              <ProjectTeamCard project={project} canManage={canManageProjects} onManage={() => setEditMode('members')} />
            </aside>
          </div>
        )}

        {/* Tab: Kanban Board */}
        {activeTab === 'board' && (
          <div className={styles.boardLayout}>
            <ProjectKanbanTab
              tasks={tasks}
              canManage={canManageTasks}
              onOpenTask={openTask}
              onCreateTask={openCreateTask}
            />
          </div>
        )}

        {/* Tab: Project Overview */}
        {activeTab === 'overview' && (
          <div className={styles.layout}>
            <div className={styles.main}>
              <ProjectInfoCard project={project} />
              <ProjectProgressCard projectId={project.id} tasks={tasks} />
              <ProjectTasksCard
                projectId={project.id}
                tasks={tasks}
                onSwitchToTodo={() => handleTabChange('todo')}
                onOpenTask={openTask}
                onCreateTask={openCreateTask}
              />
            </div>
            <aside className={styles.side}>
              <ProjectDeadlineCard project={project} />
              <ProjectTeamCard project={project} canManage={canManageProjects} onManage={() => setEditMode('members')} />
              <ProjectActivityCard projectId={project.id} tasks={tasks} />
            </aside>
          </div>
        )}
      </div>

      {/* Modals for Task and Project management */}
      <TaskDetailModal taskId={activeTaskId} onClose={closeTask} onEdit={startEditTask} />

      {canManageTasks && (
        <TaskFormModal
          isOpen={isCreatingTask}
          defaultProjectId={project.id}
          onClose={closeCreateTask}
          onSaved={() => closeCreateTask()}
        />
      )}

      {canManageTasks && (
        <TaskFormModal
          isOpen={Boolean(editingTask)}
          task={editingTask}
          defaultProjectId={project.id}
          onClose={finishEditTask}
          onSaved={finishEditTask}
        />
      )}

      {canManageProjects && (
        <ProjectFormModal
          isOpen={editMode !== 'closed'}
          onClose={closeEditor}
          project={project}
          focusMembers={editMode === 'members'}
        />
      )}
    </div>
  );
}
