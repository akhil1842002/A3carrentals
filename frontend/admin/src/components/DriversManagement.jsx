import { useState, useEffect } from 'react';
import { 
  FaUserTie, FaPlus, FaCheckCircle, FaTimesCircle, 
  FaIdCard, FaPhone, FaCar, FaClock, FaTimes, FaTrash, FaStar, FaEnvelope,
  FaSearch, FaFilter, FaCircle, FaShieldAlt
} from 'react-icons/fa';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../api';
import Pagination from './Pagination';
import ConfirmModal from './ConfirmModal';
import DriverDetailModal from './DriverDetailModal';
import { formatDate } from '../utils/format';

const VEHICLE_TYPE_OPTIONS = ['Sedan', 'SUV', 'Luxury', 'Van', 'Hatchback', 'Coupe', 'Pickup', 'Convertible'];

export default function DriversManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'on_duty' | 'off_duty'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  
  // Modal State
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
    isAlert: false,
    loading: false,
    onConfirm: () => {}
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenceNumber: '',
    experienceYears: 4,
    supportedVehicleTypes: ['Sedan', 'SUV', 'Luxury']
  });
  const [formErrors, setFormErrors] = useState({});
  const [formApiError, setFormApiError] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      licenceNumber: '',
      experienceYears: 4,
      supportedVehicleTypes: ['Sedan', 'SUV', 'Luxury']
    });
    setFormErrors({});
    setFormApiError('');
    setShowAddModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (formApiError) setFormApiError('');
  };

  const validateDriverForm = () => {
    const errors = {};
    const trimmedName = (formData.name || '').trim();
    const trimmedPhone = (formData.phone || '').trim();
    const trimmedEmail = (formData.email || '').trim();
    const trimmedLicence = (formData.licenceNumber || '').trim();

    if (!trimmedName) {
      errors.name = 'Full legal name is required';
    } else if (trimmedName.length < 3) {
      errors.name = 'Name must be at least 3 characters long';
    }

    if (!trimmedPhone) {
      errors.phone = 'Mobile number is required';
    } else if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(trimmedPhone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g. driver@carbook.com)';
    }

    if (!trimmedLicence) {
      errors.licenceNumber = 'Driving licence number is required';
    } else if (trimmedLicence.length < 4) {
      errors.licenceNumber = 'Licence number must be at least 4 characters';
    }

    if (!formData.experienceYears && formData.experienceYears !== 0) {
      errors.experienceYears = 'Commercial experience is required';
    } else if (Number(formData.experienceYears) < 1) {
      errors.experienceYears = 'Minimum 1 year of commercial driving experience is required';
    } else if (Number(formData.experienceYears) > 50) {
      errors.experienceYears = 'Please enter a realistic number of years (1 - 50)';
    }

    if (!formData.supportedVehicleTypes || formData.supportedVehicleTypes.length === 0) {
      errors.supportedVehicleTypes = 'Please select at least 1 certified vehicle category';
    }

    return errors;
  };

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await getDrivers();
      if (res.data && Array.isArray(res.data)) {
        setDrivers(res.data);
      } else {
        setDrivers([]);
      }
    } catch (err) {
      console.warn('Backend drivers endpoint error:', err?.message);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormApiError('');

    const validationErrors = validateDriverForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    setFormErrors({});
    setAddLoading(true);

    try {
      const res = await createDriver({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        licenceNumber: formData.licenceNumber.trim().toUpperCase(),
        experienceYears: Number(formData.experienceYears),
        supportedVehicleTypes: formData.supportedVehicleTypes
      });
      if (res.data?.driver) {
        setDrivers(prev => [res.data.driver, ...prev]);
      } else {
        await fetchDrivers();
      }
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        licenceNumber: '',
        experienceYears: 4,
        supportedVehicleTypes: ['Sedan', 'SUV', 'Luxury']
      });
    } catch (err) {
      console.error('Failed to register driver:', err);
      setFormApiError(err.response?.data?.message || 'Failed to register driver. Please verify inputs.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleStatusToggle = async (driver, newStatus) => {
    if (driver.hasOngoingTrip && newStatus === 'active') {
      setConfirmModal({
        isOpen: true,
        title: 'Driver Currently On Trip',
        message: `Driver ${driver.name} is currently on an active trip (${driver.ongoingTrip?.carName || 'Vehicle'}, Ref: ${driver.ongoingTrip?.bookingReference || 'Trip'}). The trip must be completed or inspected in Bookings before marking this driver as available.`,
        confirmText: 'Dismiss',
        variant: 'warning',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setDrivers(prev => prev.map(d => d._id === driver._id ? { ...d, status: newStatus } : d));
    try {
      await updateDriver(driver._id, { status: newStatus });
    } catch (err) {
      console.log('Status updated locally');
    }
  };

  const handleDelete = (id) => {
    const driver = drivers.find(d => d._id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Remove Driver?',
      message: `Are you sure you want to remove ${driver?.name || 'this driver'} from the active fleet roster?`,
      confirmText: 'Yes, Remove Driver',
      cancelText: 'Cancel',
      variant: 'danger',
      isAlert: false,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await deleteDriver(id);
          setDrivers(prev => prev.filter(d => d._id !== id));
        } catch (err) {
          console.error('Failed to remove driver:', err);
          alert(err.response?.data?.message || 'Failed to remove driver');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  const toggleVehicleType = (type) => {
    setFormData(prev => {
      const exists = prev.supportedVehicleTypes.includes(type);
      return {
        ...prev,
        supportedVehicleTypes: exists 
          ? prev.supportedVehicleTypes.filter(t => t !== type)
          : [...prev.supportedVehicleTypes, type]
      };
    });
  };

  // KPI Metrics
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.status === 'active' && !d.hasOngoingTrip).length;
  const onDutyDrivers = drivers.filter(d => d.status === 'on_duty' || d.hasOngoingTrip).length;
  const scheduledDutyDrivers = drivers.filter(d => d.hasFutureSchedule || (d.futureTripsCount > 0)).length;
  const avgRating = drivers.length > 0
    ? (drivers.reduce((acc, d) => acc + (d.rating || 4.9), 0) / drivers.length).toFixed(2)
    : '4.90';

  // Filtered drivers
  const filtered = drivers.filter(d => {
    if (statusFilter === 'active' && (d.status !== 'active' || d.hasOngoingTrip)) return false;
    if (statusFilter === 'on_duty' && !(d.status === 'on_duty' || d.hasOngoingTrip)) return false;
    if (statusFilter === 'scheduled' && !(d.hasFutureSchedule || (d.futureTripsCount > 0))) return false;
    if (statusFilter === 'off_duty' && d.status !== 'off_duty') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = d.name?.toLowerCase() || '';
      const email = d.email?.toLowerCase() || '';
      const phone = d.phone?.toLowerCase() || '';
      const licence = d.licenceNumber?.toLowerCase() || '';
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !licence.includes(q)) return false;
    }
    return true;
  });

  const paginatedDrivers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="customers-mgmt-root">
      {/* 4 Premium KPI Stat Cards */}
      <div className="cust-stats-grid">
        <div className="cust-stat-card">
          <div className="cust-stat-icon-box" style={{ background: 'rgba(249, 109, 0, 0.12)', color: 'var(--primary)' }}>
            <FaUserTie />
          </div>
          <div className="cust-stat-info-col">
            <span className="cust-stat-label-text">Total Drivers</span>
            <strong className="cust-stat-val-text">{totalDrivers}</strong>
            <span className="cust-stat-sub-text">
              <FaCircle size={7} /> Licensed Professionals
            </span>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
            <FaCheckCircle />
          </div>
          <div className="cust-stat-info-col">
            <span className="cust-stat-label-text">Available For Hire</span>
            <strong className="cust-stat-val-text">{availableDrivers}</strong>
            <span className="cust-stat-sub-text" style={{ color: '#059669' }}>
              <FaCircle size={7} /> Ready for Dispatch
            </span>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-box" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
            <FaCar />
          </div>
          <div className="cust-stat-info-col">
            <span className="cust-stat-label-text">Currently On Duty</span>
            <strong className="cust-stat-val-text">{onDutyDrivers}</strong>
            <span className="cust-stat-sub-text" style={{ color: '#2563eb' }}>
              <FaCircle size={7} /> Active On Trip
            </span>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
            <FaClock />
          </div>
          <div className="cust-stat-info-col">
            <span className="cust-stat-label-text">Scheduled Duties</span>
            <strong className="cust-stat-val-text">{scheduledDutyDrivers}</strong>
            <span className="cust-stat-sub-text" style={{ color: '#d97706' }}>
              <FaCircle size={7} /> Future Bookings Reserved
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar / Search & Action Bar */}
      <div className="cust-toolbar-bar">
        <div className="cust-search-input-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search drivers by name, licence, phone or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="cust-dropdown-select"
            style={{ minWidth: '175px' }}
          >
            <option value="all">All Roster ({drivers.length})</option>
            <option value="active">Available Now ({availableDrivers})</option>
            <option value="on_duty">On Duty Today ({onDutyDrivers})</option>
            <option value="scheduled">Scheduled Duty ({scheduledDutyDrivers})</option>
            <option value="off_duty">Off Duty ({drivers.filter(d => d.status === 'off_duty').length})</option>
          </select>

          <button 
            type="button"
            className="btn-admin-primary" 
            onClick={handleOpenAddModal}
            style={{ height: '42px', padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '10px', cursor: 'pointer' }}
          >
            <FaPlus size={12} />
            <span>Register Driver</span>
          </button>
        </div>
      </div>

      {/* Driver Cards Grid */}
      {loading ? (
        <div className="spinner-container"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div 
          className="empty-state" 
          style={{ 
            padding: '52px 24px', 
            background: '#ffffff', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div 
            style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '4px' 
            }}
          >
            <FaUserTie size={28} style={{ color: '#94a3b8' }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px 0' }}>
            No drivers found
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 16px 0', maxWidth: '440px', lineHeight: 1.5 }}>
            {search ? 'Try clearing your search query or status filter.' : 'Register certified professional drivers to fulfill chauffeur & rental with driver requests.'}
          </p>
          <button 
            type="button"
            className="btn-admin-primary" 
            onClick={handleOpenAddModal} 
            style={{ 
              height: '42px', 
              padding: '0 22px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px', 
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(249, 109, 0, 0.35)'
            }}
          >
            <FaPlus size={12} style={{ flexShrink: 0 }} />
            <span>Register Driver</span>
          </button>
        </div>
      ) : (
        <>
          <div className="driver-cards-grid">
          {paginatedDrivers.map(d => (
            <div key={d._id} className="driver-card">
              <div className="driver-card-header">
                <div className="driver-avatar-circle" style={{ background: 'linear-gradient(135deg, #f96d00 0%, #ea580c 100%)', color: '#fff' }}>
                  {d.name ? d.name.charAt(0).toUpperCase() : 'D'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 
                      style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedDriverId(d._id);
                        setShowDetailModal(true);
                      }}
                      title="View Driver Profile & Customer Reviews"
                    >
                      {d.name}
                    </h3>
                    <button 
                      className="btn-trash-driver"
                      onClick={() => handleDelete(d._id)}
                      title="Remove Driver from Fleet"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '5px' }}>
                    <span className={`driver-status-chip ${d.hasOngoingTrip || d.status === 'on_duty' ? 'on_duty' : d.hasFutureSchedule ? 'on_duty' : d.status}`}>
                      {d.hasOngoingTrip || d.status === 'on_duty' ? 'On Trip' : d.hasFutureSchedule ? 'Scheduled' : d.status === 'active' ? 'Available' : 'Off Duty'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                      <FaStar /> {d.rating || 4.9} ({d.tripsCount || 0} trips)
                    </span>
                  </div>
                </div>
              </div>

              <div className="driver-card-body">
                <div className="driver-spec-row">
                  <span className="spec-label"><FaIdCard /> Licence No:</span>
                  <span className="spec-val"><code>{d.licenceNumber}</code></span>
                </div>
                <div className="driver-spec-row">
                  <span className="spec-label"><FaPhone /> Phone:</span>
                  <span className="spec-val"><a href={`tel:${d.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{d.phone}</a></span>
                </div>
                <div className="driver-spec-row">
                  <span className="spec-label"><FaEnvelope /> Email:</span>
                  <span className="spec-val"><a href={`mailto:${d.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{d.email}</a></span>
                </div>
                <div className="driver-spec-row">
                  <span className="spec-label"><FaClock /> Experience:</span>
                  <span className="spec-val">{d.experienceYears} Years</span>
                </div>
                <div className="driver-spec-row">
                  <span className="spec-label"><FaShieldAlt /> Verification:</span>
                  <span className="spec-val" style={{ color: d.isVerified ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {d.isVerified ? '✓ Identity & Background Verified' : 'Pending Verification'}
                  </span>
                </div>

                {/* Vehicle Types Supported */}
                {d.supportedVehicleTypes && d.supportedVehicleTypes.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Certified Vehicle Classes:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {d.supportedVehicleTypes.map(t => (
                        <span key={t} className="spec-badge" style={{ fontSize: '11px' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-time Duty & Future Schedule Status */}
                {d.hasOngoingTrip || d.status === 'on_duty' ? (
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '9px 11px',
                    marginTop: '8px',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8', fontWeight: 700, marginBottom: '3px' }}>
                      <FaCar /> On Duty: Live Trip In Progress
                    </div>
                    <div style={{ color: '#1e293b', fontWeight: 600 }}>
                      {d.ongoingTrip?.carName || 'Assigned Vehicle'} • <span style={{ color: '#64748b' }}>Ref: {d.ongoingTrip?.bookingReference || 'Active'}</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
                      Schedule: {formatDate(d.ongoingTrip?.pickupDate)} to {formatDate(d.ongoingTrip?.dropoffDate)}
                    </div>
                  </div>
                ) : d.hasFutureSchedule || d.futureTripsCount > 0 ? (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '9px 11px',
                    marginTop: '8px',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#b45309', fontWeight: 700, marginBottom: '3px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaClock /> Scheduled Duty ({d.futureTripsCount} upcoming)
                      </span>
                      <span style={{ fontSize: '10.5px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Reserved</span>
                    </div>
                    {d.assignedTrips?.filter(t => t.isFuture).slice(0, 2).map((trip, idx) => (
                      <div key={trip._id || idx} style={{ marginTop: '4px', borderTop: idx > 0 ? '1px dashed #fcd34d' : 'none', paddingTop: idx > 0 ? '4px' : '0' }}>
                        <div style={{ color: '#92400e', fontWeight: 600 }}>
                          📅 {formatDate(trip.pickupDate)} to {formatDate(trip.dropoffDate)}
                        </div>
                        <div style={{ color: '#78350f', fontSize: '11px' }}>
                          {trip.carName} (Ref: {trip.bookingReference})
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: '10.5px', color: '#b45309', marginTop: '4px', fontStyle: 'italic' }}>
                      *Driver is locked for these dates to prevent double-booking.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '7px 11px',
                    marginTop: '8px',
                    fontSize: '11.5px',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600
                  }}>
                    <FaCheckCircle /> Ready for immediate hire (No duty conflicts)
                  </div>
                )}

                {/* Duty Status Actions */}
                <div className="driver-duty-toggle" style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Update Live Duty Status:</span>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className={`btn-duty-pill ${d.status === 'active' && !d.hasOngoingTrip ? 'active' : ''}`}
                      title={d.hasOngoingTrip ? 'Driver is currently on trip. Must complete trip in Bookings first.' : 'Mark Available'}
                      onClick={() => handleStatusToggle(d, 'active')}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      className={`btn-duty-pill ${d.status === 'on_duty' || d.hasOngoingTrip ? 'active' : ''}`}
                      onClick={() => handleStatusToggle(d, 'on_duty')}
                    >
                      On Trip
                    </button>
                    <button
                      type="button"
                      className={`btn-duty-pill ${d.status === 'off_duty' ? 'active' : ''}`}
                      onClick={() => handleStatusToggle(d, 'off_duty')}
                    >
                      Off Duty
                    </button>
                  </div>
                </div>

                {/* View Details & Customer Reviews Trigger Button */}
                <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDriverId(d._id);
                      setShowDetailModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f96d00'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#f96d00'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <FaStar size={11} color="#f59e0b" />
                    <span>View Profile &amp; Customer Reviews</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24, 48]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            label="drivers"
          />
        </>
      )}

      {/* Centered, Modern Register Driver Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', borderRadius: '20px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249, 109, 0, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                  <FaUserTie />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Register Driver</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Add a certified licensed driver to your active roster</p>
                </div>
              </div>
              <button 
                type="button"
                className="cust-btn-close" 
                onClick={() => setShowAddModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} noValidate className="modal-body" style={{ gap: '16px', display: 'flex', flexDirection: 'column' }}>
              {formApiError && (
                <div 
                  style={{ 
                    padding: '11px 14px', 
                    borderRadius: '10px', 
                    background: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    color: '#b91c1c', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}
                >
                  <FaTimesCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{formApiError}</span>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Legal Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Samuel Rodriguez"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    style={{
                      borderColor: formErrors.name ? '#ef4444' : '#cbd5e1',
                      backgroundColor: formErrors.name ? '#fef2f2' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  />
                  {formErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <FaTimesCircle size={11} /> {formErrors.name}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+1 (415) 789-0123"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    style={{
                      borderColor: formErrors.phone ? '#ef4444' : '#cbd5e1',
                      backgroundColor: formErrors.phone ? '#fef2f2' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  />
                  {formErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <FaTimesCircle size={11} /> {formErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="driver@carbook.com"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    style={{
                      borderColor: formErrors.email ? '#ef4444' : '#cbd5e1',
                      backgroundColor: formErrors.email ? '#fef2f2' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  />
                  {formErrors.email && (
                    <span style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <FaTimesCircle size={11} /> {formErrors.email}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Driving Licence Number *</label>
                  <input
                    type="text"
                    placeholder="DL-98214-CA"
                    value={formData.licenceNumber}
                    onChange={e => handleInputChange('licenceNumber', e.target.value)}
                    style={{
                      borderColor: formErrors.licenceNumber ? '#ef4444' : '#cbd5e1',
                      backgroundColor: formErrors.licenceNumber ? '#fef2f2' : '#ffffff',
                      textTransform: 'uppercase',
                      transition: 'all 0.15s ease'
                    }}
                  />
                  {formErrors.licenceNumber && (
                    <span style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <FaTimesCircle size={11} /> {formErrors.licenceNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Commercial Driving Experience (Years) *</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={formData.experienceYears}
                  onChange={e => handleInputChange('experienceYears', e.target.value)}
                  style={{
                    borderColor: formErrors.experienceYears ? '#ef4444' : '#cbd5e1',
                    backgroundColor: formErrors.experienceYears ? '#fef2f2' : '#ffffff',
                    transition: 'all 0.15s ease'
                  }}
                />
                {formErrors.experienceYears && (
                  <span style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <FaTimesCircle size={11} /> {formErrors.experienceYears}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Certified Vehicle Categories *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {VEHICLE_TYPE_OPTIONS.map(type => {
                    const selected = formData.supportedVehicleTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`cust-filter-chip ${selected ? 'active' : ''}`}
                        onClick={() => toggleVehicleType(type)}
                      >
                        {selected ? '✓ ' : '+ '}{type}
                      </button>
                    );
                  })}
                </div>
                {formErrors.supportedVehicleTypes && (
                  <span style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <FaTimesCircle size={11} /> {formErrors.supportedVehicleTypes}
                  </span>
                )}
              </div>

              <div 
                className="modal-footer" 
                style={{ 
                  borderTop: '1px solid #e2e8f0', 
                  paddingTop: '18px', 
                  marginTop: '8px',
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  alignItems: 'center',
                  gap: '12px' 
                }}
              >
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addLoading}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 26px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f96d00 0%, #ea580c 100%)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: addLoading ? 'not-allowed' : 'pointer',
                    opacity: addLoading ? 0.7 : 1,
                    boxShadow: '0 4px 14px rgba(249, 109, 0, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (!addLoading) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 109, 0, 0.48)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={(e) => { if (!addLoading) { e.currentTarget.style.boxShadow = '0 4px 14px rgba(249, 109, 0, 0.35)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                  <FaPlus size={12} />
                  <span>{addLoading ? 'Saving...' : 'Register Driver'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Profile, Trips & Customer Reviews Drill-down Modal */}
      <DriverDetailModal
        driverId={selectedDriverId}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDriverId(null);
        }}
      />

      {/* Custom Confirmation / Alert Dialog */}
      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
