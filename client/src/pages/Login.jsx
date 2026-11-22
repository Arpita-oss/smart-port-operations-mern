import { useState } from 'react';
import API from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@port.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const quickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('123456');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>⚓ Smart Port Command</h2>
        <p>Digital Harbor Operations Platform</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit" className="btn" style={{ width: '100%' }}>Sign In</button>
        </form>

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Quick Demo Role Fill (Password: 123456):</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button type="button" className="btn btn-sm" onClick={() => quickFill('admin@port.com')}>Admin</button>
            <button type="button" className="btn btn-sm" onClick={() => quickFill('ops@port.com')}>Ops Officer</button>
            <button type="button" className="btn btn-sm" onClick={() => quickFill('yard@port.com')}>Yard Op</button>
            <button type="button" className="btn btn-sm" onClick={() => quickFill('gate@port.com')}>Gate Op</button>
            <button type="button" className="btn btn-sm" onClick={() => quickFill('manager@port.com')}>Manager</button>
          </div>
        </div>
      </div>
    </div>
  );
}