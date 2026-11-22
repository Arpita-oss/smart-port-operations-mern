import { useEffect, useState } from 'react';
import API from '../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Operations Officer' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const loadUsers = async () => {
    try {
      const { data } = await API.get('/auth/users');
      setUsers(data);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error loading users' });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await API.post('/auth/register', form);
      setMsg({ type: 'success', text: `User ${form.name} (${form.role}) created!` });
      setForm({ name: '', email: '', password: '', role: 'Operations Officer' });
      loadUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Creation failed' });
    }
  };

  const toggleStatus = async (user) => {
    try {
      await API.patch(`/auth/users/${user._id}`, { isActive: !user.isActive });
      loadUsers();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update user status' });
    }
  };

  return (
    <div>
      <h2>👥 User & Role Management (Rule 12)</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>Only Port Administrators can register or activate/deactivate staff accounts.</p>

      {msg.text && <div className={msg.type === 'error' ? 'alert-error' : 'alert-success'}>{msg.text}</div>}

      <div className="grid-2">
        <div className="card">
          <h3>Register New Staff Account</h3>
          <form onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

            <label>Assign Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Port Administrator</option>
              <option>Operations Officer</option>
              <option>Yard Operator</option>
              <option>Gate Operator</option>
              <option>Operations Manager</option>
            </select>

            <button type="submit" className="btn">Create User</button>
          </form>
        </div>

        <div className="card">
          <h3>Registered Port Users ({users.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong><br />
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</span>
                  </td>
                  <td><span className="badge badge-blue">{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleStatus(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}