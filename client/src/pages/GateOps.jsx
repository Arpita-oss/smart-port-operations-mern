import { useEffect, useState } from 'react';
import API from '../api';

export default function GateOps() {
  const [trucks, setTrucks] = useState([]);
  const [containers, setContainers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [truckForm, setTruckForm] = useState({ truckNumber: '', driverName: '', company: '' });
  const [gateInTruckId, setGateInTruckId] = useState('');
  const [gateOutForm, setGateOutForm] = useState({ truckId: '', containerId: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      const [tRes, cRes, txRes] = await Promise.all([
        API.get('/gate/trucks'),
        API.get('/containers'),
        API.get('/gate/transactions')
      ]);
      setTrucks(tRes.data);
      setContainers(cRes.data.filter((c) => c.status !== 'Dispatched'));
      setTransactions(txRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterTruck = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await API.post('/gate/trucks', truckForm);
      setMsg({ type: 'success', text: `Truck ${truckForm.truckNumber} registered!` });
      setTruckForm({ truckNumber: '', driverName: '', company: '' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Truck registration failed' });
    }
  };

  const handleGateIn = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const { data } = await API.post('/gate/gate-in', { truckId: gateInTruckId });
      setMsg({ type: 'success', text: data.message });
      setGateInTruckId('');
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gate-In failed' });
    }
  };

  const handleGateOut = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const { data } = await API.post('/gate/gate-out', gateOutForm);
      setMsg({ type: 'success', text: data.message });
      setGateOutForm({ truckId: '', containerId: '' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gate-Out blocked' });
    }
  };

  return (
    <div>
      <h2>🚛 Truck Gate Operations & Pickup Validation</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Enforces Gate Approval (Rule 5), "Ready for Pickup" status (Rule 6), and matching Gate-In record (Rule 10).
      </p>

      {msg.text && <div className={msg.type === 'error' ? 'alert-error' : 'alert-success'}>{msg.text}</div>}

      <div className="grid-2">
        {/* 1. Gate-In Processing */}
        <div className="card">
          <h3>1. Truck Gate-In Entry</h3>
          <form onSubmit={handleGateIn} style={{ marginTop: '1rem' }}>
            <label>Select Authorized Truck</label>
            <select value={gateInTruckId} onChange={(e) => setGateInTruckId(e.target.value)} required>
              <option value="">-- Choose Registered Truck --</option>
              {trucks.map((t) => (
                <option key={t._id} value={t._id}>{t.truckNumber} - {t.driverName} ({t.company})</option>
              ))}
            </select>
            <button type="submit" className="btn">Record Gate-In</button>
          </form>
        </div>

        {/* 2. Gate-Out & Pickup Validation */}
        <div className="card">
          <h3>2. Truck Gate-Out & Pickup Validation (Rules 5, 6 & 10)</h3>
          <form onSubmit={handleGateOut} style={{ marginTop: '1rem' }}>
            <label>Select Exiting Truck</label>
            <select value={gateOutForm.truckId} onChange={(e) => setGateOutForm({ ...gateOutForm, truckId: e.target.value })} required>
              <option value="">-- Choose Truck --</option>
              {trucks.map((t) => (
                <option key={t._id} value={t._id}>{t.truckNumber} ({t.driverName})</option>
              ))}
            </select>

            <label>Container Being Picked Up (Optional if exiting empty)</label>
            <select value={gateOutForm.containerId} onChange={(e) => setGateOutForm({ ...gateOutForm, containerId: e.target.value })}>
              <option value="">-- Empty Exit / No Container --</option>
              {containers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.containerNumber} | Status: {c.status} | Approved: {c.gateApproved ? 'Yes' : 'NO'}
                </option>
              ))}
            </select>

            <button type="submit" className="btn btn-success">Validate & Approve Gate-Out</button>
          </form>
        </div>
      </div>

      <div className="grid-2">
        {/* 3. Register New Truck */}
        <div className="card">
          <h3>Register Authorized Truck</h3>
          <form onSubmit={handleRegisterTruck} style={{ marginTop: '1rem' }}>
            <label>Truck License Plate (e.g., MP-09-HH-4421)</label>
            <input value={truckForm.truckNumber} onChange={(e) => setTruckForm({ ...truckForm, truckNumber: e.target.value })} required />

            <label>Driver Name</label>
            <input value={truckForm.driverName} onChange={(e) => setTruckForm({ ...truckForm, driverName: e.target.value })} required />

            <label>Logistics Company</label>
            <input value={truckForm.company} onChange={(e) => setTruckForm({ ...truckForm, company: e.target.value })} required />

            <button type="submit" className="btn">Register Truck</button>
          </form>
        </div>

        {/* 4. Live Gate Transaction Log */}
        <div className="card">
          <h3>Gate Movement Log ({transactions.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Truck #</th>
                <th>Container</th>
                <th>Status</th>
                <th>In / Out Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td><strong>{tx.truckId?.truckNumber}</strong></td>
                  <td>{tx.containerId?.containerNumber || '-'}</td>
                  <td>
                    <span className={`badge ${tx.status === 'IN' ? 'badge-yellow' : 'badge-green'}`}>{tx.status}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    In: {new Date(tx.gateInTime).toLocaleTimeString()}<br />
                    {tx.gateOutTime ? `Out: ${new Date(tx.gateOutTime).toLocaleTimeString()}` : 'Inside Port'}
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