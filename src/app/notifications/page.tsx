'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { NotificationCategory, NotificationItem } from '@/types';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  CheckSquare,
  PlaneTakeoff,
  Clock,
  Sparkles,
  ExternalLink,
  Filter,
  Search,
  Inbox,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldAlert,
  X,
} from 'lucide-react';


export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadNotificationsCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Relative time helper
  const formatRelativeTime = (timestamp: string) => {
    try {
      const now = new Date();
      const past = new Date(timestamp);
      const diffMs = now.getTime() - past.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 45) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  const getCategoryMeta = (cat: NotificationCategory) => {
    switch (cat) {
      case 'task':
        return {
          label: 'Task',
          icon: CheckSquare,
          color: '#0284c7',
          bg: '#e0f2fe',
          border: '#bae6fd',
        };
      case 'leave':
        return {
          label: 'Leave',
          icon: PlaneTakeoff,
          color: '#d97706',
          bg: '#fef3c7',
          border: '#fde68a',
        };
      case 'attendance':
        return {
          label: 'Attendance',
          icon: Clock,
          color: '#059669',
          bg: '#d1fae5',
          border: '#a7f3d0',
        };
      case 'system':
      default:
        return {
          label: 'System',
          icon: Sparkles,
          color: '#7c3aed',
          bg: '#ede9fe',
          border: '#ddd6fe',
        };
    }
  };

  // Filter items
  const filteredNotifications = notifications.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unread' && !item.read) ||
      (statusFilter === 'read' && item.read);
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase()) ||
      (item.sender && item.sender.name.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const categoryCounts = {
    all: notifications.length,
    task: notifications.filter((n) => n.category === 'task').length,
    leave: notifications.filter((n) => n.category === 'leave').length,
    attendance: notifications.filter((n) => n.category === 'attendance').length,
    system: notifications.filter((n) => n.category === 'system').length,
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  // Quick helper to seed a test notification if the user wants to test
  const handleCreateTestNotification = () => {
    addNotification({
      title: 'Real-time System Ping',
      message: `System notification created at ${new Date().toLocaleTimeString()} to test live counters.`,
      category: 'system',
      priority: 'high',
      link: '/activity',
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 className="heading-xl" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Bell size={22} />
            </div>
            <span>Notifications & Alert Center</span>
          </h1>
          <p className="subtext" style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
            Real-time feed for task handoffs, leave review requests, attendance anomalies, and system milestones.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCheck size={16} color="var(--primary)" />
              <span>Mark all as read ({unreadNotificationsCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCreateTestNotification}
            className="btn btn-ghost btn-sm"
            title="Generate a live test alert"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px dashed var(--border-medium)' }}
          >
            <Sparkles size={14} color="var(--primary)" />
            <span>Test Alert</span>
          </button>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to clear all notifications?')) {
                  clearAllNotifications();
                }
              }}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              <Trash2 size={15} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Metric 1: Total */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <Bell size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Alerts</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {notifications.length}
            </div>
          </div>
        </div>

        {/* Metric 2: Unread */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unread Messages</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: unreadNotificationsCount > 0 ? '#dc2626' : 'var(--text-primary)' }}>
              {unreadNotificationsCount}
            </div>
          </div>
        </div>

        {/* Metric 3: Tasks */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <CheckSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Task Updates</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {categoryCounts.task}
            </div>
          </div>
        </div>

        {/* Metric 4: Leaves & Attendance */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <PlaneTakeoff size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Leave & Attendance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {categoryCounts.leave + categoryCounts.attendance}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'all', label: 'All Alerts', count: categoryCounts.all },
              { id: 'task', label: 'Tasks', count: categoryCounts.task },
              { id: 'leave', label: 'Leaves', count: categoryCounts.leave },
              { id: 'attendance', label: 'Attendance', count: categoryCounts.attendance },
              { id: 'system', label: 'System', count: categoryCounts.system },
            ].map((tab) => {
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      opacity: isSelected ? 0.9 : 0.65,
                    }}
                  >
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status Filter (All / Unread / Read) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'var(--bg-elevated)',
              padding: '3px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadNotificationsCount})` },
              { id: 'read', label: 'Read' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: statusFilter === st.id ? 700 : 500,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: statusFilter === st.id ? 'var(--bg-card)' : 'transparent',
                  color: statusFilter === st.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: statusFilter === st.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input with Theme Bended Edges */}
        <div className="search-bar-bended" style={{ height: '44px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications by keywords, employee name, or task..."
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch('')}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

      </div>

      {/* Notifications List */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {filteredNotifications.length === 0 ? (
          // Empty State
          <div
            style={{
              padding: '4.5rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
              }}
            >
              <Inbox size={32} strokeWidth={1.5} />
            </div>
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              No notifications found
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                maxWidth: '380px',
                lineHeight: 1.5,
                marginBottom: '1.25rem',
              }}
            >
              {search
                ? `No notifications matched your query "${search}". Try different search terms or reset filters.`
                : statusFilter === 'unread'
                ? "You've read all your notifications! There are no unread alerts at this time."
                : 'No notifications present in this category yet.'}
            </p>

            {(search || selectedCategory !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setStatusFilter('all');
                }}
                className="btn btn-secondary btn-sm"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredNotifications.map((item, idx) => {
              const meta = getCategoryMeta(item.category);
              const IconComponent = meta.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.125rem',
                    padding: '1.125rem 1.5rem',
                    borderBottom: idx === filteredNotifications.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                    background: item.read ? 'var(--bg-card)' : 'var(--bg-card-hover)',
                    cursor: item.link ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.read ? 'var(--bg-card-hover)' : 'var(--primary-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = item.read ? 'var(--bg-card)' : 'var(--bg-card-hover)';
                  }}
                >
                  {/* Left Unread Bar Indicator */}
                  {!item.read && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: 'var(--primary)',
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-lg)',
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <IconComponent size={20} strokeWidth={2} />
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.9375rem',
                            fontWeight: item.read ? 600 : 700,
                            color: item.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                          }}
                        >
                          {item.title}
                        </span>

                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {meta.label}
                        </span>

                        {item.priority === 'urgent' && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                            }}
                          >
                            Urgent
                          </span>
                        )}
                        {item.priority === 'high' && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: '#fffbeb',
                              color: '#d97706',
                              border: '1px solid #fde68a',
                            }}
                          >
                            High
                          </span>
                        )}
                      </div>

                      {/* Time */}
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: item.read ? 'var(--text-muted)' : 'var(--text-secondary)',
                        lineHeight: 1.5,
                        marginBottom: '0.625rem',
                      }}
                    >
                      {item.message}
                    </p>

                    {/* Bottom row actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {item.link ? (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span>Open related item</span>
                          <ExternalLink size={13} />
                        </span>
                      ) : (
                        <span />
                      )}

                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => (item.read ? markAsUnread(item.id) : markAsRead(item.id))}
                          className="btn btn-ghost btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {item.read ? <EyeOff size={14} /> : <Check size={14} />}
                          <span>{item.read ? 'Mark unread' : 'Mark read'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteNotification(item.id)}
                          className="btn btn-ghost btn-sm"
                          title="Delete notification"
                          style={{
                            padding: '0.3rem 0.5rem',
                            color: 'var(--text-muted)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#dc2626';
                            e.currentTarget.style.background = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
