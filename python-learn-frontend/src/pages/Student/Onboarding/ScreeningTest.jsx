import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import Button from '../../../components/UI/Button';
import { api } from '../../../api/api';
import './Onboarding.css';

const INTERMEDIATE_TASKS = [
  {
    id: 1,
    type: 'code',
    title: 'Find Maximum Value',
    description: 'Find the maximum value in a list WITHOUT using the built-in max() function.\n\nWrite a function called find_max(nums) that returns the largest number.',
    starterCode: 'def find_max(nums):\n    # your code here\n    pass\n',
    testCode: 'print(find_max([3, 1, 4, 1, 5, 9, 2, 6]))\nprint(find_max([-1, -5, -3]))',
    expectedOutput: '9\n-1',
  },
  {
    id: 2,
    type: 'code',
    title: 'Word Frequency Counter',
    description: 'Count how many times each word appears in a string.\n\nWrite a function called word_frequency(text) that returns a dictionary mapping each word to its count.',
    starterCode: 'def word_frequency(text):\n    # your code here\n    pass\n',
    testCode: 'result = word_frequency("hello world hello")\nprint(result["hello"])\nprint(result["world"])',
    expectedOutput: '2\n1',
  },
  {
    id: 3,
    type: 'code',
    title: 'Palindrome Checker',
    description: 'A palindrome reads the same forwards and backwards (e.g. "racecar").\n\nWrite a function called is_palindrome(s) that returns True if the string is a palindrome, False otherwise.',
    starterCode: 'def is_palindrome(s):\n    # your code here\n    pass\n',
    testCode: 'print(is_palindrome("racecar"))\nprint(is_palindrome("hello"))',
    expectedOutput: 'True\nFalse',
  },
  {
    id: 4,
    type: 'code',
    title: 'FizzBuzz',
    description: 'Print numbers from 1 to n, but:\n• For multiples of 3, print "Fizz"\n• For multiples of 5, print "Buzz"\n• For multiples of both 3 and 5, print "FizzBuzz"\n\nWrite a function called fizzbuzz(n) that prints the sequence.',
    starterCode: 'def fizzbuzz(n):\n    # your code here\n    pass\n',
    testCode: 'fizzbuzz(5)',
    expectedOutput: '1\n2\nFizz\n4\nBuzz',
  },
  {
    id: 5,
    type: 'debug',
    title: 'Debug: Fix the Loop',
    description: 'The code below should sum all numbers in the list [1, 2, 3] and print the total (expected: 6).\n\nFind and fix the bug.',
    starterCode: 'nums = [1, 2, 3]\ntotal = 0\nfor i in range(len(nums)):\n    total += nums[i + 1]\nprint(total)',
    testCode: '',
    expectedOutput: '6',
  },
  {
    id: 6,
    type: 'debug',
    title: 'Debug: Fix the Function',
    description: 'The function below should return the square of a number (e.g. square(4) → 16, square(3) → 9).\n\nFind and fix the bug.',
    starterCode: 'def square(n):\n    return n + n\n\nprint(square(4))\nprint(square(3))',
    testCode: '',
    expectedOutput: '16\n9',
  },
];

