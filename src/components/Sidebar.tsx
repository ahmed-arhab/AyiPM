'use client';

import React from 'react';
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
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { employees, projects, tasks, attendance, leaveRequests, currentRole } = useApp();

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
      name: 'Employees',
      href: '/employees',
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
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Brand Header with Uploaded AX / AYITRIX Logo */}
      <div
        style={{
          height: '70px',
          boxSizing: 'border-box',
          padding: '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <BrandLogo size="md" showSubtitle={true} />
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          padding: '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.5rem 0.75rem 0.25rem',
          }}
        >
          Core Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#0284c7' : 'var(--text-secondary)',
                backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon
                  size={18}
                  color={isActive ? '#0284c7' : '#64748b'}
                />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
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

      {/* Role Indicator Footer - Light Mode */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: '#f8fafc',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Perspective
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: currentRole === 'admin' ? '#d97706' : currentRole === 'project_manager' ? '#0284c7' : '#059669',
                textTransform: 'capitalize',
              }}
            >
              {currentRole.replace('_', ' ')}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            {currentRole === 'admin'
              ? 'Root access to employee onboarding, approvals & system settings.'
              : currentRole === 'project_manager'
              ? 'Organize sprints, manage tasks, and approve team leave.'
              : 'Log personal attendance, submit leave, and update personal tasks.'}
          </div>
        </div>
      </div>
    </aside>
  );
}
