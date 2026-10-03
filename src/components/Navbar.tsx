'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import {
  Shield,
  Briefcase,
  User,
  Clock,
  LogOut,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Settings,
} from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';
import ProfileDropdown from '@/components/ProfileDropdown';
import GlobalSearch from '@/components/GlobalSearch';


export default function Navbar() {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    checkIn,
    checkOut,
    attendance,
    resetAllData,
    t,
  } = useApp();

  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState<string>('');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find(
    (a) => a.employeeId === currentUser?.id && a.date === todayStr
  );
  const isCheckedIn = Boolean(todayRecord && todayRecord.checkIn !== '—');
  const isCheckedOut = Boolean(todayRecord && todayRecord.checkOut);

  const roles: { role: UserRole; label: string; desc: string; icon: any; color: string }[] = [
    {
      role: 'admin',
      label: 'Admin',
      desc: 'Full company oversight, approvals & employee onboarding',
      icon: Shield,
      color: '#d97706',
    },
    {
      role: 'project_manager',
      label: 'Project Manager',
      desc: 'Project & task creation, sprint tracking & team reviews',
      icon: Briefcase,
      color: '#0284c7',
    },
    {
      role: 'employee',
      label: 'Employee',
      desc: 'Check-in/out, task execution & personal leave requests',
      icon: User,
      color: '#059669',
    },
  ];

  return (
    <header
      style={{
        height: '70px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-header, rgba(255, 255, 255, 0.92))',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Left side: System clock & Current user badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            background: 'var(--bg-elevated)',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            fontWeight: 500,
          }}
        >
          <Clock size={14} color="var(--primary)" />
          <span>{timeStr || 'Mon, Sep 21'}</span>
        </div>

        {/* Quick Check-in action */}
        {!isCheckedIn ? (
          <button
            onClick={() => checkIn()}
            className="btn btn-primary btn-sm"
            title="Log attendance check-in"
          >
            <CheckCircle2 size={15} />
            <span>{t('Check In')}</span>
          </button>
        ) : !isCheckedOut ? (
          <button
            onClick={() => checkOut()}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)', background: 'var(--danger-bg)' }}
            title="Log attendance check-out"
          >
            <LogOut size={15} />
            <span>{t('Check Out')} ({todayRecord?.checkIn})</span>
          </button>
        ) : (
          <span
            className="badge badge-success"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            ✓ Shift Logged ({todayRecord?.workingHours}h)
          </span>
        )}
      </div>

      {/* Center: Global Search with Theme Bended Edges */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 1.5rem', maxWidth: '440px' }}>
        <GlobalSearch />
      </div>

      {/* Right side: Role Switcher & Persona Display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Reset Demo Data button */}
        <button
          onClick={() => {
            if (confirm('Reset demo state to initial seed data?')) {
              resetAllData();
            }
          }}
          className="btn-icon btn-ghost"
          title="Reset to initial seed data"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RotateCcw size={16} />
        </button>

        

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '0.5rem',
          }}
        >
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
