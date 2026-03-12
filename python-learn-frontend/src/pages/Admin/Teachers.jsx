import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import Button from '../../components/UI/Button';
import './Teachers.css';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const teacher = await api.createTeacher({ ...form, role: 'teacher' });
      setTeachers([...teachers, teacher]);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      setError(err.message || 'Failed to create teacher.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this teacher?')) return;
    try {
      await api.deleteTeacher(id);
      setTeachers(teachers.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="page-loading">Loading teachers...</div>;

  return (
    <div className="admin-teachers">
      <header className="header-actions">
        <div className="page-title">
          <h1>Manage Teachers</h1>
          <p className="text-sm" style={{ color: 'var(--text-teacher-secondary)', marginTop: '4px' }}>
            Add and remove teacher accounts.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Add Teacher
        </Button>
      </header>

      {showCreate && (
        <div className="create-card">
          <h3>Add New Teacher</h3>
          <form onSubmit={handleCreate} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="teacher@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={creating}>
                {creating ? 'Adding...' : 'Add Teacher'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="teachers-list">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="teacher-row">
            <div className="teacher-avatar">
              {teacher.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="teacher-info">
              <div className="teacher-name">{teacher.name}</div>
              <div className="teacher-email">{teacher.email}</div>
            </div>
            <div className="teacher-badge">
              <UserCheck size={14} />
              Teacher
            </div>
            <button className="icon-btn-danger" onClick={() => handleDelete(teacher.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {teachers.length === 0 && (
          <div className="teachers-empty">
            <UserCheck size={40} />
            <p>No teachers yet. Add the first one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
