import { Outlet } from 'react-router-dom';
import '../styles/practice.css';

export default function PracticeLayout() {
  return (
    <div className="practice-layout-container">
      <Outlet />
    </div>
  );
}
