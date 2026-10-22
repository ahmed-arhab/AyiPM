'use client';

import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { downloadFile } from '@/lib/csv';
import { useT } from '@/translations';
import styles from './RecoveryCodesList.module.css';

export function RecoveryCodesList({ codes }: { codes: string[] }) {
  const t = useT();
  const toast = useToast();
  const text = codes.join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('Recovery codes copied.'));
    } catch {
      toast.error(t('Could not access the clipboard. Copy the codes manually.'));
    }
  };

  return (
    <div className={styles.wrap}>
      <ul className={styles.codes} aria-label={t('Recovery codes')}>
        {codes.map((code) => (
          <li key={code} className={styles.code}>
            {code}
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <Button variant="secondary" size="sm" icon={Copy} onClick={copy}>
          {t('Copy codes')}
        </Button>
        <Button variant="secondary" size="sm" icon={Download} onClick={() => downloadFile('ayipm-recovery-codes.txt', `${text}\n`, 'text/plain;charset=utf-8')}>
          {t('Download')}
        </Button>
      </div>
    </div>
  );
}
