import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const MEMBER_PARAM = 'member';

export function useMemberNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const openMember = useCallback(
    (id: string) => router.replace(`${pathname}?${MEMBER_PARAM}=${encodeURIComponent(id)}`, { scroll: false }),
    [router, pathname]
  );
  const closeMember = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  return { openMember, closeMember };
}
