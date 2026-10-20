import type { Session } from '@/types';

export function isSessionActive(session: Session | null | undefined, now: number = Date.now()): session is Session {
  return Boolean(session?.expiresAt) && Date.parse(session!.expiresAt) > now;
}
