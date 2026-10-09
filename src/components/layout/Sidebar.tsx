'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavCounts } from '@/store';
import { ACCOUNT_NAV_ITEMS, NAV_ITEMS, type NavItem } from '@/constants/navigation';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/cn';
import type { NavCounts } from '@/store/selectors';
import {
  Collapsible,
  CollapsibleTrigger,
} from '@/components/animate-ui/primitives/radix/collapsible';
import {
  FilesHighlight,
  FileHighlight,
} from '@/components/animate-ui/primitives/base/files';
import { BrandMark } from './BrandLogo';
import styles from './Sidebar.module.css';

const COLLAPSE_KEY = 'ayipm:v2:sidebar-collapsed';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const NavLink = memo(function NavLink({
  item,
  active,
  collapsed,
  badge,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge?: number | string;
}) {
  const Icon = item.icon;
  const showBadge = badge !== undefined && badge !== 0 && !collapsed;
  return (
    <FileHighlight asChild id={item.href}>
      <Link
        href={item.href}
        className={cn(styles.link, active && styles.active)}
        title={collapsed ? item.label : undefined}
        aria-current={active ? 'page' : undefined}
      >
        <span className={styles.iconSlot}>
          <Icon size={18} />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              className={styles.linkLabel}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{
                width: { duration: 0.24, ease: [0.2, 0, 0, 1] },
                opacity: { duration: 0.15, ease: 'easeInOut' },
              }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {showBadge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn('badge', item.badgeTone ? `badge-${item.badgeTone}` : 'badge-neutral', styles.badge)}
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </FileHighlight>
  );
});

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname() ?? '';
  const counts = useNavCounts();
  const [collapsedPref, setCollapsed] = useState(false);
  const collapsed = collapsedPref && !mobileOpen;

  useEffect(() => {
    setCollapsed(storage.readRaw(COLLAPSE_KEY) === '1');
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsedPref;
    storage.writeRaw(COLLAPSE_KEY, next ? '1' : '0');
    setCollapsed(next);
  };

  const badgeFor = (item: NavItem) => (item.badge ? counts[item.badge as keyof NavCounts] : undefined);

  return (
    <>
      <div className={cn(styles.scrim, mobileOpen && styles.scrimVisible)} onClick={onMobileClose} aria-hidden />
      <Collapsible open={!collapsed} onOpenChange={toggleCollapsed} asChild>
        <aside
          className={cn(styles.sidebar, collapsed && styles.collapsed, mobileOpen && styles.mobileOpen)}
          aria-label="Main navigation"
        >
          <div className={styles.brand}>
            <div className={styles.brandMarkSlot}>
              <BrandMark size={34} />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  className={styles.brandName}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{
                    width: { duration: 0.24, ease: [0.2, 0, 0, 1] },
                    opacity: { duration: 0.15, ease: 'easeInOut' },
                  }}
                  style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  Ayi<span className={styles.brandAccent}>PM</span>
                </motion.span>
              )}
            </AnimatePresence>
            <button type="button" className={cn('icon-btn', styles.mobileClose)} onClick={onMobileClose} aria-label="Close navigation">
              <X size={18} />
            </button>
          </div>

          <nav className={styles.nav}>
            <div className={styles.sectionHead}>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{
                      width: { duration: 0.24, ease: [0.2, 0, 0, 1] },
                      opacity: { duration: 0.15, ease: 'easeInOut' },
                    }}
                    style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                    className={styles.sectionLabel}
                  >
                    Workspace
                  </motion.span>
                )}
              </AnimatePresence>
              <div className={styles.collapseBtnSlot}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={cn('icon-btn', styles.collapseBtn)}
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    <motion.span
                      animate={{ rotate: collapsed ? 180 : 0 }}
                      transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
                      style={{ display: 'inline-flex' }}
                    >
                      <ChevronLeft size={16} />
                    </motion.span>
                  </button>
                </CollapsibleTrigger>
              </div>
            </div>
            <FilesHighlight
              containerClassName={styles.navGroup}
              className={styles.highlightPill}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} badge={badgeFor(item)} />
              ))}
            </FilesHighlight>
          </nav>

          <div className={styles.bottomSection}>
            <div className={styles.accountHead}>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{
                      width: { duration: 0.24, ease: [0.2, 0, 0, 1] },
                      opacity: { duration: 0.15, ease: 'easeInOut' },
                    }}
                    style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                    className={styles.sectionLabel}
                  >
                    Account
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <FilesHighlight
              containerClassName={styles.navGroup}
              className={styles.highlightPill}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              {ACCOUNT_NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
              ))}
            </FilesHighlight>
          </div>
        </aside>
      </Collapsible>
    </>
  );
}
