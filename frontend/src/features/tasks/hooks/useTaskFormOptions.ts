import { useMemo } from 'react';
import { useAppStore, useEmployees, useProjects } from '@/store';
import { PROJECT_STATUS } from '@/constants/status';
import type { SelectOption } from '@/components/ui';

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

export function useProjectOptions(): SelectOption[] {
  const projects = useProjects();
  return useMemo(
    () =>
      [...projects].sort(byName).map((p) => ({
        value: p.id,
        label: p.status === 'completed' ? `${p.name} (${PROJECT_STATUS.completed.label})` : p.name,
      })),
    [projects]
  );
}

export function useAssigneeOptions(projectId: string, currentAssigneeId?: string): SelectOption[] {
  const employees = useEmployees();
  const members = useAppStore((s) => s.projects.find((p) => p.id === projectId)?.members);

  return useMemo(() => {
    const memberIds = new Set(members ?? []);
    const eligible = employees.filter((e) => e.status === 'active' || e.id === currentAssigneeId).sort(byName);
    const toOption = (e: (typeof eligible)[number]): SelectOption => ({
      value: e.id,
      label: `${e.name}${e.designation ? ` · ${e.designation}` : ''}${e.status === 'inactive' ? ' (inactive)' : ''}`,
    });
    const team = eligible.filter((e) => memberIds.has(e.id)).map(toOption);
    const others = eligible.filter((e) => !memberIds.has(e.id)).map(toOption);
    const options: SelectOption[] = [{ value: '', label: 'Unassigned' }];
    if (team.length && others.length) {
      options.push({ value: '__team', label: '── Project team ──', disabled: true }, ...team);
      options.push({ value: '__others', label: '── Other employees ──', disabled: true }, ...others);
    } else {
      options.push(...team, ...others);
    }
    return options;
  }, [employees, members, currentAssigneeId]);
}
