import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/UI/Button';
import { api } from '../../../api/api';
import './Onboarding.css';

const GOALS = [
  {
    value: 'studies',
    icon: '🎓',
    title: 'For studies',
    desc: 'I need Python for university, school, or a course.',
  },
  {
    value: 'work',
    icon: '💼',
    title: 'For work',
    desc: 'I want to use Python in my career or switch to a tech role.',
  },
  {
    value: 'personal',
    icon: '🚀',
    title: 'For personal development',
    desc: 'I want to learn Python out of curiosity or for personal projects.',
  },
];

export default function GoalSelect() {
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      if (selected) {
        await api.updateGoal(selected);
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.learning_goal = selected;
        localStorage.setItem('user', JSON.stringify(savedUser));
      }
    } catch (err) {
      console.error('Failed to save goal:', err);
    }
    navigate('/onboarding/level-select');
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="onboarding-step-badge">Step 2 of 3</div>
        <h1 className="serif-title">What's your learning goal?</h1>
        <p className="subtitle">This helps us personalise your experience. You can change it later.</p>

        <div className="goal-options">
          {GOALS.map((goal) => (
            <div
              key={goal.value}
              className={`goal-card ${selected === goal.value ? 'active' : ''}`}
              onClick={() => setSelected(goal.value)}
            >
              <div className="goal-icon">{goal.icon}</div>
              <div className="goal-info">
                <h3>{goal.title}</h3>
                <p>{goal.desc}</p>
              </div>
              <div className="goal-check">{selected === goal.value ? '✓' : ''}</div>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          className="continue-btn"
          onClick={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : selected ? 'Continue →' : 'Skip for now →'}
        </Button>
      </div>
    </div>
  );
}
