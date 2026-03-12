import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NotFound.css';

export default function NotFound() {
  const { user } = useAuth();
  const homeLink = user?.role === 'teacher' || user?.role === 'admin'
    ? '/teacher/dashboard'
    : user?.role === 'student'
    ? '/student/dashboard'
    : '/login';

  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h1>Page Not Found</h1>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <Link to={homeLink} className="not-found-btn">Go Home</Link>
    </div>
  );
}
