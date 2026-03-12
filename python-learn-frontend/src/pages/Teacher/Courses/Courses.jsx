import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../api/api';
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Button from '../../../components/UI/Button';
import './Courses.css';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const course = await api.createCourse({ title: newTitle, description: newDesc });
      setCourses([...courses, course]);
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      navigate(`/teacher/course/${course.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await api.deleteCourse(id);
      setCourses(courses.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      const updated = await api.updateCourse(course.id, { is_published: !course.is_published });
      setCourses(courses.map((c) => (c.id === course.id ? updated : c)));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="page-loading">Loading courses...</div>;

  return (
    <div className="teacher-courses">
      <header className="header-actions">
        <div className="page-title">
          <h1>Courses</h1>
          <p className="text-sm" style={{ color: 'var(--text-teacher-secondary)', marginTop: '4px' }}>
            Create and manage your courses, modules, and lessons.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Course
        </Button>
      </header>

      {showCreate && (
        <div className="create-course-card">
          <h3>Create New Course</h3>
          <form onSubmit={handleCreate} className="create-form">
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Python Basics"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What will students learn?"
                rows={3}
              />
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create & Build'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="courses-grid">
        {courses.map((course) => (
          <div key={course.id} className="course-card">
            <div className="course-card-top">
              <div className="course-card-icon">
                <BookOpen size={22} />
              </div>
              <div className={`course-status ${course.is_published ? 'published' : 'draft'}`}>
                {course.is_published ? 'Published' : 'Draft'}
              </div>
            </div>
            <h3 className="course-card-title">{course.title}</h3>
            {course.description && (
              <p className="course-card-desc">{course.description}</p>
            )}
            <div className="course-card-actions">
              <Link to={`/teacher/course/${course.id}`} className="btn btn-secondary btn-sm">
                <Edit size={14} />
                Build
              </Link>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleTogglePublish(course)}
                title={course.is_published ? 'Unpublish' : 'Publish'}
              >
                {course.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                {course.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(course.id)}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="courses-empty">
            <BookOpen size={48} />
            <h3>No courses yet</h3>
            <p>Create your first course to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
