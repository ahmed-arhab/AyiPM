import { BellRing, Settings } from 'lucide-react';
import { ButtonLink, Card } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import styles from './NotificationPreferencesHint.module.css';

export function NotificationPreferencesHint() {
  return (
    <Card padding="sm" className={styles.hint}>
      <span className={styles.icon}>
        <BellRing size={18} />
      </span>
      <div className={styles.text}>
        <p className={styles.title}>Getting too many alerts?</p>
        <p className="subtext">Choose which categories — tasks, projects, leave, attendance, system — notify you.</p>
      </div>
      <ButtonLink href={`${ROUTES.settings}#notifications`} variant="secondary" size="sm" icon={Settings}>
        Manage preferences
      </ButtonLink>
    </Card>
  );
}
