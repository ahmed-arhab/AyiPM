import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type LeaveViewTab = 'requests' | 'calendar';

/** The selected Leave tab, kept in `?view=calendar` so a refresh or shared link opens the same tab. */
export function useLeaveViewParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view: LeaveViewTab = searchParams.get('view') === 'calendar' ? 'calendar' : 'requests';

  const setView = useCallback(
    (next: LeaveViewTab) => {
      const params = new URLSearchParams(window.location.search);
      if (next === 'calendar') params.set('view', next);
      else params.delete('view');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  return { view, setView };
}
