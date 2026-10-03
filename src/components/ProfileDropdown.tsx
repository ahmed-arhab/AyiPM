'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ThemeMode } from '@/types';
import {
  User,
  SunMoon,
  Moon,
  Sun,
  Monitor,
  Globe,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ProfileDropdownProps {
  className?: string;
}

export default function ProfileDropdown({ className }: ProfileDropdownProps) {
  const router = useRouter();
  const {
    currentUser,
    currentRole,
    theme,
    setTheme,
    language,
    setLanguage,
    resetAllData,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [displayExpanded, setDisplayExpanded] = useState(true);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setLanguageExpanded(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setLanguageExpanded(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    // Reset session / clear role or show demo logout
    resetAllData();
    router.push('/');
  };

  const languagesList = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'si', label: 'Sinhala', native: 'සිංහල' },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>
      {/* Profile Trigger Button */}
      <button
        id="profile-menu-button"
        aria-label="Profile menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '42px',
          height: '42px',
          padding: 0,
          borderRadius: '50%',
          background: isOpen ? 'var(--bg-elevated, #f1f5f9)' : 'var(--bg-card, #ffffff)',
          border: isOpen ? '2px solid var(--primary)' : '2px solid var(--border-medium)',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'var(--shadow-sm)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--bg-card-hover, #f8fafc)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--bg-card, #ffffff)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }
        }}
      >
        <img
          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
          alt={currentUser?.name || 'User avatar'}
          className="avatar"
          style={{
            width: '34px',
            height: '34px',
            display: 'block',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="profile-dropdown-menu"
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: '300px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg, 14px)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 70,
            overflow: 'hidden',
            animation: 'profileDropdownFade 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* User Profile Header Card */}
          <div
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'User avatar'}
              className="avatar"
              style={{ width: '44px', height: '44px' }}
            />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {currentUser?.name}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {currentUser?.email}
              </div>
              <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  className={
                    currentRole === 'admin'
                      ? 'badge badge-role-admin'
                      : currentRole === 'project_manager'
                      ? 'badge badge-role-pm'
                      : 'badge badge-role-employee'
                  }
                  style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}
                >
                  {currentRole.replace('_', ' ')}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {currentUser?.department}
                </span>
              </div>
            </div>
          </div>

          {/* Options Container - Rendered strictly in required order:
              1. Profile
              2. Display (Dark, Light, Device)
              3. Language
              4. Verification
              5. Settings
              6. Logout
          */}
          <div style={{ padding: '0.5rem' }}>
            {/* 1. Profile */}
            <button
              id="profile-opt-profile"
              role="menuitem"
              onClick={() => handleNavigate('/settings#profile')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated, #f1f5f9)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(2, 132, 199, 0.1)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={16} />
                </div>
                <span>Profile</span>
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </button>

            {/* 2. Display (with Dark, Light, Device options) */}
            <div
              id="profile-opt-display"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0.35rem 0.5rem',
                background: 'var(--bg-card-hover, rgba(0, 0, 0, 0.02))',
                border: '1px solid var(--border-subtle)',
                margin: '0.25rem 0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(124, 58, 237, 0.1)',
                      color: 'var(--accent-purple, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SunMoon size={16} />
                  </div>
                  <span>Display</span>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'capitalize',
                    fontWeight: 600,
                  }}
                >
                  {theme}
                </span>
              </div>

              {/* Display Submenu / Sub-options in order: Dark, Light, Device */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.35rem',
                  marginTop: '0.35rem',
                  paddingTop: '0.35rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                {/* 2.a Dark */}
                <button
                  id="theme-opt-dark"
                  type="button"
                  title="Dark theme"
                  onClick={() => setTheme('dark')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.45rem 0.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: theme === 'dark' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: theme === 'dark' ? 'var(--primary-glow, rgba(2, 132, 199, 0.12))' : 'var(--bg-card, #ffffff)',
                    color: theme === 'dark' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: theme === 'dark' ? 700 : 500,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Moon size={14} />
                  <span>Dark</span>
                </button>

                {/* 2.b Light */}
                <button
                  id="theme-opt-light"
                  type="button"
                  title="Light theme"
                  onClick={() => setTheme('light')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.45rem 0.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: theme === 'light' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: theme === 'light' ? 'var(--primary-glow, rgba(2, 132, 199, 0.12))' : 'var(--bg-card, #ffffff)',
                    color: theme === 'light' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: theme === 'light' ? 700 : 500,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Sun size={14} />
                  <span>Light</span>
                </button>

                {/* 2.c Device */}
                <button
                  id="theme-opt-device"
                  type="button"
                  title="Follow device/system theme"
                  onClick={() => setTheme('device')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.45rem 0.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: theme === 'device' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: theme === 'device' ? 'var(--primary-glow, rgba(2, 132, 199, 0.12))' : 'var(--bg-card, #ffffff)',
                    color: theme === 'device' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: theme === 'device' ? 700 : 500,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Monitor size={14} />
                  <span>Device</span>
                </button>
              </div>
            </div>

            {/* 3. Language */}
            <div>
              <button
                id="profile-opt-language"
                role="menuitem"
                onClick={() => setLanguageExpanded(!languageExpanded)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: languageExpanded ? 'var(--bg-elevated, #f1f5f9)' : 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!languageExpanded) e.currentTarget.style.background = 'var(--bg-elevated, #f1f5f9)';
                }}
                onMouseLeave={(e) => {
                  if (!languageExpanded) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(6, 182, 212, 0.1)',
                      color: 'var(--accent-cyan, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Globe size={16} />
                  </div>
                  <span>Language</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {language}
                  </span>
                  <ChevronDown
                    size={14}
                    color="var(--text-muted)"
                    style={{
                      transform: languageExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform var(--transition-fast)',
                    }}
                  />
                </div>
              </button>

              {/* Language selection accordion */}
              {languageExpanded && (
                <div
                  style={{
                    padding: '0.35rem 0.5rem 0.35rem 2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    background: 'var(--bg-card-hover, rgba(0, 0, 0, 0.02))',
                    borderRadius: 'var(--radius-md)',
                    margin: '0.15rem 0 0.25rem',
                  }}
                >
                  {languagesList.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.label);
                        setLanguageExpanded(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: language === lang.label ? 'var(--info-bg, #f0f9ff)' : 'transparent',
                        color: language === lang.label ? 'var(--primary)' : 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: language === lang.label ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{lang.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({lang.native})</span>
                      </div>
                      {language === lang.label && <Check size={13} color="var(--primary)" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Verification */}
            <button
              id="profile-opt-verification"
              role="menuitem"
              onClick={() => handleNavigate('/settings#verification')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated, #f1f5f9)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(5, 150, 105, 0.1)',
                    color: 'var(--success, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={16} />
                </div>
                <span>Verification</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  className="badge badge-success"
                  style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                >
                  Verified
                </span>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            </button>

            {/* 5. Settings */}
            <button
              id="profile-opt-settings"
              role="menuitem"
              onClick={() => handleNavigate('/settings')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated, #f1f5f9)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(71, 85, 105, 0.1)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Settings size={16} />
                </div>
                <span>Settings</span>
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </button>

            {/* Divider */}
            <div
              style={{
                height: '1px',
                background: 'var(--border-subtle)',
                margin: '0.35rem 0',
              }}
            />

            {/* 6. Logout */}
            <button
              id="profile-opt-logout"
              role="menuitem"
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LogOut size={16} />
                </div>
                <span>Logout</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Logout */}
      {logoutConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setLogoutConfirmOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '400px', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Sign out of AyiPM?
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Are you sure you want to log out of your current session?
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={confirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animation */}
      <style jsx>{`
        @keyframes profileDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
