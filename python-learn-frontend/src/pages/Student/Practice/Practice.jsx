import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import Button from '../../../components/UI/Button';
import { api } from '../../../api/api';
import './Practice.css';

function parseAiFeedback(message = '') {
  const text = String(message).replace(/\r/g, '').trim();
  const sections = [
    { key: 'task', title: '1. Task understanding', content: '' },
    { key: 'good', title: '2. What is good', content: '' },
    { key: 'fix', title: '3. What to fix now', content: '' },
    { key: 'next', title: '4. Next step hint', content: '' },
  ];

  const regex = /(?:^|\n)\s*(1\.|2\.|3\.|4\.)\s*([^\n]*)/g;
  const matches = [...text.matchAll(regex)];
  if (!matches.length) return null;

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const number = parseInt(current[1], 10) - 1;
    const start = current.index + current[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end).trim();

    const inline = current[2].replace(/^[:\-\s]+/, '').trim();
    sections[number].content = [inline, body].filter(Boolean).join('\n').trim();
  }

  return sections;
}

function renderInlineFormatting(text = '') {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="feedback-inline-code">{part.slice(1, -1)}</code>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderFeedbackText(text = '') {
  const lines = String(text).split('\n');
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {renderInlineFormatting(line)}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

export default function Practice() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromLesson = location.state?.from || null;
  const fromLessonId = location.state?.lessonId || null;

  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [submitResult, setSubmitResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [nextLessonId, setNextLessonId] = useState(null);
  const runInFlightRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const parsedAiFeedback = aiFeedback?.type !== 'error'
    ? parseAiFeedback(aiFeedback?.message)
    : null;

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const [taskData, statusData] = await Promise.all([
          api.getTask(taskId),
          api.getTaskStatus(taskId),
        ]);
        setTask(taskData);
        setAttempts(statusData.attempts || 0);
        if (statusData.is_solved) {
          setIsSolved(true);
          setCode(statusData.last_code || taskData.starter_code || '');
        } else if (statusData.last_code) {
          setCode(statusData.last_code);
        } else {
          setCode(taskData.starter_code || `# Write your solution here\n`);
        }

        // If came from a lesson, fetch sibling lessons to find the next one
        if (fromLessonId) {
          try {
            const lessonData = await api.getLesson(fromLessonId);
            if (lessonData?.module_id) {
              const lessons = await api.getLessons(lessonData.module_id);
              const idx = lessons.findIndex((l) => l.id === fromLessonId);
              if (idx !== -1 && idx + 1 < lessons.length) {
                setNextLessonId(lessons[idx + 1].id);
              }
            }
          } catch {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  const handleAskAi = async () => {
    if (!task) return;
    setIsAskingAi(true);
    setAiFeedback(null);
    try {
      const result = await api.getAIFeedback(
        task.description,
        code,
        aiQuestion || null
      );
      setAiFeedback({ type: result.hint_type, message: result.feedback });
    } catch (err) {
      setAiFeedback({ type: 'error', message: 'AI service unavailable. Check GEMINI_API_KEY.' });
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleRunCode = async () => {
    if (runInFlightRef.current) return;
    runInFlightRef.current = true;
    setIsRunning(true);
    setRunResult(null);
    try {
      const result = await api.runCode(code);
      setRunResult(result);
    } catch (err) {
      setRunResult({ success: false, stderr: err.message || 'Failed to run code', stdout: '', exit_code: -1 });
    } finally {
      setIsRunning(false);
      runInFlightRef.current = false;
    }
  };

  const handleSubmit = async () => {
    if (submitInFlightRef.current) return;
    if (!task || isSolved) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const result = await api.submitTask(task.id, code);
      setAttempts((a) => a + 1);
      if (result.is_correct) {
        setIsCompleted(true);
        setIsSolved(true);
      } else {
        setSubmitResult({ success: false, message: 'Wrong answer. Check your output and try again.' });
      }
    } catch (err) {
      setSubmitResult({ success: false, message: err.message || 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
      submitInFlightRef.current = false;
    }
  };

  if (isLoading) return <div style={{ padding: '40px', color: '#666' }}>Loading task...</div>;
  if (!task) return <div style={{ padding: '40px', color: '#C13010' }}>Task not found.</div>;

  return (
    <>
      {/* Context Panel (Left) */}
      <aside className="panel-context">
        <div className="task-header">
          <div className="breadcrumbs">
            {fromLesson ? (
              <Link to={fromLesson}>← Back to Lesson</Link>
            ) : (
              <Link to="/student/tasks">Tasks</Link>
            )}
            <span>/</span>
            <span>{task.title}</span>
          </div>
          <h1 className="serif-title task-title">{task.title}</h1>
          <div className="meta-row">
            <span className="badge badge-difficulty">{task.difficulty}</span>
            <span className="badge">{task.task_type === 'standalone' ? 'Challenge' : 'Lesson Task'}</span>
            {task.topic && (
              <span className="badge">{task.topic.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            )}
          </div>
        </div>

        <div className="separator"></div>

        <section className="section">
          <h3 className="label">DESCRIPTION</h3>
          <p className="description-text">{task.description}</p>
        </section>

        {task.expected_output && (
          <>
            <div className="separator"></div>
            <section className="section">
              <h3 className="label">EXPECTED OUTPUT</h3>
              <div className="example-box">
                <div className="example-label">Output</div>
                <div className="mono">{task.expected_output}</div>
              </div>
            </section>
          </>
        )}
      </aside>

      {/* Workspace Panel (Right) */}
      <main className="panel-workspace">
        <div className="toolbar">
          <div className="file-tabs">
            <div className="tab active">solution.py</div>
            {isSolved && !isCompleted && (
              <div className="solved-badge">✓ Solved</div>
            )}
            {attempts > 0 && !isSolved && (
              <div className="attempts-info">{attempts} attempt{attempts !== 1 ? 's' : ''}</div>
            )}
          </div>
          <div className="actions">
            <Button
              variant="outline"
              onClick={handleRunCode}
              disabled={isRunning}
              style={{ marginRight: '8px' }}
            >
              {isRunning ? '▶ Running...' : '▶ Run Code'}
            </Button>
            {!isSolved && (
              <Button
                variant="primary"
                className="btn-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </Button>
            )}
          </div>
        </div>

        {submitResult && (
          <div className={`submit-result ${submitResult.success ? 'success' : 'error'}`}>
            {submitResult.message}
          </div>
        )}

        {runResult && (
          <div className="run-result">
            <div className="run-result-header">
              <span className="label">EXECUTION RESULT</span>
              <span className={`status-badge ${runResult.success ? 'success' : 'error'}`}>
                {runResult.success ? '✓ Success' : '✗ Error'}
              </span>
            </div>
            {runResult.stdout && (
              <div className="output-section">
                <div className="output-label">Output:</div>
                <pre className="output-content">{runResult.stdout}</pre>
              </div>
            )}
            {runResult.stderr && (
              <div className="output-section error">
                <div className="output-label">Error:</div>
                <pre className="output-content">{runResult.stderr}</pre>
              </div>
            )}
            {!runResult.stdout && !runResult.stderr && (
              <div className="output-section">
                <div className="output-content" style={{ color: '#999' }}>No output</div>
              </div>
            )}
          </div>
        )}

        {isCompleted ? (
          <div className="task-completed-overlay">
            <div className="task-completed-icon">✓</div>
            <h2 className="task-completed-title">Task Completed!</h2>
            <p className="task-completed-msg">Your solution has been submitted successfully.</p>
            <div className="task-completed-actions">
              {fromLesson ? (
                <>
                  <Link to={fromLesson} className="btn-next-task">← Back to Lesson</Link>
                  {nextLessonId && (
                    <Link to={`/student/lesson/${nextLessonId}`} className="btn-next-task btn-next-lesson">
                      Next Lesson →
                    </Link>
                  )}
                </>
              ) : (
                <Link to="/student/tasks" className="btn-next-task">Next Task →</Link>
              )}
              <button className="btn-review-code" onClick={() => setIsCompleted(false)}>
                Review my code
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="editor-container">
              <div className="editor-header">
                <span>PYTHON 3.11</span>
                <span>AUTO-SAVED</span>
              </div>
              <div className="code-area">
                <Editor
                  value={code}
                  onValueChange={(c) => setCode(c)}
                  highlight={(c) => highlight(c, languages.python, 'python')}
                  padding={16}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    minHeight: '100%',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

        {/* AI Panel */}
        <div className="ai-panel">
          <div className="mentor-profile">
            <div className="mentor-header">
              <div className="avatar ai-avatar"></div>
              <div>
                <div className="mentor-name">Mentor AI</div>
                <div className="label" style={{ fontSize: '10px' }}>Guidance Mode — no full answers</div>
              </div>
            </div>

            <input
              className="ai-question-input"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Ask a specific question (optional)..."
              onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
            />

            <Button
              variant="outline"
              style={{ width: '100%', fontSize: '12px' }}
              onClick={handleAskAi}
              disabled={isAskingAi}
            >
              {isAskingAi ? '🤔 Thinking...' : '💡 Ask AI for a hint'}
            </Button>
          </div>

          <div className="feedback-container">
            {aiFeedback ? (
              <div className="feedback-content">
                <div className={`feedback-badge ${aiFeedback.type === 'error' ? '' : 'hint'}`}>
                  <span style={{ fontSize: '14px' }}>{aiFeedback.type === 'error' ? '⚠️' : '💡'}</span>
                  {aiFeedback.type === 'error' ? 'Error' : 'Hint'}
                </div>
                {parsedAiFeedback ? (
                  <div className="feedback-blocks">
                    {parsedAiFeedback.map((section) => (
                      <div className="feedback-block" key={section.key}>
                        <div className="feedback-block-title">{section.title}</div>
                        <div className="feedback-text">{renderFeedbackText(section.content || '—')}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="feedback-text">{renderFeedbackText(aiFeedback.message)}</p>
                )}
              </div>
            ) : (
              <div className="feedback-empty">
                <p>Write some code, then ask AI for a hint. It won't reveal the full solution.</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </main>
    </>
  );
}
