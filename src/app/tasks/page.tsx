'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Task, TaskPriority, TaskStatus } from '@/types';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import {
  CheckSquare,
  Plus,
  Filter,
  MessageSquare,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  History,
  CheckCircle2,
} from 'lucide-react';

export default function TasksPage() {
  const {
    tasks,
    projects,
    employees,
    currentRole,
    currentUser,
    addTask,
    updateTaskStatus,
    addTaskComment,
  } = useApp();

  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');

  // New task form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projects[0]?.id || 'proj-1',
    assigneeId: employees[0]?.id || 'emp-1',
    priority: 'medium' as TaskPriority,
    dueDate: '',
    status: 'backlog' as TaskStatus,
  });

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'backlog', label: 'To Do', color: '#94a3b8' },
    { id: 'in_progress', label: 'In Progress', color: '#38bdf8' },
    { id: 'review', label: 'Review', color: '#fbbf24' },
    { id: 'done', label: 'Done', color: '#34d399' },
  ];

  const filteredTasks = tasks.filter((t) => {
    const matchProj = projectFilter === 'all' || t.projectId === projectFilter;
    const matchPrio = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchAssignee = assigneeFilter === 'all' || t.assigneeId === assigneeFilter;
    return matchProj && matchPrio && matchAssignee;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      alert('Please fill out all required fields.');
      return;
    }
    const proj = projects.find((p) => p.id === formData.projectId);
    const emp = employees.find((e) => e.id === formData.assigneeId);

    addTask({
      title: formData.title,
      description: formData.description,
      projectId: formData.projectId,
      projectName: proj?.name || 'General Project',
      assigneeId: formData.assigneeId,
      assigneeName: emp?.name || 'Unassigned',
      assigneeAvatar: emp?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      priority: formData.priority,
      dueDate: formData.dueDate,
      status: formData.status,
    });

    setIsNewTaskModalOpen(false);
    setFormData({
      title: '',
      description: '',
      projectId: projects[0]?.id || 'proj-1',
      assigneeId: employees[0]?.id || 'emp-1',
      priority: 'medium',
      dueDate: '',
      status: 'backlog',
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    addTaskComment(selectedTask.id, commentText.trim());
    // update local reference in modal
    setSelectedTask({
      ...selectedTask,
      comments: [
        ...selectedTask.comments,
        {
          id: `c-${Date.now()}`,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          text: commentText.trim(),
          timestamp: 'Just now',
        },
      ],
    });
    setCommentText('');
  };

  const todayStr = new Date().toISOString().slice(0, 10);

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
            <CheckSquare size={28} color="var(--primary)" />
            <span>Tasks & Delivery Kanban</span>
          </h1>
          <p className="subtext" style={{ marginTop: '0.25rem' }}>
            Agile task boards, multi-assignee tracking, due-date audit, and collaborative discussion threads.
          </p>
        </div>

        <button onClick={() => setIsNewTaskModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Filter by:</span>
        </div>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="all">All Assignees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        {(projectFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
          <button
            onClick={() => {
              setProjectFilter('all');
              setPriorityFilter('all');
              setAssigneeFilter('all');
            }}
            className="btn btn-sm btn-outline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Kanban Board Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '520px',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: col.color,
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{col.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: '#e2e8f0',
                    color: 'var(--text-secondary)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600,
                  }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div
                style={{
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  flex: 1,
                }}
              >
                {colTasks.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                    }}
                  >
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isOverdue = task.dueDate < todayStr && task.status !== 'done';

                    return (
                      <div
                        key={task.id}
                        className="glass-card"
                        style={{
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#38bdf8',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {task.projectName}
                          </span>
                          <StatusBadge type="task-priority" status={task.priority} />
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {task.title}
                        </div>

                        <p
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {task.description}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: '0.5rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <img
                              src={task.assigneeAvatar}
                              alt={task.assigneeName}
                              title={task.assigneeName}
                              className="avatar"
                              style={{ width: '22px', height: '22px' }}
                            />
                            <span style={{ color: 'var(--text-secondary)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.assigneeName}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                              fontWeight: isOverdue ? 600 : 400,
                            }}
                          >
                            <Calendar size={13} />
                            <span>{task.dueDate}</span>
                          </div>
                        </div>

                        {/* Quick column move options */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f1f5f9',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.3rem 0.5rem',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Move to:</span>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {columns
                              .filter((c) => c.id !== task.status)
                              .map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => updateTaskStatus(task.id, c.id)}
                                  className="btn btn-sm btn-outline"
                                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
                                >
                                  {c.label}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="Create New Delivery Task"
      >
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement schema migration runner"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed acceptance criteria and task notes..."
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select
                className="form-select"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assignee *</label>
              <select
                className="form-select"
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsNewTaskModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Details & Comments Drawer / Modal */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={`Task: ${selectedTask.title}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                {selectedTask.projectName}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <StatusBadge type="task-priority" status={selectedTask.priority} />
                <StatusBadge type="task-status" status={selectedTask.status} />
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {selectedTask.description || 'No detailed description provided.'}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: '#f8fafc',
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Assigned to:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <img src={selectedTask.assigneeAvatar} alt={selectedTask.assigneeName} className="avatar" style={{ width: '26px', height: '26px' }} />
                  <span style={{ fontWeight: 600 }}>{selectedTask.assigneeName}</span>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Target Deadline:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  <Calendar size={15} />
                  <span>{selectedTask.dueDate}</span>
                </div>
              </div>
            </div>

            {/* Change Status Controls */}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Change Workflow Status
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                {columns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      updateTaskStatus(selectedTask.id, c.id);
                      setSelectedTask({ ...selectedTask, status: c.id });
                    }}
                    className={`btn btn-sm ${selectedTask.status === c.id ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments Thread */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <MessageSquare size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Comments & Notes</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedTask.comments.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No comments yet. Start the conversation below.
                  </div>
                ) : (
                  selectedTask.comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.825rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: '#38bdf8' }}>{c.authorName}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.timestamp}</span>
                      </div>
                      <div style={{ color: 'var(--text-primary)' }}>{c.text}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Add a comment or progress note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
