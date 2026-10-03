'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ThemeMode } from '@/types';
import {
  Settings,
  User,
  SunMoon,
  Moon,
  Sun,
  Monitor,
  Globe,
  ShieldCheck,
  Bell,
  Building2,
  Lock,
  Save,
  Check,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import AvatarUploadBadge from '@/components/AvatarUploadBadge';

export default function SettingsPage() {
  const {
    currentUser,
    currentRole,
    updateEmployee,
    theme,
    setTheme,
    language,
    setLanguage,
  } = useApp();

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+1 5552345678');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [location, setLocation] = useState(currentUser?.location || 'New York, USA');
  const [designation, setDesignation] = useState(currentUser?.designation || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [bio, setBio] = useState(
    'Passionate about building scalable enterprise software and managing agile workflows.'
  );

  // Appearance & Display State
  const [compactMode, setCompactMode] = useState(false);

  // Regional State
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [weekStart, setWeekStart] = useState('Monday');

  // Verification & Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState({
    leaveUpdates: true,
    taskAssignments: true,
    projectMilestones: true,
    weeklyDigest: false,
    attendanceReminders: true,
  });

  // Workspace
  const [companyName, setCompanyName] = useState('Ayitrix');
  const [timezone, setTimezone] = useState('Asia/Colombo');
  const [workDayStart, setWorkDayStart] = useState('09:00');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [annualLeaveDays, setAnnualLeaveDays] = useState(20);
  const [sickLeaveDays, setSickLeaveDays] = useState(10);

  // Feedback State
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '+1 5552345678');
      setLocation(currentUser.location || 'New York, USA');
      setDesignation(currentUser.designation || '');
      setDepartment(currentUser.department || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleAvatarUpload = (newAvatar: string) => {
    setAvatar(newAvatar);
    if (currentUser?.id) {
      updateEmployee(currentUser.id, { avatar: newAvatar });
    }
    setSaveSuccess(true);
    setSaveMessage('Profile picture updated successfully!');
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    // Persist profile updates to AppContext
    if (currentUser?.id) {
      updateEmployee(currentUser.id, {
        name,
        email,
        phone,
        location,
        designation,
        department,
        avatar: avatar || currentUser.avatar,
      });
    }

    setSaveSuccess(true);
    setSaveMessage('All settings and account preferences saved successfully.');
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset preferences to system defaults?')) {
      setTheme('light');
      setLanguage('English');
      setDateFormat('YYYY-MM-DD');
      setTimeFormat('12h');
      setWeekStart('Monday');
      setNotifications({
        leaveUpdates: true,
        taskAssignments: true,
        projectMilestones: true,
        weeklyDigest: false,
        attendanceReminders: true,
      });
      setSaveSuccess(true);
      setSaveMessage('Settings restored to defaults.');
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '960px', paddingBottom: '5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.25rem',
        }}
      >
        <div>
          <h1
            className="heading-xl"
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(2, 132, 199, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={24} />
            </div>
            <span>Settings</span>
          </h1>
          <p className="subtext" style={{ marginTop: '0.35rem' }}>
            Manage all your personal profile, display themes, security credentials, and workspace preferences in one continuous view.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="btn btn-primary"
          style={{ minWidth: '150px' }}
        >
          <Save size={16} />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Floating Save Alert Banner */}
      {saveSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            background: 'var(--success-bg, #ecfdf5)',
            border: '1px solid var(--success-border, #a7f3d0)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <CheckCircle2 size={18} color="var(--success)" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Continuous Top-to-Bottom Settings View */}
      <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* 1. PROFILE SETTINGS */}
        <section
          id="profile"
          className="glass-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={18} />
              </div>
              <div>
                <h2 className="heading-md">Profile Settings</h2>
                <p className="subtext" style={{ fontSize: '0.8rem' }}>
                  Personal information and profile details visible to colleagues across AyiPM.
                </p>
              </div>
            </div>
            <span
              className={
                currentRole === 'admin'
                  ? 'badge badge-role-admin'
                  : currentRole === 'project_manager'
                  ? 'badge badge-role-pm'
                  : 'badge badge-role-employee'
              }
            >
              {currentRole.replace('_', ' ')}
            </span>
          </div>

          {/* Avatar and quick metadata */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1rem',
              background: 'var(--bg-card-hover, #f8fafc)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <AvatarUploadBadge
              currentAvatar={avatar || currentUser?.avatar}
              onImageSelected={handleAvatarUpload}
              size={64}
              badgeSize={22}
              alt={currentUser?.name || 'User avatar'}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {name || currentUser?.name}
              </div>
              <div className="subtext" style={{ fontSize: '0.8125rem' }}>
                {designation || currentUser?.designation} · {department || currentUser?.department}
              </div>
              <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  Active Employee
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  ID: {currentUser?.id || 'EMP-01'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <CountryPhoneInput
                id="settings-phone"
                value={phone}
                onChange={(fullVal) => setPhone(fullVal)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location / Base Office</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Designation / Title</label>
              <input
                type="text"
                className="form-input"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Professional Bio</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief professional summary"
              />
            </div>
          </div>
        </section>

        {/* 2. DISPLAY & THEME SETTINGS */}
        <section
          id="display"
          className="glass-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: 'var(--accent-purple, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SunMoon size={18} />
              </div>
              <div>
                <h2 className="heading-md">Display & Theme</h2>
                <p className="subtext" style={{ fontSize: '0.8rem' }}>
                  Choose your preferred appearance mode: Dark, Light, or follow your Device system settings.
                </p>
              </div>
            </div>
            <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
              Active: {theme}
            </span>
          </div>

          {/* Theme Selector Cards in order: Dark, Light, Device */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Dark Theme Option */}
            <div
              id="settings-theme-dark"
              onClick={() => setTheme('dark')}
              style={{
                border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                cursor: 'pointer',
                background: theme === 'dark' ? 'var(--primary-glow, rgba(2, 132, 199, 0.12))' : 'var(--bg-card, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative',
                transition: 'all var(--transition-fast)',
                boxShadow: theme === 'dark' ? 'var(--shadow-md)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: '#0f172a',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Moon size={18} />
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Dark Mode
                </div>
              </div>
            </div>

            {/* Light Theme Option */}
            <div
              id="settings-theme-light"
              onClick={() => setTheme('light')}
              style={{
                border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                cursor: 'pointer',
                background: theme === 'light' ? 'var(--primary-glow, rgba(2, 132, 199, 0.12))' : 'var(--bg-card, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative',
                transition: 'all var(--transition-fast)',
                boxShadow: theme === 'light' ? 'var(--shadow-md)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sun size={18} />
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Light Mode
                </div>
              </div>
            </div>

            {/* Device Theme Option */}
            <div
              id="settings-theme-device"
              onClick={() => setTheme('device')}
              style={{
                border: theme === 'device' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                cursor: 'pointer',
                background: theme === 'device' ? 'var(--primary-glow, rgba(2, 132, 199, 0.12))' : 'var(--bg-card, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative',
                transition: 'all var(--transition-fast)',
                boxShadow: theme === 'device' ? 'var(--shadow-md)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(6, 182, 212, 0.1)',
                    color: 'var(--accent-cyan, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Monitor size={18} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Device Theme
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. LANGUAGE & REGION SETTINGS */}
        <section
          id="language"
          className="glass-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(6, 182, 212, 0.1)',
                  color: 'var(--accent-cyan, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Globe size={18} />
              </div>
              <div>
                <h2 className="heading-md">Language & Regional Settings</h2>
                <p className="subtext" style={{ fontSize: '0.8rem' }}>
                  Configure your primary language, calendar date formats, and time display.
                </p>
              </div>
            </div>
            <span className="badge badge-info">{language}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Preferred Language</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Sinhala">Sinhala (සිංහල)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date Format</label>
              <select
                className="form-select"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-02)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (02/10/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (10/02/2026)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Time Format</label>
              <select
                className="form-select"
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
              >
                <option value="12h">12-Hour (09:15 AM)</option>
                <option value="24h">24-Hour (09:15)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">First Day of the Week</label>
              <select
                className="form-select"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              >
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4. VERIFICATION & CORPORATE CREDENTIALS */}
        <section
          id="verification"
          className="glass-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(5, 150, 105, 0.1)',
                  color: 'var(--success, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="heading-md">Verification & Corporate Status</h2>
                <p className="subtext" style={{ fontSize: '0.8rem' }}>
                  Verify your corporate employee credentials, enterprise security level, and badge authentications.
                </p>
              </div>
            </div>
            <span className="badge badge-success">Verified Identity</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Identity Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-hover, #f8fafc)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--success-bg, #ecfdf5)',
                    color: 'var(--success, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Corporate Staff ID Verification
                  </div>
                  <div className="subtext" style={{ fontSize: '0.78rem' }}>
                    AYITRIX Global Enterprise Certificate #AYI-2026-9481 · Issued Jan 2023
                  </div>
                </div>
              </div>
              <span className="badge badge-success">Verified</span>
            </div>

            {/* Email Verification */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-hover, #f8fafc)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--info-bg, #f0f9ff)',
                    color: 'var(--primary, #0284c7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Official Corporate Email
                  </div>
                  <div className="subtext" style={{ fontSize: '0.78rem' }}>
                    {email || currentUser?.email} (Single Sign-On Enforced)
                  </div>
                </div>
              </div>
              <span className="badge badge-info">Verified SSO</span>
            </div>

            {/* 2FA Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-hover, #f8fafc)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: twoFactorEnabled ? 'var(--success-bg, #ecfdf5)' : 'var(--warning-bg, #fffbeb)',
                    color: twoFactorEnabled ? 'var(--success, #059669)' : 'var(--warning, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Two-Factor Authentication (2FA)
                  </div>
                  <div className="subtext" style={{ fontSize: '0.78rem' }}>
                    Hardware key or mobile authenticator code required at login
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* 5. NOTIFICATION PREFERENCES */}
        <section
          id="notifications"
          className="glass-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(217, 119, 6, 0.1)',
                  color: 'var(--warning, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={18} />
              </div>
              <div>
                <h2 className="heading-md">Notification Preferences</h2>
                <p className="subtext" style={{ fontSize: '0.8rem' }}>
                  Decide how and when you receive task updates, sprint reviews, and leave approvals.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              {
                id: 'leaveUpdates',
                title: 'Leave Request Approvals & Status Updates',
                desc: 'Get notified when your leave request is reviewed or when team members apply for leave.',
              },
              {
                id: 'taskAssignments',
                title: 'Task Assignments and Kanban State Changes',
                desc: 'Instant notifications when tasks are assigned to you or moved across sprint columns.',
              },
              {
                id: 'projectMilestones',
                title: 'Project Milestones & Sprint Deadlines',
                desc: 'Reminders 48 hours prior to milestone deliverables and phase transitions.',
              },
              {
                id: 'attendanceReminders',
                title: 'Shift Check-in and Grace Period Reminders',
                desc: 'Prompt notification if morning check-in has not been registered by 09:10 AM.',
              },
              {
                id: 'weeklyDigest',
                title: 'Weekly Enterprise Productivity Digest',
                desc: 'Comprehensive summary email delivered every Monday morning with team metrics.',
              },
            ].map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card, #ffffff)',
                  cursor: 'pointer',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {item.title}
                  </div>
                  <div className="subtext" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
                    {item.desc}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications[item.id as keyof typeof notifications]}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      [item.id]: e.target.checked,
                    })
                  }
                  style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                />
              </label>
            ))}
          </div>
        </section>

        {/* 6. WORKSPACE CONFIGURATION */}
        <section
          id="workspace"
          className="glass-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: 'var(--primary, #0284c7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="heading-md">Workspace Configuration</h2>
                <p className="subtext" style={{ fontSize: '0.8rem' }}>
                  Company-wide defaults for attendance punctuality, leave quotas, and office operating hours.
                </p>
              </div>
            </div>
            <span className="badge badge-neutral">Organizational Defaults</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Timezone</label>
              <select
                className="form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
                <option value="UTC">UTC (GMT+0:00)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Official Work Day Starts</label>
              <input
                type="time"
                className="form-input"
                value={workDayStart}
                onChange={(e) => setWorkDayStart(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Late Check-in Grace Period (Minutes)</label>
              <input
                type="number"
                min="0"
                max="60"
                className="form-input"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Annual Vacation Days Quota</label>
              <input
                type="number"
                min="0"
                max="60"
                className="form-input"
                value={annualLeaveDays}
                onChange={(e) => setAnnualLeaveDays(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Annual Sick Leave Days Quota</label>
              <input
                type="number"
                min="0"
                max="30"
                className="form-input"
                value={sickLeaveDays}
                onChange={(e) => setSickLeaveDays(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* 7. SECURITY & SESSIONS */}
        <section
          id="security"
          className="glass-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: 'var(--danger, #dc2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <h2 className="heading-md">Security & Active Sessions</h2>
                <p className="subtext" style={{ fontSize: '0.8rem' }}>
                  Update your authentication credentials and manage authorized devices and active browser sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Password Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter at least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Active Sessions List */}
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Active Sessions & Devices
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-hover, #f8fafc)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Laptop size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Mac OS · Chrome Browser
                    </div>
                    <div className="subtext" style={{ fontSize: '0.75rem' }}>
                      Current session · Colombo, Sri Lanka · Active now
                    </div>
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  Current Device
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-hover, #f8fafc)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Smartphone size={18} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      iPhone 15 Pro · AyiPM Mobile
                    </div>
                    <div className="subtext" style={{ fontSize: '0.75rem' }}>
                      Colombo, Sri Lanka · Last active 2 hours ago
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => alert('Remote session revoked.')}
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Actions Sticky Footer */}
        <div
          style={{
            position: 'sticky',
            bottom: '1.5rem',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem 1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            zIndex: 30,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn btn-secondary"
            >
              <RotateCcw size={15} />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '160px' }}>
              <Save size={16} />
              <span>Save All Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
