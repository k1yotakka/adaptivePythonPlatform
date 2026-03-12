import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/api';
import { Code2, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import './TaskList.css';

const DIFFICULTY_COLORS = {
  easy: { bg: '#DCFCE7', text: '#166534' },
  medium: { bg: '#FEF9C3', text: '#854D0E' },
  hard: { bg: '#FEE2E2', text: '#991B1B' },
};

const TOPIC_ICONS = {
  loops: '🔁', functions: '⚙️', data_types: '📦', oop: '🏗️',
  strings: '📝', lists_dicts: '🗂️', algorithms: '🧮', files: '📁',
  exceptions: '⚠️', recursion: '🔄',
};

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [diffFilter, setDiffFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await api.getTasks('standalone');
        setTasks(data);
        // Load statuses for all tasks
        const statusMap = {};
        await Promise.all(data.map(async (t) => {
          try {
            const s = await api.getTaskStatus(t.id);
            statusMap[t.id] = s;
          } catch { statusMap[t.id] = { status: 'not_started', attempts: 0 }; }
        }));
        setStatuses(statusMap);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Group by topic
  const topicGroups = {};
  tasks.forEach((t) => {
    const key = t.topic || 'other';
    if (!topicGroups[key]) topicGroups[key] = [];
    topicGroups[key].push(t);
  });
  const topicKeys = Object.keys(topicGroups).sort((a, b) => {
    if (a === 'other') return 1;
    if (b === 'other') return -1;
    return a.localeCompare(b);
  });

  if (isLoading) return <div className="page-loading">Loading tasks...</div>;

  // Topic selection view
  if (!selectedTopic) {
    return (
      <div className="task-list-page">
        <header>
          <h1 className="serif-title">Practice Tasks</h1>
          <p className="subtitle">Choose a topic to practice.</p>
        </header>

        <div className="topics-grid">
          {topicKeys.map((key) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const icon = TOPIC_ICONS[key] || '📚';
            const count = topicGroups[key].length;
            const solved = topicGroups[key].filter(t => statuses[t.id]?.is_solved).length;
            return (
              <button key={key} className="topic-card" onClick={() => setSelectedTopic(key)}>
                <div className="topic-card-icon">{icon}</div>
                <div className="topic-card-title">{label}</div>
                <div className="topic-card-count">{solved}/{count} solved</div>
                <div className="topic-card-bar">
                  <div className="topic-card-fill" style={{ width: `${count > 0 ? (solved / count * 100) : 0}%` }} />
                </div>
              </button>
            );
          })}
          {topicKeys.length === 0 && (
            <div className="tasks-empty">
              <Code2 size={40} />
              <p>No tasks available yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tasks within selected topic
  const topicTasks = (topicGroups[selectedTopic] || []).filter(
    t => diffFilter === 'all' || t.difficulty === diffFilter
  );

  return (
    <div className="task-list-page">
      <header>
        <button className="back-btn" onClick={() => setSelectedTopic(null)}>← All Topics</button>
        <h1 className="serif-title">
          {TOPIC_ICONS[selectedTopic] || '📚'} {selectedTopic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </h1>
        <p className="subtitle">{topicTasks.length} tasks available</p>
      </header>

      <div className="task-filters">
        <div className="filter-group">
          {['all', 'easy', 'medium', 'hard'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${diffFilter === f ? 'active' : ''}`}
              onClick={() => setDiffFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <span className="task-count">{topicTasks.length} tasks</span>
      </div>

      <div className="task-rows">
        {topicTasks.map((task) => {
          const colors = DIFFICULTY_COLORS[task.difficulty] || DIFFICULTY_COLORS.easy;
          const status = statuses[task.id] || { status: 'not_started', attempts: 0 };
          return (
            <Link key={task.id} to={`/practice/${task.id}`} className={`task-row-card ${status.is_solved ? 'solved' : ''}`}>
              <div className="task-row-status">
                {status.is_solved ? (
                  <CheckCircle size={20} className="icon-solved" />
                ) : status.attempts > 0 ? (
                  <Clock size={20} className="icon-attempted" />
                ) : (
                  <Code2 size={20} className="icon-new" />
                )}
              </div>
              <div className="task-row-body">
                <div className="task-row-title">{task.title}</div>
                <div className="task-row-desc">
                  {task.description.length > 100 ? task.description.slice(0, 100) + '...' : task.description}
                </div>
              </div>
              <div className="task-row-meta">
                <span className="difficulty-badge" style={{ background: colors.bg, color: colors.text }}>
                  {task.difficulty}
                </span>
                {status.attempts > 0 && (
                  <span className="attempts-badge">{status.attempts} attempt{status.attempts !== 1 ? 's' : ''}</span>
                )}
              </div>
              <ChevronRight size={16} className="task-row-arrow" />
            </Link>
          );
        })}

        {topicTasks.length === 0 && (
          <div className="tasks-empty">
            <Code2 size={40} />
            <p>No tasks for this difficulty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
