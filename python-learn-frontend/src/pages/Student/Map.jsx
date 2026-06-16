import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/api';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
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
        console.error(err);
        setError('Failed to load learning map.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="page-loading">Loading your learning map...</div>;

  const defaultCourses = courses.filter((course) => course.is_default);
  const groupCourses = courses.filter((course) => !course.is_default);

  const renderCourse = (course) => (
    <div key={course.id} className={`course-section ${course.is_default ? 'course-section--default' : ''}`}>
      <div className="course-header">
        <div className="course-header-top">
          <h2>{course.title}</h2>
          {course.is_default && course.level && (
            <span className="course-level-badge">{course.level}</span>
          )}
        </div>
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
  );

  if (error) return (
    <div className="map-empty">
      <BookOpen size={48} />
      <h2>Learning map unavailable</h2>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="student-map">
      <header>
        <h1 className="serif-title">Learning Map</h1>
        <p className="subtitle">Your default learning path and teacher-led courses in one place.</p>
      </header>

      <section className="map-block">
        <div className="map-block-title">
          <GraduationCap size={22} />
          <div>
            <h2>Your Learning Path</h2>
            <p>Default course assigned according to your current level.</p>
          </div>
        </div>
        {defaultCourses.length > 0 ? (
          defaultCourses.map(renderCourse)
        ) : (
          <div className="map-empty-inline">
            <p>No default learning path is available for your level yet.</p>
          </div>
        )}
      </section>

      <section className="map-block">
        <div className="map-block-title">
          <Users size={22} />
          <div>
            <h2>Teacher Courses</h2>
            <p>Courses from the groups you joined with an invite code.</p>
          </div>
        </div>
        {groupCourses.length > 0 ? (
          groupCourses.map(renderCourse)
        ) : (
          <div className="map-empty-inline">
            <p>You have not joined any teacher-led courses yet.</p>
            <Link to="/student/join">Join a course →</Link>
          </div>
        )}
      </section>
    </div>
  );
}
