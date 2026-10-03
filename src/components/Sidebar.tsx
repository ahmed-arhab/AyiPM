'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import BrandLogo from '@/components/BrandLogo';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  PlaneTakeoff,
  FolderKanban,
  CheckSquare,
  Activity,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { employees, projects, tasks, attendance, leaveRequests, currentRole, unreadNotificationsCount, t } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPresentCount = attendance.filter(
    (a) => a.date === todayStr && a.status !== 'leave' && a.status !== 'absent'
  ).length;
  const pendingLeavesCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const activeProjectsCount = projects.filter((p) => p.status !== 'completed').length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'done').length;

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'project_manager', 'employee'],
    },
    {
      name: 'Team',
      href: '/team',
      icon: Users,
      badge: employees.filter((e) => e.status === 'active').length,
      roles: ['admin', 'project_manager', 'employee'],
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: CalendarCheck,
      badge: `${todayPresentCount}/${employees.length}`,
      roles: ['admin', 'project_manager', 'employee'],
    },
    {
      name: 'Leave Management',
      href: '/leave',
      icon: PlaneTakeoff,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
      badgeColor: 'badge-warning',
      roles: ['admin', 'project_manager', 'employee'],
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderKanban,
      badge: activeProjectsCount,
      roles: ['admin', 'project_manager', 'employee'],
    },
    {
      name: 'Tasks & Kanban',
      href: '/tasks',
      icon: CheckSquare,
      badge: pendingTasksCount,
      roles: ['admin', 'project_manager', 'employee'],
    },
    {
      name: 'Activity Audit',
      href: '/activity',
      icon: Activity,
      roles: ['admin', 'project_manager', 'employee'],
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
      badgeColor: 'badge-danger',
      roles: ['admin', 'project_manager', 'employee'],
    },
  ];


  return (
    <aside
      style={{
        width: isCollapsed ? '72px' : '260px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: 'var(--shadow-sm)',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Brand Header with Uploaded AX / AYITRIX Logo */}
      <div
        style={{
          height: '70px',
          boxSizing: 'border-box',
          padding: isCollapsed ? '0' : '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <BrandLogo size="md" showSubtitle={true} showWordmark={!isCollapsed} />
      </div>


      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          padding: isCollapsed ? '0.5rem 0' : '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {!isCollapsed && (
          <div
            style={{
              padding: '0.5rem 0.75rem 0.25rem',
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Core Workspace
            </span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/team' && pathname === '/employees');

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                margin: isCollapsed ? '0 0.625rem' : '0',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
                border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : '0.75rem' }}>
                <Icon
                  size={18}
                  color={isActive ? 'var(--primary)' : 'var(--text-muted)'}
                />
                {!isCollapsed && <span>{t(item.name)}</span>}
              </div>
              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`badge ${item.badgeColor || 'badge-neutral'}`}
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.45rem',
                    minWidth: '20px',
                    justifyContent: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Collapse Button */}
      <div
        style={{
          padding: isCollapsed ? '0.75rem 0' : '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: isCollapsed ? 'calc(100% - 1.25rem)' : '100%',
            margin: isCollapsed ? '0 auto' : '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : '0.75rem',
            padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {isCollapsed ? (
            <ChevronRight size={18} color="var(--text-muted)" />
          ) : (
            <>
              <ChevronLeft size={18} color="var(--text-muted)" />
              <span>{t('Collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
