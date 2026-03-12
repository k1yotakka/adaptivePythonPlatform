import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import Button from '../../components/UI/Button';
import './JoinGroup.css';

export default function JoinGroup() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const group = await api.joinGroup(code.trim());
      setSuccess(`Joined "${group.name}" successfully!`);
      setTimeout(() => navigate('/student/map'), 1500);
    } catch (err) {
      setError(err.message || 'Invalid invite code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="join-group-page">
      <div className="join-group-card">
        <h1 className="serif-title">Join a Course</h1>
        <p className="subtitle">Enter the invite code your teacher shared with you.</p>

        <form onSubmit={handleJoin} className="join-form">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. py-fall-25"
            required
            autoFocus
          />
          {error && <div className="join-error">{error}</div>}
          {success && <div className="join-success">{success}</div>}
          <Button type="submit" variant="primary" className="join-btn" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Course'}
          </Button>
        </form>
      </div>
    </div>
  );
}
