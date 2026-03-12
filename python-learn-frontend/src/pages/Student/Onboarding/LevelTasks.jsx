import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/UI/Button';
import { api } from '../../../api/api';
import './Onboarding.css';

const LEVEL_INFO = {
  beginner: {
    emoji: '🟢',
    title: 'Beginner Track',
    desc: 'You are placed in the Beginner track. Start with the fundamentals and build up step by step.',
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
  intermediate: {
    emoji: '🟡',
    title: 'Intermediate Track',
    desc: 'You are placed in the Intermediate track. Work through practice tasks that challenge your existing knowledge.',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  advanced: {
    emoji: '🔴',
    title: 'Advanced Track',
    desc: 'You are placed in the Advanced track. Tackle complex problems involving OOP, algorithms, and real-world design.',
    color: '#DC2626',
    bg: '#FFF8F8',
    border: '#FECACA',
  },
};

export default function LevelTasks() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const level = savedUser.level || 'beginner';
  const info = LEVEL_INFO[level] || LEVEL_INFO.beginner;

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const all = await api.getTasks('standalone');
        const filtered = all.filter(
          (t) => !t.level || t.level === level
        );
        setTasks(filtered.slice(0, 5));
      } catch (err) {
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, [level]);

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="onboarding-step-badge">Step 3 of 3</div>
        <h1 className="serif-title">You're all set!</h1>

        <div className="level-result-banner" style={{ background: info.bg, borderColor: info.border }}>
          <div className="level-result-emoji">{info.emoji}</div>
          <div>
            <div className="level-result-title" style={{ color: info.color }}>{info.title}</div>
            <div className="level-result-desc">{info.desc}</div>
          </div>
        </div>

        <div className="level-tasks-section">
          <h2 className="level-tasks-heading">Your first tasks</h2>
          <p className="level-tasks-subheading">
            These practice tasks match your current level. Solve them to get started.
          </p>

          {isLoading ? (
            <div className="level-tasks-loading">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="level-tasks-empty">
              No tasks available yet — your teacher will assign them soon.
            </div>
          ) : (
            <div className="level-tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className="level-task-card">
                  <div className="level-task-info">
                    <div className="level-task-title">{task.title}</div>
                    {task.description && (
                      <div className="level-task-desc">
                        {task.description.length > 100
                          ? task.description.slice(0, 100) + '...'
                          : task.description}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/practice/${task.id}`)}
                  >
                    Solve →
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="primary"
          className="continue-btn"
          onClick={() => navigate('/student/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
