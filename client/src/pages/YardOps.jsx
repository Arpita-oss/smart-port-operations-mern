import { useEffect, useState } from 'react';
import API from '../api';

export default function YardOps() {
  const [slots, setSlots] = useState([]);
  const [containers, setContainers] = useState([]);
  const [newSlot, setNewSlot] = useState({ slotCode: '', zone: 'Zone A' });
  const [assignForm, setAssignForm] = useState({ containerId: '', slotId: '' });
  const [relocateForm, setRelocateForm] = useState({ containerId: '', newSlotId: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([API.get('/yard/slots'), API.get('/containers')]);
      setSlots(sRes.data);
      setContainers(cRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await API.post('/yard/slots', newSlot);
      setMsg({ type: 'success', text: `Yard slot ${newSlot.slotCode} created!` });
      setNewSlot({ slotCode: '', zone: 'Zone A' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error creating slot' });
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const { data } = await API.post('/yard/assign', assignForm);
      setMsg({ type: 'success', text: data.message });
      setAssignForm({ containerId: '', slotId: '' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Assignment failed' });
    }
  };

  const handleRelocate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const { data } = await API.post('/yard/relocate', relocateForm);
      setMsg({ type: 'success', text: data.message });
      setRelocateForm({ containerId: '', newSlotId: '' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Relocation failed' });
    }
  };

  const unassignedContainers = containers.filter((c) => !c.yardSlotId && c.status !== 'Dispatched');
  const assignedContainers = containers.filter((c) => c.yardSlotId && c.status !== 'Dispatched');
  const vacantSlots = slots.filter((s) => !s.isOccupied);

  return (
    <div>
      <h2>🏗️ Container Yard Operations & Slot Allocation</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Enforces 1 container per slot (Rule 3), vacant slot assignment only (Rule 4), and no duplicate slot placement (Rule 11).
      </p>

      {msg.text && <div className={msg.type === 'error' ? 'alert-error' : 'alert-success'}>{msg.text}</div>}

      {/* Visual Yard Occupancy Map */}
      <div className="card">
        <h3>Live Yard Occupancy Map ({slots.filter((s) => s.isOccupied).length} / {slots.length} Occupied)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '1rem' }}>
          {slots.map((s) => (
            <div
              key={s._id}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${s.isOccupied ? '#ef4444' : '#22c55e'}`,
                background: s.isOccupied ? '#fef2f2' : '#f0fdf4',
                textAlign: 'center'
              }}
            >
              <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{s.slotCode}</strong>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.zone}</p>
              <div style={{ marginTop: '0.5rem' }}>
                {s.isOccupied ? (
                  <span className="badge badge-red">📦 {s.containerId?.containerNumber}</span>
                ) : (
                  <span className="badge badge-green">Vacant</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Forms: Assign, Relocate, Create Slot */}
      <div className="grid-2">
        <div className="card">
          <h3>Assign Container to Vacant Slot (Rules 3, 4 & 11)</h3>
          <form onSubmit={handleAssign} style={{ marginTop: '1rem' }}>
            <label>Select Unassigned Container</label>
            <select value={assignForm.containerId} onChange={(e) => setAssignForm({ ...assignForm, containerId: e.target.value })} required>
              <option value="">-- Choose Container --</option>
              {unassignedContainers.map((c) => (
                <option key={c._id} value={c._id}>{c.containerNumber} ({c.cargoDetails})</option>
              ))}
            </select>

            <label>Select Target Slot (Showing all to test Rule 4 validation)</label>
            <select value={assignForm.slotId} onChange={(e) => setAssignForm({ ...assignForm, slotId: e.target.value })} required>
              <option value="">-- Choose Yard Slot --</option>
              {slots.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.slotCode} ({s.isOccupied ? `OCCUPIED by ${s.containerId?.containerNumber}` : 'Vacant'})
                </option>
              ))}
            </select>

            <button type="submit" className="btn">Assign to Slot</button>
          </form>
        </div>

        <div className="card">
          <h3>Relocate Container Between Slots</h3>
          <form onSubmit={handleRelocate} style={{ marginTop: '1rem' }}>
            <label>Select Container Currently in Yard</label>
            <select value={relocateForm.containerId} onChange={(e) => setRelocateForm({ ...relocateForm, containerId: e.target.value })} required>
              <option value="">-- Choose Placed Container --</option>
              {assignedContainers.map((c) => (
                <option key={c._id} value={c._id}>{c.containerNumber}</option>
              ))}
            </select>

            <label>New Vacant Slot</label>
            <select value={relocateForm.newSlotId} onChange={(e) => setRelocateForm({ ...relocateForm, newSlotId: e.target.value })} required>
              <option value="">-- Choose New Vacant Slot --</option>
              {vacantSlots.map((s) => (
                <option key={s._id} value={s._id}>{s.slotCode} ({s.zone})</option>
              ))}
            </select>

            <button type="submit" className="btn btn-success">Relocate Container</button>
          </form>
        </div>
      </div>

      {/* Add New Yard Slot */}
      <div className="card">
        <h3>Create New Yard Storage Slot</h3>
        <form onSubmit={handleCreateSlot} style={{ display: 'flex', gap: '12px', marginTop: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Slot Code (e.g., A-13)</label>
            <input style={{ marginBottom: 0 }} value={newSlot.slotCode} onChange={(e) => setNewSlot({ ...newSlot, slotCode: e.target.value })} required />
          </div>
          <div style={{ flex: 1 }}>
            <label>Zone</label>
            <input style={{ marginBottom: 0 }} value={newSlot.zone} onChange={(e) => setNewSlot({ ...newSlot, zone: e.target.value })} required />
          </div>
          <button type="submit" className="btn">Add Slot</button>
        </form>
      </div>
    </div>
  );
}