import { useState, useEffect } from 'react';
import {
  FiX, FiCheckCircle, FiXCircle, FiClock, FiTool,
  FiSliders, FiUsers, FiDroplet, FiZap, FiNavigation,
  FiBox, FiTag, FiMapPin, FiCheck, FiInfo, FiCalendar, FiShield, FiDisc, FiActivity
} from 'react-icons/fi';
import { FaWhatsapp, FaStar, FaCar } from 'react-icons/fa';
import { getWhatsAppLink, getReviews } from '../api';
import { useSettings } from '../context/SettingsContext';
import { formatDate } from '../utils/format';

const DEFAULT_FEATURES = [
  { name: 'Air Conditioning', available: true },
  { name: 'GPS Navigation System', available: true },
  { name: 'Bluetooth & USB Ports', available: true },
  { name: 'Cruise Control', available: true },
  { name: 'Rear Parking Camera', available: true },
  { name: 'Anti-Lock Braking (ABS)', available: true },
  { name: 'Power Steering & Windows', available: true },
  { name: 'Full Comprehensive Insurance', available: true }
];

export default function VehicleDetailModal({ car, onClose, onBook }) {
  if (!car) return null;

  const { settings } = useSettings();
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    setActiveImgIdx(0);
    if (car?._id) {
      loadCarReviews(car._id);
    }
  }, [car?._id]);

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
      console.warn('Error loading vehicle reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const images = car.images && car.images.length > 0 ? car.images : ['/images/car-1.jpg'];
  const activeImage = images[activeImgIdx] || images[0];

  const isAvailable = car.status === 'available';
  const isRented = car.status === 'rented';
  const isMaintenance = car.status === 'maintenance';

  const statusLabel = isAvailable 
    ? 'Available Now' 
    : isRented 
      ? 'Currently Rented' 
      : isMaintenance 
        ? 'In Maintenance' 
        : 'Unavailable';

  const featuresToDisplay = (car.features && car.features.length > 0)
    ? car.features
    : DEFAULT_FEATURES;

  const inquireMessage = `Hi CarBook! I am interested in renting the ${car.name} (${car.brand} ${car.model} - ${car.year}). It is currently marked as ${car.status}. Could you please let me know when it will be available next?`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="vehicle-detail-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close vehicle details">
          <FiX size={20} />
        </button>

        {/* Modal Header */}
        <div className="vdm-header">
          <div className="vdm-header-left">
            <span className="vdm-type-pill">{car.vehicleType || 'Luxury'}</span>
            <span className={`vdm-status-pill ${isAvailable ? 'status-avail' : 'status-unavail'}`}>
              {isAvailable ? <FiCheckCircle /> : isRented ? <FiClock /> : isMaintenance ? <FiTool /> : <FiXCircle />}
              {statusLabel}
            </span>
            <h2>{car.name}</h2>
            <p className="vdm-subhead">
              {car.brand} • {car.model} • Model Year {car.year}
            </p>
          </div>
          <div className="vdm-header-right">
            <div className="vdm-rating">
              <FaStar className="star-icon" />
              <span className="rating-score">{car.rating ? Number(car.rating).toFixed(1) : '5.0'}</span>
              <span className="rating-count">({reviews.length > 0 ? reviews.length : (car.reviewCount || 0)} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
            <div className="vdm-price-box">
              <span className="price-label">Starting at</span>
              <span className="price-amount">{settings.currencySymbol || '₹'}{car.pricePerDay}</span>
              <span className="price-unit">/day</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="vdm-body">
          {/* Gallery Showcase */}
          <div className="vdm-gallery">
            <div 
              className="vdm-main-img" 
              style={{ backgroundImage: `url(${activeImage})` }}
            >
              <div className="vdm-img-overlay">
                <span className="vdm-img-count">
                  Photo {activeImgIdx + 1} of {images.length}
                </span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="vdm-thumbnails">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`vdm-thumb-btn ${i === activeImgIdx ? 'active' : ''}`}
                    onClick={() => setActiveImgIdx(i)}
                    style={{ backgroundImage: `url(${img})` }}
                    aria-label={`View photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>



          {/* Technical Specifications Grid */}
          <div className="vdm-section">
            <h3 className="vdm-section-title">
              <FaCar /> Vehicle Specifications
            </h3>
            <div className="vdm-specs-grid">
              <div className="vdm-spec-card">
                <div className="spec-icon-wrap"><FiSliders /></div>
                <div className="spec-details">
                  <span className="spec-name">Transmission</span>
                  <span className="spec-val">{car.transmission || 'Automatic'}</span>
                </div>
              </div>

              <div className="vdm-spec-card">
                <div className="spec-icon-wrap"><FiDroplet /></div>
                <div className="spec-details">
                  <span className="spec-name">Fuel Type</span>
                  <span className="spec-val">{car.fuelType || 'Petrol'}</span>
                </div>
              </div>

              <div className="vdm-spec-card">
                <div className="spec-icon-wrap"><FiUsers /></div>
                <div className="spec-details">
                  <span className="spec-name">Seating Capacity</span>
                  <span className="spec-val">{car.seats || 4} Passengers</span>
                </div>
              </div>

              <div className="vdm-spec-card">
                <div className="spec-icon-wrap"><FiBox /></div>
                <div className="spec-details">
                  <span className="spec-name">Luggage Space</span>
                  <span className="spec-val">{car.luggage || 2} Large Bags</span>
                </div>
              </div>

              <div className="vdm-spec-card">
                <div className="spec-icon-wrap"><FiActivity /></div>
                <div className="spec-details">
                  <span className="spec-name">Fuel Type</span>
                  <span className="spec-val">{car.fuelType || 'Petrol'}</span>
                </div>
              </div>

              <div className="vdm-spec-card">
                <div className="spec-icon-wrap"><FiNavigation /></div>
                <div className="spec-details">
                  <span className="spec-name">Mileage</span>
                  <span className="spec-val">{car.mileage ? `${car.mileage.replace(/mi/gi, 'km')}` : 'Unlimited / 0 km'}</span>
                </div>
              </div>

              <div className="vdm-spec-card">
                <div className="spec-icon-wrap"><FiTag /></div>
                <div className="spec-details">
                  <span className="spec-name">Plate Number</span>
                  <span className="spec-val">{car.plateNumber || 'Verified Fleet'}</span>
                </div>
              </div>

              <div className="vdm-spec-card">
                <div className="spec-icon-wrap"><FiMapPin /></div>
                <div className="spec-details">
                  <span className="spec-name">Pickup Hub</span>
                  <span className="spec-val" title={car.location || 'Airport / City Hub'}>
                    {car.location || 'Airport / City Hub'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cleanliness & Safety Assurance */}
          <div className="vdm-section">
            <h3 className="vdm-section-title">
              <FiCheckCircle /> Cleanliness &amp; Safety Assurance
            </h3>
            <div className="vdm-assurance-card" style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '13px', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 800 }}>✓</span>
                  <span>100-Point Mechanical Fleet Check</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 800 }}>✓</span>
                  <span>Detailed &amp; Sanitised Prior to Handover</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 800 }}>✓</span>
                  <span>Full Fuel Tank on Pickup Guarantee</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 800 }}>✓</span>
                  <span>24/7 Roadside Assistance Included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="vdm-section">
            <h3 className="vdm-section-title">
              <FiInfo /> About This Vehicle
            </h3>
            <p className="vdm-description">
              {car.description ||
                `The ${car.name} delivers an outstanding driving experience combining luxury, safety, and dynamic performance. Fully serviced and sanitised before every rental, ensuring peace of mind whether you're traveling for business or leisure.`}
            </p>
          </div>

          {/* Features & Amenities */}
          <div className="vdm-section">
            <h3 className="vdm-section-title">
              <FiShield /> Features &amp; Amenities
            </h3>
            <div className="vdm-features-grid">
              {featuresToDisplay.map((feat, idx) => (
                <div 
                  key={idx} 
                  className={`vdm-feature-chip ${feat.available !== false ? 'available' : 'unavailable'}`}
                >
                  {feat.available !== false ? (
                    <FiCheck className="feat-check" />
                  ) : (
                    <FiX className="feat-cross" />
                  )}
                  <span>{feat.name || feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Ratings & Reviews Section */}
          <div className="vdm-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 className="vdm-section-title" style={{ margin: 0 }}>
                <FaStar style={{ color: '#f59e0b' }} /> Customer Reviews &amp; Ratings ({reviews.length})
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fffbeb', border: '1px solid #fed7aa', padding: '4px 12px', borderRadius: '12px' }}>
                <FaStar size={13} color="#f59e0b" />
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{car.rating ? Number(car.rating).toFixed(1) : '5.0'}</strong>
                <span style={{ fontSize: '11px', color: '#78350f' }}>({reviews.length} {reviews.length === 1 ? 'rating' : 'ratings'})</span>
              </div>
            </div>

            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }}></div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  No customer reviews yet for this vehicle. Book a trip to be the first to leave a verified rating!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((rev) => {
                  const reviewerName = rev.user?.name || 'Verified Renter';
                  const initial = reviewerName.charAt(0).toUpperCase();
                  return (
                    <div 
                      key={rev._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f96d00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{reviewerName}</strong>
                              <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                ✓ Verified Renter
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {formatDate(rev.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                          {[1, 2, 3, 4, 5].map((st) => (
                            <FaStar key={st} size={12} color={st <= rev.rating ? '#f59e0b' : '#cbd5e1'} />
                          ))}
                        </div>
                      </div>

                      {rev.title && (
                        <h5 style={{ margin: '4px 0', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                          &ldquo;{rev.title}&rdquo;
                        </h5>
                      )}
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {rev.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="vdm-footer">
          <div className="vdm-footer-info">
            <span className="footer-price">{settings.currencySymbol || '₹'}{car.pricePerDay}</span>
            <span className="footer-unit">/day</span>
            <span className="footer-status-text">
              • {isAvailable ? 'Instant booking via WhatsApp' : 'Currently not available'}
            </span>
          </div>

          <div className="vdm-footer-actions">
            <button type="button" className="vdm-btn-secondary" onClick={onClose}>
              Close
            </button>

            {isAvailable ? (
              <button
                type="button"
                className="vdm-btn-primary"
                onClick={() => onBook(car)}
              >
                <FaWhatsapp size={19} /> Book via WhatsApp
              </button>
            ) : (
              <a
                href={getWhatsAppLink(inquireMessage, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="vdm-btn-inquire"
              >
                <FaWhatsapp size={19} /> Inquire Availability
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
