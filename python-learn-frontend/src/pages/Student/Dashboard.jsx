import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';
import { Link } from 'react-router-dom';
import { BookOpen, Code2, TrendingUp, Map } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashboardData, achData] = await Promise.all([
        api.getStudentDashboard(),
        api.getAvailableAchievements(),
      ]);
      setData(dashboardData);
      setAchievements(achData);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refetch data when window gains focus (returning from practice tasks)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (isLoading) return <div className="page-loading">Loading dashboard...</div>;

  return (
    <div className="student-dashboard">
      <header>
        <div className="hero-top">
          <div>
            <h1 className="serif-title">Welcome back, {user?.name?.split(' ')[0] || 'Student'}</h1>
            <div className="subtitle">
              {data?.enrolled_groups > 0
                ? `You are enrolled in ${data.enrolled_groups} group(s).`
                : 'Join a course to start learning. Use "Join Course" in the sidebar.'}
            </div>
          </div>
          {data && (
            <div className="streak-badge">
              <span className="streak-fire">🔥</span>
              {data.streak} Day Streak
            </div>
          )}
        </div>
      </header>

      {/* Row 1: Course Modules + Recent Submissions */}
      <div className="dash-row">
        <div className="dash-section dash-section--lg">
          <h2 className="section-title">Course Modules</h2>
          {data?.modules?.length > 0 ? (
            <div className="roadmap-list">
              {data.modules.map((module) => (
                <Link key={module.id} to={`/student/module/${module.id}`} className="roadmap-item roadmap-link">
                  <div className="roadmap-info">
                    <div className="module-icon in-progress">
                      <BookOpen size={18} />
                    </div>
                    <div className="module-text">
                      <h3>{module.title}</h3>
                      <p>{module.course_title} · {module.lesson_count} lessons</p>
                    </div>
                  </div>
                  <div className="status-pill active">Open</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-hint">
              <Map size={32} />
              <p>No modules yet. <Link to="/student/join">Join a course →</Link></p>
            </div>
          )}
        </div>

        <div className="dash-section dash-section--sm">
          <h2 className="section-title">Recent Submissions</h2>
          {data?.recent_tasks?.length > 0 ? (
            <div className="task-list">
              {data.recent_tasks.map((task) => (
                <Link to={`/practice/${task.task_id}`} className="task-card task-card-link" key={task.id}>
                  <div className={`check-circle ${task.is_correct ? 'done' : 'failed'}`}>
                    {task.is_correct ? '✓' : '✗'}
                  </div>
                  <div className="task-text">{task.task_title}</div>
                  <div className={`task-status-badge ${task.is_correct ? 'passed' : 'failed'}`}>
                    {task.is_correct ? 'Passed' : 'Failed'}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-hint">
              <Code2 size={32} />
              <p>No submissions yet. <Link to="/student/tasks">Try a task →</Link></p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Achievements */}
      <div className="dash-section">
        <h2 className="section-title">
          Achievements
          <span className="section-subtitle"> · {achievements.filter(a => a.is_earned).length}/{achievements.length} earned</span>
        </h2>
        <div className="achievement-row">
          {achievements.map((ach) => (
            <div
              key={ach.key}
              className={`badge-card ${ach.is_earned ? 'badge-card--earned' : 'badge-card--locked'}`}
              title={ach.is_earned ? `Earned!` : ach.description}
            >
              <div className="badge-icon">{ach.is_earned ? ach.emoji : '🔒'}</div>
              <div className="badge-name">{ach.name}</div>
              {!ach.is_earned && ach.progress && (
                <div className="badge-progress">
                  <div className="badge-progress-bar">
                    <div
                      className="badge-progress-fill"
                      style={{ width: `${ach.progress.total > 0 ? (ach.progress.solved / ach.progress.total * 100) : 0}%` }}
                    />
                  </div>
                  <div className="badge-progress-label">{ach.progress.solved}/{ach.progress.total}</div>
                </div>
              )}
            </div>
          ))}
          {achievements.length === 0 && (
            <div className="empty-hint" style={{ padding: '16px 0' }}>
              <p>Complete practice tasks to earn achievements.</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Quick Links */}
      <div className="dash-section">
        <h2 className="section-title">Quick Links</h2>
        <div className="quick-links quick-links--horizontal">
          <Link to="/student/map" className="quick-link-btn">
            <Map size={18} />
            Learning Map
          </Link>
          <Link to="/student/tasks" className="quick-link-btn">
            <Code2 size={18} />
            Practice Tasks
          </Link>
          <Link to="/student/progress" className="quick-link-btn">
            <TrendingUp size={18} />
            My Progress
          </Link>
          <Link to="/student/join" className="quick-link-btn">
            <BookOpen size={18} />
            Join a Course
          </Link>
        </div>
      </div>
    </div>
  );
}
