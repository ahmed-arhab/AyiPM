'use client';

import { useCallback, useState, type ChangeEvent } from 'react';
import { updateEmployee } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { resizeImageToDataUrl, validateAvatarFile } from '../utils';

export function useAvatarUpload(userId: string) {
  const toast = useToast();
  const confirm = useConfirm();
  const [processing, setProcessing] = useState(false);

  const onFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      const error = validateAvatarFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      setProcessing(true);
      try {
        const avatar = await resizeImageToDataUrl(file);
        const result = await updateEmployee(userId, { avatar });
        if (result.ok) toast.success('Profile photo updated.');
        else toast.error(result.error);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'This image could not be processed.');
      } finally {
        setProcessing(false);
      }
    },
    [userId, toast]
  );

  const removePhoto = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Remove profile photo?',
      message: 'Your initials will be shown instead until you upload a new photo.',
      confirmLabel: 'Remove photo',
      tone: 'danger',
    });
    if (!confirmed) return;
    const result = await updateEmployee(userId, { avatar: '' });
    if (result.ok) toast.success('Profile photo removed.');
    else toast.error(result.error);
  }, [userId, confirm, toast]);

  return { processing, onFileChange, removePhoto };
}
