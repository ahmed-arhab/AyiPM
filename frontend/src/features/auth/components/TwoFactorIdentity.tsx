import { useT } from '@/translations';
import styles from './TwoFactorStep.module.css';

/** Who is signing in, with a way back to the start. */
export function TwoFactorIdentity({ identifier, disabled, onChange }: { identifier: string; disabled: boolean; onChange: () => void }) {
  const t = useT();
  return (
    <div className={styles.identity}>
      <span className={styles.identifier} title={identifier}>
        {identifier}
      </span>
      <button type="button" className={styles.linkButton} onClick={onChange} disabled={disabled}>
        {t('Change')}
      </button>
    </div>
  );
}
