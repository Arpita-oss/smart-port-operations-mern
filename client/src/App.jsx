import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Vessels from './pages/Vessels';
import Containers from './pages/Containers';
import YardOps from './pages/YardOps';
import GateOps from './pages/GateOps';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={(u) => { setUser(u); setActiveTab('dashboard'); }} />;
  }

  const roleMenus = {
    'Port Administrator': ['dashboard', 'users', 'vessels', 'containers', 'yard', 'gate'],
    'Operations Officer': ['dashboard', 'vessels', 'containers'],
    'Yard Operator': ['dashboard', 'yard', 'containers'],
    'Gate Operator': ['dashboard', 'gate', 'containers'],
    'Operations Manager': ['dashboard']
  };

  const allowedTabs = roleMenus[user.role] || ['dashboard'];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h3>⚓ Smart Port Ops</h3>
        <div className="role-badge">{user.role}</div>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>Welcome, {user.name}</p>

        {allowedTabs.includes('dashboard') && (
          <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard & Reports
          </button>
        )}
        {allowedTabs.includes('users') && (
          <button className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            👥 User Management
          </button>
        )}
        {allowedTabs.includes('vessels') && (
          <button className={`nav-btn ${activeTab === 'vessels' ? 'active' : ''}`} onClick={() => setActiveTab('vessels')}>
            🚢 Vessel Management
          </button>
        )}
        {allowedTabs.includes('containers') && (
          <button className={`nav-btn ${activeTab === 'containers' ? 'active' : ''}`} onClick={() => setActiveTab('containers')}>
            📦 Container Tracking
          </button>
        )}
        {allowedTabs.includes('yard') && (
          <button className={`nav-btn ${activeTab === 'yard' ? 'active' : ''}`} onClick={() => setActiveTab('yard')}>
            🏗️ Yard Operations
          </button>
        )}
        {allowedTabs.includes('gate') && (
          <button className={`nav-btn ${activeTab === 'gate' ? 'active' : ''}`} onClick={() => setActiveTab('gate')}>
            🚛 Truck Gate Ops
          </button>
        )}

        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'vessels' && <Vessels user={user} />}
        {activeTab === 'containers' && <Containers user={user} />}
        {activeTab === 'yard' && <YardOps />}
        {activeTab === 'gate' && <GateOps />}
      </main>
    </div>
  );
}