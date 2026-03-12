import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';
import { Camera, Save, KeyRound, User, Mail } from 'lucide-react';
import './ProfilePage.css';

const BASE_URL = 'http://localhost:8000';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [infoMsg, setInfoMsg] = useState('');
  const [infoError, setInfoError] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef(null);

  const avatarSrc = user.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${BASE_URL}${user.avatar_url}`)
    : null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleSaveInfo(e) {
    e.preventDefault();
    setInfoMsg('');
    setInfoError('');
    if (!name.trim()) {
      setInfoError('Name cannot be empty');
      return;
    }
    setSavingInfo(true);
    try {
      const updated = await api.updateProfile({ name: name.trim(), email: email.trim() });
      updateUser(updated);
      setInfoMsg('Profile updated successfully');
    } catch (err) {
      setInfoError(err.message || 'Failed to update profile');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    setPassMsg('');
    setPassError('');
    if (!newPassword) {
      setPassError('Enter new password');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match');
      return;
    }
    setSavingPass(true);
    try {
      const updated = await api.updateProfile({ password: newPassword });
      updateUser(updated);
      setPassMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.message || 'Failed to change password');
    } finally {
      setSavingPass(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const updated = await api.uploadAvatar(file);
      updateUser(updated);
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  }

  return (
    <div className="profile-page">
      <h1 className="profile-title">My Profile</h1>

      {/* Avatar block */}
      <div className="profile-avatar-block">
        <div className="profile-avatar-wrap">
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-initials">{initials}</div>
          )}
          <button
            className="profile-avatar-btn"
            title="Change photo"
            onClick={() => fileInputRef.current.click()}
            disabled={uploadingAvatar}
          >
            <Camera size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>
        <div className="profile-avatar-info">
          <div className="profile-avatar-name">{user.name}</div>
          <div className="profile-avatar-role">
            {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) + ' Student' : 'Student'}
          </div>
          {uploadingAvatar && <div className="profile-hint">Uploading...</div>}
          {avatarError && <div className="profile-error-inline">{avatarError}</div>}
        </div>
      </div>

      {/* Info form */}
      <div className="profile-card">
        <div className="profile-card-title">
          <User size={16} /> Personal Info
        </div>
        <form className="profile-form" onSubmit={handleSaveInfo}>
          <div className="profile-field">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="profile-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          {user.role === 'student' && user.level && (
            <div className="profile-field">
              <label>Level</label>
              <input type="text" value={user.level.charAt(0).toUpperCase() + user.level.slice(1)} readOnly className="profile-readonly" />
            </div>
          )}
          {(user.role === 'teacher' || user.role === 'admin') && (
            <div className="profile-field">
              <label>Role</label>
              <input type="text" value={user.role === 'admin' ? 'Admin' : 'Teacher'} readOnly className="profile-readonly" />
            </div>
          )}
          {infoMsg && <div className="profile-success">{infoMsg}</div>}
          {infoError && <div className="profile-error">{infoError}</div>}
          <button type="submit" className="profile-save-btn" disabled={savingInfo}>
            <Save size={15} />
            {savingInfo ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="profile-card">
        <div className="profile-card-title">
          <KeyRound size={16} /> Change Password
        </div>
        <form className="profile-form" onSubmit={handleSavePassword}>
          <div className="profile-field">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <div className="profile-field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>
          {passMsg && <div className="profile-success">{passMsg}</div>}
          {passError && <div className="profile-error">{passError}</div>}
          <button type="submit" className="profile-save-btn" disabled={savingPass}>
            <KeyRound size={15} />
            {savingPass ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
