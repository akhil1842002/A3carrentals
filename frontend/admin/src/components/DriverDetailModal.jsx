import { useState, useEffect } from 'react';
import { 
  FaTimes, FaStar, FaCar, FaUserTie, FaPhone, FaEnvelope, 
  FaIdCard, FaClock, FaShieldAlt, FaCheckCircle, FaCalendarAlt,
  FaMapPin, FaCircle
} from 'react-icons/fa';
import { getDriverDetails } from '../api';
import { formatDate } from '../utils/format';

export default function DriverDetailModal({ driverId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'trips'

  useEffect(() => {
    if (isOpen && driverId) {
      loadDetails();
      setActiveTab('reviews');
    }
  }, [isOpen, driverId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await getDriverDetails(driverId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load driver details:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const driver = data?.driver;
  const trips = data?.trips || [];
  const reviews = data?.reviews || [];
  const stats = data?.stats || {
    totalTrips: 0,
    completedTrips: 0,
    activeTrips: 0,
    reviewsCount: 0,
    averageRating: 4.9
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '94%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #f96d00 0%, #ea580c 100%)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 800
              }}
            >
              {driver?.name ? driver.name.charAt(0).toUpperCase() : <FaUserTie size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {driver?.name || 'Driver Profile'}
                </h3>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  padding: '2px 8px', 
                  borderRadius: '6px',
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0'
                }}>
                  ✓ Verified Driver
                </span>
                <span className={`driver-status-chip ${driver?.status || 'active'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {driver?.status === 'on_duty' ? 'On Trip' : driver?.status === 'active' ? 'Available' : 'Off Duty'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                <span><FaIdCard /> DL: <strong>{driver?.licenceNumber || '—'}</strong></span>
                <span><FaPhone /> <a href={`tel:${driver?.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{driver?.phone || '—'}</a></span>
                <span><FaEnvelope /> <a href={`mailto:${driver?.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{driver?.email || '—'}</a></span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="cust-btn-close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px' }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {loading ? (
          <div className="spinner-container" style={{ padding: '60px 0' }}>
            <div className="spinner"></div>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Loading driver profile &amp; ratings...</p>
          </div>
        ) : !driver ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
            Driver profile could not be loaded.
          </div>
        ) : (
          <div style={{ padding: '20px 24px' }}>
            {/* Quick KPI Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '12px 14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Customer Rating</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <FaStar size={16} color="#f59e0b" />
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>{stats.averageRating.toFixed(1)}</strong>
                  <span style={{ fontSize: '11px', color: '#78350f' }}>/ 5.0</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Total Reviews</span>
                <div style={{ marginTop: '4px' }}>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>{stats.reviewsCount}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>ratings</span>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '12px 14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Completed Trips</span>
                <div style={{ marginTop: '4px' }}>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>{stats.completedTrips}</strong>
                  <span style={{ fontSize: '11px', color: '#166534', marginLeft: '4px' }}>trips</span>
                </div>
              </div>

              <div style={{ background: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: '12px', padding: '12px 14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>Experience</span>
                <div style={{ marginTop: '4px' }}>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>{driver.experienceYears || 4}</strong>
                  <span style={{ fontSize: '11px', color: '#6b21a8', marginLeft: '4px' }}>years</span>
                </div>
              </div>
            </div>

            {/* Certified Vehicle Classes */}
            {driver.supportedVehicleTypes && driver.supportedVehicleTypes.length > 0 && (
              <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Certified Vehicle Classes:</span>
                {driver.supportedVehicleTypes.map(t => (
                  <span 
                    key={t} 
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      background: '#f1f5f9', 
                      color: '#334155',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>
            )}

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '16px', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                style={{
                  padding: '9px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'reviews' ? '3px solid #f96d00' : '3px solid transparent',
                  color: activeTab === 'reviews' ? '#f96d00' : '#64748b',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaStar size={13} />
                <span>Customer Reviews ({reviews.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trips')}
                style={{
                  padding: '9px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'trips' ? '3px solid #f96d00' : '3px solid transparent',
                  color: activeTab === 'trips' ? '#f96d00' : '#64748b',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaCalendarAlt size={13} />
                <span>Assigned Trips History ({trips.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Customer Reviews List */}
            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <div style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    background: '#f8fafc', 
                    borderRadius: '14px', 
                    border: '1px dashed #cbd5e1' 
                  }}>
                    <FaStar size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                    <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                      No Customer Reviews Yet
                    </h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                      As customers complete trips with this driver, their verified ratings and feedback comments will be listed here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reviews.map((rev) => {
                      const customerName = rev.user?.name || 'Verified Customer';
                      const initial = customerName.charAt(0).toUpperCase();
                      return (
                        <div 
                          key={rev._id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '16px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#7e22ce', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                                {initial}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{customerName}</strong>
                                  <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    ✓ Verified Trip
                                  </span>
                                </div>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  {formatDate(rev.createdAt)}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {[1, 2, 3, 4, 5].map((st) => (
                                <FaStar key={st} size={13} color={st <= rev.rating ? '#f59e0b' : '#cbd5e1'} />
                              ))}
                              <strong style={{ fontSize: '12.5px', color: '#f59e0b', marginLeft: '4px' }}>
                                {rev.rating}.0
                              </strong>
                            </div>
                          </div>

                          {/* Vehicle / Booking reference tag if available */}
                          {rev.car && (
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FaCar size={11} color="#f96d00" />
                              <span>Trip Vehicle: <strong>{rev.car.brand} {rev.car.name}</strong></span>
                            </div>
                          )}

                          {rev.title && (
                            <h5 style={{ margin: '4px 0', fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                              &ldquo;{rev.title}&rdquo;
                            </h5>
                          )}
                          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                            {rev.comment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Assigned Trips History */}
            {activeTab === 'trips' && (
              <div>
                {trips.length === 0 ? (
                  <div style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    background: '#f8fafc', 
                    borderRadius: '14px', 
                    border: '1px dashed #cbd5e1' 
                  }}>
                    <FaCar size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                    <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                      No Trips Assigned
                    </h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                      This driver has not been assigned to any customer bookings yet.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {trips.map((trip) => (
                      <div 
                        key={trip._id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                              {trip.car?.name || 'Assigned Vehicle'}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Ref: <strong>{trip.bookingReference || trip._id.slice(-6).toUpperCase()}</strong>
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                            📅 {formatDate(trip.pickupDate)} → {formatDate(trip.dropoffDate)}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            Customer: <strong>{trip.user?.name || 'Customer'}</strong> ({trip.user?.phone || '—'})
                          </div>
                        </div>

                        <span 
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: trip.status === 'completed' ? '#ecfdf5' : trip.status === 'ongoing' ? '#eff6ff' : '#fffbeb',
                            color: trip.status === 'completed' ? '#047857' : trip.status === 'ongoing' ? '#1d4ed8' : '#b45309',
                            border: trip.status === 'completed' ? '1px solid #a7f3d0' : trip.status === 'ongoing' ? '1px solid #bfdbfe' : '1px solid #fde68a',
                            textTransform: 'capitalize'
                          }}
                        >
                          {trip.status === 'ongoing' ? 'Live Trip' : trip.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div 
          className="modal-footer" 
          style={{ 
            borderTop: '1px solid #e2e8f0', 
            padding: '14px 24px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            gap: '12px',
            background: '#fafbfc' 
          }}
        >
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
