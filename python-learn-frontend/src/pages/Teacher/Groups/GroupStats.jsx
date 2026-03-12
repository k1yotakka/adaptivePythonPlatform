import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/api';
import { ArrowLeft, Users, TrendingUp, CheckCircle } from 'lucide-react';
import './GroupStats.css';

export default function GroupStats() {
  const { groupId } = useParams();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getGroupStats(groupId)
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [groupId]);

  if (isLoading) return <div className="page-loading">Loading statistics...</div>;
  if (!stats) return <div className="page-error">Group not found.</div>;

  return (
    <div className="group-stats">
      <header className="header-actions">
        <div className="page-title">
          <div className="text-sm" style={{ color: 'var(--text-teacher-secondary)', marginBottom: '4px' }}>
            <Link to="/teacher/groups">Groups</Link> / Statistics
          </div>
          <h1>{stats.group_name}</h1>
          <p className="text-sm" style={{ color: 'var(--text-teacher-secondary)', marginTop: '4px' }}>
            {stats.student_count} student{stats.student_count !== 1 ? 's' : ''} enrolled
          </p>
        </div>
      </header>

      <div className="stats-summary">
        <div className="summary-card">
          <Users size={20} />
          <div className="summary-value">{stats.student_count}</div>
          <div className="summary-label">Students</div>
        </div>
        <div className="summary-card">
          <CheckCircle size={20} />
          <div className="summary-value">
            {stats.students.length > 0
              ? Math.round(stats.students.reduce((s, st) => s + st.tasks_solved, 0) / stats.students.length)
              : 0}
          </div>
          <div className="summary-label">Avg Tasks Solved</div>
        </div>
        <div className="summary-card">
          <TrendingUp size={20} />
          <div className="summary-value">
            {stats.students.length > 0
              ? Math.round(stats.students.reduce((s, st) => s + st.avg_score, 0) / stats.students.length)
              : 0}%
          </div>
          <div className="summary-label">Avg Score</div>
        </div>
      </div>

      {stats.students.length === 0 ? (
        <div className="stats-empty">No students in this group yet.</div>
      ) : (
        <div className="students-table">
          <div className="table-header">
            <span className="col-name">Student</span>
            <span className="col-level">Level</span>
            <span className="col-num">Attempted</span>
            <span className="col-num">Solved</span>
            <span className="col-num">Submissions</span>
            <span className="col-num">Avg Score</span>
          </div>
          {stats.students.map((student) => (
            <div key={student.id} className="table-row">
              <div className="col-name">
                <div className="student-name">{student.name}</div>
                <div className="student-email">{student.email}</div>
              </div>
              <span className="col-level">
                <span className="level-chip">{student.level || '—'}</span>
              </span>
              <span className="col-num">{student.tasks_attempted}</span>
              <span className="col-num">{student.tasks_solved}</span>
              <span className="col-num">{student.total_submissions}</span>
              <span className="col-num">
                <span className={`score-chip ${student.avg_score >= 70 ? 'good' : student.avg_score >= 40 ? 'mid' : 'low'}`}>
                  {student.avg_score}%
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
