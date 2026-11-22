import { useEffect, useState } from 'react';
import API from '../api';

export default function Containers({ user }) {
  const [containers, setContainers] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ containerNumber: '', vesselId: '', cargoDetails: '', status: 'Arrived' });
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const canEdit = ['Operations Officer', 'Port Administrator'].includes(user.role);

  const loadData = async () => {
    try {
      const [cRes, vRes] = await Promise.all([
        API.get('/containers', { params: { search, status: statusFilter } }),
        API.get('/vessels')
      ]);
      setContainers(cRes.data);
      setVessels(vRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await API.post('/containers', form);
      setMsg({ type: 'success', text: `Container ${form.containerNumber} registered!` });
      setForm({ containerNumber: '', vesselId: '', cargoDetails: '', status: 'Arrived' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error registering container' });
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await API.patch(`/containers/${id}/status`, payload);
      setMsg({ type: 'success', text: 'Container updated & timestamp logged (Rule 9).' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update container' });
    }
  };

  return (
    <div>
      <h2>📦 Container Management & History Tracking</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>Enforces unique Container Numbers (Rule 2), Gate Approval (Rule 5), and Timestamped History (Rule 9).</p>

      {msg.text && <div className={msg.type === 'error' ? 'alert-error' : 'alert-success'}>{msg.text}</div>}

      <div className={canEdit ? 'grid-2' : ''}>
        {canEdit && (
          <div className="card">
            <h3>Register New Container</h3>
            <form onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
              <label>Unique Container Number (e.g., C-501)</label>
              <input value={form.containerNumber} onChange={(e) => setForm({ ...form, containerNumber: e.target.value })} required />

              <label>Associated Vessel (Optional)</label>
              <select value={form.vesselId} onChange={(e) => setForm({ ...form, vesselId: e.target.value })}>
                <option value="">-- Select Vessel --</option>
                {vessels.map((v) => (
                  <option key={v._id} value={v._id}>{v.vesselId} - {v.vesselName}</option>
                ))}
              </select>

              <label>Cargo Details</label>
              <input placeholder="e.g., Textiles - 12 Tons" value={form.cargoDetails} onChange={(e) => setForm({ ...form, cargoDetails: e.target.value })} required />

              <label>Initial Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>In Transit</option>
                <option>Arrived</option>
                <option>In Yard</option>
                <option>Ready for Pickup</option>
              </select>

              <button type="submit" className="btn">Register Container</button>
            </form>
          </div>
        )}

        <div className="card">
          <h3>Container Registry & Search</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '0.75rem' }}>
            <input
              placeholder="Search Container Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select style={{ width: '180px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Stages</option>
              <option>In Transit</option>
              <option>Arrived</option>
              <option>In Yard</option>
              <option>Ready for Pickup</option>
              <option>Dispatched</option>
            </select>
          </div>

          <table>
            <thead>
              <tr>
                <th>Container #</th>
                <th>Vessel / Cargo</th>
                <th>Stage</th>
                <th>Gate Approval</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.containerNumber}</strong></td>
                  <td style={{ fontSize: '0.82rem' }}>
                    Vessel: {c.vesselId ? c.vesselId.vesselId : <span style={{ color: '#94a3b8' }}>None / Archived</span>}<br />
                    {c.cargoDetails}
                  </td>
                  <td>
                    {canEdit && c.status !== 'Dispatched' ? (
                      <select
                        style={{ marginBottom: 0, padding: '4px' }}
                        value={c.status}
                        onChange={(e) => handleUpdate(c._id, { status: e.target.value })}
                      >
                        <option>In Transit</option>
                        <option>Arrived</option>
                        <option>In Yard</option>
                        <option>Ready for Pickup</option>
                      </select>
                    ) : (
                      <span className={`badge ${c.status === 'Dispatched' ? 'badge-green' : 'badge-blue'}`}>{c.status}</span>
                    )}
                  </td>
                  <td>
                    {canEdit && c.status !== 'Dispatched' ? (
                      <button
                        className={`btn btn-sm ${c.gateApproved ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => handleUpdate(c._id, { gateApproved: !c.gateApproved })}
                      >
                        {c.gateApproved ? 'Approved ✓' : 'Not Approved'}
                      </button>
                    ) : (
                      <span className={`badge ${c.gateApproved ? 'badge-green' : 'badge-red'}`}>
                        {c.gateApproved ? 'Approved' : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setSelectedHistory(c)}>
                      🕒 Log ({c.statusHistory?.length || 0})
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Container Status History Modal Card (Rule 9) */}
      {selectedHistory && (
        <div className="card" style={{ border: '2px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🕒 Audit History for {selectedHistory.containerNumber} (Rule 9)</h3>
            <button className="btn btn-sm btn-danger" onClick={() => setSelectedHistory(null)}>Close</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {selectedHistory.statusHistory.map((h, i) => (
                <tr key={i}>
                  <td><span className="badge badge-blue">{h.status}</span></td>
                  <td>{new Date(h.timestamp).toLocaleString()}</td>
                  <td>{h.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}