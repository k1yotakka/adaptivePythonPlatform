import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../../api/api';
import { Plus, Trash2, Code2, Save } from 'lucide-react';
import Button from '../../../components/UI/Button';
import './LessonEditor.css';

export default function LessonEditor() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lessonData = await api.getLesson(lessonId);
        setLesson(lessonData);
        setTitle(lessonData.title);
        setContent(lessonData.content || '');
        const allTasks = await api.getTasks();
        setTasks(allTasks.filter((t) => t.lesson_id === parseInt(lessonId)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [lessonId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateLesson(lessonId, { title, content });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="page-loading">Loading lesson...</div>;
  if (!lesson) return <div className="page-error">Lesson not found.</div>;

  return (
    <div className="lesson-editor">
      <header className="header-actions">
        <div className="page-title">
          <div className="text-sm" style={{ color: 'var(--text-teacher-secondary)', marginBottom: '4px' }}>
            <Link to="/teacher/courses">Courses</Link> / Lesson
          </div>
          <h1>Edit Lesson</h1>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          <Save size={16} />
          {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}
        </Button>
      </header>

      <div className="lesson-editor-body">
        <div className="editor-section">
          <label className="editor-label">Lesson Title</label>
          <input
            className="editor-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lesson title..."
          />
        </div>

        <div className="editor-section">
          <label className="editor-label">
            Content <span className="hint">Markdown supported: # heading, ```python code```, `inline`</span>
          </label>
          <textarea
            className="editor-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={'# Introduction\n\nWrite your lesson content here.\n\n```python\nprint("Hello!")\n```'}
            rows={18}
          />
        </div>

        <div className="editor-section">
          <div className="tasks-header">
            <label className="editor-label">Lesson Tasks</label>
            <Link
              to={`/teacher/task/create?lesson_id=${lessonId}`}
              className="btn btn-outline btn-sm"
            >
              <Plus size={14} />
              Add Task
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="tasks-empty-hint">
              No tasks yet. Add practice tasks for students to complete after reading this lesson.
            </div>
          ) : (
            <div className="lesson-tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className="lesson-task-row">
                  <Code2 size={14} />
                  <span className="lesson-task-title">{task.title}</span>
                  <span className="difficulty-chip">{task.difficulty}</span>
                  <button
                    className="icon-btn-danger small"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