const ADVANCED_TASKS = [
  {
    id: 1,
    type: 'code',
    title: 'BankAccount Class (OOP)',
    description: 'Design a BankAccount class with:\n• balance attribute (starts at 0)\n• deposit(amount) method that adds to balance\n• withdraw(amount) method that subtracts from balance (must prevent negative balance)\n• transaction_log list that records every deposit and withdrawal',
    starterCode: 'class BankAccount:\n    pass\n',
    testCode: 'acc = BankAccount()\nacc.deposit(100)\nacc.deposit(50)\nacc.withdraw(30)\nprint(acc.balance)\nprint(len(acc.transaction_log))',
    expectedOutput: '120\n3',
  },
  {
    id: 2,
    type: 'test',
    title: 'Write Tests for withdraw()',
    description: 'A BankAccount class is provided. Write 3 test functions for the withdraw() method:\n• test_withdraw_success — successful withdrawal reduces balance\n• test_withdraw_insufficient_funds — withdrawal rejected when not enough balance\n• test_withdraw_exact_balance — withdrawing exactly the full balance works\n\nUse assert statements. The last line must print "All tests passed".',
    starterCode: 'class BankAccount:\n    def __init__(self):\n        self.balance = 0\n        self.transaction_log = []\n\n    def deposit(self, amount):\n        self.balance += amount\n        self.transaction_log.append(f"deposit {amount}")\n\n    def withdraw(self, amount):\n        if amount > self.balance:\n            return False\n        self.balance -= amount\n        self.transaction_log.append(f"withdraw {amount}")\n        return True\n\n\ndef test_withdraw_success():\n    # your code here\n    pass\n\ndef test_withdraw_insufficient_funds():\n    # your code here\n    pass\n\ndef test_withdraw_exact_balance():\n    # your code here\n    pass\n\n\ntest_withdraw_success()\ntest_withdraw_insufficient_funds()\ntest_withdraw_exact_balance()\nprint("All tests passed")\n',
    testCode: '',
    expectedOutput: 'All tests passed',
  },
  {
    id: 3,
    type: 'code',
    title: 'Longest Substring Without Repeating Characters',
    description: 'Using the sliding window approach, find the length of the longest substring without repeating characters.\n\nWrite a function called longest_substring(s) that returns the length as an integer.',
    starterCode: 'def longest_substring(s):\n    # Use sliding window approach\n    pass\n',
    testCode: 'print(longest_substring("abcabcbb"))\nprint(longest_substring("bbbbb"))\nprint(longest_substring("pwwkew"))',
    expectedOutput: '3\n1\n3',
  },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const HARNESS_START_MARKER = '__PYLEARN_HARNESS_START__';
const HARNESS_END_MARKER = '__PYLEARN_HARNESS_END__';

function normalizeLines(text = '') {
  return String(text)
    .replace(/\r/g, '')
    .trim()
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
}

function matchesExpectedOutput(actualText = '', expectedText = '') {
  const actualLines = normalizeLines(actualText);
  const expectedLines = normalizeLines(expectedText);

  if (!expectedLines.length) return !actualLines.length;

  // Strict match
  if (actualLines.join('\n') === expectedLines.join('\n')) return true;

  // Accept repeated expected block (e.g. student's demo prints + harness prints)
  if (actualLines.length % expectedLines.length === 0) {
    const blocks = actualLines.length / expectedLines.length;
    if (blocks >= 2) {
      const repeated = Array.from({ length: blocks }, () => expectedLines).flat();
      if (actualLines.join('\n') === repeated.join('\n')) return true;
    }
  }

  // Accept expected output as final meaningful tail
  if (actualLines.length >= expectedLines.length) {
    const tail = actualLines.slice(actualLines.length - expectedLines.length);
    if (tail.join('\n') === expectedLines.join('\n')) return true;
  }

  return false;
}

function extractHarnessOutput(stdout = '') {
  const lines = String(stdout).replace(/\r/g, '').split('\n');
  const startIndex = lines.findIndex((line) => line.trim() === HARNESS_START_MARKER);
  const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim() === HARNESS_END_MARKER);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return lines.slice(startIndex + 1, endIndex).join('\n').trimEnd();
  }

  return String(stdout).replace(/\r/g, '').trimEnd();
}

function extractStudentOutput(stdout = '') {
  const lines = String(stdout).replace(/\r/g, '').split('\n');
  const markerIndex = lines.findIndex((line) => line.trim() === HARNESS_START_MARKER);
  if (markerIndex !== -1) {
    return lines.slice(0, markerIndex).join('\n').trimEnd();
  }
  return String(stdout).replace(/\r/g, '').trimEnd();
}

