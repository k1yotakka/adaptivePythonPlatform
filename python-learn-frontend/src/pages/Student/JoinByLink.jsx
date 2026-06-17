import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';
import Button from '../../components/UI/Button';
import './JoinGroup.css';

// Receiving end of an invite LINK: /join/:code
// The teacher's "Copy Link" button produces  {origin}/join/{invite_code}.
// This page resolves the link depending on who is visiting:
//   - guest         -> remember the code, prompt to sign in / sign up
//   - student       -> join the group right away (reuses POST /groups/join)
//   - teacher/admin -> explain that only students can join
export default function JoinByLink() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('working'); // working | need_auth | success | wrong_role | error
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against double-run
    ran.current = true;

    // Not logged in -> stash the code so we can auto-join after auth.
    if (!user) {
      localStorage.setItem('pendingInvite', code);
      setStatus('need_auth');
      return;
    }

    // Logged in, but not a student -> backend would reject with 403 anyway.
    if (user.role !== 'student') {
      localStorage.removeItem('pendingInvite');
      setStatus('wrong_role');
      return;
    }

    // Student -> perform the join.
    (async () => {
      try {
        const group = await api.joinGroup(code);
        localStorage.removeItem('pendingInvite');
        setMessage(`You've joined "${group.name}"!`);
        setStatus('success');
        setTimeout(() => navigate('/student/map'), 1500);
      } catch (err) {
        localStorage.removeItem('pendingInvite');
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('already enrolled')) {
          setMessage("You're already in this class.");
          setStatus('success');
          setTimeout(() => navigate('/student/map'), 1500);
        } else {
          setMessage(err.message || 'This invite link is invalid or has expired.');
          setStatus('error');
        }
      }
    })();
  }, [user, code, navigate]);

  return (
    <div className="join-group-page">
      <div className="join-group-card">
        <h1 className="serif-title">Join a Course</h1>

        {status === 'working' && <p className="subtitle">Joining…</p>}

        {status === 'need_auth' && (
          <>
            <p className="subtitle">
              You've been invited to join a class. Sign in or create an account to continue.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button variant="primary" className="join-btn" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="secondary" className="join-btn" onClick={() => navigate('/signup')}>
                Create Account
              </Button>
            </div>
          </>
        )}

        {status === 'success' && <div className="join-success">{message}</div>}

        {status === 'wrong_role' && (
          <>
            <p className="subtitle">
              Only student accounts can join classes. You're signed in as a {user?.role}.
            </p>
            <Button variant="primary" className="join-btn" onClick={() => navigate('/')}>
              Go Back
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="join-error">{message}</div>
            <Button
              variant="secondary"
              className="join-btn"
              onClick={() => navigate('/student/join')}
            >
              Enter code manually
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
