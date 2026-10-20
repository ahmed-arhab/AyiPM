import type { ActionResult } from '@/types';

export type ApiResult<T> = ActionResult<T> & { status?: number };

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

export async function api<T>(method: Method, url: string, body?: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }

  let payload: { data?: T; error?: string } = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    return { ok: false, error: payload.error ?? 'Something went wrong. Please try again.', status: response.status };
  }
  return { ok: true, data: payload.data as T, status: response.status };
}
