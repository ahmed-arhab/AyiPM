import { useEffect, useRef } from 'react';

export function useHotkey(key: string, handler: (event: KeyboardEvent) => void, options: { meta?: boolean } = {}): void {
  const handlerRef = useRef(handler);
  // eslint-disable-next-line react-hooks/refs -- Latest-ref pattern: the listener calls the newest handler without being re-attached.
  handlerRef.current = handler;
  const { meta = false } = options;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event?.key || typeof key !== 'string') return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (meta && !(event.metaKey || event.ctrlKey)) return;
      handlerRef.current(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, meta]);
}
