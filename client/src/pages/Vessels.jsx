import { useEffect, useState } from 'react';
import API from '../api';

export default function Vessels({ user }) {
  const [vessels, setVessels] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ vesselId: '', vesselName: '', arrivalDate: '', departureDate: '', status: 'Scheduled' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const canEdit = ['Operations Officer', 'Port Administrator'].includes(user.role);

  const loadVessels = async () => {
    try {
      const { data } = await API.get('/vessels', { params: { search, status: statusFilter } });
      setVessels(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVessels();
  }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await API.post('/vessels', form);
      setMsg({ type: 'success', text: `Vessel ${form.vesselId} registered!` });
      setForm({ vesselId: '', vesselName: '', arrivalDate: '', departureDate: '', status: 'Scheduled' });
      loadVessels();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error creating vessel' });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.patch(`/vessels/${id}/status`, { status: newStatus });
      loadVessels();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update vessel status' });
    }
  };

  const handleDelete = async (id, vesselId) => {
    try {
      const { data } = await API.delete(`/vessels/${id}`);
      setMsg({ type: 'success', text: data.message });
      loadVessels();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to delete vessel' });
    }
  };

  return (
    <div>
      <h2>🚢 Vessel Management & Schedule</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>Enforces unique Vessel IDs (Rule 1) and preserves containers upon vessel deletion (Rule 7).</p>

      {msg.text && <div className={msg.type === 'error' ? 'alert-error' : 'alert-success'}>{msg.text}</div>}

      <div className={canEdit ? 'grid-2' : ''}>
        {canEdit && (
          <div className="card">
            <h3>Register Incoming Vessel</h3>
            <form onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
              <label>Unique Vessel ID (e.g., V-102)</label>
              <input value={form.vesselId} onChange={(e) => setForm({ ...form, vesselId: e.target.value })} required />

              <label>Vessel Name</label>
              <input value={form.vesselName} onChange={(e) => setForm({ ...form, vesselName: e.target.value })} required />

              <label>Planned Arrival Date</label>
              <input type="date" value={form.arrivalDate} onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })} required />

              <label>Planned Departure Date</label>
              <input type="date" value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} required />

              <label>Initial Stage</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Scheduled</option>
                <option>Arrived</option>
                <option>Departed</option>
              </select>

              <button type="submit" className="btn">Register Vessel</button>
            </form>
          </div>
        )}

        <div className="card">
          <h3>Vessel Schedule & Search</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '0.75rem' }}>
            <input
              placeholder="Search by Vessel ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select style={{ width: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Scheduled</option>
              <option>Arrived</option>
              <option>Departed</option>
            </select>
          </div>

          <table>
            <thead>
              <tr>
                <th>Vessel ID</th>
                <th>Name</th>
                <th>Schedule</th>
                <th>Stage</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vessels.map((v) => (
                <tr key={v._id}>
                  <td><strong>{v.vesselId}</strong></td>
                  <td>{v.vesselName}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    ETA: {new Date(v.arrivalDate).toLocaleDateString()}<br />
                    ETD: {new Date(v.departureDate).toLocaleDateString()}
                  </td>
                  <td>
                    {canEdit ? (
                      <select
                        style={{ marginBottom: 0, padding: '4px' }}
                        value={v.status}
                        onChange={(e) => handleStatusChange(v._id, e.target.value)}
                      >
                        <option>Scheduled</option>
                        <option>Arrived</option>
                        <option>Departed</option>
                      </select>
                    ) : (
                      <span className="badge badge-blue">{v.status}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(v._id, v.vesselId)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}