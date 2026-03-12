import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/api';
import { Plus, Trash2, Code2, Layers, Edit2 } from 'lucide-react';
import Button from '../../../components/UI/Button';
import './TaskLibrary.css';

const DIFFICULTY_COLORS = {
  easy: { bg: '#DCFCE7', text: '#166534' },
  medium: { bg: '#FEF9C3', text: '#854D0E' },
  hard: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function TaskLibrary() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.task_type === filter);

  if (isLoading) return <div className="page-loading">Loading tasks...</div>;

  return (
    <div className="task-library">
      <header className="header-actions">
        <div className="page-title">
          <h1>Task Library</h1>
          <p className="text-sm" style={{ color: 'var(--text-teacher-secondary)', marginTop: '4px' }}>
            All your tasks — lesson tasks and standalone challenges.
          </p>
        </div>
        <Link to="/teacher/task/create" className="btn btn-primary">
          <Plus size={16} />
          Create Task
        </Link>
      </header>

      <div className="task-filters">
        {['all', 'lesson', 'standalone'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Tasks' : f === 'lesson' ? 'Lesson Tasks' : 'Standalone'}
          </button>
        ))}
        <span className="task-count">{filtered.length} tasks</span>
      </div>

      <div className="tasks-table">
        {filtered.map((task) => {
          const colors = DIFFICULTY_COLORS[task.difficulty] || DIFFICULTY_COLORS.easy;
          return (
            <div key={task.id} className="task-row-item">
              <div className="task-row-icon">
                {task.task_type === 'standalone' ? <Layers size={16} /> : <Code2 size={16} />}
              </div>
              <div className="task-row-content">
                <div className="task-row-title">{task.title}</div>
                <div className="task-row-meta">
                  <span
                    className="difficulty-badge"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {task.difficulty}
                  </span>
                  <span className="type-badge">
                    {task.task_type === 'standalone' ? 'Standalone' : 'Lesson Task'}
                  </span>
                  {task.topic && (
                    <span className="type-badge">{task.topic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  )}
                  {task.level && (
                    <span className="type-badge" style={{ textTransform: 'capitalize' }}>{task.level}</span>
                  )}
                </div>
              </div>
              <div className="task-row-actions">
                <Link
                  to={`/teacher/task/edit/${task.id}`}
                  className="icon-btn"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </Link>
                <button
                  className="icon-btn-danger"
                  onClick={() => handleDelete(task.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="tasks-empty">
            <Code2 size={40} />
            <p>No tasks found. Create your first task.</p>
          </div>
        )}
      </div>
    </div>
  );
}
