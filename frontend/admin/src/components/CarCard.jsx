import { useState, useRef, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaStar, FaEye, FaChevronDown, FaCheck, FaGasPump } from 'react-icons/fa';
import { GiSteeringWheel } from 'react-icons/gi';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented' },
  { value: 'maintenance', label: 'In Service' },
  { value: 'unavailable', label: 'Unavailable' }
];

export default function CarCard({ 
  car, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onQuickStatusChange, 
  rentalType = 'daily' 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const getPrice = () => {
    if (rentalType === 'weekly' && car.pricePerWeek) return { price: car.pricePerWeek, unit: '/wk' };
    if (rentalType === 'monthly' && car.pricePerMonth) return { price: car.pricePerMonth, unit: '/mo' };
    return { price: car.pricePerDay || 158, unit: '/day' };
  };

  const formatMileage = (val) => {
    if (!val) return '15 km/l';
    const clean = String(val).trim();
    if (clean === '15,000 km' || clean === '15000 km' || clean === '15000' || clean === '15,000') return '15 km/l';
    if (/^\d+$/.test(clean)) return `${clean} km/l`;
    if (clean.toLowerCase().endsWith('km') && !clean.toLowerCase().includes('km/l') && !clean.toLowerCase().includes('kmpl')) {
      return clean.replace(/km/i, 'km/l');
    }
    return clean;
  };

  const { price, unit } = getPrice();
  const currentStatus = car.status || 'available';

  const handleStatusSelect = (newStatus) => {
    setDropdownOpen(false);
    if (onQuickStatusChange && newStatus !== currentStatus) {
      onQuickStatusChange(car, newStatus);
    }
  };

  return (
    <div
      className={`carvia-car-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(car)}
      title="Click to view detailed vehicle specifications & health"
    >
      <div className="car-card-top">
        <div className="car-card-title-box">
          <h3 className="car-card-title">{car.name}</h3>
        </div>

        {/* Admin Quick Action Buttons (Inspect, Edit & Delete) */}
        <div className="car-card-top-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn-card-action inspect"
            onClick={() => onSelect && onSelect(car)}
            title="Inspect Vehicle Details"
          >
            <FaEye size={13} />
          </button>
          <button
            type="button"
            className="btn-card-action edit"
            onClick={() => onEdit && onEdit(car)}
            title="Edit Vehicle & Specifications"
          >
            <FaEdit size={13} />
          </button>
          <button
            type="button"
            className="btn-card-action delete"
            onClick={() => onDelete && onDelete(car._id)}
            title="Delete Vehicle"
          >
            <FaTrashAlt size={12} />
          </button>
        </div>
      </div>

      {/* Subhead & Clean Status Dropdown Row (Outside the image!) */}
      <div className="car-card-subhead-row">
        <div className="car-card-subhead">
          <span>{car.brand}</span>
          <span>•</span>
          <span>{car.vehicleType || 'Sedan'} ({car.year || 2024})</span>
        </div>

        {/* Custom Status Dropdown */}
        <div 
          className="custom-status-container" 
          ref={dropdownRef} 
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={`custom-status-trigger ${currentStatus} ${car.hasOngoingTrip ? 'trip-locked' : ''}`}
            onClick={() => {
              if (car.hasOngoingTrip) {
                onQuickStatusChange && onQuickStatusChange(car, 'available');
              } else {
                setDropdownOpen(prev => !prev);
              }
            }}
            title={car.hasOngoingTrip ? `Ongoing Trip (${car.ongoingBooking?.bookingReference || 'Active'}). Trip must be completed in Bookings first.` : "Click to toggle rental status"}
            style={car.hasOngoingTrip ? { border: '1.5px solid #f59e0b', background: '#fffbeb' } : {}}
          >
            <span className={`status-indicator-dot ${currentStatus}`}></span>
            <span className="status-trigger-label" style={car.hasOngoingTrip ? { color: '#b45309', fontWeight: 700 } : {}}>
              {car.hasOngoingTrip ? 'Trip Ongoing 🔒' : currentStatus === 'maintenance' ? 'In Service' : currentStatus === 'rented' ? 'Rented' : currentStatus === 'unavailable' ? 'Unavailable' : 'Available'}
            </span>
            {!car.hasOngoingTrip && (
              <FaChevronDown size={8} className={`status-chevron ${dropdownOpen ? 'open' : ''}`} />
            )}
          </button>

          {dropdownOpen && !car.hasOngoingTrip && (
            <div className="custom-status-menu">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`custom-status-option ${opt.value} ${currentStatus === opt.value ? 'selected' : ''}`}
                  onClick={() => handleStatusSelect(opt.value)}
                >
                  <span className={`status-indicator-dot ${opt.value}`}></span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{opt.label}</span>
                  {currentStatus === opt.value && <FaCheck size={9} style={{ color: 'var(--primary)', marginLeft: '6px' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clean Unobstructed Car Photo */}
      <div className="car-card-img-wrapper">
        <img
          src={car.images && car.images[0] ? car.images[0] : '/images/car-1.jpg'}
          alt={car.name}
          className="car-card-img"
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/car-1.jpg'; }}
        />
      </div>

      <div className="car-card-bottom">
        <div className="car-card-meta">
          <div className="meta-item plate-tag" title="Vehicle Plate Number">
            <span>{car.plateNumber || 'NYC-4521'}</span>
          </div>

          {/* Fuel Type Badge */}
          <div 
            className="meta-item plate-tag" 
            title={`Fuel Type: ${car.fuelType || 'Petrol'}`}
          >
            <FaGasPump size={11} style={{ color: 'var(--primary)' }} />
            <span>{car.fuelType || 'Petrol'}</span>
          </div>

          <div className="meta-item hp-tag" title="Vehicle Fuel Efficiency / Mileage">
            <GiSteeringWheel size={11} />
            <span>{formatMileage(car.mileage)}</span>
          </div>
        </div>

        <div className="car-card-price">
          ₹{car.pricePerDay || price} <span>/day</span>
        </div>
      </div>
    </div>
  );
}
