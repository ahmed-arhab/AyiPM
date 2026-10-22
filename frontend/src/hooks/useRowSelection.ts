import { useCallback, useState } from 'react';

const NONE: ReadonlySet<string> = new Set();

/** Selected row keys for a DataTable. The selection is cleared whenever `resetKey` changes, e.g. when filters change. */
export function useRowSelection(resetKey?: unknown) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(NONE);
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  if (!Object.is(lastResetKey, resetKey)) {
    setLastResetKey(resetKey);
    setSelected(NONE);
  }

  const clear = useCallback(() => setSelected(NONE), []);
  return { selected, setSelected, clear };
}
