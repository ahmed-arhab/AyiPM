'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useCurrentUser } from '@/store';
import { ROUTES } from '@/constants/navigation';
import { useT } from '@/translations';
import styles from './ProfileLinkCard.module.css';

export function ProfileLinkCard() {
  const user = useCurrentUser();
  const { t } = useT();
  return (
    <Link href={ROUTES.profile} className={`card ${styles.card}`}>
      <Avatar name={user.name} src={user.avatar} size={40} />
      <span className={styles.text}>
        <span className={styles.title}>{t('Personal details & password')}</span>
        <span className={styles.hint}>{t('Edit your profile, photo and password on My Profile.')}</span>
      </span>
      <ChevronRight size={18} className={styles.chevron} />
    </Link>
  );
}