function getRecommendation(level, score, total) {
  if (level === 'intermediate') {
    if (score <= 2) return {
      recommendedLevel: 'beginner',
      title: 'Recommended Track: Beginner',
      message: 'Your result suggests starting with the Beginner track to build a solid foundation. You can always move up as you progress.',
      emoji: '🟢',
    };
    if (score <= 5) return {
      recommendedLevel: 'intermediate',
      title: 'Your Track: Intermediate',
      message: 'Good work! You have a solid base in Python fundamentals. The Intermediate track is right for you.',
      emoji: '🟡',
    };
    return {
      recommendedLevel: 'advanced',
      title: 'Your Track: Advanced',
      message: 'Excellent performance! You solved all tasks correctly. You are placed in the Advanced track.',
      emoji: '🔴',
    };
  } else {
    if (score <= 1) return {
      recommendedLevel: 'intermediate',
      title: 'Recommended Track: Intermediate',
      message: 'The Advanced screening shows Intermediate is a better fit right now. You can move up after completing intermediate modules.',
      emoji: '🟡',
    };
    return {
      recommendedLevel: 'advanced',
      title: 'Your Track: Advanced',
      message: 'Strong performance! You demonstrated advanced Python skills. Welcome to the Advanced track.',
      emoji: '🔴',
    };
  }
}

