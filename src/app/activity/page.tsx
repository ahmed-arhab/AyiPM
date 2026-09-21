'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Activity,
  Filter,
  Search,
  Users,
  FolderKanban,
  CheckSquare,
  CalendarCheck,
  PlaneTakeoff,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function ActivityPage() {
  const { activityLog } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredLogs = activityLog.filter((log) => {
    const matchesType = filterType === 'all' || log.entityType === filterType;
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityName.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'employee':
        return <Users size={16} color="var(--primary)" />;
      case 'project':
        return <FolderKanban size={16} color="#a855f7" />;
      case 'task':
        return <CheckSquare size={16} color="#38bdf8" />;
      case 'attendance':
        return <CalendarCheck size={16} color="#10b981" />;
      case 'leave':
        return <PlaneTakeoff size={16} color="#f59e0b" />;
      default:
        return <Activity size={16} color="var(--text-secondary)" />;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div>
        <h1 className="heading-xl" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Activity size={28} color="var(--primary)" />
          <span>System Activity & Audit Trail</span>
        </h1>
        <p className="subtext" style={{ marginTop: '0.25rem' }}>
          Immutable ledger of every state change: onboarding, task transitions, attendance check-ins, and leave decisions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search audit actions, actors, or entity names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'attendance', 'leave', 'task', 'project', 'employee'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No activity log records found matching your filter criteria.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '1rem',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: '#f1f5f9',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {getEntityIcon(log.entityType)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.actorName}</span>
                    <span
                      className="badge badge-neutral"
                      style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', textTransform: 'capitalize' }}
                    >
                      {log.actorRole.replace('_', ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {log.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{log.action}:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{log.entityName}</strong>
                </div>

                {log.details && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.35rem',
                      background: '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-block',
                    }}
                  >
                    {log.details}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
