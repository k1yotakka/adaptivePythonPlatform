import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/api';
import { Plus, Trash2, ChevronDown, ChevronRight, BookOpen, Code2 } from 'lucide-react';
import Button from '../../../components/UI/Button';
import './CourseBuilder.css';

export default function CourseBuilder() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [openModules, setOpenModules] = useState({});
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [showNewModule, setShowNewModule] = useState(false);
  const [newLessonTitles, setNewLessonTitles] = useState({});
  const [showNewLesson, setShowNewLesson] = useState({});

  useEffect(() => {
    loadAll();
  }, [courseId]);

  const loadAll = async () => {
    try {
      const [courseData, modulesData] = await Promise.all([
        api.getCourse(courseId),
        api.getModules(courseId),
      ]);
      setCourse(courseData);
      setModules(modulesData);
      const lessonsMap = {};
      for (const m of modulesData) {
        lessonsMap[m.id] = await api.getLessons(m.id);
      }
      setLessons(lessonsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (id) => setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    try {
      const mod = await api.createModule(courseId, { title: newModuleTitle, order: modules.length + 1 });
      setModules([...modules, mod]);
      setLessons({ ...lessons, [mod.id]: [] });
      setNewModuleTitle('');
      setShowNewModule(false);
      setOpenModules((prev) => ({ ...prev, [mod.id]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    try {
      await api.deleteModule(moduleId);
      setModules(modules.filter((m) => m.id !== moduleId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLesson = async (e, moduleId) => {
    e.preventDefault();
    const title = newLessonTitles[moduleId];
    if (!title?.trim()) return;
    try {
      const lesson = await api.createLesson(moduleId, {
        title,
        order: (lessons[moduleId] || []).length + 1,
      });
      setLessons({ ...lessons, [moduleId]: [...(lessons[moduleId] || []), lesson] });
      setNewLessonTitles({ ...newLessonTitles, [moduleId]: '' });
      setShowNewLesson({ ...showNewLesson, [moduleId]: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.deleteLesson(lessonId);
      setLessons({ ...lessons, [moduleId]: lessons[moduleId].filter((l) => l.id !== lessonId) });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="page-loading">Loading course builder...</div>;
  if (!course) return <div className="page-error">Course not found.</div>;

  return (
    <div className="course-builder">
      <header className="header-actions">
        <div className="page-title">
          <div className="text-sm" style={{ color: 'var(--text-teacher-secondary)', marginBottom: '4px' }}>
            <Link to="/teacher/courses">Courses</Link> / Builder
          </div>
          <h1>{course.title}</h1>
        </div>
        <Button variant="primary" onClick={() => setShowNewModule(true)}>
          <Plus size={16} />
          Add Module
        </Button>
      </header>

      <div className="builder-modules">
        {modules.map((module, idx) => (
          <div key={module.id} className="builder-module">
            <div className="module-header" onClick={() => toggleModule(module.id)}>
              <div className="module-header-left">
                {openModules[module.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <BookOpen size={16} />
                <span className="module-title">{module.title}</span>
                <span className="module-count">{(lessons[module.id] || []).length} lessons</span>
              </div>
              <button
                className="icon-btn-danger"
                onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {openModules[module.id] && (
              <div className="module-body">
                {(lessons[module.id] || []).map((lesson) => (
                  <div key={lesson.id} className="lesson-item">
                    <BookOpen size={14} />
                    <Link to={`/teacher/lesson/${lesson.id}/edit`} className="lesson-item-title">
                      {lesson.title}
                    </Link>
                    <button
                      className="icon-btn-danger small"
                      onClick={() => handleDeleteLesson(module.id, lesson.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {showNewLesson[module.id] ? (
                  <form onSubmit={(e) => handleAddLesson(e, module.id)} className="inline-add-form">
                    <input
                      type="text"
                      value={newLessonTitles[module.id] || ''}
                      onChange={(e) => setNewLessonTitles({ ...newLessonTitles, [module.id]: e.target.value })}
                      placeholder="Lesson title"
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Add</button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowNewLesson({ ...showNewLesson, [module.id]: false })}
                    >Cancel</button>
                  </form>
                ) : (
                  <button
                    className="add-lesson-btn"
                    onClick={() => setShowNewLesson({ ...showNewLesson, [module.id]: true })}
                  >
                    <Plus size={14} />
                    Add Lesson
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {showNewModule && (
          <form onSubmit={handleAddModule} className="new-module-form">
            <input
              type="text"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Module title, e.g. Functions & Scope"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="submit" variant="primary">Add Module</Button>
              <Button type="button" variant="secondary" onClick={() => setShowNewModule(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {modules.length === 0 && !showNewModule && (
          <div className="builder-empty">
            <BookOpen size={40} />
            <p>No modules yet. Click "Add Module" to start building your course.</p>
          </div>
        )}
      </div>
    </div>
  );
}
