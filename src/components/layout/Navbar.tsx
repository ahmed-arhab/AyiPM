'use client';

import { Menu } from 'lucide-react';
import { LiveClock } from './LiveClock';
import { CheckInButton } from './CheckInButton';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { ProfileMenu } from './ProfileMenu';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';
import styles from './Navbar.module.css';

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button type="button" className={`icon-btn ${styles.menuBtn}`} onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <LiveClock />
        <CheckInButton />
      </div>
      <div className={styles.center}>
        <GlobalSearch />
      </div>
      <div className={styles.right}>
        <ThemeTogglerButton
          modes={['light', 'dark']}
          className="size-[42px] rounded-full cursor-pointer"
        />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
