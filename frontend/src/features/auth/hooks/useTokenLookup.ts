import { useEffect, useState } from 'react';
import type { ActionResult } from '@/types';

export type TokenLookup<T> = { status: 'loading' } | { status: 'invalid' } | { status: 'valid'; data: T };

export function useTokenLookup<T>(token: string, fetcher: (token: string) => Promise<ActionResult<T>>): TokenLookup<T> {
  const [state, setState] = useState<TokenLookup<T>>({ status: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'invalid' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    fetcher(token).then((result) => {
      if (!cancelled) setState(result.ok ? { status: 'valid', data: result.data } : { status: 'invalid' });
    });
    return () => {
      cancelled = true;
    };
  }, [token, fetcher]);

  return state;
}
