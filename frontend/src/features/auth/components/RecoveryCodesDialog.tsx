'use client';

import { Check } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { dismissNewRecoveryCodes, useNewRecoveryCodes } from '@/store';
import { useT } from '@/translations';
import { RecoveryCodesList } from './RecoveryCodesList';

/** Shows new recovery codes once, wherever the person lands after setting up two-factor authentication. */
export function RecoveryCodesDialog() {
  const t = useT();
  const codes = useNewRecoveryCodes();
  if (!codes) return null;

  return (
    <Modal
      isOpen
      onClose={dismissNewRecoveryCodes}
      size="sm"
      title={t('Save your recovery codes')}
      description={t(
        "If you lose your phone, each code signs you in once instead of an authenticator code. Keep them somewhere safe, like a password manager. They won't be shown again."
      )}
      footer={
        <Button icon={Check} onClick={dismissNewRecoveryCodes}>
          {t("I've saved my codes")}
        </Button>
      }
    >
      <RecoveryCodesList codes={codes} />
    </Modal>
  );
}
