'use client';

import { useCallback } from 'react';
import { updatePreferences } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import type { UserPreferences } from '@/types';

export function useSavePreferences() {
  const toast = useToast();
  return useCallback(
    (update: Partial<UserPreferences>, message = 'Preferences saved.') => {
      const result = updatePreferences(update);
      if (result.ok) toast.success(message);
      else toast.error(result.error);
    },
    [toast]
  );
}
