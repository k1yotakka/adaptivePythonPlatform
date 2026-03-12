import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../../api/api';
import Button from '../../../components/UI/Button';
import './TaskCreator.css';

export default function TaskCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonIdFromUrl = searchParams.get('lesson_id');

  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    task_type: lessonIdFromUrl ? 'lesson' : 'standalone',
    topic: '',
    level: '',
    starter_code: '',
    expected_output: '',
    test_cases: '',
    lesson_id: lessonIdFromUrl ? parseInt(lessonIdFromUrl) : null,
  });
  const [existingTopics, setExistingTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTopics().then(setExistingTopics).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const payload = { ...form, level: form.level || null, topic: form.topic || null };
      await api.createTask(payload);
      if (lessonIdFromUrl) {
        navigate(`/teacher/lesson/${lessonIdFromUrl}/edit`);
      } else {
        navigate('/teacher/tasks');
      }
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="task-creator">
      <header className="header-actions">
        <div className="page-title">
          <div className="text-sm" style={{ color: 'var(--text-teacher-secondary)', marginBottom: '4px' }}>
            <Link to="/teacher/tasks">Task Library</Link> / Create
          </div>
          <h1>Create Task</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-row">
          <div className="form-group flex-2">
            <label>Task Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Filter Even Numbers"
              required
            />
          </div>
          <div className="form-group">
            <label>Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="form-group">
            <label>Task Type</label>
            <select name="task_type" value={form.task_type} onChange={handleChange}>
              <option value="standalone">Standalone (HackerRank-style)</option>
              <option value="lesson">Lesson Task</option>
            </select>
          </div>
          <div className="form-group">
            <label>Topic</label>
            <input
              name="topic"
              list="topics-list"
              value={form.topic}
              onChange={handleChange}
              placeholder="e.g. loops, functions, oop..."
              autoComplete="off"
            />
            <datalist id="topics-list">
              {existingTopics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Level</label>
            <select name="level" value={form.level} onChange={handleChange}>
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe what the student needs to implement. Be clear about inputs, outputs, and edge cases."
            rows={5}
            required
          />
        </div>

        <div className="form-group">
          <label>Starter Code</label>
          <textarea
            name="starter_code"
            value={form.starter_code}
            onChange={handleChange}
            placeholder={"def solution(nums):\n    # your code here\n    pass"}
            rows={6}
            className="code-textarea"
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label>Expected Output (example)</label>
            <input
              name="expected_output"
              value={form.expected_output}
              onChange={handleChange}
              placeholder="[2, 4, 6]"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Test Cases (JSON format)</label>
          <textarea
            name="test_cases"
            value={form.test_cases}
            onChange={handleChange}
            placeholder={'[{"input": [[1,2,3,4]], "expected": [2,4]}]'}
            rows={4}
            className="code-textarea"
          />
          <span className="field-hint">JSON array: each item has "input" (array of args) and "expected" (expected return value)</span>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-submit">
          <Button type="button" variant="secondary" onClick={() => navigate('/teacher/tasks')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  );
}
