import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { ChevronRight, Code2, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import './LessonPage.css';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [nextLesson, setNextLesson] = useState(null);
  const [isLastLesson, setIsLastLesson] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const lessonData = await api.getLesson(lessonId);
      setLesson(lessonData);
      const allTasks = await api.getTasks('lesson');
      const lessonTasks = allTasks.filter((t) => t.lesson_id === parseInt(lessonId));
      setTasks(lessonTasks);
      const statuses = {};
      await Promise.all(
        lessonTasks.map(async (t) => {
          try {
            const s = await api.getTaskStatus(t.id);
            statuses[t.id] = s;
          } catch {}
        })
      );
      setTaskStatuses(statuses);

      // Fetch all lessons in module to find next lesson
      if (lessonData.module_id) {
        const allLessons = await api.getLessons(lessonData.module_id);
        const sortedLessons = allLessons.sort((a, b) => a.order - b.order);
        const currentIndex = sortedLessons.findIndex((l) => l.id === parseInt(lessonId));
        if (currentIndex !== -1) {
          if (currentIndex < sortedLessons.length - 1) {
            setNextLesson(sortedLessons[currentIndex + 1]);
            setIsLastLesson(false);
          } else {
            setIsLastLesson(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  // Refetch data when window gains focus (returning from practice tasks)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lessonId]);

  if (isLoading) return <div className="page-loading">Loading lesson...</div>;
  if (!lesson) return <div className="page-error">Lesson not found.</div>;

  return (
    <div className="lesson-page">
      <div className="lesson-breadcrumbs">
        <Link to="/student/map">Map</Link>
        <span>/</span>
        <span>{lesson.title}</span>
      </div>

      <header>
        <h1 className="serif-title">{lesson.title}</h1>
      </header>

      {lesson.content ? (
        <div className="lesson-content">
          <div
            className="lesson-body"
            dangerouslySetInnerHTML={{ __html: renderContent(lesson.content) }}
          />
        </div>
      ) : (
        <div className="lesson-empty">No content yet for this lesson.</div>
      )}

      {tasks.length > 0 && (
        <div className="lesson-tasks">
          <h2 className="section-title">Practice Tasks</h2>
          <div className="tasks-list">
            {tasks.map((task) => {
              const status = taskStatuses[task.id];
              const isSolved = status?.is_solved;
              return (
                <Link
                  key={task.id}
                  to={`/practice/${task.id}`}
                  state={{ from: `/student/lesson/${lessonId}`, lessonId: parseInt(lessonId) }}
                  className={`task-row ${isSolved ? 'task-row--done' : ''}`}
                >
                  <div className="task-row-icon">
                    {isSolved
                      ? <CheckCircle size={18} style={{ color: '#16A34A' }} />
                      : <Circle size={18} style={{ color: '#9CA3AF' }} />
                    }
                  </div>
                  <div className="task-row-info">
                    <div className="task-row-title">{task.title}</div>
                    <div className="task-row-meta">
                      {task.difficulty}
                      {isSolved && ' · Completed'}
                      {status?.attempts > 0 && !isSolved && ` · ${status.attempts} attempt${status.attempts !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                  <ChevronRight size={16} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="lesson-navigation">
        {nextLesson && (
          <button
            className="btn-next-lesson"
            onClick={() => navigate(`/student/lesson/${nextLesson.id}`)}
          >
            Next Lesson: {nextLesson.title}
            <ArrowRight size={16} />
          </button>
        )}
        {isLastLesson && (
          <button
            className="btn-finish-module"
            onClick={() => lesson.module_id && navigate(`/student/module/${lesson.module_id}`)}
          >
            Finish Module
          </button>
        )}
      </div>
    </div>
  );
}

function renderContent(content) {
  // Простой рендер — переносы строк в <br>, ```code``` в <pre>
  return content
    .replace(/```python([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/\n/g, '<br/>');
}
