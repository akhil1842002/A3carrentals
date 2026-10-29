import { useState, useEffect } from 'react';
import {
  FaTimes,
  FaStar,
  FaTrashAlt,
  FaEdit,
  FaCheckCircle,
  FaClock,
  FaTools,
  FaTimesCircle,
  FaSearch,
  FaImage,
  FaGasPump,
  FaCogs,
  FaTachometerAlt,
  FaIdCard,
  FaUsers,
  FaCar,
  FaCalendarAlt
} from 'react-icons/fa';
import { FiDisc } from 'react-icons/fi';
import { getReviews } from '../api';
import { formatDate } from '../utils/format';

export default function VehicleDetailModal({
  car,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    if (isOpen && car?._id) {
      loadCarReviews(car._id);
    }
  }, [car?._id, isOpen]);

  const loadCarReviews = async (carId) => {
    setReviewsLoading(true);
    try {
      const res = await getReviews({ targetType: 'car', carId });
      if (res.data?.reviews) {
        setReviews(res.data.reviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.warn('Error fetching car reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !car) return null;

  const currentStatus = car.status || 'available';
  const carImages = Array.isArray(car.images) && car.images.length > 0 ? car.images : ['/images/car-1.jpg'];
  const activeHeroImg = carImages[activeImageIndex] || carImages[0];

  const handleStatusChange = (status) => {
    if (onUpdateStatus) {
      onUpdateStatus(car, status);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content vehicle-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '840px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '20px 24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{car.name}</h3>
              <span className={`detail-status-pill ${currentStatus}`}>
                <span className={`status-dot ${currentStatus}`}></span>
                {currentStatus === 'maintenance' ? 'In Service' : currentStatus}
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
              {car.brand} • {car.vehicleType || 'Sedan'} ({car.year || 2024}) • Plate: <strong>{car.plateNumber || 'NYC-4521'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-card-action edit"
              onClick={() => onEdit(car)}
              title="Edit Vehicle"
              style={{ width: '36px', height: '36px' }}
            >
              <FaEdit size={14} />
            </button>
            <button
              type="button"
              className="btn-card-action delete"
              onClick={() => onDelete(car._id)}
              title="Delete Vehicle"
              style={{ width: '36px', height: '36px' }}
            >
              <FaTrashAlt size={13} />
            </button>
            <button
              type="button"
              className="detail-action-circle"
              onClick={onClose}
              title="Close"
              style={{ width: '36px', height: '36px' }}
            >
              <FaTimes size={15} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px', gap: '20px' }}>
          {/* 1. Large Showcase & Thumbnails */}
          <div className="detail-showcase-container">
            <div className="detail-hero-img-box" style={{ height: '320px', borderRadius: '12px' }}>
              <img
                src={activeHeroImg}
                alt={car.name}
                className="detail-hero-img"
                onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
              />
              <span className="hero-photo-counter-badge">
                <FaImage size={11} /> {activeImageIndex + 1} / {carImages.length} Photos
              </span>
            </div>

            {carImages.length > 1 && (
              <div className="detail-photos-strip" style={{ marginTop: '12px' }}>
                {carImages.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    className={`detail-strip-thumb ${activeImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                    title={`View photo ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Angle ${idx + 1}`}
                      onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Pricing & Rating Cards */}
          <div className="detail-price-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="detail-price-card">
              <span className="price-card-label">Daily Rental Rate</span>
              <span className="price-card-value">₹{car.pricePerDay || 2000}<span>/day</span></span>
            </div>
            <div className="detail-price-card highlight">
              <span className="price-card-label">Customer Rating</span>
              <span className="price-card-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaStar size={14} color="#f59e0b" /> {car.rating || 4.9}
                <span style={{ fontSize: '11px', color: '#64748b' }}>({car.reviewCount || 45} reviews)</span>
              </span>
            </div>
          </div>

          {/* 3. Detailed Specifications Grid */}
          <div className="detail-specs-uniform-grid">
            <div className="spec-item-box">
              <FaCogs className="spec-icon" />
              <div>
                <span className="spec-label">Transmission</span>
                <strong className="spec-val">{car.transmission || 'Automatic'}</strong>
              </div>
            </div>

            <div className="spec-item-box">
              <FaGasPump className="spec-icon" />
              <div>
                <span className="spec-label">Fuel Type</span>
                <strong className="spec-val">{car.fuelType || 'Petrol'}</strong>
              </div>
            </div>

            <div className="spec-item-box">
              <FaCar className="spec-icon" />
              <div>
                <span className="spec-label">Mileage</span>
                <strong className="spec-val">
                  {car.mileage ? (car.mileage.includes('km') ? car.mileage : `${car.mileage} km`) : '15,000 km'}
                </strong>
              </div>
            </div>

            <div className="spec-item-box">
              <FaUsers className="spec-icon" />
              <div>
                <span className="spec-label">Capacity</span>
                <strong className="spec-val">{car.seats || 5} Seats</strong>
              </div>
            </div>

            <div className="spec-item-box">
              <FaIdCard className="spec-icon" />
              <div>
                <span className="spec-label">License Plate</span>
                <strong className="spec-val">{car.plateNumber || 'NYC-4521'}</strong>
              </div>
            </div>
          </div>

          {/* 4. Fleet Readiness & Vehicle Health */}
          <div className="spec-info-card" style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCheckCircle size={18} style={{ color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Fleet Readiness &amp; Maintenance Status
                </h4>
              </div>
              <span style={{ fontSize: '11.5px', padding: '3px 10px', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontWeight: 700 }}>
                Verified &amp; Sanitized
              </span>
            </div>

            <div className="form-grid-3" style={{ marginTop: '14px' }}>
              <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span className="spec-sub">Odometer Reading</span>
                <strong className="spec-main-highlight" style={{ fontSize: '15px', display: 'block', marginTop: '3px' }}>
                  {car.mileage ? car.mileage.replace(/mi/gi, 'km') : '18,420 km'}
                </strong>
              </div>
              <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span className="spec-sub">Powertrain / Fuel</span>
                <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginTop: '3px' }}>
                  {car.fuelType || 'Petrol'} • {car.transmission || 'Automatic'}
                </strong>
              </div>
              <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span className="spec-sub">Seating Capacity</span>
                <strong style={{ fontSize: '13.5px', color: '#1e293b', display: 'block', marginTop: '3px' }}>
                  {car.seats || 5} Passengers
                </strong>
              </div>
            </div>
          </div>

          {/* 5. Features Checklist */}
          {Array.isArray(car.features) && car.features.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>
                Vehicle Equipment &amp; Features
              </span>
              <div className="detail-features-chips">
                {car.features.map(feat => (
                  <span key={feat.name} className={`detail-feat-chip ${feat.available ? 'active' : 'disabled'}`}>
                    {feat.available ? '✓' : '✕'} {feat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 6. Fleet Status Quick Switcher */}
          <div className="admin-status-control-box" style={{ margin: 0 }}>
            <div className="status-control-title">
              <span>Quick Change Rental Status:</span>
              <strong className={`status-text-pill ${currentStatus}`}>
                {car.hasOngoingTrip ? 'Ongoing Trip 🔒' : currentStatus === 'rented' ? 'Rented Out' : currentStatus === 'maintenance' ? 'In Service' : currentStatus === 'unavailable' ? 'Unavailable' : 'Available'}
              </strong>
            </div>

            {car.hasOngoingTrip && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#b45309',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                margin: '8px 0 14px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1.4
              }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                <span>
                  <strong>Active Trip in Progress (Ref: {car.ongoingBooking?.bookingReference || 'Active'}):</strong> Vehicle status cannot be changed to Available or In Service while trip is ongoing. The trip must be completed in Bookings first.
                </span>
              </div>
            )}

            <div className="status-button-group">
              <button
                type="button"
                className={`status-chip-btn ${currentStatus === 'available' ? 'active-available' : ''}`}
                onClick={() => handleStatusChange('available')}
                disabled={car.hasOngoingTrip}
                style={car.hasOngoingTrip ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                title={car.hasOngoingTrip ? 'Locked: Ongoing trip must be completed first' : ''}
              >
                <FaCheckCircle /> Available
              </button>

              <button
                type="button"
                className={`status-chip-btn ${currentStatus === 'rented' ? 'active-rented' : ''}`}
                onClick={() => handleStatusChange('rented')}
                disabled={car.hasOngoingTrip}
                style={car.hasOngoingTrip ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                title={car.hasOngoingTrip ? 'Vehicle is currently rented and on a trip' : ''}
              >
                <FaClock /> Rented
              </button>

              <button
                type="button"
                className={`status-chip-btn ${currentStatus === 'maintenance' ? 'active-maintenance' : ''}`}
                onClick={() => handleStatusChange('maintenance')}
                disabled={car.hasOngoingTrip}
                style={car.hasOngoingTrip ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                title={car.hasOngoingTrip ? 'Locked: Ongoing trip must be completed first' : ''}
              >
                <FaTools /> In Service
              </button>

              <button
                type="button"
                className={`status-chip-btn ${currentStatus === 'unavailable' ? 'active-unavailable' : ''}`}
                onClick={() => handleStatusChange('unavailable')}
                disabled={car.hasOngoingTrip}
                style={car.hasOngoingTrip ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                title={car.hasOngoingTrip ? 'Locked: Ongoing trip must be completed first' : ''}
              >
                <FaTimesCircle /> Unavailable
              </button>
            </div>
          </div>

          {/* Active & Upcoming Reservations Breakdown */}
          {car.bookedDates && car.bookedDates.length > 0 && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginTop: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCalendarAlt style={{ color: 'var(--primary)' }} />
                <span>Active &amp; Upcoming Trip Schedule ({car.bookedDates.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {car.bookedDates.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px'
                  }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>
                        {formatDate(b.pickupDate)} → {formatDate(b.dropoffDate)}
                      </strong>
                      <span style={{ color: '#64748b', marginLeft: '10px' }}>Ref: {b.bookingReference}</span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: b.status === 'ongoing' ? '#eff6ff' : '#f0fdf4',
                      color: b.status === 'ongoing' ? '#1d4ed8' : '#15803d',
                      border: b.status === 'ongoing' ? '1px solid #bfdbfe' : '1px solid #bbf7d0'
                    }}>
                      {b.status === 'ongoing' ? 'Ongoing Trip' : 'Upcoming Booking'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '8px' }}>
                💡 Note: Dates outside these scheduled reservations remain open and available for customers to book.
              </div>
            </div>
          )}

          {/* 7. Customer Ratings & Reviews Section */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px 20px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaStar size={18} color="#f59e0b" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Customer Reviews &amp; Ratings ({reviews.length})
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '4px 10px', borderRadius: '8px' }}>
                <FaStar size={13} color="#f59e0b" />
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{car.rating ? car.rating.toFixed(1) : '5.0'}</strong>
                <span style={{ fontSize: '11px', color: '#78350f' }}>({reviews.length} ratings)</span>
              </div>
            </div>

            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }}></div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '12.5px' }}>
                  No customer reviews submitted for this vehicle yet. Reviews submitted by customers upon trip completion will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reviews.map((rev) => {
                  const customerName = rev.user?.name || 'Verified Renter';
                  const initial = customerName.charAt(0).toUpperCase();
                  return (
                    <div
                      key={rev._id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f96d00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px' }}>
                            {initial}
                          </div>
                          <div>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{customerName}</strong>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>
                              {formatDate(rev.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                          {[1, 2, 3, 4, 5].map((st) => (
                            <FaStar key={st} size={11} color={st <= rev.rating ? '#f59e0b' : '#cbd5e1'} />
                          ))}
                        </div>
                      </div>
                      {rev.title && (
                        <strong style={{ fontSize: '12.5px', color: '#1e293b', display: 'block', marginBottom: '2px' }}>
                          &ldquo;{rev.title}&rdquo;
                        </strong>
                      )}
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}>
                        {rev.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onEdit(car)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FaEdit size={13} /> Edit Vehicle Specifications
          </button>
        </div>
      </div>
    </div>
  );
}
