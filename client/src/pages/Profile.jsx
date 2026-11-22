import { useState } from 'react';
import API from '../api';

export default function Profile({ user, onUpdateUser }) {
  const [name, setName] = useState(user.name);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const { data } = await API.put('/auth/profile', { name });
      const updatedUser = { ...user, name: data.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update profile' });
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px' }}>
      <h2>👤 My Profile Details (Section 5.1)</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>View and update your port operator profile.</p>

      {msg.text && <div className={msg.type === 'error' ? 'alert-error' : 'alert-success'}>{msg.text}</div>}

      <form onSubmit={handleSave}>
        <label>Full Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Email Address (Read-Only)</label>
        <input value={user.email} disabled style={{ background: '#f8fafc', color: '#64748b' }} />

        <label>Assigned Port Role (Read-Only)</label>
        <input value={user.role} disabled style={{ background: '#f8fafc', color: '#64748b' }} />

        <button type="submit" className="btn">Save Profile</button>
      </form>
    </div>
  );
}