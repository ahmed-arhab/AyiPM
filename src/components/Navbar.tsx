'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function Navbar() {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    checkIn,
    checkOut,
    attendance,
    resetAllData,
  } = useApp();

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
    (a) => a.employeeId === currentUser.id && a.date === todayStr
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
        background: 'rgba(255, 255, 255, 0.92)',
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
            background: '#f1f5f9',
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
            <span>Check In</span>
          </button>
        ) : !isCheckedOut ? (
          <button
            onClick={() => checkOut()}
            className="btn btn-secondary btn-sm"
            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
            title="Log attendance check-out"
          >
            <LogOut size={15} />
            <span>Check Out ({todayRecord?.checkIn})</span>
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

        {/* Interactive Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              background: '#ffffff',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.4rem 0.875rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Active Persona
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'capitalize' }}>
                {currentRole.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown size={15} color="var(--text-secondary)" />
          </button>

          {roleMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                onClick={() => setRoleMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '320px',
                  background: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.5rem',
                  zIndex: 60,
                }}
              >
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Switch Perspective
                </div>
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isActive = currentRole === r.role;
                  return (
                    <button
                      key={r.role}
                      onClick={() => {
                        setCurrentRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: isActive ? '#f0f9ff' : 'transparent',
                        border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <div
                        style={{
                          background: `${r.color}15`,
                          color: r.color,
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isActive ? '#0284c7' : 'inherit' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* User Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingLeft: '0.5rem',
            borderLeft: '1px solid var(--border-subtle)',
          }}
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="avatar"
            style={{ width: '38px', height: '38px' }}
          />
        </div>
      </div>
    </header>
  );
}
