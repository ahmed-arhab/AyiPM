'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  HelpCircle,
  ListTodo,
  Plus,
  Search,
  SearchX,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button, EmptyState, Input, Select, type SelectOption } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { TASK_PRIORITY, TASK_PRIORITY_ORDER } from '@/constants/status';
import { cn } from '@/lib/cn';
import { daysUntil, isOverdue } from '@/lib/date';
import { matchesQuery } from '@/lib/format';
import { updateTask, useEmployeesById, useFormatters } from '@/store';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { groupTasksByDueTimeline, type DueTimelineGroup, type DueTimelineKey } from '../utils';
import { ProjectTodoItem } from './ProjectTodoItem';
import styles from './ProjectTodoList.module.css';

interface ProjectTodoListProps {
  projectId: string;
  tasks: Task[];
  canManage: boolean;
  onOpenTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onCreateTask: () => void;
}

const TIMELINE_ICONS: Record<DueTimelineKey, LucideIcon> = {
  overdue: AlertCircle,
  today: Clock,
  tomorrow: Calendar,
  this_week: CalendarDays,
  later: CalendarRange,
  no_due_date: HelpCircle,
  completed: CheckCircle2,
};

const PRIORITY_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: 'all', label: 'All priorities' },
  ...TASK_PRIORITY_ORDER.map((p) => ({ value: p, label: TASK_PRIORITY[p].label })),
];

