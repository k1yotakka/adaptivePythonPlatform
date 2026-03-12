import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ progress, color = 'var(--text-student-primary)', label }) {
  return (
    <div className="progress-wrapper">
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
}
