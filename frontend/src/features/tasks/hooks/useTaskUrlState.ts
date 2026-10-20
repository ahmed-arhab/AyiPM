import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { TaskView } from '../utils';

type ParamPatch = Partial<Record<'view' | 'task' | 'project' | 'new', string | null>>;

export function useTaskUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (patch: ParamPatch) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const view: TaskView = searchParams.get('view') === 'list' ? 'list' : 'board';

  return {
    view,
    taskId: searchParams.get('task'),
    projectId: searchParams.get('project') ?? '',
    isCreating: searchParams.get('new') === '1',
    setParams,
  };
}
