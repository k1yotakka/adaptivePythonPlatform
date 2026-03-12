import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/UI/Button';
import { api } from '../../../api/api';
import './Onboarding.css';

export default function LevelSelect() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selectedLevel) return;

    if (selectedLevel === 'beginner') {
      setIsLoading(true);
      try {
        await api.updateLevel('beginner');
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.level = 'beginner';
        localStorage.setItem('user', JSON.stringify(savedUser));
      } catch (err) {
        console.error('Failed to save level:', err);
      }
      navigate('/onboarding/level-tasks');
    } else {
      navigate(`/onboarding/screening?level=${selectedLevel}`);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="onboarding-step-badge">Step 3 of 3</div>
        <h1 className="serif-title">Select your level</h1>
        <p className="subtitle">This helps us personalize your learning path.</p>

        <div className="level-options">
          <div 
            className={`level-card ${selectedLevel === 'beginner' ? 'active' : ''}`}
            onClick={() => setSelectedLevel('beginner')}
          >
            <div className="level-icon">🟢</div>
            <div className="level-info">
              <h3>Beginner</h3>
              <p>I have never programmed before or have very limited experience.</p>
            </div>
          </div>

          <div 
            className={`level-card ${selectedLevel === 'intermediate' ? 'active' : ''}`}
            onClick={() => setSelectedLevel('intermediate')}
          >
            <div className="level-icon">🟡</div>
            <div className="level-info">
              <h3>Intermediate</h3>
              <p>I have written code before and understand loops, conditionals, and functions.</p>
            </div>
          </div>

          <div 
            className={`level-card ${selectedLevel === 'advanced' ? 'active' : ''}`}
            onClick={() => setSelectedLevel('advanced')}
          >
            <div className="level-icon">🔴</div>
            <div className="level-info">
              <h3>Advanced</h3>
              <p>I can build programs and have experience with OOP, files, and real projects.</p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          className="continue-btn"
          onClick={handleContinue}
          disabled={!selectedLevel || isLoading}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
