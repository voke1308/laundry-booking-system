import React, { useState } from 'react';
import BookingForm from './components/BookingForm.jsx';
import BookingList from './components/BookingList.jsx';

export default function App() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="container">
      <div className="card">
        <h2>Laundry Booking</h2>
        <p className="muted">Create a booking and view all bookings below.</p>
        <BookingForm onCreated={() => setReloadKey((k) => k + 1)} />
      </div>
      <div className="card">
        <h3>Bookings</h3>
        <BookingList reloadKey={reloadKey} />
      </div>
    </div>
  );
}
