'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Search,
  X,
  CheckSquare,
  FolderKanban,
  Users,
  Bell,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function GlobalSearch() {
  const router = useRouter();
  const { tasks, projects, employees, notifications } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute matches
  const cleanQ = query.trim().toLowerCase();
  const hasQuery = cleanQ.length > 0;

  const matchedTasks = hasQuery
    ? tasks.filter((t) => t.title.toLowerCase().includes(cleanQ) || t.projectName.toLowerCase().includes(cleanQ)).slice(0, 3)
    : [];

  const matchedProjects = hasQuery
    ? projects.filter((p) => p.name.toLowerCase().includes(cleanQ) || p.client.toLowerCase().includes(cleanQ)).slice(0, 3)
    : [];

  const matchedEmployees = hasQuery
    ? employees.filter((e) => e.name.toLowerCase().includes(cleanQ) || e.designation.toLowerCase().includes(cleanQ)).slice(0, 3)
    : [];

  const matchedNotifs = hasQuery
    ? notifications.filter((n) => n.title.toLowerCase().includes(cleanQ) || n.message.toLowerCase().includes(cleanQ)).slice(0, 2)
    : [];

  const totalResults = matchedTasks.length + matchedProjects.length + matchedEmployees.length + matchedNotifs.length;

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '380px',
      }}
    >
      {/* Bended Edges Pill Search Bar */}
      <div
        className="search-bar-bended"
        style={{
          width: '100%',
          height: '40px',
        }}
      >
        <Search size={16} className="search-icon" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Search tasks, projects, people..."
          aria-label="Global search"
        />

        {query ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            title="Clear search"
          >
            <X size={13} />
          </button>
        ) : (
          <div className="kbd-badge" title="Shortcut: Cmd + K">
            <span>⌘</span>
            <span>K</span>
          </div>
        )}
      </div>

      {/* Instant Search Results Dropdown */}
      {isOpen && hasQuery && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.16)',
            zIndex: 100,
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '0.5rem',
            animation: 'dropdown-slide 0.15s ease',
          }}
        >
          {totalResults === 0 ? (
            <div
              style={{
                padding: '1.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              No results found for &ldquo;<strong>{query}</strong>&rdquo;
            </div>
          ) : (
            <div>
              {/* Tasks Section */}
              {matchedTasks.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Tasks
                  </div>
                  {matchedTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelect('/tasks')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            background: 'var(--info-bg)',
                            color: 'var(--info)',
                            padding: '4px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                          }}
                        >
                          <CheckSquare size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {t.projectName} &bull; {t.priority}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={13} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              )}

              {/* Projects Section */}
              {matchedProjects.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Projects
                  </div>
                  {matchedProjects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect('/projects')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: 'var(--accent-purple)',
                            padding: '4px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                          }}
                        >
                          <FolderKanban size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {p.client} &bull; {p.progress}% done
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={13} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              )}

              {/* People Section */}
              {matchedEmployees.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    People
                  </div>
                  {matchedEmployees.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => handleSelect('/team')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <img
                          src={e.avatar}
                          alt={e.name}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {e.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {e.designation} &bull; {e.department}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={13} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              )}

              {/* Notifications Section */}
              {matchedNotifs.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Notifications
                  </div>
                  {matchedNotifs.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleSelect(n.link || '/notifications')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            background: 'var(--warning-bg)',
                            color: 'var(--warning)',
                            padding: '4px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                          }}
                        >
                          <Bell size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {n.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '240px',
                            }}
                          >
                            {n.message}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={13} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
