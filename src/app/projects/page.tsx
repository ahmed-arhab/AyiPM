'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ProjectStatus } from '@/types';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import {
  FolderKanban,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react';

export default function ProjectsPage() {
  const { projects, employees, currentRole, addProject, updateProjectStatus } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    client: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'planning' as ProjectStatus,
    members: [] as string[],
  });

  const statuses: { label: string; value: string }[] = [
    { label: 'All Projects', value: 'all' },
    { label: 'Planning', value: 'planning' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'In Review', value: 'in_review' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Completed', value: 'completed' },
  ];

  const filteredProjects = projects.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.client || !form.endDate) {
      alert('Please fill out all required fields.');
      return;
    }
    addProject({
      ...form,
      members: form.members.length > 0 ? form.members : [employees[0].id],
    });
    setIsNewModalOpen(false);
    setForm({
      name: '',
      client: '',
      description: '',
      startDate: '',
      endDate: '',
      budget: '',
      status: 'planning',
      members: [],
    });
  };

  const toggleMemberSelection = (empId: string) => {
    setForm((prev) => {
      const exists = prev.members.includes(empId);
      return {
        ...prev,
        members: exists ? prev.members.filter((id) => id !== empId) : [...prev.members, empId],
      };
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 className="heading-xl" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <FolderKanban size={28} color="var(--primary)" />
            <span>Projects Portfolio</span>
          </h1>
          <p className="subtext" style={{ marginTop: '0.25rem' }}>
            Deliverable tracking across five lifecycle phases, client accounts, budget, and assigned team members.
          </p>
        </div>

        {(currentRole === 'admin' || currentRole === 'project_manager') && (
          <button onClick={() => setIsNewModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
        }}
      >
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`btn btn-sm ${filterStatus === s.value ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {filteredProjects.length === 0 ? (
          <div
            className="glass-card"
            style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}
          >
            No projects found for the selected status filter.
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <h3 className="heading-md">{project.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Client: <strong style={{ color: 'var(--text-primary)' }}>{project.client}</strong>
                  </div>
                </div>
                <StatusBadge type="project" status={project.status} />
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {project.description}
              </p>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontWeight: 600 }}>{project.progress}%</span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                }}
              >
                <div>
                  <span>Timeline:</span>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>
                    {project.startDate} to {project.endDate}
                  </div>
                </div>
                {project.budget && (
                  <div>
                    <span>Budget:</span>
                    <div style={{ color: '#34d399', fontWeight: 600, marginTop: '2px' }}>
                      {project.budget}
                    </div>
                  </div>
                )}
              </div>

              {/* Members and Status quick changer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                }}
              >
                <div className="avatar-group">
                  {project.members.map((mId) => {
                    const emp = employees.find((e) => e.id === mId);
                    if (!emp) return null;
                    return (
                      <img
                        key={mId}
                        src={emp.avatar}
                        alt={emp.name}
                        title={emp.name}
                        className="avatar"
                        style={{ width: '28px', height: '28px' }}
                      />
                    );
                  })}
                </div>

                {(currentRole === 'admin' || currentRole === 'project_manager') && (
                  <select
                    value={project.status}
                    onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                    className="form-select"
                    style={{ width: 'auto', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create New Delivery Project"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Cloud Sync v2"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Client / Department *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Global Financial"
              className="form-input"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              placeholder="Summary of project goals and deliverables..."
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Completion *</label>
              <input
                type="date"
                required
                className="form-input"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Budget Allocation</label>
              <input
                type="text"
                placeholder="$50,000"
                className="form-input"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Team Members</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto' }}>
              {employees.map((emp) => {
                const isSelected = form.members.includes(emp.id);
                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => toggleMemberSelection(emp.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? '#f0f9ff' : '#f8fafc',
                      border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <img src={emp.avatar} alt={emp.name} className="avatar" style={{ width: '22px', height: '22px' }} />
                    <span style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {emp.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsNewModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
