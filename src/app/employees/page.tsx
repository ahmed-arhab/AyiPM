'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Employee, UserRole } from '@/types';
import Modal from '@/components/Modal';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Briefcase,
  UserCheck,
  UserX,
  X,
  Filter,
} from 'lucide-react';

export default function EmployeesPage() {
  const { employees, currentRole, addEmployee, toggleEmployeeStatus, projects } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    designation: '',
    role: 'employee' as UserRole,
    phone: '',
    location: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  });

  const departments = ['all', 'Engineering', 'Product', 'Operations'];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.designation) {
      alert('Please fill out all required fields.');
      return;
    }
    addEmployee({
      ...formData,
      status: 'active',
      joinDate: new Date().toISOString().slice(0, 10),
    });
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      email: '',
      department: 'Engineering',
      designation: '',
      role: 'employee',
      phone: '',
      location: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });
  };

  return (
    <div className="page-container">
      {/* Page Title & Onboarding CTA */}
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
            <Users size={28} color="var(--primary)" />
            <span>Employee Directory</span>
          </h1>
          <p className="subtext" style={{ marginTop: '0.25rem' }}>
            Manage staff profiles, department structures, designations, and system roles.
          </p>
        </div>

        {currentRole === 'admin' ? (
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Onboard Employee</span>
          </button>
        ) : (
          <div
            style={{
              fontSize: '0.8rem',
              background: '#f1f5f9',
              color: 'var(--text-secondary)',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Admin role required to onboard employees
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
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
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by name, email, or designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'all' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Designation</th>
              <th>System Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No employees found matching the filters.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <img src={emp.avatar} alt={emp.name} className="avatar" style={{ width: '38px', height: '38px' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: '#60a5fa',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {emp.department}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{emp.designation}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        color: emp.role === 'admin' ? '#f59e0b' : emp.role === 'project_manager' ? '#38bdf8' : '#10b981',
                      }}
                    >
                      {emp.role === 'admin' ? <Shield size={14} /> : emp.role === 'project_manager' ? <Briefcase size={14} /> : null}
                      {emp.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.joinDate}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="btn btn-sm btn-secondary"
                      >
                        Profile
                      </button>

                      {currentRole === 'admin' && (
                        <button
                          onClick={() => toggleEmployeeStatus(emp.id)}
                          className={`btn btn-sm ${emp.status === 'active' ? 'btn-outline' : 'btn-success'}`}
                          title={emp.status === 'active' ? 'Deactivate employee' : 'Reactivate employee'}
                        >
                          {emp.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                          <span>{emp.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Employee"
      >
        <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Email *</label>
            <input
              type="email"
              required
              placeholder="alex.m@ayipm.io"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior QA Engineer"
                className="form-input"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">System Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value="employee">Employee</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA"
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="text"
              placeholder="+1 (555) 000-0000"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Onboard Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee Profile Details Drawer / Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          title={`Employee Profile: ${selectedEmployee.name}`}
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="avatar"
                style={{ width: '64px', height: '64px' }}
              />
              <div>
                <h3 className="heading-md">{selectedEmployee.name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedEmployee.designation} • {selectedEmployee.department}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <span className={`badge ${selectedEmployee.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {selectedEmployee.status}
                  </span>
                  <span className="badge badge-neutral">Role: {selectedEmployee.role.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.875rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Mail size={16} color="var(--text-muted)" />
                <span>{selectedEmployee.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Phone size={16} color="var(--text-muted)" />
                <span>{selectedEmployee.phone || '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <MapPin size={16} color="var(--text-muted)" />
                <span>{selectedEmployee.location || 'Remote'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <span>Joined {selectedEmployee.joinDate}</span>
              </div>
            </div>

            {/* Assigned projects */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Assigned Projects
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {projects.filter((p) => p.members.includes(selectedEmployee.id)).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No active projects currently assigned.
                  </div>
                ) : (
                  projects
                    .filter((p) => p.members.includes(selectedEmployee.id))
                    .map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: '0.625rem 0.875rem',
                          borderRadius: 'var(--radius-sm)',
                          background: '#f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                        }}
                      >
                        <span>{p.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{p.progress}% done</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setSelectedEmployee(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
