import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthLayout() {
  const { user } = useAuth();

  // Если уже авторизован, редиректим в зависимости от роли
  if (user) {
    if (user.role === 'teacher' || user.role === 'admin') {
      return <Navigate to="/teacher" replace />;
    }
    // Студент: проверяем завершен ли онбординг
    if (!user.level) {
      return <Navigate to="/onboarding/goal-select" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: '#f9fafb', overflowY: 'auto', padding: '2rem 1rem' }}>
      <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <Outlet />
      </div>
    </div>
  );
}
