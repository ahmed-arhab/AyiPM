'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Inbox,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  X,
} from 'lucide-react';

interface NotificationDropdownProps {
  // Optional custom trigger or class
  className?: string;
}

export default function NotificationDropdown({ className }: NotificationDropdownProps) {
  const router = useRouter();
  const {
    notifications,
    unreadNotificationsCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
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
      return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return timestamp;
    }
  };

  // Category visual styles & icons
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

  // Filtered notifications
  const filteredNotifications = notifications.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (unreadOnly && item.read) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = item.title.toLowerCase().includes(q) || item.message.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });


  const categoryCounts = {
    all: notifications.length,
    task: notifications.filter((n) => n.category === 'task').length,
    leave: notifications.filter((n) => n.category === 'leave').length,
    attendance: notifications.filter((n) => n.category === 'attendance').length,
    system: notifications.filter((n) => n.category === 'system').length,
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>
      {/* Trigger Button with Animated Alert Counter */}
      <button
        type="button"
        id="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadNotificationsCount} unread)`}
        aria-expanded={isOpen}
        title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread notifications` : 'Notifications'}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-lg)',
          background: isOpen ? 'var(--bg-elevated)' : 'var(--bg-card)',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border-medium)',
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'var(--shadow-sm)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
        <Bell size={19} strokeWidth={2.1} />

        {/* Dynamic Badge Counter */}
        {unreadNotificationsCount > 0 && (
          <span
            id="notification-unread-badge"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '20px',
              height: '20px',
              padding: '0 5px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontSize: '0.6875rem',
              fontWeight: 800,
              lineHeight: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.45), 0 0 0 2px var(--bg-card)',
              animation: unreadNotificationsCount > 0 ? 'pulse-alert 2.5s infinite ease-in-out' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Global CSS for alert pulse */}
      <style jsx global>{`
        @keyframes pulse-alert {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.12);
          }
        }
      `}</style>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: 'min(440px, calc(100vw - 24px))',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.04)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'dropdown-slide 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.125rem 1.25rem 0.875rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <h3
                  style={{
                    fontSize: '1.0625rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em',
                  }}
                >
                  Notifications
                </h3>
                {unreadNotificationsCount > 0 ? (
                  <span
                    style={{
                      background: '#eff6ff',
                      color: 'var(--primary)',
                      border: '1px solid #bfdbfe',
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {unreadNotificationsCount} unread
                  </span>
                ) : (
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: 'var(--text-muted)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    All caught up
                  </span>
                )}
              </div>

              {/* Action buttons in header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    id="mark-all-read-btn"
                    title="Mark all as read"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'var(--bg-card-nested, #f8fafc)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.35rem 0.65rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-glow)';
                      e.currentTarget.style.color = 'var(--primary)';
                      e.currentTarget.style.borderColor = 'var(--border-focus)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card-nested, #f8fafc)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                paddingBottom: '0.25rem',
              }}
            >
              {[
                { id: 'all', label: 'All', count: categoryCounts.all },
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
                      gap: '0.35rem',
                      padding: '0.35rem 0.7rem',
                      borderRadius: 'var(--radius-full)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                      background: isSelected ? 'var(--primary)' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        opacity: isSelected ? 0.9 : 0.7,
                        fontWeight: 600,
                      }}
                    >
                      ({tab.count})
                    </span>
                  </button>
                );
              })}

              {/* Unread Only filter button */}
              <button
                type="button"
                onClick={() => setUnreadOnly(!unreadOnly)}
                title={unreadOnly ? 'Show all' : 'Show unread only'}
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.35rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  border: unreadOnly ? '1px solid #bae6fd' : '1px solid var(--border-subtle)',
                  background: unreadOnly ? '#f0f9ff' : 'transparent',
                  color: unreadOnly ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Filter size={11} />
                <span>{unreadOnly ? 'Unread' : 'Filter'}</span>
              </button>
            </div>

            {/* Quick Search with Bended Edges */}
            <div style={{ marginTop: '0.625rem' }}>
              <div
                className="search-bar-bended"
                style={{
                  height: '36px',
                  padding: '0.15rem 0.5rem 0.15rem 0.75rem',
                  background: 'var(--bg-card-nested, #f8fafc)',
                }}
              >
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick filter alerts..."
                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    style={{ width: '18px', height: '18px' }}
                    title="Clear filter"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* Notification List Container */}
          <div
            id="notification-items-list"
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              background: 'var(--bg-card)',
            }}
          >
            {filteredNotifications.length === 0 ? (
              // Empty State
              <div
                style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    marginBottom: '1rem',
                  }}
                >
                  <Inbox size={26} strokeWidth={1.75} />
                </div>
                <h4
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {unreadOnly
                    ? 'No unread notifications'
                    : selectedCategory !== 'all'
                    ? `No ${selectedCategory} notifications`
                    : 'No notifications'}
                </h4>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                    maxWidth: '260px',
                    lineHeight: 1.45,
                  }}
                >
                  {unreadOnly
                    ? 'Great job! You have cleared all your unread alerts.'
                    : 'When tasks are updated or requests come in, they will appear here.'}
                </p>
                {unreadOnly && (
                  <button
                    type="button"
                    onClick={() => setUnreadOnly(false)}
                    style={{
                      marginTop: '0.875rem',
                      background: 'var(--bg-card-nested, #f8fafc)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      cursor: 'pointer',
                    }}
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              // List of notification items
              filteredNotifications.map((item) => {
                const meta = getCategoryMeta(item.category);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.875rem',
                      padding: '0.875rem 1.125rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: item.read ? 'var(--bg-card)' : 'var(--bg-card-hover)',
                      cursor: item.link ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = item.read ? 'var(--bg-card-hover)' : 'var(--primary-glow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = item.read ? 'var(--bg-card)' : 'var(--bg-card-hover)';
                    }}
                  >
                    {/* Unread pulse dot on the left */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '6px',
                        top: '1.25rem',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: item.read ? 'transparent' : 'var(--primary)',
                        boxShadow: item.read ? 'none' : '0 0 6px rgba(2, 132, 199, 0.6)',
                      }}
                    />

                    {/* Category Icon Badge */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
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
                      <IconComponent size={18} strokeWidth={2} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.84rem',
                              fontWeight: item.read ? 600 : 700,
                              color: item.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                              lineHeight: 1.3,
                            }}
                          >
                            {item.title}
                          </span>

                          {/* Priority tag if high/urgent */}
                          {item.priority === 'urgent' && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '1px 5px',
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
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '1px 5px',
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

                        {/* Relative time */}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      {/* Notification message */}
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: item.read ? 'var(--text-muted)' : 'var(--text-secondary)',
                          lineHeight: 1.45,
                          marginBottom: '0.35rem',
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.message}
                      </p>

                      {/* Footer actions for this notification */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '0.25rem',
                        }}
                      >
                        {/* Target link indicator */}
                        {item.link ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--primary)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <span>Open details</span>
                            <ExternalLink size={11} />
                          </span>
                        ) : (
                          <span />
                        )}

                        {/* Item Quick Actions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Toggle Read/Unread */}
                          <button
                            type="button"
                            onClick={() => (item.read ? markAsUnread(item.id) : markAsRead(item.id))}
                            title={item.read ? 'Mark as unread' : 'Mark as read'}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '3px 6px',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.7rem',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--primary)';
                              e.currentTarget.style.background = '#f1f5f9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {item.read ? <EyeOff size={13} /> : <Check size={13} />}
                            <span>{item.read ? 'Unread' : 'Read'}</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => deleteNotification(item.id)}
                            title="Remove notification"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '3px 5px',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
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
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div
            style={{
              padding: '0.75rem 1.125rem',
              borderTop: '1px solid var(--border-subtle)',
              background: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>View all notifications</span>
              <ExternalLink size={12} />
            </Link>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all notifications?')) {
                    clearAllNotifications();
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
