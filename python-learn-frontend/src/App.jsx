import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import PracticeLayout from './layouts/PracticeLayout';
import AuthLayout from './layouts/AuthLayout';
import OnboardingLayout from './layouts/OnboardingLayout';

// Auth
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

// Student
import StudentDashboard from './pages/Student/Dashboard';
import LevelSelect from './pages/Student/Onboarding/LevelSelect';
import GoalSelect from './pages/Student/Onboarding/GoalSelect';
import ScreeningTest from './pages/Student/Onboarding/ScreeningTest';
import LevelTasks from './pages/Student/Onboarding/LevelTasks';
import Map from './pages/Student/Map';
import ModulePage from './pages/Student/ModulePage';
import LessonPage from './pages/Student/LessonPage';
import Progress from './pages/Student/Progress';
import Practice from './pages/Student/Practice/Practice';
import TaskList from './pages/Tasks/TaskList';
import JoinGroup from './pages/Student/JoinGroup';

// Teacher
import TeacherDashboard from './pages/Teacher/Dashboard';
import Groups from './pages/Teacher/Groups/Groups';
import Courses from './pages/Teacher/Courses/Courses';
import CourseBuilder from './pages/Teacher/Courses/CourseBuilder';
import TaskLibrary from './pages/Teacher/Tasks/TaskLibrary';
import TaskCreator from './pages/Teacher/Tasks/TaskCreator';
import TaskEditor from './pages/Teacher/Tasks/TaskEditor';
import LessonEditor from './pages/Teacher/Courses/LessonEditor';
import GroupStats from './pages/Teacher/Groups/GroupStats';

// Profile
import ProfilePage from './pages/Profile/ProfilePage';

// Admin
import Teachers from './pages/Admin/Teachers';

// Misc
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
          </Route>

          {/* Onboarding (no sidebar) */}
          <Route path="/onboarding" element={<OnboardingLayout />}>
            <Route path="goal-select" element={<GoalSelect />} />
            <Route path="level-select" element={<LevelSelect />} />
            <Route path="screening" element={<ScreeningTest />} />
            <Route path="level-tasks" element={<LevelTasks />} />
          </Route>

          {/* Student */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="map" element={<Map />} />
            <Route path="module/:moduleId" element={<ModulePage />} />
            <Route path="lesson/:lessonId" element={<LessonPage />} />
            <Route path="progress" element={<Progress />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="join" element={<JoinGroup />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Practice (split-screen, no sidebar) */}
          <Route path="/practice/:taskId" element={<PracticeLayout />}>
            <Route index element={<Practice />} />
          </Route>

          {/* Standalone tasks via /tasks path */}
          <Route path="/tasks" element={<StudentLayout />}>
            <Route index element={<TaskList />} />
          </Route>

          {/* Teacher + Admin share TeacherLayout */}
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="course/:courseId" element={<CourseBuilder />} />
            <Route path="tasks" element={<TaskLibrary />} />
            <Route path="task/create" element={<TaskCreator />} />
            <Route path="task/edit/:taskId" element={<TaskEditor />} />
            <Route path="lesson/:lessonId/edit" element={<LessonEditor />} />
            <Route path="groups" element={<Groups />} />
            <Route path="group/:groupId/stats" element={<GroupStats />} />
            <Route path="admin/teachers" element={<Teachers />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
