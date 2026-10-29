import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiMapPin, FiCalendar, FiClock, FiCheckCircle, FiTruck, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getMyDriverTrips, updateDriverTripStatus, linkMyDriverProfile } from '../api';
import { formatDate } from '../utils/format';

const DRIVER_FLOW = [
  { key: 'assigned', label: 'Assigned', nextKey: 'en_route', nextLabel: 'Mark En Route 🚗', color: '#3b82f6' },
  { key: 'en_route', label: 'En Route', nextKey: 'arrived', nextLabel: 'Mark Arrived 📍', color: '#f59e0b' },
  { key: 'arrived', label: 'Arrived at Pickup', nextKey: 'trip_started', nextLabel: 'Start Trip 🏁', color: '#8b5cf6' },
  { key: 'trip_started', label: 'Trip in Progress', nextKey: 'completed', nextLabel: 'Complete Trip ✅', color: '#10b981' },
  { key: 'completed', label: 'Completed', nextKey: null, nextLabel: null, color: '#64748b' },
];

export default function DriverPortal() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [driverProfile, setDriverProfile] = useState(null);
  const [isDriver, setIsDriver] = useState(false);
  const [linkingDriver, setLinkingDriver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const [updatingId, setUpdatingId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await getMyDriverTrips();
      const tripsList = Array.isArray(res.data) ? res.data : (res.data?.trips || []);
      setTrips(tripsList);
      setDriverProfile(res.data?.driver || null);
      setIsDriver(!!res.data?.isDriver || !!res.data?.driver);
    } catch (err) {
      console.error('Error fetching driver trips:', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchTrips();
  }, [isAuthenticated]);

  const handleLinkAsDriver = async () => {
    setLinkingDriver(true);
    try {
      await linkMyDriverProfile();
      setMsg('Your account has been linked as a verified driver in the fleet roster! In Admin Portal, you can now assign bookings to your name.');
      await fetchTrips();
      setTimeout(() => setMsg(''), 6000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to link driver profile');
    } finally {
      setLinkingDriver(false);
    }
  };

  const handleAdvanceStatus = async (bookingId, nextStatus) => {
    if (!nextStatus) return;
    setUpdatingId(bookingId);
    setMsg('');
    try {
      await updateDriverTripStatus(bookingId, nextStatus);
      setMsg(`Trip status updated to: ${nextStatus.replace('_', ' ').toUpperCase()}`);
      await fetchTrips();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeTrips = trips.filter((t) => t.driverStatus !== 'completed' && t.status !== 'cancelled' && t.status !== 'completed');
  const completedTrips = trips.filter((t) => t.driverStatus === 'completed' || t.status === 'completed');
  const displayedTrips = activeTab === 'active' ? activeTrips : completedTrips;

  return (
    <div className="driver-portal-page" style={{ width: '100%', padding: '0' }}>
      <div className="portal-fluid-container" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
        {/* Driver Header */}
        <div style={{ background: '#0f172a', color: '#fff', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isDriver ? '#10b981' : '#f96d00', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', marginBottom: '8px' }}>
              <FiTruck /> {isDriver ? 'Active Chauffeur' : 'Driver Dispatch Hub'}
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 700 }}>
              Welcome back, {user?.name || 'Driver'}
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              {isDriver ? (
                <span>Verified Fleet Driver • Licence: <strong style={{ color: '#fff' }}>{driverProfile?.licenceNumber || 'DL-ACTIVE'}</strong> • {user?.phone || user?.email}</span>
              ) : (
                <span>Customer Account • {user?.phone || user?.email}</span>
              )}
            </p>
          </div>
          <button
            onClick={fetchTrips}
            className="btn btn-outline"
            style={{ color: '#fff', borderColor: '#334155' }}
          >
            ↻ Refresh Dispatches
          </button>
        </div>

        {/* Customer vs Driver context notice */}
        {!loading && !isDriver && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', color: '#92400e' }}>
            <h4 style={{ margin: '0 0 6px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
              <FiAlertCircle /> Why are dispatches not showing here?
            </h4>
            <p style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#78350f', lineHeight: 1.5 }}>
              This page (<strong>Driver Dispatch Hub</strong>) is for <strong>Drivers</strong> to manage trips assigned to them.
              Your car bookings (as a customer) are listed under <strong style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/dashboard?tab=bookings')}>My Car Rentals</strong>.
              In the Admin portal, the trip was assigned to driver <strong>Michael Chang</strong>, so it was routed to Michael Chang's terminal.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              <button 
                onClick={() => navigate('/dashboard?tab=bookings')} 
                className="btn btn-primary" 
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                Go to "My Car Rentals" (View My Booking)
              </button>
              <button 
                onClick={handleLinkAsDriver} 
                disabled={linkingDriver}
                className="btn btn-outline" 
                style={{ padding: '8px 18px', fontSize: '0.85rem', borderColor: '#b45309', color: '#b45309', fontWeight: 600 }}
              >
                {linkingDriver ? 'Linking...' : '⚡ Link My Account as Verified Driver for Testing'}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.85rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <FiCheckCircle size={18} /> {msg}
          </div>
        )}

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'active' ? '#f96d00' : '#e2e8f0',
              color: activeTab === 'active' ? '#fff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Active Trips</span>
            <span style={{ background: activeTab === 'active' ? 'rgba(255,255,255,0.25)' : '#cbd5e1', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>
              {activeTrips.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'completed' ? '#f96d00' : '#e2e8f0',
              color: activeTab === 'completed' ? '#fff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Trip History</span>
            <span style={{ background: activeTab === 'completed' ? 'rgba(255,255,255,0.25)' : '#cbd5e1', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>
              {completedTrips.length}
            </span>
          </button>
        </div>

        {/* Trip Cards */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : displayedTrips.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
            <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>
              {activeTab === 'active' ? 'No Active Dispatches' : 'No Completed Trips Yet'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              {activeTab === 'active' ? 'When an administrator assigns you to a booking with driver, it will appear here instantly.' : 'Past completed trips will be archived here for your records.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {displayedTrips.map((trip) => {
              const currentFlow = DRIVER_FLOW.find((f) => f.key === (trip.driverStatus || 'assigned')) || DRIVER_FLOW[0];
              const car = trip.car || {};
              const customerName = trip.customerName || trip.user?.name || 'Customer';
              const customerPhone = trip.customerPhone || trip.user?.phone || '';

              return (
                <div
                  key={trip._id}
                  style={{
                    background: '#fff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Status Banner */}
                  <div
                    style={{
                      background: currentFlow.color,
                      color: '#fff',
                      padding: '8px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>REF: {trip.bookingReference || trip._id.slice(-6).toUpperCase()}</span>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Status: {currentFlow.label}
                    </span>
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      {/* Vehicle Column */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Vehicle</span>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                          <img
                            src={car.image || '/images/car-1.jpg'}
                            alt={car.name}
                            style={{ width: '65px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{car.name || 'Vehicle'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Plate: <strong style={{ color: '#f96d00' }}>{car.registrationNumber || 'Fleet Unit'}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Column */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Customer Contact</span>
                        <div style={{ marginTop: '6px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiUser style={{ color: '#64748b' }} /> {customerName}
                          </div>
                          {customerPhone ? (
                            <a
                              href={`tel:${customerPhone}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f96d00', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px', textDecoration: 'none' }}
                            >
                              <FiPhone /> Call {customerPhone}
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Phone not provided</span>
                          )}
                        </div>
                      </div>

                      {/* Schedule & Route Column */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Schedule & Route</span>
                        <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <FiCalendar style={{ color: '#64748b' }} />
                            <span>{formatDate(trip.pickupDate)} - {formatDate(trip.returnDate || trip.dropoffDate)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiMapPin style={{ color: '#ef4444' }} />
                            <span>{trip.pickupLocation || 'Main Hub'} → {trip.dropoffLocation || 'Same location'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    {currentFlow.nextKey && (
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Next Milestone:</span>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={updatingId === trip._id}
                          onClick={() => handleAdvanceStatus(trip._id, currentFlow.nextKey)}
                          style={{
                            padding: '10px 22px',
                            fontWeight: 700,
                            borderRadius: '8px',
                            background: '#f96d00',
                            boxShadow: '0 2px 8px rgba(249, 109, 0, 0.3)',
                          }}
                        >
                          {updatingId === trip._id ? 'Updating...' : currentFlow.nextLabel}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
