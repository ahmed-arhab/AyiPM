import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import styles from './SettingsSection.module.css';

interface SettingsSectionProps {
  id: string;
  title: string;
  description: ReactNode;
  icon: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
}

export function SettingsSection({ id, title, description, icon, actions, children }: SettingsSectionProps) {
  return (
    <Card as="section" id={id} aria-label={title} className={styles.section}>
      <CardHeader icon={icon} title={title} description={description} actions={actions} />
      <div className={styles.body}>{children}</div>
    </Card>
  );
}
