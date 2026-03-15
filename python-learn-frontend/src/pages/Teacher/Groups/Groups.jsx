import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/api';
import Button from '../../../components/UI/Button';
import { Plus, Copy, Users, Trash2, Check, BarChart3, Edit2, BookOpen } from 'lucide-react';
import './Groups.css';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCourseIds, setNewCourseIds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCourseIds, setEditCourseIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsData, coursesData] = await Promise.all([
        api.getGroups(),
        api.getCourses(),
      ]);
      setGroups(groupsData);
      setCourses(coursesData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCourseId = (id, selected, setSelected) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((c) => c !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const group = await api.createGroup({ name: newName, course_ids: newCourseIds });
      setGroups([...groups, group]);
      setNewName('');
      setNewCourseIds([]);
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (group) => {
    setEditingGroup(group.id);
    setEditName(group.name);
    setEditCourseIds(group.course_ids || []);
  };

  const handleSaveEdit = async (groupId) => {
    setSaving(true);
    try {
      const updated = await api.updateGroup(groupId, { name: editName, course_ids: editCourseIds });
      setGroups(groups.map((g) => (g.id === groupId ? updated : g)));
      setEditingGroup(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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

  const getCourseNames = (courseIds) => {
    if (!courseIds || courseIds.length === 0) return null;
    return courseIds
      .map((id) => courses.find((c) => c.id === id)?.title)
      .filter(Boolean);
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
        <Button variant="primary" onClick={() => { setShowCreate(true); setEditingGroup(null); }}>
          <Plus size={16} />
          Create Group
        </Button>
      </header>

      {showCreate && (
        <div className="create-group-card">
          <h3 style={{ marginBottom: '12px' }}>New Group</h3>
          <form onSubmit={handleCreate} className="create-group-form">
            <div className="form-group">
              <label>Group Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Python Basics - Fall 2025"
                autoFocus
                required
              />
            </div>
            {courses.length > 0 && (
              <div className="form-group">
                <label>Attach Courses (optional)</label>
                <div className="course-checkboxes">
                  {courses.map((c) => (
                    <label key={c.id} className="course-checkbox-item">
                      <input
                        type="checkbox"
                        checked={newCourseIds.includes(c.id)}
                        onChange={() => toggleCourseId(c.id, newCourseIds, setNewCourseIds)}
                      />
                      <BookOpen size={14} />
                      {c.title}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="form-actions-row">
              <Button type="submit" variant="primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="groups-grid">
        {groups.map((group) => (
          <div key={group.id} className="group-card">
            {editingGroup === group.id ? (
              <div className="group-edit-form">
                <input
                  className="group-edit-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                {courses.length > 0 && (
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-teacher-secondary)' }}>Courses</label>
                    <div className="course-checkboxes">
                      {courses.map((c) => (
                        <label key={c.id} className="course-checkbox-item">
                          <input
                            type="checkbox"
                            checked={editCourseIds.includes(c.id)}
                            onChange={() => toggleCourseId(c.id, editCourseIds, setEditCourseIds)}
                          />
                          <BookOpen size={14} />
                          {c.title}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="form-actions-row" style={{ marginTop: '10px' }}>
                  <Button variant="primary" onClick={() => handleSaveEdit(group.id)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="secondary" onClick={() => setEditingGroup(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="group-card-top">
                  <div className="group-icon">
                    <Users size={20} />
                  </div>
                  <div className="group-card-actions">
                    <button
                      className="icon-btn"
                      onClick={() => handleStartEdit(group)}
                      title="Edit group"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="icon-btn-danger"
                      onClick={() => handleDelete(group.id)}
                      title="Delete group"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="group-name">{group.name}</h3>

                {getCourseNames(group.course_ids)?.length > 0 && (
                  <div className="group-courses">
                    {getCourseNames(group.course_ids).map((name) => (
                      <span key={name} className="course-chip">
                        <BookOpen size={11} />
                        {name}
                      </span>
                    ))}
                  </div>
                )}

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
              </>
            )}
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