export default function ScreeningTest() {
  const [searchParams] = useSearchParams();
  const level = searchParams.get('level');
  const navigate = useNavigate();

  const tasks = level === 'intermediate' ? INTERMEDIATE_TASKS : ADVANCED_TASKS;

  const [phase, setPhase] = useState('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [taskPassed, setTaskPassed] = useState(null);
  const [scores, setScores] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === 'testing') {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase === 'testing' && tasks[currentIdx]) {
      setCode(tasks[currentIdx].starterCode);
      setRunResult(null);
      setTaskPassed(null);
    }
  }, [currentIdx, phase]);

  const handleStart = () => {
    setCode(tasks[0].starterCode);
    setPhase('testing');
  };

  const handleRunAndCheck = async () => {
    setIsRunning(true);
    setRunResult(null);
    setTaskPassed(null);
    try {
      const currentTask = tasks[currentIdx];
      const codeToRun = currentTask.testCode
        ? `${code}\nprint("${HARNESS_START_MARKER}")\n${currentTask.testCode}\nprint("${HARNESS_END_MARKER}")`
        : code;
      const result = await api.runCode(codeToRun);
      const checkedStdout = extractHarnessOutput(result.stdout);
      const studentStdout = extractStudentOutput(result.stdout);
      setRunResult({ ...result, stdout: studentStdout });
      if (result.success) {
        const passed = matchesExpectedOutput(checkedStdout, currentTask.expectedOutput);
        setTaskPassed(passed);
      } else {
        setTaskPassed(false);
      }
    } catch (err) {
      setRunResult({ success: false, stderr: 'Server connection error', stdout: '', exit_code: -1 });
      setTaskPassed(false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleNextTask = () => {
    const passed = taskPassed === true;
    const newScores = [...scores, passed];
    setScores(newScores);

    if (currentIdx + 1 < tasks.length) {
      setCurrentIdx(idx => idx + 1);
    } else {
      clearInterval(timerRef.current);
      setPhase('result');
    }
  };

  const handleConfirmLevel = async (confirmedLevel) => {
    setIsSaving(true);
    try {
      await api.updateLevel(confirmedLevel);
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.level = confirmedLevel;
      localStorage.setItem('user', JSON.stringify(savedUser));
    } catch (err) {
      console.error('Failed to save level:', err);
    }
    navigate('/onboarding/level-tasks');
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="onboarding-container">
        <div className="onboarding-content screening">
          <h1 className="serif-title">
            {level === 'intermediate' ? 'Intermediate Screening' : 'Advanced Screening'}
          </h1>
          <p className="subtitle">
            {level === 'intermediate'
              ? '6 tasks (4 coding + 2 debugging). Your score determines your track.'
              : '3 tasks (OOP design, testing, algorithm). Your score determines your track.'}
          </p>

          <div className="screening-intro-tasks">
            {tasks.map((task, idx) => (
              <div key={task.id} className="intro-task-item">
                <span className="intro-task-num">{idx + 1}</span>
                <div className="intro-task-info">
                  <strong>{task.title}</strong>
                  <span className={`task-type-badge type-${task.type}`}>
                    {task.type === 'debug' ? 'debug' : task.type === 'test' ? 'testing' : 'coding'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="screening-note">
            You can run your code and check the output before moving on. Each task is automatically evaluated.
          </div>

          <Button variant="primary" className="continue-btn" onClick={handleStart}>
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const score = scores.filter(Boolean).length;
    const total = tasks.length;
    const rec = getRecommendation(level, score, total);

    return (
      <div className="onboarding-container">
        <div className="onboarding-content">
          <h1 className="serif-title">Test Complete</h1>

          <div className="result-score-card">
            <div className="result-score">{score} / {total}</div>
            <div className="result-score-label">tasks solved correctly</div>
            <div className="result-time">Time: {formatTime(elapsedSeconds)}</div>
          </div>

          <div className="result-breakdown">
            {tasks.map((task, idx) => (
              <div key={task.id} className={`result-task-row ${scores[idx] ? 'passed' : 'failed'}`}>
                <span className="result-task-icon">{scores[idx] ? '✓' : '✗'}</span>
                <span className="result-task-title">{task.title}</span>
              </div>
            ))}
          </div>

          <div className="result-recommendation">
            <div className="rec-emoji">{rec.emoji}</div>
            <h3>{rec.title}</h3>
            <p>{rec.message}</p>
          </div>

          <Button
            variant="primary"
            className="continue-btn"
            onClick={() => handleConfirmLevel(rec.recommendedLevel)}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Confirm & Start Learning'}
          </Button>
        </div>
      </div>
    );
  }

  // ── TESTING ────────────────────────────────────────────────────────────────
  const currentTask = tasks[currentIdx];

  return (
    <div className="screening-test-page">
      <div className="screening-header">
        <div className="screening-progress-info">
          <span className="progress-label">Task {currentIdx + 1} of {tasks.length}</span>
          <div className="screening-progress-bar">
            <div
              className="screening-progress-fill"
              style={{ width: `${(currentIdx / tasks.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="screening-timer">⏱ {formatTime(elapsedSeconds)}</div>
      </div>

      <div className="screening-body">
        <div className="screening-task-panel">
          <span className={`task-type-pill type-${currentTask.type}`}>
            {currentTask.type === 'debug' ? '🐛 Debug' : currentTask.type === 'test' ? '🧪 Testing' : '💻 Coding'}
          </span>
          <h2 className="screening-task-title">{currentTask.title}</h2>
          <p className="screening-task-desc">{currentTask.description}</p>

          {currentTask.expectedOutput && (
            <div className="expected-output-box">
              <div className="expected-label">Expected output:</div>
              <pre className="expected-code">{currentTask.expectedOutput}</pre>
            </div>
          )}
        </div>

        <div className="screening-editor-panel">
          <div className="screening-editor-wrap">
            <div className="screening-editor-header">
              <span>solution.py</span>
              <span>Python 3</span>
            </div>
            <div className="screening-code-area">
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={(c) => highlight(c, languages.python, 'python')}
                padding={16}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minHeight: '200px', outline: 'none' }}
              />
            </div>
          </div>

          {runResult && (
            <div className={`screening-run-result ${taskPassed ? 'passed' : 'failed'}`}>
              <div className="run-status">
                {taskPassed ? '✓ Correct!' : '✗ Incorrect — check your output'}
              </div>
              {runResult.stdout && (
                <div className="run-output-block">
                  <div className="run-output-label">Output:</div>
                  <pre className="run-output-pre">{runResult.stdout}</pre>
                </div>
              )}
              {runResult.stderr && (
                <div className="run-output-block">
                  <div className="run-output-label">Error:</div>
                  <pre className="run-output-pre run-error-pre">{runResult.stderr}</pre>
                </div>
              )}
            </div>
          )}

          <div className="screening-actions">
            <Button variant="outline" onClick={handleRunAndCheck} disabled={isRunning}>
              {isRunning ? '▶ Running...' : '▶ Run & Check'}
            </Button>
            <Button variant="primary" onClick={handleNextTask}>
              {taskPassed !== null
                ? (currentIdx + 1 < tasks.length ? 'Next Task →' : 'Finish Test')
                : 'Skip Task'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
