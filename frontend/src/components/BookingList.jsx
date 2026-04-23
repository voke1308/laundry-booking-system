import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];

export default function BookingList({ reloadKey }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchBookings() {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings');
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  async function updateStatus(id, status) {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      fetchBookings();
    } catch (err) {
      alert('Failed to update status');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      setBookings((arr) => arr.filter((b) => b._id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  }

  const groups = useMemo(() => {
    const g = { pending: [], 'in-progress': [], completed: [], cancelled: [] };
    for (const b of bookings) g[b.status]?.push(b);
    return g;
  }, [bookings]);

  return (
    <div>
      {loading && <div className="muted">Loading...</div>}
      {!loading && bookings.length === 0 && <div className="muted">No bookings yet.</div>}

      {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
        <div key={status} className="card">
          <h4 style={{ marginTop: 0, marginBottom: 8, textTransform: 'capitalize' }}>
            {status} <span className="badge">{groups[status]?.length || 0}</span>
          </h4>
          <div className="list">
            {(groups[status] || []).map((b) => (
              <div key={b._id} className="card">
                <div style={{ fontWeight: 600 }}>{b.name} <span className="muted">({b.phone})</span></div>
                <div className="muted">{b.address}</div>
                <div style={{ marginTop: 6 }}>
                  <div>Service: {b.serviceType.replace('_', ' ')}</div>
                  {b.items && Object.keys(b.items).length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div className="muted">Items:</div>
                      {Object.entries(b.items).map(([item, qty]) => 
                        qty > 0 ? (
                          <div key={item} style={{ fontSize: '13px', marginLeft: 8 }}>
                            {item}: {qty}
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                  <div>Pickup: {new Date(b.pickupDate).toLocaleDateString()}</div>
                  <div>Price: <strong>{INR.format(b.price || 0)}</strong></div>
                </div>
                <div className="actions">
                  <select value={b.status} onChange={(e) => updateStatus(b._id, e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button onClick={() => remove(b._id)} style={{ background: '#dc2626' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
