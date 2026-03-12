import React from 'react';
import './Card.css';

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', padded = false, ...props }) {
  return (
    <div className={`card-body ${padded ? 'card-body-padded' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
