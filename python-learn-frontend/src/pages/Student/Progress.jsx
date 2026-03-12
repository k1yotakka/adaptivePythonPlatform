import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import './Progress.css';

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getStudentProgress()
      .then(setProgress)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="page-loading">Loading progress...</div>;
  if (!progress) return null;

  return (
    <div className="progress-page">
      <header>
        <h1 className="serif-title">My Progress</h1>
        <p className="subtitle">Track your learning journey and task completion.</p>
      </header>

      <div className="progress-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{progress.tasks_solved}</div>
          <div className="stat-label">Tasks Solved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.tasks_failed}</div>
          <div className="stat-label">Unsolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.total_submissions}</div>
          <div className="stat-label">Total Attempts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.avg_score}%</div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">{progress.completion_rate}%</div>
          <div className="stat-label">Success Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>

      <div className="progress-bar-section">
        <h2 className="section-title">Overall Completion</h2>
        <div className="big-progress-track">
          <div className="big-progress-fill" style={{ width: `${progress.completion_rate}%` }} />
        </div>
        <div className="progress-labels">
          <span>{progress.tasks_solved} solved</span>
          <span>{progress.tasks_attempted} attempted</span>
        </div>
      </div>

      {progress.topic_stats && progress.topic_stats.length > 0 && (
        <div className="topic-breakdown">
          <h2 className="section-title">Progress by Topic</h2>
          <div className="topic-bars">
            {progress.topic_stats.map((ts) => (
              <div key={ts.topic} className="topic-bar-row">
                <div className="topic-bar-label">
                  <span className="topic-bar-name">{ts.label}</span>
                  <span className="topic-bar-count">{ts.solved}/{ts.attempted}</span>
                </div>
                <div className="topic-bar-track">
                  <div
                    className="topic-bar-fill"
                    style={{ width: `${ts.attempted > 0 ? (ts.solved / ts.attempted * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
