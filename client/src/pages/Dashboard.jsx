import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);

  const fetchSummary = async () => {
    try {
      const res = await API.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const downloadCSV = (filename, rows) => {
    if (!rows || rows.length === 0) {
      alert('No data available to export');
      return;
    }
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [
      headers,
      ...rows.map((r) => Object.values(r).map((v) => `"${v ?? ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) return <div className="card">Loading port analytics...</div>;

  const containerChartData = [
    { name: 'In Transit', count: data.containerStats['In Transit'] },
    { name: 'Arrived', count: data.containerStats.Arrived },
    { name: 'In Yard', count: data.containerStats['In Yard'] },
    { name: 'Ready Pickup', count: data.containerStats['Ready for Pickup'] },
    { name: 'Dispatched', count: data.containerStats.Dispatched }
  ];

  const yardChartData = [
    { name: 'Occupied Slots', value: data.yardStats.occupiedSlots },
    { name: 'Vacant Slots', value: data.yardStats.vacantSlots }
  ];
  const COLORS = ['#ef4444', '#22c55e'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>📊 Port Operations Command Dashboard</h2>
        <button className="btn btn-sm" onClick={fetchSummary}>🔄 Refresh Live Data</button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid-4">
        <div className="card">
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Vessels</p>
          <h2 style={{ fontSize: '1.8rem', margin: '0.4rem 0' }}>{data.vesselStats.total}</h2>
          <span className="badge badge-blue">Arrived: {data.vesselStats.Arrived} | Scheduled: {data.vesselStats.Scheduled}</span>
        </div>

        <div className="card">
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Containers</p>
          <h2 style={{ fontSize: '1.8rem', margin: '0.4rem 0' }}>{data.containerStats.total}</h2>
          <span className="badge badge-green">In Yard: {data.containerStats['In Yard']}</span>
        </div>

        <div className="card">
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Yard Occupancy</p>
          <h2 style={{ fontSize: '1.8rem', margin: '0.4rem 0' }}>{data.yardStats.occupancyRate}%</h2>
          <span className="badge badge-yellow">{data.yardStats.occupiedSlots} / {data.yardStats.totalSlots} Slots Used</span>
        </div>

        <div className="card">
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Active Trucks Inside</p>
          <h2 style={{ fontSize: '1.8rem', margin: '0.4rem 0' }}>{data.gateStats.activeTrucksInside}</h2>
          <span className="badge badge-red">Pending Pickups: {data.pendingPickups.length}</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2">
        <div className="card">
          <h3>Container Monitoring (By Stage)</h3>
          <div style={{ width: '100%', height: 240, marginTop: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={containerChartData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Yard Occupancy Report</h3>
          <div style={{ width: '100%', height: 240, marginTop: '1rem' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={yardChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {yardChartData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Pickup Report & Gate Activity Report */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3>⏳ Pending Pickup Report</h3>
            <button
              className="btn btn-sm"
              onClick={() =>
                downloadCSV(
                  'pending_pickups.csv',
                  data.pendingPickups.map((c) => ({
                    ContainerNumber: c.containerNumber,
                    Cargo: c.cargoDetails,
                    YardSlot: c.yardSlotId?.slotCode || 'Unassigned',
                    GateApproved: c.gateApproved ? 'Yes' : 'No'
                  }))
                )
              }
            >
              ⬇️ Export CSV
            </button>
          </div>

          {data.pendingPickups.length === 0 ? (
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No containers waiting for pickup.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Container #</th>
                  <th>Cargo</th>
                  <th>Slot</th>
                  <th>Gate Approved</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingPickups.map((c) => (
                  <tr key={c._id}>
                    <td><strong>{c.containerNumber}</strong></td>
                    <td>{c.cargoDetails}</td>
                    <td>{c.yardSlotId?.slotCode || 'Unassigned'}</td>
                    <td>{c.gateApproved ? <span className="badge badge-green">Yes</span> : <span className="badge badge-red">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3>🚛 Daily Gate Activity Report</h3>
            <button
              className="btn btn-sm"
              onClick={() =>
                downloadCSV(
                  'gate_activity.csv',
                  data.gateStats.recentTransactions.map((t) => ({
                    TruckNumber: t.truckId?.truckNumber,
                    Container: t.containerId?.containerNumber || 'None',
                    Status: t.status,
                    GateInTime: new Date(t.gateInTime).toLocaleString(),
                    GateOutTime: t.gateOutTime ? new Date(t.gateOutTime).toLocaleString() : 'Inside Port'
                  }))
                )
              }
            >
              ⬇️ Export CSV
            </button>
          </div>

          {data.gateStats.recentTransactions.length === 0 ? (
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No truck gate movements logged yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Truck #</th>
                  <th>Container</th>
                  <th>Status</th>
                  <th>Gate-In Time</th>
                </tr>
              </thead>
              <tbody>
                {data.gateStats.recentTransactions.map((t) => (
                  <tr key={t._id}>
                    <td><strong>{t.truckId?.truckNumber}</strong></td>
                    <td>{t.containerId?.containerNumber || '-'}</td>
                    <td>
                      <span className={`badge ${t.status === 'IN' ? 'badge-yellow' : 'badge-green'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{new Date(t.gateInTime).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}