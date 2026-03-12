import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Map, Code2, TrendingUp, LogOut, UserPlus, UserCircle } from 'lucide-react';
import '../styles/student.css';

const BASE_URL = 'http://localhost:8000';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="student-layout">
      <nav className="student-sidebar">
        <div className="brand">
          <div className="brand-icon"></div>
          <span>PyLearn.</span>
        </div>

        <div className="nav-group">
          <Link to="/student/dashboard" className={`nav-item ${isActive('/student/dashboard') ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link to="/student/map" className={`nav-item ${isActive('/student/map') || isActive('/student/module') || isActive('/student/lesson') ? 'active' : ''}`}>
            <Map size={18} />
            <span>Learning Map</span>
          </Link>
          <Link to="/student/tasks" className={`nav-item ${isActive('/student/tasks') || isActive('/tasks') ? 'active' : ''}`}>
            <Code2 size={18} />
            <span>Practice Tasks</span>
          </Link>
          <Link to="/student/progress" className={`nav-item ${isActive('/student/progress') ? 'active' : ''}`}>
            <TrendingUp size={18} />
            <span>My Progress</span>
          </Link>
          <Link to="/student/join" className={`nav-item ${isActive('/student/join') ? 'active' : ''}`}>
            <UserPlus size={18} />
            <span>Join Course</span>
          </Link>
        </div>

        <div className="user-profile">
          <div className="avatar" style={user.avatar_url ? { backgroundImage: `url(${user.avatar_url.startsWith('http') ? user.avatar_url : BASE_URL + user.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}></div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-status"><span className="status-dot"></span>{user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'Student'}</div>
          </div>
          <Link to="/student/profile" className="logout-btn" title="Profile">
            <UserCircle size={16} />
          </Link>
          <button className="logout-btn" onClick={logout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main className="student-main">
        <Outlet />
      </main>
    </div>
  );
}
