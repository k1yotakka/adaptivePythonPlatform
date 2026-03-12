import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import ProgressBar from '../../components/UI/ProgressBar';
import { Plus, Users, BookOpen, Code2, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';
import './Dashboard.css';

export default function TeacherDashboard() {
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groupStats, setGroupStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsData, coursesData] = await Promise.all([
          api.getGroups(),
          api.getCourses(),
        ]);
        setGroups(groupsData);
        setCourses(coursesData);

        // Fetch stats for all groups in parallel
        const statsResults = await Promise.all(
          groupsData.map((g) =>
            api.getGroupStats(g.id).then((s) => ({ ...s, group_id: g.id })).catch(() => null)
          )
        );
        setGroupStats(statsResults.filter(Boolean));
      } catch (error) {
        console.error('Failed to fetch teacher data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalStudents = groups.reduce((sum, g) => sum + (g.student_count || 0), 0);
  const allStudents = groupStats.flatMap((gs) => gs.students || []);
  const avgScore = allStudents.length
    ? Math.round(allStudents.reduce((s, st) => s + st.avg_score, 0) / allStudents.length)
    : 0;
  const totalSolved = allStudents.reduce((s, st) => s + st.tasks_solved, 0);

  return (
    <div className="teacher-dashboard">
      <header className="header-actions">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-teacher-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Overview of your courses and students.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/teacher/courses" className="btn btn-secondary">
            <BookOpen size={16} />
            Courses
          </Link>
          <Link to="/teacher/groups" className="btn btn-primary">
            <Plus size={16} />
            New Group
          </Link>
        </div>
      </header>

      <div className="dashboard-metrics">
        <Card className="metric-card">
          <div className="metric-label">Total Students</div>
          <div className="metric-value">{totalStudents}</div>
          <div className="metric-sub">{groups.length} groups</div>
        </Card>
        <Card className="metric-card">
          <div className="metric-label">Tasks Solved</div>
          <div className="metric-value">{totalSolved}</div>
          <div className="metric-sub">across all students</div>
        </Card>
        <Card className="metric-card">
          <div className="metric-label">Avg Score</div>
          <div className="metric-value">{avgScore}%</div>
          <div className="metric-sub">{courses.length} courses</div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card className="section-roster">
          <CardHeader>
            <h3>My Courses</h3>
            <Link to="/teacher/courses" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
              Manage
            </Link>
          </CardHeader>
          <CardBody>
            {courses.length === 0 && (
              <p style={{ color: 'var(--text-teacher-secondary)', fontSize: '14px' }}>
                No courses yet. <Link to="/teacher/courses">Create one →</Link>
              </p>
            )}
            {courses.map((course) => (
              <div key={course.id} className="list-row">
                <div className="list-row-icon">
                  <BookOpen size={16} />
                </div>
                <div className="list-row-content">
                  <h4>{course.title}</h4>
                  <p>{course.is_published ? 'Published' : 'Draft'}</p>
                </div>
                <Link to={`/teacher/course/${course.id}`} className="btn btn-secondary btn-sm">
                  Build
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="section-feed">
          <CardHeader>
            <h3>My Groups</h3>
            <Link to="/teacher/groups" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
              Manage
            </Link>
          </CardHeader>
          <CardBody>
            {groups.length === 0 && (
              <p style={{ color: 'var(--text-teacher-secondary)', fontSize: '14px' }}>
                No groups yet. <Link to="/teacher/groups">Create one →</Link>
              </p>
            )}
            {groups.map((group) => (
              <div key={group.id} className="list-row">
                <div className="list-row-icon">
                  <Users size={16} />
                </div>
                <div className="list-row-content">
                  <h4>{group.name}</h4>
                  <p>{group.student_count} students · code: {group.invite_code}</p>
                </div>
                <Link to={`/teacher/group/${group.id}/stats`} className="btn btn-secondary btn-sm">
                  <BarChart3 size={14} /> Stats
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Student Statistics Table */}
      {groupStats.length > 0 && allStudents.length > 0 && (
        <Card>
          <CardHeader>
            <h3>Student Progress Overview</h3>
          </CardHeader>
          <div className="dash-student-table">
            <div className="dash-table-header">
              <span className="col-name">Student</span>
              <span className="col-group">Group</span>
              <span className="col-level">Level</span>
              <span className="col-num">Solved</span>
              <span className="col-num">Submissions</span>
              <span className="col-num">Avg Score</span>
            </div>
            {groupStats.map((gs) =>
              gs.students.map((student) => (
                <div key={student.id} className="dash-table-row">
                  <div className="col-name">
                    <div className="dash-student-name">{student.name}</div>
                    <div className="dash-student-email">{student.email}</div>
                  </div>
                  <span className="col-group">{gs.group_name}</span>
                  <span className="col-level">
                    <span className={`level-chip level-${student.level}`}>{student.level || '—'}</span>
                  </span>
                  <span className="col-num">{student.tasks_solved}</span>
                  <span className="col-num">{student.total_submissions}</span>
                  <span className="col-num">
                    <span className={`score-chip ${student.avg_score >= 70 ? 'good' : student.avg_score >= 40 ? 'mid' : 'low'}`}>
                      {student.avg_score}%
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
