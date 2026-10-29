import { useState, useEffect } from 'react';
import { 
  FaTimes, FaCar, FaTools, FaStar, FaRegStar, FaCalendarAlt, 
  FaMapPin, FaUserTie, FaPhone, FaEnvelope, FaCheckCircle, 
  FaBan, FaTruck, FaBox, FaShieldAlt, FaClock, FaDollarSign, 
  FaTrash, FaExternalLinkAlt, FaCheck, FaExclamationTriangle
} from 'react-icons/fa';
import { getCustomerDetails, deleteReview, updateCustomerStatus, toggleReviewLanding } from '../api';
import { formatDate } from '../utils/format';

export default function CustomerDetailModal({ customerId, initialTab = 'rentals', onClose, onCustomerUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab === 'orders' ? 'rentals' : (initialTab || 'rentals')); // 'rentals' | 'reviews'
  const [reviewFilter, setReviewFilter] = useState('all');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab === 'orders' ? 'rentals' : (initialTab || 'rentals'));
  }, [initialTab]);

  useEffect(() => {
    if (customerId) {
      loadCustomerDetails();
    }
  }, [customerId]);

  const loadCustomerDetails = async () => {
    setLoading(true);
    try {
      const res = await getCustomerDetails(customerId);
      if (res.data && res.data.customer) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err) {
      console.warn('Error loading customer details:', err?.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data?.customer) return;
    const currentStatus = data.customer.status;
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    
    if (!window.confirm(`Are you sure you want to mark ${data.customer.name}'s account as ${nextStatus.toUpperCase()}?`)) {
      return;
    }

    setStatusUpdating(true);
    try {
      await updateCustomerStatus(data.customer._id, nextStatus);
      setData(prev => ({
        ...prev,
        customer: { ...prev.customer, status: nextStatus }
      }));
      if (onCustomerUpdated) onCustomerUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update customer status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;
    try {
      await deleteReview(reviewId);
      setData(prev => ({
        ...prev,
        reviews: prev.reviews.filter(r => r._id !== reviewId),
        metrics: {
          ...prev.metrics,
          reviewsCount: Math.max(0, prev.metrics.reviewsCount - 1)
        }
      }));
      if (onCustomerUpdated) onCustomerUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleToggleReviewLanding = async (reviewId, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      await toggleReviewLanding(reviewId, nextStatus);
      setData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => r._id === reviewId ? { ...r, showOnLanding: nextStatus } : r)
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update review status');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <FaStar key={i} style={{ color: '#f59e0b', fontSize: '13px' }} />
        ) : (
          <FaRegStar key={i} style={{ color: '#cbd5e1', fontSize: '13px' }} />
        )
      );
    }
    return stars;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'active':
      case 'paid':
      case 'fully_paid':
        return 'chip-active';
      case 'ongoing':
      case 'processing':
      case 'shipped':
      case 'deposit_paid':
        return 'chip-rented';
      case 'confirmed':
      case 'driver_assigned':
      case 'packed':
        return 'chip-maintenance';
      case 'cancelled':
      case 'suspended':
      case 'refunded':
        return 'chip-cancelled';
      default:
        return 'chip-maintenance';
    }
  };

  if (!customerId) return null;

  return (
    <div className="cust-modal-backdrop" onClick={onClose}>
      <div className="cust-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="cust-modal-header">
          <div className="cust-header-profile">
            <div className="cust-avatar-large">
              {data?.customer?.name ? data.customer.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className="cust-profile-name">{data?.customer?.name || 'Customer Profile'}</h3>
                {data?.customer && (
                  <span className={`status-chip ${data.customer.status === 'suspended' ? 'chip-cancelled' : 'chip-active'}`}>
                    {data.customer.status === 'suspended' ? <FaBan style={{ marginRight: '4px' }} /> : <FaCheckCircle style={{ marginRight: '4px' }} />}
                    {data.customer.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                )}
              </div>
              <div className="cust-profile-meta">
                <span><FaEnvelope /> {data?.customer?.email || '—'}</span>
                <span><FaPhone /> {data?.customer?.phone || 'No phone recorded'}</span>
                <span><FaCalendarAlt /> Joined {data?.customer?.createdAt ? formatDate(data.customer.createdAt) : '—'}</span>
                {data?.customer?.addresses?.[0] && (
                  <span>
                    <FaMapPin /> {data.customer.addresses[0].city}, {data.customer.addresses[0].state || data.customer.addresses[0].country}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {data?.customer && (
              <button 
                className={`btn-action-sm ${data.customer.status === 'suspended' ? 'confirm' : 'cancel'}`}
                onClick={handleToggleStatus}
                disabled={statusUpdating}
                title="Toggle customer account status"
              >
                {data.customer.status === 'suspended' ? <><FaCheckCircle /> Reactivate Account</> : <><FaBan /> Suspend Account</>}
              </button>
            )}
            <button className="cust-btn-close" onClick={onClose} aria-label="Close modal">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="cust-modal-loading">
            <div className="spinner"></div>
            <p>Loading customer profile, rental history, and reviews...</p>
          </div>
        ) : !data ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <FaExclamationTriangle size={40} style={{ color: '#ef4444', marginBottom: '12px' }} />
            <h3>Unable to load customer history</h3>
            <p>Customer details could not be retrieved from the server.</p>
          </div>
        ) : (
          <>
            {/* KPI Metrics Strip */}
            <div className="cust-kpi-grid">
              <div className="cust-kpi-card" onClick={() => setActiveTab('rentals')}>
                <div className="cust-kpi-icon icon-rentals">
                  <FaCar />
                </div>
                <div className="cust-kpi-info">
                  <span className="cust-kpi-label">Vehicle Rentals</span>
                  <strong className="cust-kpi-val">{data.metrics.rentalsCount} Bookings</strong>
                  <small className="cust-kpi-sub">₹{(data.metrics.totalRentalsSpent || 0).toLocaleString('en-IN')} spent</small>
                </div>
              </div>

              <div className="cust-kpi-card">
                <div className="cust-kpi-icon icon-spend">
                  <FaDollarSign />
                </div>
                <div className="cust-kpi-info">
                  <span className="cust-kpi-label">Lifetime Spend</span>
                  <strong className="cust-kpi-val">₹{(data.metrics.totalSpent || 0).toLocaleString('en-IN')}</strong>
                  <small className="cust-kpi-sub">Total Rental Volume</small>
                </div>
              </div>

              <div className="cust-kpi-card" onClick={() => setActiveTab('reviews')}>
                <div className="cust-kpi-icon icon-reviews">
                  <FaStar />
                </div>
                <div className="cust-kpi-info">
                  <span className="cust-kpi-label">Customer Reviews</span>
                  <strong className="cust-kpi-val">{data.metrics.reviewsCount} Submitted</strong>
                  <small className="cust-kpi-sub">Avg Rating: {data.metrics.avgRating} ★</small>
                </div>
              </div>

              <div className="cust-kpi-card">
                <div className="cust-kpi-icon icon-rentals" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <FaCheck />
                </div>
                <div className="cust-kpi-info">
                  <span className="cust-kpi-label">Account Status</span>
                  <strong className="cust-kpi-val" style={{ textTransform: 'uppercase', fontSize: '15px' }}>{data.customer.status || 'Active'}</strong>
                  <small className="cust-kpi-sub">Verified Identity</small>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="cust-nav-tabs">
              <button 
                className={`cust-tab-btn ${activeTab === 'rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('rentals')}
              >
                <FaCar /> Vehicle Rent History
                <span className="cust-tab-badge">{data.rentals.length}</span>
              </button>

              <button 
                className={`cust-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                <FaStar /> Customer Reviews
                <span className="cust-tab-badge">{data.reviews.length}</span>
              </button>
            </div>

            {/* Modal Body / Tab Content */}
            <div className="cust-tab-content">
              {/* TAB 1: VEHICLE RENT HISTORY */}
              {activeTab === 'rentals' && (
                <div className="cust-history-list">
                  {data.rentals.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <FaCar size={40} style={{ color: 'var(--text-secondary)', marginBottom: '10px' }} />
                      <h4>No Vehicle Rental History</h4>
                      <p>This customer has not booked any vehicles yet.</p>
                    </div>
                  ) : (
                    data.rentals.map((booking) => (
                      <div key={booking._id} className="cust-history-card">
                        <div className="cust-card-top-row">
                          <div className="cust-card-vehicle-head">
                            <div className="cust-card-thumb-wrap">
                              <img 
                                src={booking.car?.images?.[0] || '/images/car-1.jpg'} 
                                alt={booking.car?.name || 'Vehicle'} 
                                className="cust-card-thumb"
                                onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
                              />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 className="cust-card-title">
                                  {booking.car ? `${booking.car.brand} ${booking.car.name}` : 'Reserved Vehicle'}
                                </h4>
                                <span className="cust-ref-badge">{booking.bookingReference}</span>
                              </div>
                              <span className="cust-card-sub">
                                {booking.rentalType === 'with_driver' || booking.withDriver ? 'Rental With Driver' : 'Self-Drive Rental'} • {booking.car?.vehicleType || 'Sedan'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`status-chip ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span className={`status-chip ${getStatusBadgeClass(booking.paymentStatus)}`}>
                              {booking.paymentStatus?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Rental Details Grid */}
                        <div className="cust-details-grid">
                          <div className="cust-detail-box">
                            <span className="cust-box-label"><FaCalendarAlt /> Rental Schedule</span>
                            <strong className="cust-box-val">
                              {formatDate(booking.pickupDate)} &rarr; {formatDate(booking.dropoffDate)}
                            </strong>
                            <small className="cust-box-sub">{booking.days || 1} Days Total</small>
                          </div>

                          <div className="cust-detail-box">
                            <span className="cust-box-label"><FaMapPin /> Pick-up &amp; Drop-off</span>
                            <strong className="cust-box-val">{booking.pickupLocation || 'Main Airport Hub'}</strong>
                            <small className="cust-box-sub">Return: {booking.dropoffLocation || 'Main Airport Hub'}</small>
                          </div>

                          <div className="cust-detail-box">
                            <span className="cust-box-label"><FaUserTie /> Assigned Driver</span>
                            <strong className="cust-box-val">
                              {booking.driver ? booking.driver.name : (booking.withDriver ? 'Driver Pending' : 'Self-Drive')}
                            </strong>
                            <small className="cust-box-sub">
                              {booking.driver ? (booking.driver.phone || 'Driver Assigned') : 'Client Driving'}
                            </small>
                          </div>

                          <div className="cust-detail-box highlight">
                            <span className="cust-box-label"><FaDollarSign /> Financial Summary</span>
                            <strong className="cust-box-val total-amt">₹{booking.totalPrice?.toLocaleString('en-IN') || 0}</strong>
                            <small className="cust-box-sub">
                              ₹{booking.dailyRate}/day • Dep: ₹{booking.securityDeposit ?? 0}
                            </small>
                          </div>
                        </div>

                        {/* Inspection / Notes Strip if available */}
                        {(booking.inspection?.returnNotes || booking.notes) && (
                          <div className="cust-card-notes-strip">
                            <FaShieldAlt style={{ color: '#0ea5e9', flexShrink: 0 }} />
                            <div>
                              {booking.notes && <p><strong>Customer Note:</strong> {booking.notes}</p>}
                              {booking.inspection?.returnNotes && (
                                <p><strong>Inspection Log:</strong> {booking.inspection.returnNotes} (Odo: {booking.inspection.returnOdometer || '—'} km, Fuel: {booking.inspection.returnFuelLevel})</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: CUSTOMER REVIEWS & RATINGS */}
              {activeTab === 'reviews' && (
                <div className="cust-reviews-container">
                  {/* Filter Sub-bar */}
                  <div className="cust-review-filter-bar">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="cust-filter-chip active"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FaCar /> Vehicle Rental Reviews ({data.reviews.length})
                      </button>
                    </div>

                    <div className="cust-avg-badge">
                      <FaStar style={{ color: '#f59e0b' }} /> Average Given: <strong>{data.metrics.avgRating} / 5.0</strong>
                    </div>
                  </div>

                  {data.reviews.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <FaStar size={40} style={{ color: '#cbd5e1', marginBottom: '10px' }} />
                      <h4>No Customer Reviews Recorded</h4>
                      <p>This customer has not posted any vehicle rental reviews yet.</p>
                    </div>
                  ) : (
                    <div className="cust-reviews-grid">
                      {data.reviews.map((review) => {
                        const targetItem = review.car || {};
                        const itemName = targetItem.name ? `${targetItem.brand || ''} ${targetItem.name}` : 'Rental Vehicle';
                        const itemImg = targetItem.images?.[0] || targetItem.image || '/images/car-1.jpg';

                        return (
                          <div key={review._id} className="cust-review-card">
                            <div className="cust-review-card-head">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img 
                                  src={itemImg} 
                                  alt={itemName} 
                                  className="cust-review-item-thumb" 
                                  onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
                                />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="cust-target-tag tag-car">
                                      <FaCar /> Car Rental
                                    </span>
                                    {review.verifiedPurchase && (
                                      <span className="cust-verified-badge" title="Verified customer transaction">
                                        <FaCheck /> Verified
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="cust-review-target-name">{itemName}</h4>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button 
                                  type="button"
                                  onClick={() => handleToggleReviewLanding(review._id, review.showOnLanding)}
                                  style={{
                                    background: review.showOnLanding ? '#ecfdf5' : '#f8fafc',
                                    color: review.showOnLanding ? '#047857' : '#64748b',
                                    border: review.showOnLanding ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title={review.showOnLanding ? 'Featured on landing page slider (Click to hide)' : 'Click to feature on landing page slider'}
                                >
                                  {review.showOnLanding ? '🟢 On Landing' : '⚪ Feature on Landing'}
                                </button>
                                <button 
                                  className="cust-btn-delete-review"
                                  onClick={() => handleDeleteReview(review._id)}
                                  title="Delete Review (Admin Moderation)"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>

                            <div className="cust-review-rating-row">
                              <div className="stars-strip">
                                {renderStars(review.rating)}
                              </div>
                              <span className="cust-review-date">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>

                            {review.title && (
                              <h5 className="cust-review-title">&ldquo;{review.title}&rdquo;</h5>
                            )}

                            <p className="cust-review-comment">{review.comment}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
