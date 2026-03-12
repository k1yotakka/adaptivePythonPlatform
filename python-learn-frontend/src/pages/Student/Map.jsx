import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/api';
import { CheckCircle, Lock, PlayCircle, BookOpen } from 'lucide-react';
import './Map.css';

export default function Map() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesData = await api.getCourses();
        setCourses(coursesData);
        const modulesMap = {};
        for (const course of coursesData) {
          const mods = await api.getModules(course.id);
          modulesMap[course.id] = mods;
        }
        setModules(modulesMap);
      } catch (err) {
        setError('Failed to load learning map. Are you enrolled in a course?');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="page-loading">Loading your learning map...</div>;

  if (error) return (
    <div className="map-empty">
      <BookOpen size={48} />
      <h2>No courses yet</h2>
      <p>{error}</p>
      <p>Ask your teacher for an invite link to join a course.</p>
    </div>
  );

  return (
    <div className="student-map">
      <header>
        <h1 className="serif-title">Learning Map</h1>
        <p className="subtitle">Your curriculum roadmap — complete modules to unlock the next ones.</p>
      </header>

      {courses.map((course) => (
        <div key={course.id} className="course-section">
          <div className="course-header">
            <h2>{course.title}</h2>
            {course.description && <p>{course.description}</p>}
          </div>

          <div className="modules-track">
            {(modules[course.id] || []).map((module, idx) => (
              <Link key={module.id} to={`/student/module/${module.id}`} className="module-node">
                <div className="module-node-icon">
                  <BookOpen size={20} />
                </div>
                <div className="module-node-body">
                  <div className="module-node-number">Module {idx + 1}</div>
                  <div className="module-node-title">{module.title}</div>
                  {module.description && <div className="module-node-desc">{module.description}</div>}
                </div>
              </Link>
            ))}

            {(modules[course.id] || []).length === 0 && (
              <p className="no-modules">No modules yet in this course.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
