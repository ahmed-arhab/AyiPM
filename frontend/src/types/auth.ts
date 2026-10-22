export interface Session {
  userId: string;
  expiresAt: string;
}

export interface AccessLink {
  token: string;
  expiresAt: string;
  /** Whether the server is also emailing the link to the person. False when email isn't set up on the server. */
  emailed: boolean;
}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };
