import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Book, Users, Code2, LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import '../styles/teacher.css';

const BASE_URL = 'http://localhost:8000';

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path) => location.pathname.startsWith(path);

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="teacher-app-container">
      <aside className="teacher-sidebar">
        <div className="logo-area">
          <div className="avatar" style={{ background: 'var(--text-teacher-primary)', color: 'white', fontSize: '11px' }}>Py</div>
          <span>PyLearn</span>
        </div>

        <nav className="nav-section">
          <div className="nav-label">Overview</div>
          <Link to="/teacher/dashboard" className={`nav-item ${isActive('/teacher/dashboard') ? 'active' : ''}`}>
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link to="/teacher/courses" className={`nav-item ${isActive('/teacher/courses') || isActive('/teacher/course/') ? 'active' : ''}`}>
            <Book size={16} />
            Courses
          </Link>
          <Link to="/teacher/groups" className={`nav-item ${isActive('/teacher/groups') ? 'active' : ''}`}>
            <Users size={16} />
            Groups
          </Link>
        </nav>

        {user.role === 'admin' && (
          <nav className="nav-section">
            <div className="nav-label">Admin</div>
            <Link to="/teacher/tasks" className={`nav-item ${isActive('/teacher/tasks') || isActive('/teacher/task/') ? 'active' : ''}`}>
              <Code2 size={16} />
              Practice Tasks
            </Link>
            <Link to="/teacher/admin/teachers" className={`nav-item ${isActive('/teacher/admin/teachers') ? 'active' : ''}`}>
              <ShieldCheck size={16} />
              Manage Teachers
            </Link>
          </nav>
        )}

        <div style={{ flexGrow: 1 }} />

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '11px', backgroundImage: user.avatar_url ? `url(${user.avatar_url.startsWith('http') ? user.avatar_url : BASE_URL + user.avatar_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!user.avatar_url && initials}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          </div>
          <Link to="/teacher/profile" className="logout-btn" title="Profile">
            <UserCircle size={15} />
          </Link>
          <button className="logout-btn" onClick={logout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className="teacher-main-content">
        <Outlet />
      </main>
    </div>
  );
}
