import React, { useMemo, useState } from 'react';
import api from '../lib/api.js';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

const ITEM_PRICES = {
  WASH_FOLD: {
    shirt: 40,
    pant: 50,
    tshirt: 35,
    jeans: 60,
    bedsheet: 80,
    towel: 25,
    dress: 70,
    sweater: 90,
  },
  WASH_IRON: {
    shirt: 60,
    pant: 70,
    tshirt: 50,
    jeans: 80,
    bedsheet: 120,
    towel: 35,
    dress: 100,
    sweater: 130,
  },
  DRY_CLEAN: {
    suit: 250,
    blazer: 200,
    coat: 300,
    dress: 220,
    curtain: 180,
    blanket: 350,
  },
};

function minPickupDateStr() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookingForm({ onCreated }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    serviceType: 'WASH_FOLD',
    pickupDate: '',
  });
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);
  const minDate = useMemo(() => minPickupDateStr(), []);

  const availableItems = useMemo(() => ITEM_PRICES[form.serviceType] || {}, [form.serviceType]);

  const price = useMemo(() => {
    let total = 0;
    for (const [itemType, quantity] of Object.entries(items)) {
      const qty = Number(quantity) || 0;
      const itemPrice = availableItems[itemType] || 0;
      total += qty * itemPrice;
    }
    return Math.max(0, Math.round(total * 100) / 100);
  }, [items, availableItems]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'serviceType') {
      setItems({});
    }
  }

  function handleItemChange(itemType, value) {
    const qty = Math.max(0, parseInt(value || '0', 10));
    setItems((prev) => ({ ...prev, [itemType]: qty }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.pickupDate) {
      alert('Please select a pickup date.');
      return;
    }

    const hasItems = Object.values(items).some((qty) => qty > 0);
    if (!hasItems) {
      alert('Please select at least one item.');
      return;
    }

    setLoading(true);
    try {
      // Filter out items with 0 or empty quantities
      const filteredItems = {};
      for (const [key, value] of Object.entries(items)) {
        const qty = Number(value) || 0;
        if (qty > 0) {
          filteredItems[key] = qty;
        }
      }

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        serviceType: form.serviceType,
        items: filteredItems,
        pickupDate: form.pickupDate,
      };
      await api.post('/bookings', payload);
      setForm({ name: '', phone: '', address: '', serviceType: 'WASH_FOLD', pickupDate: '' });
      setItems({});
      onCreated && onCreated();
    } catch (err) {
      console.error('Booking error:', err);
      console.error('Error response:', err?.response?.data);
      const msg = err?.response?.data?.message || 'Failed to create booking';
      const details = err?.response?.data?.details;
      if (details) {
        console.error('Validation details:', details);
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Phone (10 digits)</label>
          <input name="phone" value={form.phone} onChange={handleChange} pattern="\d{10}" required />
        </div>
      </div>

      <div>
        <label>Address</label>
        <textarea name="address" value={form.address} onChange={handleChange} required />
      </div>

      <div className="row">
        <div>
          <label>Service Type</label>
          <select name="serviceType" value={form.serviceType} onChange={handleChange}>
            <option value="WASH_FOLD">Wash & Fold</option>
            <option value="WASH_IRON">Wash & Iron</option>
            <option value="DRY_CLEAN">Dry Clean</option>
          </select>
        </div>
        <div>
          <label>Pickup Date</label>
          <input name="pickupDate" type="date" min={minDate} value={form.pickupDate} onChange={handleChange} required />
        </div>
      </div>

      <div>
        <label>Select Items</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '8px' }}>
          {Object.entries(availableItems).map(([itemType, itemPrice]) => (
            <div key={itemType} style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: '4px' }}>{itemType}</div>
              <div className="muted" style={{ fontSize: '12px', marginBottom: '6px' }}>{INR.format(itemPrice)} each</div>
              <input
                type="number"
                min="0"
                step="1"
                value={items[itemType] || ''}
                onChange={(e) => handleItemChange(itemType, e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ alignItems: 'center', marginTop: '16px' }}>
        <div>
          <label>Estimated Price</label>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{INR.format(price)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Booking'}</button>
        </div>
      </div>
    </form>
  );
}
