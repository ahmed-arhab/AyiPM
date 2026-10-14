'use client';

import { Suspense, useCallback, useState } from 'react';
import { CheckSquare, Columns3, Download, List, Plus, SearchX } from 'lucide-react';
import { Button, EmptyState, PageHeader, SegmentedControl, Spinner, type SegmentOption } from '@/components/ui';
import { toDateKey } from '@/lib/date';
import { downloadFile } from '@/lib/csv';
import { pluralize } from '@/lib/format';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAppStore, useEmployeesById, useFormatters, usePermission, useProjectsById } from '@/store';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { useTaskUrlGuards } from '../hooks/useTaskUrlGuards';
import { useTaskUrlState } from '../hooks/useTaskUrlState';
import { buildTasksCsv, type TaskView } from '../utils';
import { KanbanBoard } from './KanbanBoard';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFiltersBar } from './TaskFiltersBar';
import { TaskFormModal } from './TaskFormModal';
import { TaskList } from './TaskList';
import { TasksEmptyState } from './TasksEmptyState';
import styles from './TasksView.module.css';

const VIEW_OPTIONS: SegmentOption<TaskView>[] = [
  { value: 'board', label: 'Board', icon: Columns3 },
  { value: 'list', label: 'List', icon: List },
];

export function TasksView() {
  return (
    <Suspense
      fallback={
        <div className={styles.loading}>
          <Spinner size={28} label="Loading tasks" />
        </div>
      }
    >
      <TasksPage />
    </Suspense>
  );
}

function TasksPage() {
  const url = useTaskUrlState();
  const { view, taskId, projectId, isCreating, setParams } = url;
  const canManage = usePermission('tasks.manage');
  const canManageProjects = usePermission('projects.manage');
  const hasProjects = useAppStore((s) => s.projects.length > 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTask = useAppStore((s) => (editingId ? s.tasks.find((t) => t.id === editingId) : undefined));
  const projectsById = useProjectsById();
  const employeesById = useEmployeesById();
  const { date } = useFormatters();
  const toast = useToast();

  useTaskUrlGuards(url, canManage && hasProjects);

  const setProject = useCallback((id: string) => setParams({ project: id || null }), [setParams]);
  const filters = useTaskFilters({ projectId, onProjectChange: setProject });

  const exportCsv = useCallback(() => {
    downloadFile(`tasks-${toDateKey()}.csv`, buildTasksCsv(filters.sortedTasks, projectsById, employeesById, date));
    toast.success(`Exported ${pluralize(filters.sortedTasks.length, 'task')}.`);
  }, [filters.sortedTasks, projectsById, employeesById, date, toast]);

  const openTask = useCallback((id: string) => setParams({ task: id }), [setParams]);
  const closeTask = useCallback(() => setParams({ task: null }), [setParams]);
  const openCreate = useCallback(() => setParams({ new: '1' }), [setParams]);
  const closeCreate = useCallback(() => setParams({ new: null }), [setParams]);
  const startEdit = useCallback(
    (id: string) => {
      setEditingId(id);
      setParams({ task: null });
    },
    [setParams]
  );
  const finishEdit = useCallback(() => {
    if (editingId) setParams({ task: editingId });
    setEditingId(null);
  }, [editingId, setParams]);

  const canCreate = canManage && hasProjects;

  return (
    <div className="page-container">
      <PageHeader
        icon={CheckSquare}
        title="Tasks"
        description="Plan, assign and track delivery across every project."
        actions={
          <>
            <SegmentedControl
              label="Task view"
              options={VIEW_OPTIONS}
              value={view}
              onChange={(v) => setParams({ view: v === 'list' ? 'list' : null })}
            />
            {filters.sortedTasks.length > 0 && (
              <Button variant="secondary" icon={Download} onClick={exportCsv}>
                Export CSV
              </Button>
            )}
            {canCreate && (
              <Button icon={Plus} onClick={openCreate}>
                New task
              </Button>
            )}
          </>
        }
      />

      {filters.totalCount === 0 ? (
        <TasksEmptyState
          hasProjects={hasProjects}
          canCreateTask={canCreate}
          canCreateProject={canManageProjects}
          onCreateTask={openCreate}
        />
      ) : (
        <>
          <TaskFiltersBar api={filters} view={view} />
          {view === 'board' ? (
            <KanbanBoard tasks={filters.filteredTasks} onOpenTask={openTask} />
          ) : filters.sortedTasks.length > 0 ? (
            <TaskList tasks={filters.sortedTasks} onOpenTask={openTask} resetKey={JSON.stringify(filters.filters)} />
          ) : (
            <div className="card">
              <EmptyState
                compact
                icon={SearchX}
                title="No tasks match your filters"
                description="Try a different search term or clear the filters to see every task."
                action={
                  <Button variant="outline" size="sm" onClick={filters.reset}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          )}
        </>
      )}

      <TaskDetailModal taskId={taskId} onClose={closeTask} onEdit={startEdit} />
      {canManage && <TaskFormModal isOpen={isCreating && hasProjects} defaultProjectId={projectId} onClose={closeCreate} />}
      {canManage && <TaskFormModal isOpen={Boolean(editingTask)} task={editingTask} onClose={finishEdit} onSaved={finishEdit} />}
    </div>
  );
}