export function ProjectTodoList({ tasks, canManage, onOpenTask, onEditTask, onCreateTask }: ProjectTodoListProps) {
  const toast = useToast();
  const employeesById = useEmployeesById();
  const { date } = useFormatters();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);

  // Assignee options for dropdown
  const assigneeOptions: SelectOption<string>[] = useMemo(() => {
    const ids = Array.from(new Set(tasks.map((t) => t.assigneeId).filter(Boolean))) as string[];
    return [
      { value: 'all', label: 'All assignees' },
      { value: 'unassigned', label: 'Unassigned' },
      ...ids.map((id) => {
        const emp = employeesById.get(id);
        return { value: id, label: emp ? emp.name : id };
      }),
    ];
  }, [tasks, employeesById]);

  // Overall quick statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const pending = total - completed;
    const overdue = tasks.filter((t) => t.status !== 'done' && Boolean(t.dueDate) && isOverdue(t.dueDate)).length;
    const today = tasks.filter((t) => {
      if (t.status === 'done' || !t.dueDate) return false;
      const days = Math.round((new Date(t.dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
      return days === 0;
    }).length;

    return { total, completed, pending, overdue, today };
  }, [tasks]);

  const tasksDueToday = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      return daysUntil(t.dueDate) === 0;
    });
  }, [tasks]);

  // Filter tasks based on search & selectors
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== (priorityFilter as TaskPriority)) return false;
      if (assigneeFilter === 'unassigned' && t.assigneeId) return false;
      if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned' && t.assigneeId !== assigneeFilter) return false;
      if (searchQuery.trim()) {
        const assigneeName = t.assigneeId ? employeesById.get(t.assigneeId)?.name : '';
        if (!matchesQuery(searchQuery, t.title, t.description, assigneeName)) return false;
      }
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter, searchQuery, employeesById]);

  // Group filtered tasks by due timeline
  const timelineGroups: DueTimelineGroup[] = useMemo(() => {
    return groupTasksByDueTimeline(filteredTasks);
  }, [filteredTasks]);

  const handleToggleTaskStatus = useCallback(
    async (task: Task) => {
      const nextStatus: TaskStatus = task.status === 'done' ? 'backlog' : 'done';
      const result = await updateTask(task.id, { status: nextStatus });
      if (result.ok) {
        if (nextStatus === 'done') {
          toast.success(`Completed "${task.title}"`);
        } else {
          toast.info(`Reopened "${task.title}"`);
        }
      } else {
        toast.error(result.error);
      }
    },
    [toast]
  );

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setAssigneeFilter('all');
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || priorityFilter !== 'all' || assigneeFilter !== 'all');

  if (tasks.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <EmptyState
          icon={ListTodo}
          title="No tasks in this project yet"
          description="Create your first to-do item to organize deliverables and track deadlines."
          action={
            canManage && (
              <Button icon={Plus} onClick={onCreateTask}>
                Add first task
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 2-Row Stats Grid matching user sketch:
          Row 1: TO DO | OVER DUE | DUE TODAY
          Row 2: DONE  | Due Today Task Callout (with arrow pointing to DUE TODAY) */}
      <div className={styles.statsGrid}>
        {/* Row 1, Col 1: TO DO */}
        <div className={styles.statTile}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>TO DO</span>
            <span className={styles.statValue}>{stats.pending}</span>
          </div>
          <div className={styles.statIcon}>
            <ListTodo size={18} />
          </div>
        </div>

        {/* Row 1, Col 2: OVER DUE */}
        <div className={styles.statTile}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>OVER DUE</span>
            <span className={styles.statValue + (stats.overdue > 0 ? ` ${styles.danger}` : '')}>{stats.overdue}</span>
          </div>
          <div className={styles.statIcon + (stats.overdue > 0 ? ` ${styles.danger}` : '')}>
            <AlertCircle size={18} />
          </div>
        </div>

        {/* Row 1, Col 3: DUE TODAY */}
        <div className={cn(styles.statTile, styles.dueTodayTile, stats.today > 0 && styles.hasItems)}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>DUE TODAY</span>
            <span className={styles.statValue + (stats.today > 0 ? ` ${styles.warning}` : '')}>{stats.today}</span>
          </div>
          <div className={styles.statIcon + (stats.today > 0 ? ` ${styles.warning}` : '')}>
            <Clock size={18} />
          </div>
        </div>

        {/* Row 2, Col 1: DONE */}
        <div className={styles.statTile}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>DONE</span>
            <span className={`${styles.statValue} ${styles.success}`}>
              {stats.completed} / {stats.total}
            </span>
          </div>
          <div className={`${styles.statIcon} ${styles.success}`}>
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Row 2, Col 2 & 3: Component for what task is due today with arrow pointing to DUE TODAY */}
        <div className={cn(styles.dueTodayBanner, tasksDueToday.length > 0 && styles.active)}>
          <div className={styles.dueTodayArrow} aria-hidden />

          <div className={styles.dueTodayBannerHead}>
            <div className={styles.dueTodayBannerTitle}>
              <Clock size={14} className={styles.warning} />
              <span>What&apos;s Due Today</span>
            </div>
            {tasksDueToday.length > 0 && (
              <span className={styles.dueTodayBannerCount}>
                {tasksDueToday.length} {tasksDueToday.length === 1 ? 'task' : 'tasks'}
              </span>
            )}
          </div>

          {tasksDueToday.length === 0 ? (
            <div className={styles.dueTodayEmpty}>
              <CheckCircle2 size={15} style={{ color: '#059669' }} />
              <span>No tasks due today — all clear!</span>
            </div>
          ) : (
            <div className={styles.dueTodayTaskList}>
              {tasksDueToday.map((task) => {
                const isDone = task.status === 'done';
                return (
                  <div
                    key={task.id}
                    className={styles.dueTodayTextItem}
                    onClick={() => onOpenTask(task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenTask(task.id);
                      }
                    }}
                    title={`Click to view: ${task.title}`}
                  >
                    <span className={cn(styles.dueTodayTaskName, isDone && styles.done)}>{task.title}</span>
                    <span className={styles.dueTodayDateLabel}>(Due: {date(task.dueDate)})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filtersLeft}>
          <div className={styles.searchInput}>
            <Input
              icon={Search}
              placeholder="Filter tasks by name or notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter tasks"
            />
          </div>

          <div className={styles.filterSelect}>
            <Select aria-label="Filter by priority" options={PRIORITY_FILTER_OPTIONS} value={priorityFilter} onChange={setPriorityFilter} />
          </div>

          {assigneeOptions.length > 2 && (
            <div className={styles.filterSelect}>
              <Select aria-label="Filter by assignee" options={assigneeOptions} value={assigneeFilter} onChange={setAssigneeFilter} />
            </div>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
              Reset
            </Button>
          )}
        </div>

        <div className={styles.filtersRight}>
          {canManage && (
            <Button icon={Plus} size="sm" onClick={onCreateTask}>
              Add task
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Groups */}
      {filteredTasks.length === 0 ? (
        <div className={styles.emptyCard}>
          <EmptyState
            compact
            icon={SearchX}
            title="No tasks match your filters"
            description="Try adjusting your search query or reset the priority and assignee filters."
            action={
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className={styles.groups}>
          {timelineGroups.map((group) => {
            if (group.tasks.length === 0) return null;

            const Icon = TIMELINE_ICONS[group.key];
            const isCompletedGroup = group.key === 'completed';

            if (isCompletedGroup) {
              return (
                <div key={group.key} className={styles.group}>
                  <div className={styles.groupHeader}>
                    <button
                      type="button"
                      className={styles.completedToggle}
                      onClick={() => setShowCompleted((prev) => !prev)}
                      aria-expanded={showCompleted}
                    >
                      {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className={`${styles.groupIcon} ${styles.success}`}>
                        <CheckCircle2 size={14} />
                      </span>
                      <span>Completed tasks ({group.tasks.length})</span>
                    </button>
                  </div>

                  {showCompleted && (
                    <div className={styles.itemsList}>
                      {group.tasks.map((task) => (
                        <ProjectTodoItem
                          key={task.id}
                          task={task}
                          assignee={task.assigneeId ? employeesById.get(task.assigneeId) : undefined}
                          formatDate={date}
                          onToggle={handleToggleTaskStatus}
                          onOpen={onOpenTask}
                          onEdit={onEditTask}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={group.key} className={styles.group}>
                <div className={styles.groupHeader}>
                  <div className={styles.groupTitleRow}>
                    <span className={`${styles.groupIcon} ${styles[group.tone]}`}>
                      <Icon size={14} />
                    </span>
                    <h3 className={styles.groupTitle}>{group.label}</h3>
                    <span className={`${styles.groupCount} ${group.tone === 'danger' ? styles.danger : ''}`}>{group.tasks.length}</span>
                  </div>
                  <span className={styles.groupDesc}>{group.description}</span>
                </div>

                <div className={styles.itemsList}>
                  {group.tasks.map((task) => (
                    <ProjectTodoItem
                      key={task.id}
                      task={task}
                      assignee={task.assigneeId ? employeesById.get(task.assigneeId) : undefined}
                      formatDate={date}
                      onToggle={handleToggleTaskStatus}
                      onOpen={onOpenTask}
                      onEdit={onEditTask}
                      canManage={canManage}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
