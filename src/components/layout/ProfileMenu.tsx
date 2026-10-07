'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronDown, LogOut, Settings, UserCircle } from 'lucide-react';
import { logout, useCurrentUser } from '@/store';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDisclosure } from '@/hooks/useDisclosure';
import { ROUTES } from '@/constants/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import type { ThemeMode } from '@/types';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/animate-ui/primitives/radix/collapsible';
import styles from './ProfileMenu.module.css';

export function ProfileMenu() {
  const user = useCurrentUser();
  const confirm = useConfirm();
  const { isOpen, toggle, close } = useDisclosure();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, close, isOpen);

  const handleLogout = async () => {
    close();
    const ok = await confirm({ title: 'Sign out?', message: 'You will need your Employee ID and password to sign back in.', confirmLabel: 'Sign out', tone: 'danger' });
    if (ok) logout();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={toggle} asChild>
      <div ref={ref} className={styles.wrap}>
        <CollapsibleTrigger asChild>
          <button type="button" className={styles.trigger} aria-expanded={isOpen} aria-haspopup="menu">
            <Avatar name={user.name} src={user.avatar} size={34} />
            <span className={styles.identity}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.meta}>{user.employeeId}</span>
            </span>
            <ChevronDown
              size={14}
              className={styles.chevron}
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent
          className={styles.panel}
          role="menu"
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'top right' }}
        >
          <div className={styles.header}>
            <Avatar name={user.name} src={user.avatar} size={44} />
            <div className={styles.headerText}>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <RoleBadge role={user.role} />
            </div>
          </div>

          <div className={styles.section}>
            <FilesHighlight
              containerClassName={styles.itemGroup}
              className={styles.highlightPill}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <FileHighlight id="profile" asChild>
                <Link href={ROUTES.profile} className={styles.item} role="menuitem" onClick={close}>
                  <UserCircle size={16} />
                  My profile
                </Link>
              </FileHighlight>
              <FileHighlight id="settings" asChild>
                <Link href={ROUTES.settings} className={styles.item} role="menuitem" onClick={close}>
                  <Settings size={16} />
                  Settings
                </Link>
              </FileHighlight>
            </FilesHighlight>
          </div>

          <div className={styles.section}>
            <FilesHighlight
              containerClassName={styles.itemGroup}
              className={styles.dangerHighlightPill}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <FileHighlight id="signout" asChild>
                <button type="button" className={`${styles.item} ${styles.danger}`} role="menuitem" onClick={handleLogout}>
                  <LogOut size={16} />
                  Sign out
                </button>
              </FileHighlight>
            </FilesHighlight>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
