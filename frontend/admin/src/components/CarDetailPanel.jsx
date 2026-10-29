import { useState, useEffect } from 'react';
import { FaTimes, FaEllipsisV, FaStar, FaTrashAlt, FaEdit, FaCheckCircle, FaClock, FaTools, FaTimesCircle, FaSearch, FaImage } from 'react-icons/fa';
import { FiDisc } from 'react-icons/fi';

export default function CarDetailPanel({
  car,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onToggleStatus,
  rentalType = 'daily'
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [car?._id]);

  if (!car) return null;

  const getPrice = () => {
    if (rentalType === 'weekly' && car.pricePerWeek) return { price: car.pricePerWeek, unit: '/week' };
    if (rentalType === 'monthly' && car.pricePerMonth) return { price: car.pricePerMonth, unit: '/month' };
    return { price: car.pricePerDay || 158, unit: '/day' };
  };

  const { price, unit } = getPrice();
  const currentStatus = car.status || 'available';
  const carImages = Array.isArray(car.images) && car.images.length > 0 ? car.images : ['/images/car-1.jpg'];
  const activeHeroImg = carImages[activeImageIndex] || carImages[0];

  const handleStatusChange = (status) => {
    if (onUpdateStatus) {
      onUpdateStatus(car, status);
    } else if (onToggleStatus) {
      onToggleStatus(car);
    }
  };

  return (
    <aside className="detail-sidebar">
      {/* Top Header Actions */}
      <div className="detail-top-actions">
        <button
          type="button"
          className="detail-action-circle"
          onClick={onClose}
          title="Close detail panel"
        >
          <FaTimes />
        </button>

        <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Vehicle Inspector
        </span>

        <button 
          type="button" 
          className="detail-action-circle" 
          onClick={() => onEdit(car)}
          title="Edit Vehicle"
        >
          <FaEdit />
        </button>
      </div>

      {/* Hero Car Showcase */}
      <div className="detail-hero-img-box">
        <img
          src={activeHeroImg}
          alt={car.name}
          className="detail-hero-img"
          onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
        />
        {carImages.length > 1 && (
          <span className="hero-photo-counter-badge">
            <FaImage size={10} /> {activeImageIndex + 1} / {carImages.length}
          </span>
        )}
      </div>

      {/* Multi-Photo Thumbnails Strip if multiple photos exist */}
      {carImages.length > 1 && (
        <div className="detail-photos-strip">
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

      {/* Title, Status, Rating & Price */}
      <div className="detail-header-info">
        <div className="detail-title-col">
          <h2 className="detail-car-name">{car.name}</h2>
          <div className="detail-sub-meta">
            <div className={`status-badge-inline ${currentStatus}`}>
              <span className={`status-dot ${currentStatus}`}></span>
              <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                {currentStatus === 'maintenance' ? 'In Service' : currentStatus}
              </span>
            </div>

            <div className="detail-rating-inline">
              <FaStar />
              <span>{car.rating || 5.0}</span>
            </div>
          </div>
        </div>

        <div className="detail-price-col">
          <div className="detail-price-main">
            ₹{car.pricePerDay || price}<span>/day</span>
          </div>
        </div>
      </div>

      {/* 2x2 Specs Grid */}
      <div className="detail-specs-grid">
        <div className="spec-cell">
          <span className="spec-cell-label">Plate</span>
          <span className="spec-cell-value">{car.plateNumber || 'NYC - 4521'}</span>
        </div>

        <div className="spec-cell">
          <span className="spec-cell-label">Transmission</span>
          <span className="spec-cell-value">{car.transmission || 'Automatic'}</span>
        </div>

        <div className="spec-cell">
          <span className="spec-cell-label">Fuel Type</span>
          <span className="spec-cell-value">{car.fuelType || 'Petrol'}</span>
        </div>

        <div className="spec-cell">
          <span className="spec-cell-label">Mileage</span>
          <span className="spec-cell-value">{car.mileage ? car.mileage.replace(/mi/gi, 'km') : '18,420 km'}</span>
        </div>
      </div>

      {/* Fleet Maintenance & Status Specs */}
      <div className="spec-info-card" style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaCheckCircle size={15} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Fleet Readiness</span>
          </div>
          <span style={{ fontSize: '11px', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontWeight: 700 }}>
            Inspected
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
            <span className="spec-sub">Plate Number</span>
            <strong style={{ fontSize: '13px', display: 'block', color: '#1e293b' }}>{car.plateNumber || 'Verified Fleet'}</strong>
          </div>
          <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
            <span className="spec-sub">Transmission</span>
            <strong style={{ fontSize: '13px', display: 'block', color: '#1e293b' }}>{car.transmission || 'Automatic'}</strong>
          </div>
        </div>
      </div>

      {/* Fleet Status Controller */}
      <div className="admin-status-control-box">
        <div className="status-control-title">
          <span>Fleet Rental Status:</span>
          <strong className={`status-text-pill ${currentStatus}`}>
            {currentStatus === 'rented' ? 'Rented Out' : currentStatus === 'maintenance' ? 'In Service' : currentStatus === 'unavailable' ? 'Unavailable' : 'Available'}
          </strong>
        </div>

        <div className="status-button-group">
          <button
            type="button"
            className={`status-chip-btn ${currentStatus === 'available' ? 'active-available' : ''}`}
            onClick={() => handleStatusChange('available')}
            title="Mark vehicle as available for customers to rent"
          >
            <FaCheckCircle /> Available
          </button>

          <button
            type="button"
            className={`status-chip-btn ${currentStatus === 'rented' ? 'active-rented' : ''}`}
            onClick={() => handleStatusChange('rented')}
            title="Mark vehicle as currently rented to a customer"
          >
            <FaClock /> Rented
          </button>

          <button
            type="button"
            className={`status-chip-btn ${currentStatus === 'maintenance' ? 'active-maintenance' : ''}`}
            onClick={() => handleStatusChange('maintenance')}
            title="Mark vehicle under service or scheduled maintenance"
          >
            <FaTools /> Service
          </button>

          <button
            type="button"
            className={`status-chip-btn ${currentStatus === 'unavailable' ? 'active-unavailable' : ''}`}
            onClick={() => handleStatusChange('unavailable')}
            title="Mark vehicle as unavailable"
          >
            <FaTimesCircle /> Decommission
          </button>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="detail-bottom-buttons">
        <button
          type="button"
          className="btn-detail-edit"
          onClick={() => onEdit(car)}
        >
          <FaEdit /> Edit Vehicle
        </button>

        <button
          type="button"
          className="btn-detail-delete"
          onClick={() => onDelete(car._id)}
        >
          <FaTrashAlt /> Delete
        </button>
      </div>
    </aside>
  );
}
