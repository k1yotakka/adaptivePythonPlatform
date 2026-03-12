import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OnboardingLayout() {
  const { user } = useAuth();

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
