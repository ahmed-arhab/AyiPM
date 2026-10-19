export interface Session {
  userId: string;
  expiresAt: string;
}

export interface AccessLink {
  token: string;
  expiresAt: string;
}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };
