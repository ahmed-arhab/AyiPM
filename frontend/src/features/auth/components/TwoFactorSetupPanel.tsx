'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import type { TwoFactorSetup } from '@/types';
import { useT } from '@/translations';
import { groupSecret } from '../utils';
import styles from './TwoFactorSetupPanel.module.css';

/** The QR code to scan, with the secret as text for apps that can't scan. */
export function TwoFactorSetupPanel({ setup }: { setup: TwoFactorSetup }) {
  const t = useT();
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(setup.secret);
      toast.success(t('Key copied.'));
    } catch {
      toast.error(t('Could not access the clipboard. Copy the key manually.'));
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.scan}>
        {/* Always dark on white, whatever the theme, so every phone camera can read it. */}
        <div className={styles.qr}>
          <QRCodeSVG value={setup.otpauthUri} size={152} level="M" marginSize={0} title={t('QR code for your authenticator app')} />
        </div>
        <ol className={styles.steps}>
          <li>{t('Open an authenticator app, such as Google Authenticator, Microsoft Authenticator or 1Password.')}</li>
          <li>{t('Scan this QR code with the app.')}</li>
          <li>{t('Enter the 6-digit code that the app shows.')}</li>
        </ol>
      </div>
      <div className={styles.manual}>
        <span className={styles.manualLabel}>{t("Can't scan it? Enter this key in the app instead:")}</span>
        <div className={styles.secretRow}>
          <code className={styles.secret}>{groupSecret(setup.secret)}</code>
          <Button variant="secondary" size="sm" icon={Copy} onClick={copy}>
            {t('Copy')}
          </Button>
        </div>
      </div>
    </div>
  );
}
