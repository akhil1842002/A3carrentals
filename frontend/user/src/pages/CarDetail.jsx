import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiUsers, FiSliders, FiDroplet, FiZap, FiNavigation,
  FiBox, FiCheck, FiX, FiArrowLeft, FiCalendar, FiMapPin, FiUser, FiPhone, FiMail, FiClock
} from 'react-icons/fi';
import { FaWhatsapp, FaStar, FaCar, FaUserTie } from 'react-icons/fa';
import { getCar, createBooking, getMyBookings, getWhatsAppLink, getBookingQuote, getReviews, createReview, getMe } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { formatDate } from '../utils/format';
import AuthModal from '../components/AuthModal';

export default function CarDetail() {
  const { id } = useParams();
  const { isAuthenticated, user, updateUser } = useAuth();
  const { settings } = useSettings();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Booking Form State
  const [withDriver, setWithDriver] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState({ type: '', text: '', waUrl: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Quote State
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [reviewErrors, setReviewErrors] = useState({});
  const [bookErrors, setBookErrors] = useState({});

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const carRes = await getCar(id);
        setCar(carRes.data);
      } catch (err) {
        console.error('Error fetching car:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
    fetchCarReviews();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchCarReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await getReviews({ targetType: 'car', carId: id });
      if (res.data?.reviews) {
        setReviews(res.data.reviews);
      }
    } catch (err) {
      console.error('Error fetching car reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReviewMsg({ type: 'error', text: 'Please sign in to leave a review.' });
      return;
    }
    const errs = {};
    if (!reviewComment.trim()) {
      errs.comment = 'Please enter your review feedback';
    }
    setReviewErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setReviewSubmitting(true);
      setReviewMsg({ type: '', text: '' });
      await createReview({
        targetType: 'car',
        carId: id,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim()
      });
      setReviewMsg({ type: 'success', text: 'Thank you! Your review has been published.' });
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setReviewErrors({});
      fetchCarReviews();
      // Also refresh car details to update average rating
      const carRes = await getCar(id);
      setCar(carRes.data);
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit review' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const [userBookings, setUserBookings] = useState([]);

  useEffect(() => {
    // If logged in, fetch fresh user profile from API to ensure WhatsApp number is 100% current from profile page
    if (isAuthenticated) {
      getMyBookings()
        .then(res => {
          if (res?.data) setUserBookings(res.data);
        })
        .catch(() => {});

      getMe()
        .then(res => {
          if (res?.data) {
            if (res.data.name) setCustName(res.data.name);
            if (res.data.phone) setCustPhone(res.data.phone);
            if (res.data.email) setCustEmail(res.data.email);
            if (typeof updateUser === 'function') updateUser(res.data);
          }
        })
        .catch(() => {
          if (user) {
            setCustName(user.name || '');
            setCustPhone(user.phone || '');
            setCustEmail(user.email || '');
          }
        });
    } else if (user) {
      setCustName(user.name || '');
      setCustPhone(user.phone || '');
      setCustEmail(user.email || '');
    }
  }, [isAuthenticated, user]);

  const userPendingBooking = userBookings.find(b => 
    (b.car?._id === id || b.car === id) && b.status === 'pending'
  );

  // Recalculate quote
  useEffect(() => {
    if (!car || !pickupDate || !dropoffDate) {
      setQuote(null);
      return;
    }
    let isMounted = true;
    setQuoteLoading(true);
    getBookingQuote({
      carId: car._id,
      pickupDate,
      dropoffDate,
      withDriver
    })
      .then((res) => {
        if (isMounted) setQuote(res.data);
      })
      .catch((err) => console.error('Quote err:', err))
      .finally(() => {
        if (isMounted) setQuoteLoading(false);
      });

    return () => { isMounted = false; };
  }, [car, pickupDate, dropoffDate, withDriver]);

  if (loading) {
    return <div className="loading-spinner" style={{ paddingTop: '200px' }}><div className="spinner"></div></div>;
  }

  if (!car) {
    return (
      <div className="empty-state" style={{ paddingTop: '200px', textAlign: 'center' }}>
        <h2>Car Not Found</h2>
        <p>The vehicle you're looking for doesn't exist or has been removed.</p>
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="btn btn-primary">
          <FiArrowLeft /> {isAuthenticated ? 'Back to Fleet' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  const isAvailable = car.status === 'available';
  const today = new Date().toISOString().split('T')[0];
  const images = car.images && car.images.length > 0 ? car.images : ['/images/car-1.jpg'];
  const image = images[activeImage] || images[0];

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!custName.trim()) {
      errs.custName = 'Please enter your full name';
    }
    if (!custPhone.trim()) {
      errs.custPhone = 'Mobile number is compulsory.';
    } else if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(custPhone.trim().replace(/[\s\-\(\)]/g, ''))) {
      errs.custPhone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }
    if (!pickupDate) {
      errs.pickupDate = 'Please select your ride date';
    }
    setBookErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // If customer is not authenticated, display the inline AuthModal
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    executeBooking(user);
  };

  const handleAuthSuccess = (loggedInUser) => {
    setShowAuthModal(false);
    if (loggedInUser.name && !custName) setCustName(loggedInUser.name);
    if (loggedInUser.phone && !custPhone) setCustPhone(loggedInUser.phone);
    if (loggedInUser.email && !custEmail) setCustEmail(loggedInUser.email);
    executeBooking(loggedInUser);
  };

  const handleGuestContinue = () => {
    setShowAuthModal(false);
    executeBooking(null);
  };

  const executeBooking = async (activeUser = user) => {
    setBookingLoading(true);
    setBookingMsg({ type: '', text: '', waUrl: '' });

    try {
      const brand = settings?.businessName || 'CarBook';
      const pickLoc = pickupLocation.trim() || `${brand} Hub`;
      const dropLoc = dropoffLocation.trim() || pickLoc;
      const customerName = custName.trim() || activeUser?.name || 'Customer';
      const customerPhone = custPhone.trim() || activeUser?.phone || 'Not provided';
      const customerEmail = custEmail.trim() || activeUser?.email || 'Not provided';
      const days = quote?.days || Math.max(1, Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)));
      const totalAmount = quote?.totalPayable || (days * car.pricePerDay + (withDriver ? days * settings.driverDailyFee : 0));

      let bookingRef = '';
      if (activeUser || isAuthenticated) {
        const res = await createBooking({
          carId: car._id,
          pickupDate,
          dropoffDate: dropoffDate || pickupDate,
          pickupLocation: pickLoc,
          dropoffLocation: dropLoc,
          rentalType: withDriver ? 'with_driver' : 'self_drive',
          withDriver,
          bookingSource: 'whatsapp',
          paymentMethod: 'whatsapp',
          notes: `Name: ${customerName} | Phone: ${customerPhone} | Email: ${customerEmail}${bookingNotes ? ` | Note: ${bookingNotes}` : ''}`
        });
        bookingRef = res.data?.bookingReference || res.data?._id;
        getMyBookings().then(r => setUserBookings(r.data || [])).catch(() => {});
      }

      // WhatsApp Message
      const waMessage = `*${brand.toUpperCase()} - RESERVATION REQUEST*
---------------------------
${bookingRef ? `*Booking Ref:* ${bookingRef}\n` : ''}*Vehicle:* ${car.name} (${car.brand} ${car.model} - ${car.year})
*Drive Option:* ${withDriver ? 'With Driver (Professional Driver Included)' : 'Without Driver (Self-Drive Rental)'}
- Daily Rate: ${settings.currencySymbol || '₹'}${car.pricePerDay}/day

*Schedule:*
- Ride Date: ${formatDate(pickupDate)} (1 Day)
- Pick-up Location: ${pickLoc}
- Drop-off Location: ${dropLoc}

*Estimated Total:* ${settings.currencySymbol || '₹'}${totalAmount} ${withDriver ? `(Includes ${settings.currencySymbol || '₹'}${settings.driverDailyFee || 999}/day driver fee)` : '(No driver fee)'}

*Customer Details:*
- Name: ${customerName}
- Phone: ${customerPhone}
- Email: ${customerEmail}
${bookingNotes ? `- Notes: ${bookingNotes}\n` : ''}*Status:* Pending Admin Approval
---------------------------
Hello Admin, please verify and confirm this reservation request on WhatsApp.`;

      const waUrl = getWhatsAppLink(waMessage, settings.whatsappNumber);
      window.open(waUrl, '_blank');

      setBookingMsg({
        type: 'success',
        text: '⏳ WhatsApp opened! Please hit "Send" in WhatsApp to notify Admin. Your booking is saved as "Pending" and will be confirmed once Admin verifies the chat.' + (isAuthenticated ? ' You can track status or re-send from your Dashboard.' : ''),
        waUrl
      });
    } catch (err) {
      console.error('Car detail booking error:', err);
      setBookingMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit booking. This car may be booked for the selected dates.'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="car-detail" style={{ paddingTop: isAuthenticated ? '20px' : '100px', paddingBottom: '80px', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div className="car-detail-container" style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <div className="breadcrumb" style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#888' }}>
            <Link to="/">Home</Link> <span>/</span>
            {isAuthenticated ? (
              <Link to="/dashboard">Dashboard</Link>
            ) : (
              <Link to="/">Fleet</Link>
            )} <span>/</span>
            <span style={{ color: '#333', fontWeight: 600 }}>{car.name}</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="car-detail-hero" style={{ backgroundImage: `url(${image})` }}>
          <div className="car-detail-overlay">
            <span className="subheading">{car.brand} • {car.year}</span>
            <h1>{car.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#FFD700', fontWeight: 700 }}>
                <FaStar /> {car.rating || 4.8}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>({car.reviewCount || 15} reviews)</span>
              <span
                style={{
                  background: isAvailable ? '#10B981' : '#EF4444',
                  color: '#fff',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'capitalize'
                }}
              >
                {isAvailable ? 'Available Now' : car.status}
              </span>
            </div>
          </div>
        </div>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', margin: '15px 0 30px' }}>
            {images.map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveImage(i)}
                style={{
                  width: '90px',
                  height: '65px',
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: i === activeImage ? '3px solid var(--primary)' : '3px solid transparent',
                  opacity: i === activeImage ? 1 : 0.65,
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* Specs Bar */}
        <div className="car-specs-bar">
          <div className="spec-item">
            <div className="spec-icon"><FiActivity /></div>
            <div className="spec-info">
              <h4>Fuel Type</h4>
              <p>{car.fuelType || 'Petrol'}</p>
            </div>
          </div>
          <div className="spec-item">
            <div className="spec-icon"><FiNavigation /></div>
            <div className="spec-info">
              <h4>Mileage</h4>
              <p>{car.mileage ? car.mileage.replace(/mi/gi, 'km') : 'Unlimited'}</p>
            </div>
          </div>
          <div className="spec-item">
            <div className="spec-icon"><FiSliders /></div>
            <div className="spec-info">
              <h4>Transmission</h4>
              <p>{car.transmission || 'Automatic'}</p>
            </div>
          </div>
          <div className="spec-item">
            <div className="spec-icon"><FiUsers /></div>
            <div className="spec-info">
              <h4>Seats</h4>
              <p>{car.seats || 4} Persons</p>
            </div>
          </div>
          <div className="spec-item">
            <div className="spec-icon"><FiDroplet /></div>
            <div className="spec-info">
              <h4>Fuel Type</h4>
              <p>{car.fuelType || 'Petrol'}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="car-detail-content">
          <div className="car-detail-main">
            <div className="detail-section">
              <h2>About This Vehicle</h2>
              <p>{car.description || 'Experience premium driving comfort and reliability with this top-tier vehicle, thoroughly inspected and maintained to ensure a flawless journey.'}</p>
            </div>

            <div className="detail-section">
              <h2>Vehicle Specifications</h2>
              <div className="detail-specs-grid">
                <div className="detail-spec-row">
                  <span className="spec-label">Brand</span>
                  <span className="spec-value">{car.brand}</span>
                </div>
                <div className="detail-spec-row">
                  <span className="spec-label">Model</span>
                  <span className="spec-value">{car.model}</span>
                </div>
                <div className="detail-spec-row">
                  <span className="spec-label">Year</span>
                  <span className="spec-value">{car.year}</span>
                </div>
                <div className="detail-spec-row">
                  <span className="spec-label">Vehicle Type</span>
                  <span className="spec-value">{car.vehicleType}</span>
                </div>
                <div className="detail-spec-row">
                  <span className="spec-label">Luggage Capacity</span>
                  <span className="spec-value">{car.luggage || 2} Bags</span>
                </div>
                <div className="detail-spec-row">
                  <span className="spec-label">Plate Number</span>
                  <span className="spec-value">{car.plateNumber || 'Verified Fleet'}</span>
                </div>
              </div>
            </div>

            {car.features && car.features.length > 0 && (
              <div className="detail-section">
                <h2>Features &amp; Amenities</h2>
                <div className="features-grid">
                  {car.features.map((feature, i) => (
                    <div key={i} className={`feature-item ${feature.available ? 'available' : 'unavailable'}`}>
                      {feature.available ? <FiCheck /> : <FiX />}
                      <span>{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Reviews & Feedback Section */}
            <div className="detail-section car-reviews-section" style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Customer Reviews &amp; Ratings</h2>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                    Authentic feedback from verified renters
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff7ed', padding: '8px 16px', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                  <div style={{ display: 'flex', color: '#f59e0b' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar key={s} size={15} color={s <= Math.round(car.rating || 5) ? '#f59e0b' : '#cbd5e1'} />
                    ))}
                  </div>
                  <strong style={{ fontSize: '16px', color: '#0f172a' }}>{car.rating ? car.rating.toFixed(1) : '5.0'}</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                </div>
              </div>

              {/* Reviews List */}
              {reviewsLoading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto' }}></div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>No reviews yet for this vehicle. Be the first to share your rental experience!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                  {reviews.map((rev) => {
                    const reviewerName = rev.user?.name || 'Verified Customer';
                    const initials = reviewerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU';
                    return (
                      <div
                        key={rev._id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '16px 20px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: '#f96d00',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '12px'
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{reviewerName}</strong>
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
                              <FaStar key={st} size={13} color={st <= rev.rating ? '#f59e0b' : '#cbd5e1'} />
                            ))}
                          </div>
                        </div>

                        {rev.title && (
                          <h4 style={{ margin: '6px 0 4px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                            &ldquo;{rev.title}&rdquo;
                          </h4>
                        )}
                        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                          {rev.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Submit a Review Form */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Write a Rental Review
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>
                  Have you experienced this {car.brand} {car.model}? Share your feedback on comfort, performance, and booking ease.
                </p>

                {reviewMsg.text && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      marginBottom: '14px',
                      background: reviewMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                      border: reviewMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                      color: reviewMsg.type === 'success' ? '#065f46' : '#991b1b'
                    }}
                  >
                    {reviewMsg.type === 'success' ? '✓ ' : '✕ '}{reviewMsg.text}
                  </div>
                )}

                {isAuthenticated ? (
                  <form onSubmit={handleReviewSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Your Star Rating *
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <FaStar
                              size={22}
                              color={star <= reviewRating ? '#f59e0b' : '#cbd5e1'}
                              style={{ transition: 'color 0.15s ease' }}
                            />
                          </button>
                        ))}
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginLeft: '6px' }}>
                          {reviewRating} of 5 Stars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Review Headline (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Smooth highway drive and great fuel efficiency!"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Your Detailed Feedback *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe vehicle condition, pickup experience, driving dynamics, cleanliness..."
                        value={reviewComment}
                        onChange={(e) => {
                          setReviewComment(e.target.value);
                          if (reviewErrors.comment) setReviewErrors(prev => ({ ...prev, comment: '' }));
                        }}
                        className={reviewErrors.comment ? 'input-error' : ''}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: reviewErrors.comment ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit'
                        }}
                      />
                      {reviewErrors.comment && <span className="field-error-text">{reviewErrors.comment}</span>}
                    </div>

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      style={{
                        alignSelf: 'flex-start',
                        background: '#f96d00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Post Customer Review'}
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Sign in to your account to post your review and rating for this car.
                    </span>
                    <Link
                      to="/login"
                      style={{
                        background: '#0f172a',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      Sign In to Review
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="booking-sidebar">
            <h3>Rental Price</h3>
            <div className="price-display">
              {settings.currencySymbol || '₹'}{car.pricePerDay} <span>/ day</span>
            </div>

            <div className="sidebar-booking-form-wrap" style={{ marginTop: '20px' }}>
              <div className="sidebar-form-header">
                <FaWhatsapp style={{ color: '#25D366', fontSize: '20px' }} />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Book via WhatsApp</h4>
              </div>

              {userPendingBooking && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  margin: '10px 0',
                  fontSize: '13px',
                  color: '#92400e'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>
                    <FiClock size={16} style={{ color: '#f59e0b' }} />
                    <span>Booking Pending Admin Approval</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', lineHeight: 1.4 }}>
                    You already have a pending booking request for this vehicle (Ref: <strong>#{userPendingBooking.bookingReference || userPendingBooking._id?.slice(-6)}</strong> for <strong>{formatDate(userPendingBooking.pickupDate)}</strong>).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const phone = settings?.contactPhone || settings?.whatsappNumber || '919876543210';
                      const cleanPhone = phone.replace(/[^0-9]/g, '');
                      const msg = `*Booking Request Follow-up - CarBook*\n` +
                        `• *Booking Ref:* ${userPendingBooking.bookingReference || userPendingBooking._id?.slice(-6)}\n` +
                        `• *Car:* ${car.name}\n` +
                        `• *Date:* ${formatDate(userPendingBooking.pickupDate)}\n` +
                        `• *Customer:* ${user?.name || ''} (${user?.phone || ''})\n` +
                        `• *Status:* Pending Admin Approval\n\n` +
                        `Hello Admin, I have submitted this booking request. Please verify and confirm my reservation.`;
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#25D366',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <FaWhatsapp size={14} /> Send WhatsApp Message
                  </button>
                </div>
              )}

              {bookingMsg.text && (
                <div 
                  className={`auth-${bookingMsg.type === 'success' ? 'success' : 'error'}`}
                  style={{ margin: '10px 0', fontSize: '13px' }}
                >
                  {bookingMsg.text}
                </div>
              )}

              {bookingMsg.type === 'success' && bookingMsg.waUrl && (
                <a
                  href={bookingMsg.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-direct"
                  style={{ display: 'inline-flex', marginBottom: '12px' }}
                >
                  <FaWhatsapp size={16} /> Open WhatsApp Chat
                </a>
              )}

              <form onSubmit={handleBookSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Drive Selection Toggle */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Drive Option: Do you need a driver?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setWithDriver(false)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: !withDriver ? '2px solid #f96d00' : '1px solid #cbd5e1',
                        background: !withDriver ? '#fff7ed' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FaCar style={{ color: '#f96d00' }} /> Without Driver
                        </span>
                        {!withDriver && (
                          <span style={{ fontSize: '9px', fontWeight: 800, background: '#f96d00', color: '#fff', padding: '1px 5px', borderRadius: '6px' }}>✓</span>
                        )}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>Self-Drive</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithDriver(true)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: withDriver ? '2px solid #7e22ce' : '1px solid #cbd5e1',
                        background: withDriver ? '#faf5ff' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#581c87', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FaUserTie style={{ color: '#7e22ce' }} /> With Driver
                        </span>
                        {withDriver && (
                          <span style={{ fontSize: '9px', fontWeight: 800, background: '#7e22ce', color: '#fff', padding: '1px 5px', borderRadius: '6px' }}>✓</span>
                        )}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#7e22ce', marginTop: '2px' }}>+{settings.currencySymbol || '₹'}{settings.driverDailyFee}/day</div>
                    </button>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#666' }}>Your Name *</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={custName}
                    className={bookErrors.custName ? 'input-error' : ''}
                    onChange={(e) => {
                      setCustName(e.target.value);
                      if (bookErrors.custName) setBookErrors(prev => ({ ...prev, custName: '' }));
                    }}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                  {bookErrors.custName && <span className="field-error-text">{bookErrors.custName}</span>}
                </div>

                <div className="auth-input-group">
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#666' }}>WhatsApp Phone *</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={custPhone}
                    className={bookErrors.custPhone ? 'input-error' : ''}
                    onChange={(e) => {
                      setCustPhone(e.target.value);
                      if (bookErrors.custPhone) setBookErrors(prev => ({ ...prev, custPhone: '' }));
                    }}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                  {bookErrors.custPhone && <span className="field-error-text">{bookErrors.custPhone}</span>}
                </div>

                <div className="auth-input-group" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#666', margin: 0 }}>Ride Date (1 Day) *</label>
                    {pickupDate && (
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                        📅 {formatDate(pickupDate)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={pickupDate}
                    min={today}
                    className={bookErrors.pickupDate ? 'input-error' : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPickupDate(val);
                      setDropoffDate(val);
                      if (bookErrors.pickupDate) setBookErrors(prev => ({ ...prev, pickupDate: '', dropoffDate: '' }));
                    }}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px', fontSize: '10.5px', color: '#64748b' }}>
                    <span>Format: <strong style={{ color: '#0284c7' }}>DD-MM-YYYY</strong></span>
                    {pickupDate && <span>Selected: <strong style={{ color: '#0f172a' }}>{formatDate(pickupDate)}</strong></span>}
                  </div>
                  {bookErrors.pickupDate && <span className="field-error-text">{bookErrors.pickupDate}</span>}
                </div>

                <div className="auth-input-group">
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#666' }}>Pick-up Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Airport, City Center"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>

                {pickupDate && dropoffDate && (
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                    {quoteLoading ? (
                      <div>Calculating total...</div>
                    ) : quote ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Rental ({quote.days} days)</span>
                          <span>{settings.currencySymbol || '₹'}{quote.rentalSubtotal ?? quote.subtotal ?? (quote.days * (car.pricePerDay || 0))}</span>
                        </div>
                        {quote.withDriver && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7e22ce' }}>
                            <span>Driver Fee</span>
                            <span>+{settings.currencySymbol || '₹'}{quote.driverFeeTotal ?? quote.driverFee ?? 0}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '4px', fontWeight: 700 }}>
                          <span>Estimated Total:</span>
                          <span style={{ color: 'var(--primary)' }}>
                            {settings.currencySymbol || '₹'}{(quote.totalPayable ?? quote.totalPrice ?? ((quote.subtotal || 0) + (quote.driverFee || 0) + (quote.taxAmount || 0)))?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {isAvailable ? (
                  userPendingBooking ? (
                    <>
                      <button
                        type="button"
                        className="btn-whatsapp-submit"
                        disabled={true}
                        style={{
                          marginTop: '6px',
                          padding: '12px',
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          cursor: 'not-allowed',
                          fontWeight: 700
                        }}
                      >
                        <FiClock size={16} /> Booking Currently Pending Approval
                      </button>
                      <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#b45309', textAlign: 'center', lineHeight: 1.4 }}>
                        ⏳ You already requested a booking for this car. Please send the WhatsApp message or wait for Admin confirmation.
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        type="submit"
                        className="btn-whatsapp-submit"
                        disabled={bookingLoading}
                        style={{ marginTop: '6px', padding: '12px' }}
                      >
                        {bookingLoading ? <div className="auth-btn-spinner"></div> : <><FaWhatsapp size={18} /> Book via WhatsApp</>}
                      </button>
                      <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                        ℹ️ Reservation will be saved as <strong>Pending</strong> until Admin verifies your WhatsApp message and confirms the car.
                      </p>
                    </>
                  )
                ) : (
                  <a
                    href={getWhatsAppLink(`Hi ${settings?.businessName || 'CarBook'}! I would like to inquire when the ${car.name} (${car.brand} ${car.model}) will become available.`, settings.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ justifyContent: 'center', padding: '12px', textAlign: 'center', color: '#666' }}
                  >
                    <FaWhatsapp size={16} /> Inquire Availability
                  </a>
                )}
              </form>
            </div>

            <Link
              to={isAuthenticated ? '/dashboard' : '/'}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px', marginTop: '14px' }}
            >
              <FiArrowLeft /> {isAuthenticated ? 'Back to Fleet' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>

      {/* Inline Auth Modal for Frictionless Booking */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        onGuestContinue={handleGuestContinue}
        message="Sign in or register to link this vehicle reservation directly to your account"
      />
    </div>
  );
}
