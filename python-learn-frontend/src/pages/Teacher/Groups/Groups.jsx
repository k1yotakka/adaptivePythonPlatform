import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/api';
import Button from '../../../components/UI/Button';
import { Plus, Copy, Users, Trash2, Check, BarChart3 } from 'lucide-react';
import './Groups.css';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const group = await api.createGroup({ name: newName });
      setGroups([...groups, group]);
      setNewName('');
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this group? Students will lose access.')) return;
    try {
      await api.deleteGroup(id);
      setGroups(groups.filter((g) => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (group) => {
    const link = `${window.location.origin}/join/${group.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <div className="page-loading">Loading groups...</div>;

  return (
    <div className="teacher-groups">
      <header className="header-actions">
        <div className="page-title">
          <h1>Groups & Classes</h1>
          <p style={{ color: 'var(--text-teacher-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Create groups, share invite links, and manage your students.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Create Group
        </Button>
      </header>

      {showCreate && (
        <div className="create-group-card">
          <form onSubmit={handleCreate} className="create-group-form">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Group name, e.g. Python Basics - Fall 2025"
              autoFocus
              required
            />
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </form>
        </div>
      )}

      <div className="groups-grid">
        {groups.map((group) => (
          <div key={group.id} className="group-card">
            <div className="group-card-top">
              <div className="group-icon">
                <Users size={20} />
              </div>
              <button
                className="icon-btn-danger"
                onClick={() => handleDelete(group.id)}
                title="Delete group"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <h3 className="group-name">{group.name}</h3>

            <div className="group-stats">
              <span className="stat-chip">
                <Users size={13} />
                {group.student_count} students
              </span>
            </div>

            <div className="invite-section">
              <div className="invite-label">Invite Code</div>
              <div className="invite-box">
                <code className="invite-code">{group.invite_code}</code>
                <button
                  className={`copy-btn ${copiedId === group.id ? 'copied' : ''}`}
                  onClick={() => handleCopy(group)}
                  title="Copy invite link"
                >
                  {copiedId === group.id ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === group.id ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <Link to={`/teacher/group/${group.id}/stats`} className="group-stats-link">
              <BarChart3 size={14} />
              Student Statistics
            </Link>
          </div>
        ))}

        {groups.length === 0 && !showCreate && (
          <div className="groups-empty">
            <Users size={40} />
            <h3>No groups yet</h3>
            <p>Create a group and share the invite link with students.</p>
          </div>
        )}
      </div>
    </div>
  );
}
