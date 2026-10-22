import { useMemo } from 'react';
import { ArrowUpDown, LayoutGrid, List, RotateCcw } from 'lucide-react';
import { Button, Card, SearchInput, SegmentedControl, Select, type SelectOption } from '@/components/ui';
import { ROLE_OPTIONS } from '@/constants/roles';
import { useT } from '@/translations';
import type { EmployeeStatus, Project, UserRole } from '@/types';
import { SORT_OPTIONS, type ProjectFilter, type TeamFilters, type TeamSort, type TeamViewMode } from '../utils';
import styles from './TeamToolbar.module.css';

interface TeamToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  filters: TeamFilters;
  onFilterChange: <K extends keyof TeamFilters>(key: K, value: TeamFilters[K]) => void;
  departments: string[];
  projects: Project[];
  viewMode: TeamViewMode;
  onViewModeChange: (mode: TeamViewMode) => void;
  resultCount: number;
  total: number;
  hasActiveFilters: boolean;
  onReset: () => void;
}

export function TeamToolbar({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  departments,
  projects,
  viewMode,
  onViewModeChange,
  resultCount,
  total,
  hasActiveFilters,
  onReset,
}: TeamToolbarProps) {
  const { t, formatNumber } = useT();

  const roleFilterOptions = useMemo<SelectOption<'all' | UserRole>[]>(
    () => [{ value: 'all', label: t('All roles') }, ...ROLE_OPTIONS.map((r) => ({ value: r.value, label: t(r.label) }))],
    [t]
  );

  const statusFilterOptions = useMemo<SelectOption<'all' | EmployeeStatus>[]>(
    () => [
      { value: 'all', label: t('All statuses') },
      { value: 'active', label: t('Active') },
      { value: 'inactive', label: t('Inactive') },
    ],
    [t]
  );

  const viewOptions = useMemo(
    () => [
      { value: 'grid' as const, label: t('Grid'), icon: LayoutGrid },
      { value: 'table' as const, label: t('Table'), icon: List },
    ],
    [t]
  );

  const sortOptions = useMemo(() => SORT_OPTIONS.map((s) => ({ value: s.value, label: t(s.label) })), [t]);

  const departmentOptions = useMemo<SelectOption[]>(
    () => [{ value: 'all', label: t('All departments') }, ...departments.map((d) => ({ value: d, label: d }))],
    [departments, t]
  );

  const projectOptions = useMemo<SelectOption<ProjectFilter>[]>(
    () => [
      { value: 'all', label: t('All projects') },
      { value: 'unassigned', label: t('Unassigned') },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects, t]
  );

  // The count goes where each language puts it, in bold, so it can't be part of the translated string.
  const [summaryBefore, summaryAfter = ''] = t('Showing {count} of {total} members', { total: formatNumber(total) }).split('{count}');

  return (
    <Card padding="sm" className={styles.toolbar}>
      <div className={styles.row}>
        <SearchInput
          className={styles.search}
          value={query}
          onChange={onQueryChange}
          placeholder={t('Search name, email, Employee ID, designation, department, location…')}
          aria-label={t('Search team members')}
        />
        <SegmentedControl label={t('Layout')} size="sm" options={viewOptions} value={viewMode} onChange={onViewModeChange} />
      </div>
      <div className="toolbar">
        <Select
          aria-label={t('Department')}
          options={departmentOptions}
          value={filters.department}
          onChange={(v) => onFilterChange('department', v)}
        />
        <Select aria-label={t('Role')} options={roleFilterOptions} value={filters.role} onChange={(v) => onFilterChange('role', v)} />
        <Select
          aria-label={t('Status')}
          options={statusFilterOptions}
          value={filters.status}
          onChange={(v) => onFilterChange('status', v)}
        />
        <Select aria-label={t('Project')} options={projectOptions} value={filters.project} onChange={(v) => onFilterChange('project', v)} />
        <span className={styles.sort}>
          <ArrowUpDown size={14} aria-hidden />
          <Select<TeamSort>
            aria-label={t('Sort by')}
            options={sortOptions}
            value={filters.sort}
            onChange={(v) => onFilterChange('sort', v)}
          />
        </span>
      </div>
      <div className={styles.summary}>
        <span>
          {summaryBefore}
          <strong>{formatNumber(resultCount)}</strong>
          {summaryAfter}
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset}>
            {t('Reset filters')}
          </Button>
        )}
      </div>
    </Card>
  );
}
