import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/api';
import { BookOpen, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import './ModulePage.css';

export default function ModulePage() {
  const { moduleId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [lessonsData, progressData] = await Promise.all([
        api.getLessons(moduleId),
        api.getLessonProgress(moduleId),
      ]);
      setLessons(lessonsData);
      const progressMap = {};
      progressData.forEach((p) => { progressMap[p.lesson_id] = p; });
      setProgress(progressMap);
      setError('');
    } catch (err) {
      setError('Failed to load lessons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [moduleId]);

  // Refetch data when window gains focus (returning from practice tasks)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [moduleId]);

  const completedCount = lessons.filter((l) => progress[l.id]?.is_completed).length;

  if (isLoading) return <div className="page-loading">Loading module...</div>;

  return (
    <div className="module-page">
      <div className="module-page-breadcrumbs">
        <Link to="/student/map">Learning Map</Link>
        <span>/</span>
        <span>Module Lessons</span>
      </div>

      <header>
        <h1 className="serif-title">Module Lessons</h1>
        <p className="subtitle">
          {lessons.length} lessons · {completedCount} completed
        </p>
      </header>

      {error && <div className="page-error">{error}</div>}

      <div className="lessons-list">
        {lessons.map((lesson, idx) => {
          const lessonProgress = progress[lesson.id];
          const isCompleted = lessonProgress?.is_completed;
          return (
            <Link key={lesson.id} to={`/student/lesson/${lesson.id}`} className={`lesson-row ${isCompleted ? 'lesson-row--done' : ''}`}>
              <div className="lesson-status-icon">
                {isCompleted
                  ? <CheckCircle size={20} className="icon-done" />
                  : <Circle size={20} className="icon-pending" />
                }
              </div>
              <div className="lesson-info">
                <div className="lesson-title">{lesson.title}</div>
                <div className="lesson-meta">
                  Lesson {idx + 1} of {lessons.length}
                  {lessonProgress?.has_tasks && !isCompleted && ' · has practice tasks'}
                </div>
              </div>
              <ChevronRight size={18} className="lesson-arrow" />
            </Link>
          );
        })}

        {lessons.length === 0 && (
          <div className="empty-state">No lessons in this module yet.</div>
        )}
      </div>
    </div>
  );
}
