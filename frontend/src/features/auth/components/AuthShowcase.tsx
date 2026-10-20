import { CalendarCheck, KanbanSquare, PlaneTakeoff, ShieldCheck, type LucideIcon } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { AuthIllustration } from './AuthIllustration';
import { useT } from '@/translations';
import styles from './AuthShowcase.module.css';

const FEATURES: { icon: LucideIcon; text: string }[] = [
  { icon: KanbanSquare, text: 'Plan projects and move tasks on a Kanban board' },
  { icon: CalendarCheck, text: 'Check in and out with automatic late and half-day tracking' },
  { icon: PlaneTakeoff, text: 'Request leave and get approvals without the email chains' },
  { icon: ShieldCheck, text: 'Role-based access for admins, project managers and employees' },
];

export function AuthShowcase() {
  const t = useT();

  return (
    <aside className={styles.showcase} aria-label={t('About AyiPM')}>
      <BrandLogo size="lg" inverted />
      <div className={styles.copy}>
        <h2 className={styles.headline}>{t("Your team's projects, time and leave in one place.")}</h2>
        <p className={styles.lead}>{t('AyiPM replaces scattered spreadsheets and chat threads with one workspace for the whole team.')}</p>
      </div>
      <AuthIllustration className={styles.illustration} />
      <ul className={styles.features}>
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text}>
            <span className={styles.featureIcon}>
              <Icon size={16} />
            </span>
            {t(text)}
          </li>
        ))}
      </ul>
    </aside>
  );
}
