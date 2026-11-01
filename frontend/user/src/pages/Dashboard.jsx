import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiCalendar, FiMapPin, FiClock, FiX, FiCheckCircle,
  FiAlertCircle, FiXCircle, FiSearch, FiEye, FiEyeOff, FiLock, FiKey, FiPhone, FiMail, FiUser, FiTruck,
  FiFileText, FiShoppingBag, FiSave, FiPrinter, FiShield, FiDisc,
  FiArrowRight, FiCheck, FiChevronRight, FiGrid
} from 'react-icons/fi';
import { FaCar, FaWhatsapp, FaUserTie, FaStar } from 'react-icons/fa';
import {
  getCars, createBooking, getMyBookings, cancelBooking, getWhatsAppLink,
  getBookingQuote, updateProfile, changePassword, createReview, createTripReview, getMe
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import VehicleDetailModal from '../components/VehicleDetailModal';
import RentalInvoiceModal from '../components/RentalInvoiceModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import DateInput from '../components/DateInput';
import { formatDate } from '../utils/format';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const normalizedRaw = rawTab === 'rentals' ? 'bookings' : rawTab;
  const activeTab = (!normalizedRaw || normalizedRaw === 'overview' || normalizedRaw === 'tyre_orders') ? 'overview' : normalizedRaw;
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available' | 'unavailable'
  const [searchQuery, setSearchQuery] = useState('');
  const [carPage, setCarPage] = useState(1);
  const [carPageSize, setCarPageSize] = useState(6);
  const [rentalPage, setRentalPage] = useState(1);
  const [rentalPageSize, setRentalPageSize] = useState(6);

  const handleTabChange = (tabName) => {
    const resolved = tabName === 'rentals' ? 'bookings' : tabName;
    setSearchParams({ tab: resolved });
  };

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCar, setDetailCar] = useState(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null);
  const [bookingFilter, setBookingFilter] = useState('all');

  // Customer Review Modal State (Supports Vehicle + Driver for chauffeured trips)
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDriverRating, setReviewDriverRating] = useState(5);
  const [reviewDriverComment, setReviewDriverComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });

  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [withDriver, setWithDriver] = useState(false);
  const [rentalPeriodType, setRentalPeriodType] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
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
  const [bookingToast, setBookingToast] = useState(null);

  // Auto-dismiss reservation toast after 7 seconds
  useEffect(() => {
    if (!bookingToast) return;
    const timer = setTimeout(() => {
      setBookingToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [bookingToast]);

  // Live itemized server quote
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErrors, setProfileErrors] = useState({});

  // Change Password State
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [modalBookErrors, setModalBookErrors] = useState({});
  const [reviewErrors, setReviewErrors] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
    isAlert: false,
    loading: false,
    onConfirm: () => { }
  });

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => {
      fetchSilently();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSilently = async () => {
    try {
      const [carsRes, bookingsRes] = await Promise.all([
        getCars({ limit: 100 }).catch(err => {
          console.error('Failed to load cars silently:', err);
          return null;
        }),
        getMyBookings().catch(err => {
          console.error('Failed to load user bookings silently:', err);
          return null;
        })
      ]);
      if (carsRes?.data?.cars) setCars(carsRes.data.cars);
      if (bookingsRes?.data) setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Silent sync error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      const addr = user.addresses?.[0];
      const isDummySF = addr?.street?.includes('Mission Bay') || addr?.city === 'San Francisco';
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        street: isDummySF ? '' : (addr?.street || ''),
        city: isDummySF ? '' : (addr?.city || ''),
        state: '',
        zip: ''
      });
    }
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [carsRes, bookingsRes] = await Promise.all([
        getCars({ limit: 100 }).catch(err => {
          console.error('Failed to load cars:', err);
          return { data: { cars: [] } };
        }),
        getMyBookings().catch(err => {
          console.error('Failed to load user bookings:', err);
          return { data: [] };
        })
      ]);
      setCars(carsRes.data?.cars || []);
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (car) => {
    setDetailCar(car);
    setShowDetailModal(true);
  };

  const handleOpenReview = (booking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewDriverRating(5);
    setReviewDriverComment('');
    setReviewErrors({});
    setReviewMsg({ type: '', text: '' });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking || !reviewBooking.car) return;
    const errs = {};
    if (!reviewComment.trim()) {
      errs.comment = 'Please enter your vehicle feedback';
    }
    const hasDriver = Boolean(reviewBooking.withDriver || reviewBooking.driver);
    if (hasDriver && !reviewDriverComment.trim()) {
      errs.driverComment = 'Please enter your driver feedback';
    }
    setReviewErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setReviewLoading(true);
      setReviewMsg({ type: '', text: '' });

      const carId = reviewBooking.car._id || reviewBooking.car;
      const driverId = reviewBooking.driver?._id || (typeof reviewBooking.driver === 'string' ? reviewBooking.driver : null);

      await createTripReview({
        bookingId: reviewBooking._id,
        carId,
        carRating: reviewRating,
        carTitle: reviewTitle.trim(),
        carComment: reviewComment.trim(),
        driverId: hasDriver ? driverId : undefined,
        driverRating: hasDriver ? reviewDriverRating : undefined,
        driverTitle: 'Driver Service Review',
        driverComment: hasDriver ? reviewDriverComment.trim() : undefined
      });

      setReviewMsg({
        type: 'success',
        text: hasDriver
          ? 'Thank you! Your verified reviews for vehicle & driver have been published.'
          : 'Thank you! Your verified rental review has been published.'
      });
      setTimeout(() => {
        setReviewBooking(null);
        setReviewMsg({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit review' });
    } finally {
      setReviewLoading(false);
    }
  };

  const openBookingModal = async (car) => {
    setSelectedCar(car);
    setWithDriver(false);
    setRentalPeriodType('daily');

    // Default single rental date to tomorrow for daily plan
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startStr = tomorrow.toISOString().slice(0, 10);
    setPickupDate(startStr);
    setDropoffDate(startStr);

    // Do NOT pre-fill dummy/foreign hub locations
    setPickupLocation('');
    setDropoffLocation('');

    // Pre-fill from current profile / user state
    let currentName = profileData.name || user?.name || '';
    let currentPhone = profileData.phone || user?.phone || '';
    let currentEmail = user?.email || '';

    setCustName(currentName);
    setCustPhone(currentPhone);
    setCustEmail(currentEmail);
    setBookingNotes('');
    setBookingMsg({ type: '', text: '', waUrl: '' });
    setModalBookErrors({});
    setQuote(null);
    setShowModal(true);

    // Auto-fetch fresh profile from profile endpoint to guarantee latest WhatsApp phone is auto-filled
    try {
      const meRes = await getMe();
      if (meRes?.data) {
        if (meRes.data.phone) setCustPhone(meRes.data.phone);
        if (meRes.data.name) setCustName(meRes.data.name);
        if (meRes.data.email) setCustEmail(meRes.data.email);
        if (typeof updateUser === 'function') updateUser(meRes.data);
      }
    } catch (e) {
      console.error('Error fetching fresh user profile for booking:', e);
    }
  };

  const handleRentalPeriodTypeChange = (type) => {
    setRentalPeriodType(type);
    if (type === 'weekly' || type === 'monthly') {
      setWithDriver(false);
    }
    const start = pickupDate ? new Date(pickupDate) : new Date();
    if (!isNaN(start.getTime())) {
      const end = new Date(start);
      if (type === 'weekly') {
        end.setDate(end.getDate() + 7);
        setDropoffDate(end.toISOString().slice(0, 10));
      } else if (type === 'monthly') {
        end.setDate(end.getDate() + 30);
        setDropoffDate(end.toISOString().slice(0, 10));
      } else {
        // Daily is a single 1-day rental: dropoffDate equals pickupDate
        setDropoffDate(start.toISOString().slice(0, 10));
      }
    }
  };

  const handleDailySingleDateChange = (val) => {
    setPickupDate(val);
    setDropoffDate(val);
    if (modalBookErrors.pickupDate || modalBookErrors.dropoffDate) {
      setModalBookErrors(prev => ({ ...prev, pickupDate: '', dropoffDate: '' }));
    }
  };

  const handlePickupDateChange = (val) => {
    setPickupDate(val);
    if (val) {
      const start = new Date(val);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        if (rentalPeriodType === 'weekly') {
          end.setDate(end.getDate() + 7);
          setDropoffDate(end.toISOString().slice(0, 10));
        } else if (rentalPeriodType === 'monthly') {
          end.setDate(end.getDate() + 30);
          setDropoffDate(end.toISOString().slice(0, 10));
        } else {
          setDropoffDate(val);
        }
      }
    }
    if (modalBookErrors.pickupDate) {
      setModalBookErrors(prev => ({ ...prev, pickupDate: '' }));
    }
  };

  const handleDropoffDateChange = (val) => {
    setDropoffDate(val);
    if (modalBookErrors.dropoffDate) {
      setModalBookErrors(prev => ({ ...prev, dropoffDate: '' }));
    }
  };

  // Recalculate quote when dates, duration plan, or driver option change
  useEffect(() => {
    if (!selectedCar || !pickupDate || !dropoffDate) {
      setQuote(null);
      return;
    }

    let isMounted = true;
    setQuoteLoading(true);

    getBookingQuote({
      carId: selectedCar._id,
      pickupDate,
      dropoffDate,
      withDriver,
      rentalPeriodType
    })
      .then((res) => {
        if (isMounted) setQuote(res.data);
      })
      .catch((err) => {
        console.error('Failed to get quote:', err);
      })
      .finally(() => {
        if (isMounted) setQuoteLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedCar, pickupDate, dropoffDate, withDriver, rentalPeriodType]);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    if (showModal || showDetailModal || selectedInvoiceBooking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showDetailModal, selectedInvoiceBooking]);

  const handleBook = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!custName.trim()) {
      errs.custName = 'Please enter your full name';
    }
    if (!custPhone.trim()) {
      errs.custPhone = 'WhatsApp mobile number is compulsory.';
    } else if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(custPhone.trim().replace(/[\s\-\(\)]/g, ''))) {
      errs.custPhone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }
    if (!pickupDate) {
      errs.pickupDate = rentalPeriodType === 'daily' ? 'Please select rental date' : 'Please select pick-up start date';
    }
    if (rentalPeriodType !== 'daily') {
      if (!dropoffDate) {
        errs.dropoffDate = 'Please select return end date';
      } else if (new Date(dropoffDate) < new Date(pickupDate)) {
        errs.dropoffDate = 'Return date cannot precede pick-up date';
      }
    }
    setModalBookErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBookingLoading(true);
    setBookingMsg({ type: '', text: '', waUrl: '' });

    try {
      const brand = settings?.businessName || 'CarBook';
      const pickLoc = pickupLocation.trim() || 'Main Hub';
      const dropLoc = dropoffLocation.trim() || pickLoc;
      const customerContact = custPhone.trim() || user?.phone || 'Not provided';
      const customerName = custName.trim() || user?.name || 'Customer';
      const customerEmail = custEmail.trim() || user?.email || 'Not provided';

      const days = quote?.days || Math.max(1, Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)));

      // 1. Create booking in DB with pending status
      const res = await createBooking({
        carId: selectedCar._id,
        pickupDate,
        dropoffDate,
        pickupLocation: pickLoc,
        dropoffLocation: dropLoc,
        rentalType: withDriver ? 'with_driver' : 'self_drive',
        rentalDurationType: rentalPeriodType,
        withDriver,
        bookingSource: 'whatsapp',
        paymentMethod: 'whatsapp',
        notes: `[Plan: ${rentalPeriodType.toUpperCase()} - ${days} Days] Name: ${customerName} | Phone: ${customerContact} | Email: ${customerEmail}${bookingNotes ? ` | Note: ${bookingNotes}` : ''}`
      });

      const confirmedBooking = res.data;
      const totalAmount = quote?.totalPayable || confirmedBooking.totalPrice;

      // 2. Prepare WhatsApp message
      const isDaily = rentalPeriodType === 'daily';
      const planLabel = rentalPeriodType === 'monthly' ? '🗓️ Monthly Rental' : rentalPeriodType === 'weekly' ? '📆 Weekly Rental' : '📅 Daily Rental (1 Day)';

      let waMessage = '';
      if (!isDaily) {
        waMessage = `*${brand.toUpperCase()} - ${rentalPeriodType.toUpperCase()} RENTAL REQUEST*
---------------------------
*Request Ref:* ${confirmedBooking.bookingReference || confirmedBooking._id}
*Status:* ⏳ Pending Admin Review
*Plan:* ${planLabel}
*Vehicle:* ${selectedCar.name} (${selectedCar.brand} ${selectedCar.model} ${selectedCar.year})
*Rental Type:* Self-Drive Rental

*Requested Schedule:*
- Pick-up Start Date: ${formatDate(pickupDate)}
- Return End Date: ${formatDate(dropoffDate)} (${days} Days)

*Customer Details:*
- Name: ${customerName}
- Phone: ${customerContact}
- Email: ${customerEmail}
${bookingNotes ? `- Notes: ${bookingNotes}\n` : ''}---------------------------
Hello Admin, I have submitted a ${rentalPeriodType} rental request for this vehicle. Please let me know vehicle availability and your discounted package pricing. Thank you!`;
      } else {
        waMessage = `*${brand.toUpperCase()} - RESERVATION REQUEST*
---------------------------
*Booking Ref:* ${confirmedBooking.bookingReference || confirmedBooking._id}
*Status:* ⏳ Pending Admin Approval
*Vehicle:* ${selectedCar.name} (${selectedCar.brand} ${selectedCar.model} ${selectedCar.year})
*Rental Plan:* ${planLabel}
*Drive Option:* ${withDriver ? 'With Driver (Professional Driver Service)' : 'Without Driver (Self-Drive Rental)'}

*Schedule:*
- Rental Date (1 Day): ${formatDate(pickupDate)}
- Pick-up Hub: ${pickLoc}
- Return Hub: ${dropLoc}

*Estimated Total:* ${settings.currencySymbol || '₹'}${totalAmount} ${withDriver ? `(Includes driver fee)` : '(No driver fee)'}

*Customer:*
- Name: ${customerName}
- Phone: ${customerContact}
- Email: ${customerEmail}
${bookingNotes ? `- Notes: ${bookingNotes}\n` : ''}---------------------------
Hello Admin, I have submitted this pending booking request. Please verify and approve my reservation. Thank you!`;
      }

      const waUrl = getWhatsAppLink(waMessage, settings.whatsappNumber);

      // 3. Open WhatsApp chat
      window.open(waUrl, '_blank');

      // 4. Close the reservation modal
      setShowModal(false);
      setSelectedCar(null);

      // 5. Update UI with confirmation toast
      setBookingToast({
        text: `⏳ Booking ${confirmedBooking.bookingReference || ''} saved as Pending! Please send the WhatsApp message so Admin can verify & confirm.`,
        waUrl
      });

      fetchInitialData();
    } catch (err) {
      console.error('Booking failed:', err);
      setBookingMsg({
        type: 'error',
        text: err.response?.data?.message || 'Booking failed. This car may be booked or under maintenance for the selected dates.'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancel = (bookingId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Reservation?',
      message: 'Are you sure you want to cancel this booking? This will release the vehicle reservation.',
      confirmText: 'Yes, Cancel Booking',
      cancelText: 'Keep Booking',
      variant: 'danger',
      isAlert: false,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await cancelBooking(bookingId);
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
          fetchInitialData();
        } catch (err) {
          setConfirmModal({
            isOpen: true,
            title: 'Cancellation Failed',
            message: err.response?.data?.message || 'Failed to cancel booking. Please try again.',
            confirmText: 'Dismiss',
            variant: 'danger',
            isAlert: true,
            loading: false,
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileData.name.trim()) {
      errs.name = 'Full name is required';
    }
    if (!profileData.phone.trim()) {
      errs.phone = 'Mobile number is compulsory.';
    } else if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(profileData.phone.trim().replace(/[\s\-\(\)]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        addresses: [
          {
            street: profileData.street,
            city: profileData.city,
            state: profileData.state,
            zip: profileData.zip,
            isDefault: true
          }
        ]
      });
      if (res?.data && typeof updateUser === 'function') {
        updateUser(res.data);
      }
      setProfileMsg('Profile and address saved successfully!');
      setTimeout(() => setProfileMsg(''), 4000);
    } catch (err) {
      setConfirmModal({
        isOpen: true,
        title: 'Profile Update Error',
        message: err.response?.data?.message || 'Failed to update profile. Please try again.',
        confirmText: 'Dismiss',
        variant: 'danger',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdForm.newPassword) {
      setPwdError('Please enter a new password.');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('New passwords do not match. Please re-enter.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setPwdSuccess(res.data?.message || 'Password updated successfully!');
      setPwdForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const getBookingStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      confirmed: '#10B981',
      active: '#3B82F6',
      cancelled: '#EF4444',
      completed: '#6366F1'
    };
    return colors[status] || '#64748B';
  };

  const today = new Date().toISOString().split('T')[0];
  const sym = settings.currencySymbol || '₹';
  const userPendingForSelectedCar = selectedCar
    ? bookings.find(b => (b.car?._id === selectedCar._id || b.car === selectedCar._id) && b.status === 'pending')
    : null;

  return (
    <div className="dashboard-page" style={{ width: '100%', padding: '0' }}>
      <div className="portal-fluid-container" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <div className="spinner-text">Syncing {settings?.businessName || 'CarBook'} portal &amp; reservations...</div>
          </div>
        ) : activeTab === 'overview' ? (
          (() => {
            const activeTrips = bookings.filter(b => b.status === 'confirmed' || b.status === 'ongoing' || b.status === 'in_progress');
            const pendingTrips = bookings.filter(b => b.status === 'pending');
            const completedTrips = bookings.filter(b => b.status === 'completed');
            const spotlightBooking = bookings.find(b => ['ongoing', 'confirmed', 'pending'].includes(b.status));
            const availableCars = cars.filter(c => c.status === 'available' && !c.hasOngoingTrip && c.status !== 'rented');
            const recommendedCars = availableCars.slice(0, 3);
            const recentRentals = bookings.slice(0, 3);
            const conciergeWhatsAppUrl = getWhatsAppLink(
              settings?.whatsappNumber,
              `Hello ${settings?.businessName || 'CarBook'} Team, I would like to inquire about car rentals.`
            );

            return (
              <div className="user-dash-wrapper">
                {/* Hero Welcome Banner */}
                <div className="user-dash-hero">
                  <div className="user-dash-hero-left">
                    <div className="user-dash-badge">
                      <span style={{ fontSize: '14px' }}>✨</span> Verified Customer Portal
                    </div>
                    <h2 className="user-dash-hero-title">
                      Welcome back, {user?.name || 'Valued Member'}! 👋
                    </h2>
                    <p className="user-dash-hero-desc">
                      Manage your active road trips, review vehicle invoices, or pick your next ride from our premium fleet with instant WhatsApp dispatch.
                    </p>
                    <div className="user-dash-hero-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleTabChange('cars')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.4rem' }}
                      >
                        <FaCar /> Browse Available Cars <FiArrowRight />
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleTabChange('bookings')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '0.75rem 1.4rem'
                        }}
                      >
                        <FiCalendar /> My Rentals ({bookings.length})
                      </button>
                      <a
                        href={conciergeWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '0.75rem 1.4rem',
                          fontWeight: 600
                        }}
                      >
                        <FaWhatsapp size={17} /> WhatsApp Concierge
                      </a>
                    </div>
                  </div>

                  <div className="user-dash-hero-right">
                    <div className="user-dash-profile-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.1rem'
                        }}>
                          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CB'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                            {user?.name || 'Customer Account'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {user?.phone || user?.email || 'Registered Customer'}
                          </div>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Profile &amp; Addresses</span>
                        <button
                          type="button"
                          onClick={() => handleTabChange('profile')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 0
                          }}
                        >
                          Edit Profile <FiChevronRight />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 KPI Metric Cards */}
                <div className="user-dash-stats-grid">
                  <div className="user-dash-stat-card" onClick={() => handleTabChange('bookings')}>
                    <div className="user-dash-stat-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <FaCar />
                    </div>
                    <div className="user-dash-stat-info">
                      <div className="user-dash-stat-value">{activeTrips.length}</div>
                      <div className="user-dash-stat-label">Active Trips</div>
                      <div className="user-dash-stat-subtext">Confirmed or in progress</div>
                    </div>
                  </div>

                  <div className="user-dash-stat-card" onClick={() => handleTabChange('bookings')}>
                    <div className="user-dash-stat-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                      <FiClock />
                    </div>
                    <div className="user-dash-stat-info">
                      <div className="user-dash-stat-value">{pendingTrips.length}</div>
                      <div className="user-dash-stat-label">Pending Requests</div>
                      <div className="user-dash-stat-subtext">Awaiting admin review</div>
                    </div>
                  </div>

                  <div className="user-dash-stat-card" onClick={() => handleTabChange('bookings')}>
                    <div className="user-dash-stat-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <FiCheckCircle />
                    </div>
                    <div className="user-dash-stat-info">
                      <div className="user-dash-stat-value">{completedTrips.length}</div>
                      <div className="user-dash-stat-label">Completed Trips</div>
                      <div className="user-dash-stat-subtext">Past successful journeys</div>
                    </div>
                  </div>

                  <div className="user-dash-stat-card" onClick={() => handleTabChange('bookings')}>
                    <div className="user-dash-stat-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                      <FiCalendar />
                    </div>
                    <div className="user-dash-stat-info">
                      <div className="user-dash-stat-value">{bookings.length}</div>
                      <div className="user-dash-stat-label">Total Reservations</div>
                      <div className="user-dash-stat-subtext">Lifetime carbook rentals</div>
                    </div>
                  </div>
                </div>

                {/* Spotlight Card: Ongoing or Pending Trip vs Quick Start */}
                {spotlightBooking ? (
                  <div
                    className="user-dash-spotlight-card"
                    style={{
                      borderLeftColor: spotlightBooking.status === 'pending' ? '#f59e0b' : '#2563eb'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px' }}>
                      <img
                        src={spotlightBooking.car?.images?.[0] || '/images/car-1.jpg'}
                        alt={spotlightBooking.car?.name || 'Vehicle'}
                        style={{
                          width: '120px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0'
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: spotlightBooking.status === 'pending' ? '#fef3c7' : '#dbeafe',
                            color: spotlightBooking.status === 'pending' ? '#b45309' : '#1d4ed8'
                          }}>
                            {spotlightBooking.status === 'pending' ? 'Pending Approval' : 'Active / Confirmed Trip'}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Plan: {spotlightBooking.rentalDurationType ? (spotlightBooking.rentalDurationType.charAt(0).toUpperCase() + spotlightBooking.rentalDurationType.slice(1)) : 'Daily'}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                          {spotlightBooking.car?.brand} {spotlightBooking.car?.name}
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>📅 Pick-up: <strong>{formatDate(spotlightBooking.pickupDate || spotlightBooking.startDate)}</strong></span>
                          <span>➔</span>
                          <span>Drop-off: <strong>{formatDate(spotlightBooking.dropoffDate || spotlightBooking.returnDate || spotlightBooking.endDate)}</strong></span>
                          <span>•</span>
                          <span>{spotlightBooking.withDriver ? 'Chauffeur Driven' : 'Self-Drive'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="user-dash-btn-secondary"
                        onClick={() => handleTabChange('bookings')}
                      >
                        <FiFileText size={15} /> View Rental Details
                      </button>
                      <a
                        href={getWhatsAppLink(
                          settings?.whatsappNumber,
                          `Hi, I have a question regarding my reservation #${(spotlightBooking.bookingCode || spotlightBooking._id).slice(-8).toUpperCase()} for ${spotlightBooking.car?.name}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="user-dash-btn-whatsapp"
                      >
                        <FaWhatsapp size={16} /> WhatsApp Support
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                        Ready for your next journey?
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                        Choose from our verified fleet with zero deposit hassles, clean sanitized interiors, and instant delivery.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="user-dash-btn-primary"
                      onClick={() => handleTabChange('cars')}
                    >
                      Explore Vehicle Fleet <FiArrowRight />
                    </button>
                  </div>
                )}

                {/* Recommended Vehicles Section */}
                <div>
                  <div className="user-dash-section-header">
                    <h3 className="user-dash-section-title">
                      <FaCar style={{ color: '#2563eb' }} /> Recommended Vehicles
                    </h3>
                    <button
                      type="button"
                      className="user-dash-section-link"
                      onClick={() => handleTabChange('cars')}
                    >
                      View Full Fleet ({cars.length}) <FiArrowRight />
                    </button>
                  </div>

                  <div className="dash-cars-grid">
                    {recommendedCars.map(car => {
                      const image = car.images?.[0] || '/images/car-1.jpg';
                      return (
                        <div key={car._id} className="dash-car-card">
                          <div className="dash-car-card-top">
                            <div className="dash-car-card-title-box">
                              <h3
                                className="dash-car-title"
                                onClick={() => openDetailModal(car)}
                                title={`View ${car.name} specifications`}
                              >
                                {car.name}
                              </h3>
                            </div>
                            <span className="dash-car-type-badge">{car.vehicleType || 'Sedan'}</span>
                          </div>

                          <div className="dash-car-subhead-row">
                            <div className="dash-car-subhead">
                              <span>{car.brand}</span>
                              <span>•</span>
                              <span>{car.year || 2024}</span>
                              <span style={{ margin: '0 4px', color: '#cbd5e1' }}>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 700 }}>
                                <FaStar size={11} /> {car.rating ? Number(car.rating).toFixed(1) : '5.0'}
                              </span>
                            </div>
                            <span className="dash-car-status-pill available">
                              <span className="status-indicator-dot available"></span>
                              Available
                            </span>
                          </div>

                          <div
                            className="dash-car-img-wrapper"
                            onClick={() => openDetailModal(car)}
                            title="Click to view detailed vehicle specifications & customer reviews"
                            style={{ cursor: 'pointer' }}
                          >
                            <img
                              src={image}
                              alt={car.name}
                              className="dash-car-img-elem"
                              loading="lazy"
                              onError={(e) => { e.target.onerror = null; e.target.src = '/images/car-1.jpg'; }}
                            />
                            <div className="dash-img-hover-overlay">
                              <span className="dash-hover-pill"><FiEye /> Specs &amp; Reviews</span>
                            </div>
                          </div>

                          <div className="dash-car-specs-grid">
                            <div className="dash-spec-item" title="Seating Capacity">
                              <span>{car.seats || 5} Seats</span>
                            </div>
                            <div className="dash-spec-item" title="Transmission">
                              <span>{car.transmission || 'Automatic'}</span>
                            </div>
                            <div className="dash-spec-item" title="Fuel Type">
                              <span>{car.fuelType || 'Petrol'}</span>
                            </div>
                            <div className="dash-spec-item" title="Mileage Policy">
                              <span>{car.mileage ? car.mileage.replace(/mi/gi, 'km') : 'Unlimited'}</span>
                            </div>
                          </div>

                          <div className="dash-car-card-bottom">
                            <div className="dash-car-price-row">
                              <div className="dash-car-price-box">
                                <span className="dash-car-price-num">{sym}{car.pricePerDay || 0}</span>
                                <span className="dash-car-price-unit">/day</span>
                              </div>
                              <span className="dash-car-rate-tag">
                                Verified Fleet
                              </span>
                            </div>
                            <div className="dash-car-card-actions">
                              <button
                                type="button"
                                className="dash-view-specs-btn"
                                onClick={() => openDetailModal(car)}
                                title="View Full Specifications & Customer Reviews"
                              >
                                <FiEye size={13} /> Specs &amp; Reviews
                              </button>
                              <button
                                type="button"
                                className="dash-whatsapp-book-btn"
                                onClick={() => openBookingModal(car)}
                                title="Book via WhatsApp or Online Reservation"
                              >
                                <FaWhatsapp size={15} /> Book Now
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Assurance Perks Grid */}
                <div className="user-dash-perks-grid">
                  <div className="user-dash-perk-card">
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0
                    }}>
                      <FiShield />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        100% Insured Fleet
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                        Comprehensive damage coverage with 24/7 emergency roadside towing &amp; assistance across all routes.
                      </p>
                    </div>
                  </div>

                  <div className="user-dash-perk-card">
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#f0fdf4',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0
                    }}>
                      <FaWhatsapp />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Instant WhatsApp Dispatch
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                        Quick document approval and seamless delivery coordination directly via WhatsApp support.
                      </p>
                    </div>
                  </div>

                  <div className="user-dash-perk-card">
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#faf5ff',
                      color: '#9333ea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0
                    }}>
                      <FaUserTie />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Self-Drive &amp; Chauffeur
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                        Choose between personal self-drive freedom or verified professional chauffeurs for city and outstation trips.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Section if bookings exist */}
                {recentRentals.length > 0 && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px 24px' }}>
                    <div className="user-dash-section-header" style={{ marginBottom: '14px' }}>
                      <h3 className="user-dash-section-title" style={{ fontSize: '1.15rem' }}>
                        <FiClock style={{ color: '#2563eb' }} /> Recent Rental Activity
                      </h3>
                      <button
                        type="button"
                        className="user-dash-section-link"
                        onClick={() => handleTabChange('bookings')}
                      >
                        View All ({bookings.length}) <FiArrowRight />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {recentRentals.map(b => (
                        <div
                          key={b._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #edf2f7',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🚗</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                                {b.car?.brand} {b.car?.name || 'Vehicle Rental'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                📅 {formatDate(b.startDate)} ➔ {formatDate(b.endDate)} • {b.withDriver ? 'With Chauffeur' : 'Self-Drive'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: b.status === 'confirmed' ? '#dcfce7' : b.status === 'pending' ? '#fef3c7' : b.status === 'completed' ? '#e0e7ff' : '#fee2e2',
                              color: b.status === 'confirmed' ? '#15803d' : b.status === 'pending' ? '#b45309' : b.status === 'completed' ? '#4338ca' : '#b91c1c'
                            }}>
                              {b.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTabChange('bookings')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0284c7',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              View <FiChevronRight />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : activeTab === 'cars' ? (
          <>
            {/* Car Status Filter & Search */}
            <div className="dash-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="dash-status-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className={`dash-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('all'); setCarPage(1); }}
                >
                  All Cars ({cars.length})
                </button>
                <button
                  className={`dash-pill-btn pill-available ${statusFilter === 'available' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('available'); setCarPage(1); }}
                >
                  <FiCheckCircle /> Available ({cars.filter(c => c.status === 'available' && !c.hasOngoingTrip).length})
                </button>
                <button
                  className={`dash-pill-btn ${statusFilter === 'in_trip' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('in_trip'); setCarPage(1); }}
                  style={statusFilter === 'in_trip' ? { background: '#2563eb', color: '#fff', border: '1px solid #1d4ed8' } : {}}
                >
                  <FaCar /> In Trip ({cars.filter(c => c.status === 'rented' || c.hasOngoingTrip).length})
                </button>
                <button
                  className={`dash-pill-btn pill-unavailable ${statusFilter === 'unavailable' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('unavailable'); setCarPage(1); }}
                >
                  <FiXCircle /> In Service / Other ({cars.filter(c => c.status !== 'available' && c.status !== 'rented' && !c.hasOngoingTrip).length})
                </button>
              </div>

              <div className="dash-search-box">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by car name or brand..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCarPage(1); }}
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => { setSearchQuery(''); setCarPage(1); }}>
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            {/* Cars Grid */}
            {(() => {
              const displayedCars = cars.filter(car => {
                const isRented = car.status === 'rented' || car.hasOngoingTrip;
                const isAvail = car.status === 'available' && !isRented;
                if (statusFilter === 'available' && !isAvail) return false;
                if (statusFilter === 'in_trip' && !isRented) return false;
                if (statusFilter === 'unavailable' && (isAvail || isRented)) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase().trim();
                  const nameMatch = car.name?.toLowerCase().includes(q);
                  const brandMatch = car.brand?.toLowerCase().includes(q);
                  if (!nameMatch && !brandMatch) return false;
                }
                return true;
              });

              if (displayedCars.length === 0) {
                return (
                  <div className="empty-state" style={{ padding: '60px 20px', background: 'var(--white)', borderRadius: 'var(--radius-lg)' }}>
                    <FaCar size={44} style={{ color: 'var(--gray)', marginBottom: '12px' }} />
                    <h3>No cars found</h3>
                    <p>No vehicles match your current filter criteria.</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
                      style={{ marginTop: '12px' }}
                    >
                      Reset Filters
                    </button>
                  </div>
                );
              }

              const paginatedCars = displayedCars.slice((carPage - 1) * carPageSize, carPage * carPageSize);

              return (
                <>
                  <div className="dash-cars-grid">
                    {paginatedCars.map(car => {
                      const isRented = car.status === 'rented' || car.hasOngoingTrip;
                      const isAvailable = car.status === 'available' && !isRented;
                      const image = car.images?.[0] || '/images/car-1.jpg';
                      const userPendingBooking = bookings.find(b =>
                        (b.car?._id === car._id || b.car === car._id) && b.status === 'pending'
                      );
                      const userOngoingBooking = bookings.find(b =>
                        (b.car?._id === car._id || b.car === car._id) && b.status === 'ongoing'
                      );
                      const userConfirmedBooking = bookings.find(b =>
                        (b.car?._id === car._id || b.car === car._id) && (b.status === 'confirmed' || b.status === 'driver_assigned')
                      );
                      return (
                        <div key={car._id} className={`dash-car-card ${!isAvailable ? 'card-unavailable' : ''}`}>
                          {/* Card Header Top */}
                          <div className="dash-car-card-top">
                            <div className="dash-car-card-title-box">
                              <h3
                                className="dash-car-title"
                                onClick={() => openDetailModal(car)}
                                title={`View ${car.name} specifications`}
                              >
                                {car.name}
                              </h3>
                            </div>
                            <span className="dash-car-type-badge">{car.vehicleType || 'Sedan'}</span>
                          </div>

                          {/* Subhead Row: Brand • Year on Left, Clean Status Pill on Right */}
                          <div className="dash-car-subhead-row">
                            <div className="dash-car-subhead">
                              <span>{car.brand}</span>
                              <span>•</span>
                              <span>{car.year || 2024}</span>
                              <span style={{ margin: '0 4px', color: '#cbd5e1' }}>•</span>
                              <span
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 700, cursor: 'pointer' }}
                                onClick={() => openDetailModal(car)}
                                title="View Customer Ratings & Reviews"
                              >
                                <FaStar size={11} /> {car.rating ? Number(car.rating).toFixed(1) : '5.0'}
                                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '11px', marginLeft: '2px' }}>
                                  ({car.reviewCount || 0})
                                </span>
                              </span>
                            </div>
                            {userPendingBooking ? (
                              <span className="dash-car-status-pill pending">
                                <span className="status-indicator-dot pending"></span>
                                Booking Pending
                              </span>
                            ) : userOngoingBooking ? (
                              <span className="dash-car-status-pill in-trip">
                                <span className="status-indicator-dot in-trip"></span>
                                In Trip (Your Trip)
                              </span>
                            ) : userConfirmedBooking ? (
                              <span className="dash-car-status-pill confirmed">
                                <span className="status-indicator-dot confirmed"></span>
                                Confirmed
                              </span>
                            ) : isRented ? (
                              <span className="dash-car-status-pill in-trip">
                                <span className="status-indicator-dot in-trip"></span>
                                In Trip
                              </span>
                            ) : isAvailable ? (
                              <span className="dash-car-status-pill available">
                                <span className="status-indicator-dot available"></span>
                                Available
                              </span>
                            ) : (
                              <span className="dash-car-status-pill unavailable">
                                <span className="status-indicator-dot unavailable"></span>
                                {car.status === 'maintenance' ? 'In Service' : 'Unavailable'}
                              </span>
                            )}
                          </div>

                          {/* Curved Image Showcase */}
                          <div
                            className="dash-car-img-wrapper"
                            onClick={() => openDetailModal(car)}
                            title="Click to view detailed vehicle specifications & customer reviews"
                          >
                            <img
                              src={image}
                              alt={car.name}
                              className="dash-car-img-elem"
                              loading="lazy"
                              onError={(e) => { e.target.onerror = null; e.target.src = '/images/car-1.jpg'; }}
                            />
                            <div className="dash-img-hover-overlay">
                              <span className="dash-hover-pill"><FiEye /> Specs &amp; Reviews</span>
                            </div>
                          </div>

                          {/* Vehicle Specs Grid */}
                          <div className="dash-car-specs-grid">
                            <div className="dash-spec-item" title="Seating Capacity">
                              <span>{car.seats || 5} Seats</span>
                            </div>
                            <div className="dash-spec-item" title="Transmission">
                              <span>{car.transmission || 'Automatic'}</span>
                            </div>
                            <div className="dash-spec-item" title="Fuel Type">
                              <span>{car.fuelType || 'Petrol'}</span>
                            </div>
                            <div className="dash-spec-item" title="Mileage Policy">
                              <span>{car.mileage ? car.mileage.replace(/mi/gi, 'km') : 'Unlimited'}</span>
                            </div>
                          </div>

                          {/* Card Bottom Row: Price Row + Action Buttons (No Text Breaking) */}
                          <div className="dash-car-card-bottom">
                            <div className="dash-car-price-row">
                              <div className="dash-car-price-box">
                                <span className="dash-car-price-num">{sym}{car.pricePerDay}</span>
                                <span className="dash-car-price-unit">/day</span>
                              </div>
                              <span className="dash-car-rate-tag">
                                Verified Fleet
                              </span>
                            </div>
                            <div className="dash-car-card-actions">
                              <button
                                type="button"
                                className="dash-view-specs-btn"
                                onClick={() => openDetailModal(car)}
                                title="View Full Specifications & Customer Reviews"
                              >
                                <FiEye size={13} /> Specs &amp; Reviews
                              </button>
                              {userPendingBooking ? (
                                <button
                                  type="button"
                                  className="dash-whatsapp-book-btn pending"
                                  onClick={() => openBookingModal(car)}
                                  title="Booking pending admin approval. Click to view status or send WhatsApp message"
                                >
                                  <FiClock size={14} /> Pending
                                </button>
                              ) : userOngoingBooking ? (
                                <button
                                  type="button"
                                  className="dash-whatsapp-book-btn in-trip"
                                  disabled={true}
                                  title="Your trip is currently active"
                                  style={{ background: '#0284c7', color: '#fff', cursor: 'not-allowed', opacity: 0.9 }}
                                >
                                  <FaCar size={13} /> Active Trip
                                </button>
                              ) : userConfirmedBooking ? (
                                <button
                                  type="button"
                                  className="dash-whatsapp-book-btn confirmed"
                                  disabled={true}
                                  title="Your reservation is confirmed for this vehicle"
                                  style={{ background: '#059669', color: '#fff', cursor: 'not-allowed', opacity: 0.9 }}
                                >
                                  <FiCheckCircle size={14} /> Confirmed
                                </button>
                              ) : isAvailable ? (
                                <button
                                  type="button"
                                  className="dash-whatsapp-book-btn"
                                  onClick={() => openBookingModal(car)}
                                  title="Book via WhatsApp or Online Reservation"
                                >
                                  <FaWhatsapp size={15} /> Book Now
                                </button>
                              ) : isRented ? (
                                <button
                                  type="button"
                                  className="dash-whatsapp-book-btn in-trip"
                                  onClick={() => openDetailModal(car)}
                                  title="Vehicle is currently on an active rental trip"
                                >
                                  <FaCar size={13} /> In Trip
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="dash-whatsapp-book-btn disabled"
                                  onClick={() => openDetailModal(car)}
                                  title="Vehicle currently unavailable"
                                >
                                  Unavailable
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination
                    currentPage={carPage}
                    totalItems={displayedCars.length}
                    pageSize={carPageSize}
                    pageSizeOptions={[6, 12, 24]}
                    onPageChange={setCarPage}
                    onPageSizeChange={setCarPageSize}
                    label="vehicles"
                  />
                </>
              );
            })()}
          </>
        ) : activeTab === 'bookings' ? (
          /* My Car Rentals Tab with Status KPI Cards & Filters */
          <div className="dash-bookings">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <FiCalendar size={48} style={{ color: 'var(--gray)', marginBottom: '15px' }} />
                <h3>No Car Rentals Yet</h3>
                <p>Browse our vehicle fleet and reserve self-drive or with-driver trips.</p>
                <button className="btn btn-primary" onClick={() => handleTabChange('cars')} style={{ marginTop: '12px' }}>
                  Browse Fleet
                </button>
              </div>
            ) : (() => {
              const totalCount = bookings.length;
              const completedCount = bookings.filter(b => b.status === 'completed').length;
              const pendingCount = bookings.filter(b => b.status === 'pending').length;
              const activeCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'driver_assigned' || b.status === 'ongoing').length;
              const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

              const filteredList = bookings.filter(b => {
                if (bookingFilter === 'all') return true;
                if (bookingFilter === 'pending') return b.status === 'pending';
                if (bookingFilter === 'completed') return b.status === 'completed';
                if (bookingFilter === 'active') return b.status === 'confirmed' || b.status === 'driver_assigned' || b.status === 'ongoing';
                if (bookingFilter === 'cancelled') return b.status === 'cancelled';
                return true;
              });

              return (
                <div>
                  {/* Summary KPI Cards: Completed vs Pending vs Active */}
                  <div className="dash-kpi-grid">
                    <div
                      onClick={() => { setBookingFilter('all'); setRentalPage(1); }}
                      style={{
                        background: '#fff', padding: '1.1rem', borderRadius: '14px', border: bookingFilter === 'all' ? '2px solid #0f172a' : '1px solid #e2e8f0',
                        cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>All Rentals</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{totalCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total bookings made</div>
                    </div>

                    <div
                      onClick={() => { setBookingFilter('pending'); setRentalPage(1); }}
                      style={{
                        background: '#fffbeb', padding: '1.1rem', borderRadius: '14px', border: bookingFilter === 'pending' ? '2px solid #f59e0b' : '1px solid #fde68a',
                        cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(245,158,11,0.08)'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>⏳ Pending Approval</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>{pendingCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#b45309' }}>Awaiting confirmation</div>
                    </div>

                    <div
                      onClick={() => { setBookingFilter('active'); setRentalPage(1); }}
                      style={{
                        background: '#eff6ff', padding: '1.1rem', borderRadius: '14px', border: bookingFilter === 'active' ? '2px solid #3b82f6' : '1px solid #bfdbfe',
                        cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(59,130,246,0.08)'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>🚗 Active / Confirmed</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', margin: '4px 0' }}>{activeCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>Upcoming or ongoing</div>
                    </div>

                    <div
                      onClick={() => { setBookingFilter('completed'); setRentalPage(1); }}
                      style={{
                        background: '#ecfdf5', padding: '1.1rem', borderRadius: '14px', border: bookingFilter === 'completed' ? '2px solid #10b981' : '1px solid #a7f3d0',
                        cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(16,185,129,0.08)'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>✅ Completed Trips</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>{completedCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#047857' }}>Safely returned &amp; closed</div>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="dash-booking-filters-bar">
                    <div className="dash-booking-pills-row">
                      {[
                        { key: 'all', label: `All (${totalCount})` },
                        { key: 'pending', label: `Pending (${pendingCount})` },
                        { key: 'active', label: `Active (${activeCount})` },
                        { key: 'completed', label: `Completed (${completedCount})` },
                        { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
                      ].map(pill => (
                        <button
                          key={pill.key}
                          type="button"
                          onClick={() => { setBookingFilter(pill.key); setRentalPage(1); }}
                          style={{
                            padding: '6px 14px', borderRadius: '20px',
                            border: bookingFilter === pill.key ? '2px solid #f96d00' : '1px solid #e2e8f0',
                            background: bookingFilter === pill.key ? '#fff7ed' : '#ffffff',
                            color: bookingFilter === pill.key ? '#f96d00' : '#475569',
                            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease'
                          }}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>

                    <div className="live-sync-indicator" title="Auto-refreshing every 10 seconds">
                      <span className="pulse-dot"></span>
                      Live (10s Sync)
                    </div>
                  </div>

                  {filteredList.length === 0 ? (
                    <div className="empty-state" style={{ background: '#fff', borderRadius: '14px', padding: '3rem 1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <FiCalendar size={42} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                      <h4 style={{ color: '#0f172a', fontWeight: 700, margin: '0 0 6px' }}>No {bookingFilter !== 'all' ? bookingFilter : ''} rentals found</h4>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>You don't have any bookings matching this status filter.</p>
                    </div>
                  ) : (
                    <>
                      <div className="dash-bookings-grid">
                        {filteredList.slice((rentalPage - 1) * rentalPageSize, rentalPage * rentalPageSize).map((b) => {
                          const isChauffeur = b.rentalType === 'chauffeured' || b.withDriver;
                          const driver = b.driver || {};
                          const carImg = b.car?.images?.[0] || '/images/car-1.jpg';

                          const extraTotal = b.inspection?.extraCharges || 0;
                          const damageTotal = Array.isArray(b.damageCharges)
                            ? b.damageCharges.reduce((s, d) => s + (Number(d.amount) || 0), 0)
                            : (Number(b.damageCharges) || 0);
                          const additionalTotal = Array.isArray(b.additionalCharges) && b.additionalCharges.length > 0
                            ? b.additionalCharges.reduce((s, ac) => s + (Number(ac.amount) || 0), 0)
                            : (extraTotal + damageTotal);

                          const rentalSub = (Number(b.subtotal) || 0) + (Number(b.driverFee) || 0);
                          const baseTotal = (rentalSub + (Number(b.taxAmount) || 0)) || (Number(b.totalPrice) || 0);
                          const cardGrandTotal = baseTotal + additionalTotal;
                          const cardTotalPaid = b.paidAmount !== undefined
                            ? Number(b.paidAmount) || 0
                            : (b.paymentStatus === 'fully_paid' ? cardGrandTotal : (Number(b.advanceAmount) || 0));
                          const cardBalanceDue = Math.max(0, cardGrandTotal - cardTotalPaid);

                          return (
                            <div
                              key={b._id}
                              className="dash-rental-card"
                              style={{
                                background: '#ffffff',
                                borderRadius: '18px',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden',
                                boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.25s ease'
                              }}
                            >
                              {/* ── Card Media & Badges ── */}
                              <div style={{ position: 'relative', width: '100%', height: '175px', background: '#0f172a', overflow: 'hidden' }}>
                                <img
                                  src={carImg}
                                  alt={b.car?.name || 'Vehicle'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { e.target.onerror = null; e.target.src = '/images/car-1.jpg'; }}
                                />
                                {/* Top Scrim */}
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  padding: '10px 14px',
                                  background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0) 100%)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#f8fafc',
                                    background: 'rgba(0, 0, 0, 0.55)',
                                    backdropFilter: 'blur(6px)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    letterSpacing: '0.04em'
                                  }}>
                                    REF: #{b.bookingReference || b._id.slice(-6).toUpperCase()}
                                  </span>
                                  <span style={{
                                    background: getBookingStatusColor(b.status),
                                    color: '#ffffff',
                                    padding: '3px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                                  }}>
                                    {b.status}
                                  </span>
                                </div>

                                {/* Bottom Floating Badges */}
                                <div style={{
                                  position: 'absolute',
                                  bottom: '8px',
                                  left: '12px',
                                  display: 'flex',
                                  gap: '6px',
                                  flexWrap: 'wrap'
                                }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.74rem',
                                    padding: '3px 9px',
                                    borderRadius: '20px',
                                    background: isChauffeur ? 'rgba(88, 28, 135, 0.92)' : 'rgba(234, 88, 12, 0.92)',
                                    backdropFilter: 'blur(6px)',
                                    color: '#ffffff',
                                    fontWeight: 700
                                  }}>
                                    {isChauffeur ? <FaUserTie size={11} /> : <FaCar size={11} />}
                                    {isChauffeur ? 'With Driver' : 'Self-Drive'}
                                  </span>
                                  {b.rentalDurationType && b.rentalDurationType !== 'daily' && (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.74rem',
                                      padding: '3px 9px',
                                      borderRadius: '20px',
                                      background: b.rentalDurationType === 'monthly' ? 'rgba(5, 150, 105, 0.92)' : 'rgba(3, 105, 161, 0.92)',
                                      backdropFilter: 'blur(6px)',
                                      color: '#ffffff',
                                      fontWeight: 700
                                    }}>
                                      {b.rentalDurationType === 'monthly' ? '🗓️ Monthly' : '📆 Weekly'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* ── Card Body ── */}
                              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                                <div>
                                  <h3 style={{ margin: '0 0 2px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                                    {b.car?.name || 'Vehicle'}
                                  </h3>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {b.car?.brand} {b.car?.model} {b.car?.year ? `(${b.car.year})` : ''}
                                  </div>
                                </div>

                                {b.status === 'pending' && (
                                  <div style={{
                                    background: '#fffbeb',
                                    border: '1px solid #fef3c7',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                    fontSize: '0.76rem',
                                    color: '#b45309',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    lineHeight: 1.4
                                  }}>
                                    <FaWhatsapp style={{ color: '#25D366', fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }} />
                                    <span>Awaiting Admin WhatsApp confirmation. Send pre-filled message to confirm.</span>
                                  </div>
                                )}

                                {/* Schedule & Hub Info */}
                                <div style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '10px',
                                  padding: '10px 12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                  fontSize: '0.82rem'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                      <FiCalendar style={{ color: '#f96d00' }} /> Dates:
                                    </span>
                                    <strong style={{ color: '#0f172a', fontWeight: 700 }}>
                                      {formatDate(b.pickupDate)} → {formatDate(b.dropoffDate || b.returnDate)}
                                    </strong>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                      <FiClock style={{ color: '#0284c7' }} /> Duration:
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#334155' }}>
                                      {b.days} Day{b.days > 1 ? 's' : ''}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                      <FiMapPin style={{ color: '#ef4444' }} /> Pick-up Hub:
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#334155', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {b.pickupLocation || 'Main Hub'}
                                    </span>
                                  </div>

                                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>Total Price:</span>
                                    {b.rentalDurationType && b.rentalDurationType !== 'daily' && (!b.totalPrice || b.totalPrice === 0) ? (
                                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 7px', borderRadius: '4px' }}>
                                        Quote on Request
                                      </span>
                                    ) : b.status === 'cancelled' ? (
                                      <strong style={{ fontSize: '1.05rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                        {sym}{b.totalPrice?.toFixed(2) || b.totalPrice}
                                      </strong>
                                    ) : (
                                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                                        {sym}{b.totalPrice?.toFixed(2) || b.totalPrice}
                                      </strong>
                                    )}
                                  </div>
                                </div>

                                {/* Payment & Balance Status */}
                                {b.status === 'cancelled' ? (
                                  <div style={{
                                    background: '#fef2f2',
                                    border: '1.5px solid #fecaca',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div>
                                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <FiXCircle size={14} /> Reservation Cancelled
                                      </div>
                                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                        {cardTotalPaid > 0 ? `Recorded Paid: ${sym}${cardTotalPaid}` : 'No payment collected'}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        display: 'inline-block'
                                      }}>
                                        No Balance Due
                                      </span>
                                    </div>
                                  </div>
                                ) : cardBalanceDue > 0 ? (
                                  <div style={{
                                    background: b.status === 'completed' ? '#fef2f2' : '#fffbeb',
                                    border: `1.5px solid ${b.status === 'completed' ? '#fca5a5' : '#fde68a'}`,
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div>
                                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: b.status === 'completed' ? '#b91c1c' : '#b45309' }}>
                                        ⚠️ {b.status === 'completed' ? 'Settlement Pending' : 'Payment Due'}
                                      </div>
                                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                        Paid: {sym}{cardTotalPaid}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#dc2626' }}>
                                        Due
                                      </div>
                                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#dc2626' }}>
                                        {sym}{cardBalanceDue}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.78rem',
                                    color: '#15803d'
                                  }}>
                                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <FiCheckCircle style={{ color: '#16a34a' }} /> Settled ({sym}{cardGrandTotal})
                                    </span>
                                    <span style={{ fontWeight: 800, color: '#16a34a' }}>₹0 Due</span>
                                  </div>
                                )}

                                {/* Driver Dispatch Info Box if applicable */}
                                {isChauffeur && (
                                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '6px 10px', fontSize: '0.78rem', color: '#581c87' }}>
                                    {driver.name ? (
                                      <div>
                                        <strong>Driver:</strong> {driver.name} • <a href={`tel:${driver.phone}`} style={{ color: '#7e22ce', fontWeight: 700 }}>{driver.phone}</a>
                                        {b.driverStatus && (
                                          <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '4px', background: '#f3e8ff', color: '#6b21a8', fontWeight: 700, fontSize: '0.7rem' }}>
                                            {b.driverStatus.replace('_', ' ')}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div style={{ color: '#7e22ce', fontSize: '0.74rem' }}>
                                        Driver assignment will be dispatched prior to departure.
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* ── Card Footer Actions ── */}
                                <div style={{
                                  borderTop: '1px solid #f1f5f9',
                                  paddingTop: '12px',
                                  marginTop: 'auto',
                                  display: 'flex',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}>
                                  {b.status === 'cancelled' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '2px 0' }}>
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        color: '#dc2626',
                                        background: '#fee2e2',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid #fca5a5'
                                      }}>
                                        <FiXCircle size={13} /> Cancelled
                                      </span>
                                      {cardTotalPaid > 0 && (
                                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                          Paid: {sym}{cardTotalPaid}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      {b.status === 'completed' && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenReview(b)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '0.78rem',
                                            padding: '6px 11px',
                                            background: '#fff7ed',
                                            color: '#ea580c',
                                            border: '1px solid #fed7aa',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <FaStar size={11} color="#f59e0b" /> Review
                                        </button>
                                      )}

                                      {b.status === 'completed' ? (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedInvoiceBooking(b)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '0.78rem',
                                            padding: '6px 12px',
                                            background: '#ecfdf5',
                                            color: '#047857',
                                            border: '1px solid #a7f3d0',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <FiPrinter size={13} /> Tax Invoice
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedInvoiceBooking(b)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '0.78rem',
                                            padding: '6px 12px',
                                            background: '#f8fafc',
                                            color: '#334155',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <FiPrinter size={13} /> Agreement Slip
                                        </button>
                                      )}

                                      {b.status === 'pending' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const phone = settings?.contactPhone || settings?.whatsappNumber || '919629182095';
                                            const cleanPhone = phone.replace(/[^0-9]/g, '');
                                            const msg = `*Booking Request Follow-up - CarBook*\n` +
                                              `• *Booking ID:* ${b.bookingReference || b._id?.slice(-6)}\n` +
                                              `• *Car:* ${b.car?.name || 'Vehicle'}\n` +
                                              `• *Dates:* ${formatDate(b.pickupDate)} to ${formatDate(b.dropoffDate || b.returnDate)}\n` +
                                              `• *Customer:* ${user?.name || ''} (${user?.phone || ''})\n` +
                                              `• *Status:* Pending Admin Approval\n\n` +
                                              `Hello Admin, I have submitted this booking request. Please verify and confirm my reservation.`;
                                            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                          }}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '0.78rem',
                                            padding: '6px 12px',
                                            background: '#25D366',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <FaWhatsapp size={13} /> WhatsApp
                                        </button>
                                      )}

                                      {(b.status === 'pending' || b.status === 'confirmed') && (
                                        <button
                                          type="button"
                                          onClick={() => handleCancel(b._id)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            fontSize: '0.76rem',
                                            color: '#ef4444',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px 6px',
                                            marginLeft: 'auto'
                                          }}
                                        >
                                          <FiX size={13} /> Cancel
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Pagination
                        currentPage={rentalPage}
                        totalItems={filteredList.length}
                        pageSize={rentalPageSize}
                        pageSizeOptions={[6, 12, 24]}
                        onPageChange={setRentalPage}
                        onPageSizeChange={setRentalPageSize}
                        label="rentals"
                      />
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          /* Saved Profile & Addresses Tab */
          <div style={{ maxWidth: '680px', margin: '1.5rem auto 3rem auto', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Account Profile &amp; Address
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Save your contact information and address for expedited vehicle reservations and rental agreements.
            </p>

            {profileMsg && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                ✓ {profileMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} noValidate>
              <div className="dash-form-row-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    className={profileErrors.name ? 'input-error' : ''}
                    value={profileData.name}
                    onChange={(e) => {
                      setProfileData(p => ({ ...p, name: e.target.value }));
                      if (profileErrors.name) setProfileErrors(prev => ({ ...prev, name: '' }));
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: profileErrors.name ? '1.5px solid #ef4444' : '1px solid #cbd5e1' }}
                  />
                  {profileErrors.name && <span className="field-error-text">{profileErrors.name}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone Number *</label>
                  <input
                    type="tel"
                    className={profileErrors.phone ? 'input-error' : ''}
                    value={profileData.phone}
                    onChange={(e) => {
                      setProfileData(p => ({ ...p, phone: e.target.value }));
                      if (profileErrors.phone) setProfileErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="+91 9876543210"
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: profileErrors.phone ? '1.5px solid #ef4444' : '1px solid #cbd5e1' }}
                  />
                  {profileErrors.phone && <span className="field-error-text">{profileErrors.phone}</span>}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Address</label>
                <input
                  type="text"
                  value={profileData.street}
                  onChange={(e) => setProfileData(p => ({ ...p, street: e.target.value }))}
                  placeholder="House/Flat No., Street, Landmark, Area"
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>City</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData(p => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Chennai, Bangalore, Coimbatore, Delhi"
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FiSave /> {profileSaving ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>

            {/* Security & Change Password Section */}
            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                <FiLock style={{ color: '#f96d00', fontSize: '1.2rem' }} />
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Security &amp; Change Password
                </h4>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                Update your password to keep your bookings and rental credentials secure.
              </p>

              {pwdSuccess && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCheckCircle /> {pwdSuccess}
                </div>
              )}

              {pwdError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiAlertCircle /> {pwdError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Current Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPwd ? 'text' : 'password'}
                        value={pwdForm.currentPassword}
                        onChange={(e) => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
                        placeholder="Enter your existing password"
                        style={{ width: '100%', padding: '0.65rem 2.6rem 0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPwd(v => !v)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                        title={showCurrentPwd ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="dash-form-row-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        New Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={pwdForm.newPassword}
                          onChange={(e) => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                          placeholder="Min. 6 characters"
                          style={{ width: '100%', padding: '0.65rem 2.6rem 0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(v => !v)}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                          title={showNewPwd ? 'Hide password' : 'Show password'}
                        >
                          {showNewPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={pwdForm.confirmPassword}
                        onChange={(e) => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                        style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: '#f96d00', color: '#f96d00', fontWeight: 600 }}
                >
                  <FiKey /> {pwdLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Detail Modal */}
      {showDetailModal && detailCar && (
        <VehicleDetailModal
          car={detailCar}
          onClose={() => setShowDetailModal(false)}
          onBook={(car) => {
            setShowDetailModal(false);
            openBookingModal(car);
          }}
        />
      )}

      {/* Rental Invoice Modal */}
      {selectedInvoiceBooking && (
        <RentalInvoiceModal
          booking={selectedInvoiceBooking}
          onClose={() => setSelectedInvoiceBooking(null)}
        />
      )}


      {/* Book Car via WhatsApp Modal with Driver Selection & Live Itemized Breakdown */}
      {showModal && selectedCar && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="booking-modal whatsapp-booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close modal">
              <FiX size={20} />
            </button>

            {/* Vehicle Header Banner */}
            <div className="modal-car-preview" style={{ backgroundImage: `url(${selectedCar.images?.[0] || '/images/car-1.jpg'})` }}>
              <div className="modal-car-overlay">
                <span className="modal-car-tag">{selectedCar.brand} • {selectedCar.year}</span>
                <h2>{selectedCar.name}</h2>
                <span className="modal-car-price">
                  {rentalPeriodType === 'daily' ? (
                    <>{sym}{selectedCar.pricePerDay}<small>/day</small></>
                  ) : (
                    <span style={{ fontSize: '0.82rem', background: 'rgba(255,255,255,0.22)', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                      {rentalPeriodType === 'monthly' ? 'Monthly Plan' : 'Weekly Plan'}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {userPendingForSelectedCar && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '0.9rem 1.1rem',
                margin: '1rem 1.5rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700, fontSize: '0.92rem' }}>
                    <FiClock size={17} style={{ color: '#f59e0b' }} />
                    <span>Booking Pending Admin Approval</span>
                  </div>
                  <span style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    border: '1px solid #fde68a'
                  }}>
                    Ref: #{userPendingForSelectedCar.bookingReference || userPendingForSelectedCar._id?.slice(-6)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', lineHeight: 1.45 }}>
                  You already submitted a reservation for this vehicle ({formatDate(userPendingForSelectedCar.pickupDate)}). It is currently awaiting Admin WhatsApp verification.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const phone = settings?.contactPhone || settings?.whatsappNumber || '919629182095';
                      const cleanPhone = phone.replace(/[^0-9]/g, '');
                      const msg = `*Booking Request Follow-up - CarBook*\n` +
                        `• *Booking Ref:* ${userPendingForSelectedCar.bookingReference || userPendingForSelectedCar._id?.slice(-6)}\n` +
                        `• *Car:* ${selectedCar.name} (${selectedCar.brand} ${selectedCar.model})\n` +
                        `• *Date:* ${formatDate(userPendingForSelectedCar.pickupDate)}\n` +
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
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <FaWhatsapp size={15} /> Send WhatsApp Message
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      handleTabChange('bookings');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#fff',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    View in My Rentals
                  </button>
                </div>
              </div>
            )}

            <form className="modal-form" onSubmit={handleBook} noValidate>
              {bookingMsg.text && (
                <div className={`auth-${bookingMsg.type === 'success' ? 'success' : 'error'}`}>
                  {bookingMsg.text}
                </div>
              )}

              {bookingMsg.type === 'success' && bookingMsg.waUrl && (
                <div className="wa-fallback-box" style={{ marginBottom: '1rem' }}>
                  <p>Didn't see WhatsApp open? Click below to send your booking message:</p>
                  <a
                    href={bookingMsg.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp-direct"
                  >
                    <FaWhatsapp size={18} /> Open WhatsApp Chat Now
                  </a>
                </div>
              )}

              {/* ── RENTAL PERIOD TYPE ──────────────────────────── */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem' }}>
                  Rental Duration Plan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { key: 'daily', label: '📅 Daily Plan', sub: 'Single 1-Day Rental', color: '#f96d00' },
                    { key: 'weekly', label: '📆 Weekly Plan', sub: 'Multi-Day (Start & End)', color: '#0369a1' },
                    { key: 'monthly', label: '🗓️ Monthly Plan', sub: 'Long-Term (Start & End)', color: '#059669' }
                  ].map(({ key, label, sub, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleRentalPeriodTypeChange(key)}
                      style={{
                        padding: '0.7rem 0.5rem',
                        borderRadius: '12px',
                        border: rentalPeriodType === key ? `2px solid ${color}` : '1px solid #e2e8f0',
                        background: rentalPeriodType === key ? `${color}0d` : '#fff',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
                        boxShadow: rentalPeriodType === key ? `0 2px 10px ${color}25` : 'none'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: rentalPeriodType === key ? color : '#374151' }}>{label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Dates Selection (Single Date for Daily, Two Dates for Weekly/Monthly) ── */}
              {rentalPeriodType === 'daily' ? (
                <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700, fontSize: '0.86rem' }}>
                      <FiCalendar style={{ color: 'var(--primary)' }} /> Select Rental Date (1 Day) *
                    </label>
                    {pickupDate && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                        📅 {formatDate(pickupDate)}
                      </span>
                    )}
                  </div>
                  <DateInput
                    value={pickupDate}
                    min={today}
                    className={modalBookErrors.pickupDate ? 'input-error' : ''}
                    onChange={(e) => handleDailySingleDateChange(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Format: <strong style={{ color: '#0284c7' }}>DD-MM-YYYY</strong></span>
                    {pickupDate && <span>Selected: <strong style={{ color: '#0f172a' }}>{formatDate(pickupDate)}</strong></span>}
                  </div>
                  {modalBookErrors.pickupDate && <span className="field-error-text">{modalBookErrors.pickupDate}</span>}
                </div>
              ) : (
                <div className="modal-form-row">
                  <div className="auth-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700, fontSize: '0.86rem' }}>
                        <FiCalendar style={{ color: 'var(--primary)' }} /> Pick-up Start Date *
                      </label>
                      {pickupDate && (
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '2px 7px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                          📅 {formatDate(pickupDate)}
                        </span>
                      )}
                    </div>
                    <DateInput
                      value={pickupDate}
                      min={today}
                      className={modalBookErrors.pickupDate ? 'input-error' : ''}
                      onChange={(e) => handlePickupDateChange(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.74rem', color: '#64748b' }}>
                      <span>Format: <strong style={{ color: '#0284c7' }}>DD-MM-YYYY</strong></span>
                      {pickupDate && <span>Start: <strong style={{ color: '#0f172a' }}>{formatDate(pickupDate)}</strong></span>}
                    </div>
                    {modalBookErrors.pickupDate && <span className="field-error-text">{modalBookErrors.pickupDate}</span>}
                  </div>

                  <div className="auth-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700, fontSize: '0.86rem' }}>
                        <FiCalendar style={{ color: 'var(--primary)' }} /> Return End Date *
                      </label>
                      {dropoffDate && (
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '2px 7px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                          📅 {formatDate(dropoffDate)}
                        </span>
                      )}
                    </div>
                    <DateInput
                      value={dropoffDate}
                      min={pickupDate || today}
                      className={modalBookErrors.dropoffDate ? 'input-error' : ''}
                      onChange={(e) => handleDropoffDateChange(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.74rem', color: '#64748b' }}>
                      <span>Format: <strong style={{ color: '#0284c7' }}>DD-MM-YYYY</strong></span>
                      {dropoffDate && <span>End: <strong style={{ color: '#0f172a' }}>{formatDate(dropoffDate)}</strong></span>}
                    </div>
                    {modalBookErrors.dropoffDate && <span className="field-error-text">{modalBookErrors.dropoffDate}</span>}
                  </div>
                </div>
              )}

              {/* Plan & Duration Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px 14px',
                marginBottom: '1rem',
                fontSize: '12.5px'
              }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>
                  Rental Duration: <strong style={{ color: '#0f172a' }}>{rentalPeriodType === 'daily' ? 1 : (quote?.days || Math.max(1, Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))))} Day{(rentalPeriodType === 'daily' ? 1 : (quote?.days || Math.max(1, Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))))) > 1 ? 's' : ''}</strong>
                </span>
                <span style={{
                  color: rentalPeriodType === 'monthly' ? '#059669' : rentalPeriodType === 'weekly' ? '#0369a1' : '#f96d00',
                  fontWeight: 700,
                  background: rentalPeriodType === 'monthly' ? '#ecfdf5' : rentalPeriodType === 'weekly' ? '#f0f9ff' : '#fff7ed',
                  border: `1px solid ${rentalPeriodType === 'monthly' ? '#a7f3d0' : rentalPeriodType === 'weekly' ? '#bae6fd' : '#fed7aa'}`,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  ✓ {rentalPeriodType === 'monthly' ? 'Monthly Plan' : rentalPeriodType === 'weekly' ? 'Weekly Plan' : 'Daily 1-Day Plan'}
                </span>
              </div>

              {/* ── Drive Option: Only shown for Daily rentals; Hidden completely for Weekly & Monthly ── */}
              {rentalPeriodType === 'daily' && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                    Drive Option: Do you need a driver?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setWithDriver(false)}
                      style={{
                        padding: '0.9rem',
                        borderRadius: '12px',
                        border: !withDriver ? '2px solid #f96d00' : '1px solid #cbd5e1',
                        background: !withDriver ? '#fff7ed' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: !withDriver ? '0 2px 8px rgba(249, 109, 0, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaCar style={{ color: '#f96d00' }} /> Without Driver
                        </div>
                        {!withDriver && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#f96d00', color: '#fff', padding: '2px 7px', borderRadius: '10px' }}>
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                        Self-Drive Rental • 100% Privacy &amp; Freedom
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', marginTop: '6px' }}>
                        Prefilled Rate: {sym}{selectedCar.pricePerDay}/day
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithDriver(true)}
                      style={{
                        padding: '0.9rem',
                        borderRadius: '12px',
                        border: withDriver ? '2px solid #7e22ce' : '1px solid #cbd5e1',
                        background: withDriver ? '#faf5ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: withDriver ? '0 2px 8px rgba(126, 34, 206, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#581c87', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaUserTie style={{ color: '#7e22ce' }} /> With Driver
                        </div>
                        {withDriver && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#7e22ce', color: '#fff', padding: '2px 7px', borderRadius: '10px' }}>
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                        Driver Service • Verified professional driver
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7e22ce', marginTop: '6px' }}>
                        {sym}{selectedCar.pricePerDay} (car) + {sym}{settings.driverDailyFee || 35} (driver) = <strong>{sym}{selectedCar.pricePerDay + (settings.driverDailyFee || 35)}/day</strong>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Booked Dates Notice */}
              {selectedCar.bookedDates && selectedCar.bookedDates.length > 0 && (
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.85rem',
                  fontSize: '0.82rem',
                  color: '#1e40af'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCalendar /> Currently Reserved Dates for this Car:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
                    {selectedCar.bookedDates.map((b, i) => (
                      <span key={i} style={{ background: '#dbeafe', color: '#1e3a8a', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}>
                        {formatDate(b.pickupDate)} → {formatDate(b.dropoffDate)}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '3px' }}>
                    ✓ You can still reserve this car for any dates before or after these periods!
                  </div>
                </div>
              )}

              {/* Locations (Shown ONLY for Daily rentals; Hidden for Weekly & Monthly inquiry) */}
              {rentalPeriodType === 'daily' && (
                <div className="modal-form-row">
                  <div className="auth-input-group">
                    <label>Pick-up Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Airport, City Hub / Main Branch"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                    />
                  </div>
                  <div className="auth-input-group">
                    <label>Drop-off Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Same as pickup / Airport"
                      value={dropoffLocation}
                      onChange={(e) => setDropoffLocation(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="modal-form-row">
                <div className="auth-input-group">
                  <label>Your Name *</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={custName}
                    className={modalBookErrors.custName ? 'input-error' : ''}
                    onChange={(e) => {
                      setCustName(e.target.value);
                      if (modalBookErrors.custName) setModalBookErrors(prev => ({ ...prev, custName: '' }));
                    }}
                  />
                  {modalBookErrors.custName && <span className="field-error-text">{modalBookErrors.custName}</span>}
                </div>
                <div className="auth-input-group">
                  <label>WhatsApp Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={custPhone}
                    className={modalBookErrors.custPhone ? 'input-error' : ''}
                    onChange={(e) => {
                      setCustPhone(e.target.value);
                      if (modalBookErrors.custPhone) setModalBookErrors(prev => ({ ...prev, custPhone: '' }));
                    }}
                  />
                  {modalBookErrors.custPhone && <span className="field-error-text">{modalBookErrors.custPhone}</span>}
                </div>
              </div>

              <div className="auth-input-group">
                <label>Special Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Flight number, child seat, specific pickup time"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
              </div>

              {/* Live Itemized Server Quote Breakdown (Only for Daily; Replaced with Inquiry Card for Weekly & Monthly) */}
              {rentalPeriodType === 'daily' ? (
                pickupDate && dropoffDate ? (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', margin: '1rem 0' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Itemized Cost Breakdown ({quote?.days || 1} Day)
                    </div>
                    {quoteLoading ? (
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Calculating official rate...</div>
                    ) : quote ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: '#475569' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Vehicle Rental ({quote.days} days @ {sym}{quote.dailyRate}/day)</span>
                          <span>{sym}{quote.rentalSubtotal ?? quote.subtotal ?? (quote.days * quote.dailyRate)}</span>
                        </div>
                        {quote.withDriver && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7e22ce', fontWeight: 600 }}>
                            <span>Professional Driver ({quote.days} days @ {sym}{quote.driverDailyFee}/day)</span>
                            <span>+{sym}{quote.driverFeeTotal ?? quote.driverFee ?? 0}</span>
                          </div>
                        )}
                        {(quote.taxAmount || 0) > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Estimated Govt. Tax ({quote.taxRatePercent}%)</span>
                            <span>+{sym}{quote.taxAmount?.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.35rem', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                          <span>Estimated Total Payable:</span>
                          <span style={{ color: '#f96d00' }}>
                            {sym}{(quote.totalPayable ?? quote.totalPrice ?? ((quote.subtotal || 0) + (quote.driverFee || 0) + (quote.taxAmount || 0)))?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>Estimated Total</span>
                        <span>{sym}{withDriver ? selectedCar.pricePerDay + (settings.driverDailyFee || 999) : selectedCar.pricePerDay}/day</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Prefilled Daily Rate ({withDriver ? 'Car + Driver' : 'Car Only'}):
                    </span>
                    <strong style={{ fontSize: '1rem', color: withDriver ? '#7e22ce' : '#0f172a' }}>
                      {sym}{withDriver ? selectedCar.pricePerDay + (settings.driverDailyFee || 999) : selectedCar.pricePerDay}/day
                    </strong>
                  </div>
                )
              ) : (
                /* Pure Request Type Message for Weekly & Monthly (No Estimate, No Amount) */
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                  border: '1.5px solid #93c5fd',
                  borderRadius: '12px',
                  padding: '1.1rem 1.25rem',
                  margin: '1rem 0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.3rem' }}>📋</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                      {rentalPeriodType === 'monthly' ? 'Monthly Rental Request' : 'Weekly Rental Request'}
                    </strong>
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#0369a1',
                      background: '#e0f2fe',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      Inquiry Only • No Payment Needed
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: '#334155', lineHeight: 1.5 }}>
                    You are submitting a custom <strong>{rentalPeriodType === 'monthly' ? 'Monthly' : 'Weekly'} Rental Request</strong> for <strong>{selectedCar.name}</strong> from <strong>{pickupDate ? formatDate(pickupDate) : '...'}</strong> to <strong>{dropoffDate ? formatDate(dropoffDate) : '...'}</strong> ({quote?.days || Math.max(1, Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)))} Days).
                  </p>
                  <div style={{ marginTop: '9px', padding: '7px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.45 }}>
                    💬 <strong>Request Workflow:</strong> Once submitted, our team will verify car availability for your requested duration and reply on WhatsApp with custom discounted package pricing and rental terms.
                  </div>
                </div>
              )}

              {quote && quote.isAvailable === false && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  margin: '0.75rem 0',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FiAlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <strong>Dates Already Reserved:</strong> This vehicle is booked from {quote.conflict ? formatDate(quote.conflict.pickupDate) : ''} to {quote.conflict ? formatDate(quote.conflict.dropoffDate) : ''}. Please choose dates before or after this reservation.
                  </div>
                </div>
              )}

              {userPendingForSelectedCar ? (
                <button
                  type="button"
                  className="btn-whatsapp-submit"
                  disabled={true}
                  style={{
                    marginTop: '0.5rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    cursor: 'not-allowed',
                    fontWeight: 700
                  }}
                >
                  <FiClock size={18} /> Booking Currently Pending Approval
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-whatsapp-submit"
                  disabled={bookingLoading || (quote && quote.isAvailable === false)}
                  style={{
                    marginTop: '0.5rem',
                    ...(quote && quote.isAvailable === false ? { background: '#94a3b8', cursor: 'not-allowed' } : {})
                  }}
                >
                  {bookingLoading ? (
                    <div className="auth-btn-spinner"></div>
                  ) : (quote && quote.isAvailable === false) ? (
                    'Dates Overlap Existing Confirmed Booking'
                  ) : rentalPeriodType !== 'daily' ? (
                    <>
                      <FaWhatsapp size={20} /> Submit Rental Request via WhatsApp
                    </>
                  ) : (
                    <>
                      <FaWhatsapp size={20} /> Request Booking &amp; Open WhatsApp
                    </>
                  )}
                </button>
              )}
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: userPendingForSelectedCar ? '#b45309' : '#64748b', marginTop: '6px' }}>
                {userPendingForSelectedCar ? (
                  <>⏳ You already requested a booking for this vehicle. Please send the WhatsApp message or await Admin confirmation.</>
                ) : rentalPeriodType !== 'daily' ? (
                  <>ℹ️ Rental request will be saved as <strong>Pending</strong>. Our team will verify dates and reply with package pricing on WhatsApp.</>
                ) : (
                  <>ℹ️ Booking is saved as <strong>Pending</strong>. Vehicle is locked once Admin verifies your WhatsApp message.</>
                )}
              </p>
            </form>
          </div>
        </div>
      )}
      {/* Customer Review Modal for Completed Rentals (Supports Vehicle + Driver) */}
      {reviewBooking && (
        <div className="modal-overlay" onClick={() => setReviewBooking(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '580px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '20px',
              padding: '26px',
              background: '#ffffff',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div className="modal-header" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Rate &amp; Review Your Trip
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{reviewBooking.car?.name}</span>
                  <span>•</span>
                  <span>Ref: <strong>{reviewBooking.bookingReference || reviewBooking._id.slice(-6).toUpperCase()}</strong></span>
                  {(reviewBooking.withDriver || reviewBooking.driver) && (
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff', fontSize: '11px', fontWeight: 700 }}>
                      With Driver Rental
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setReviewBooking(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {reviewMsg.text && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  background: reviewMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: reviewMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                  color: reviewMsg.type === 'success' ? '#065f46' : '#991b1b',
                  fontWeight: 600
                }}
              >
                {reviewMsg.type === 'success' ? '✓ ' : '✕ '}{reviewMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmitReview} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* SECTION 1: Vehicle Experience Feedback */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FaCar size={16} color="#f96d00" />
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>1. Vehicle Performance &amp; Comfort</strong>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Vehicle Rating
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                      >
                        <FaStar
                          size={24}
                          color={star <= reviewRating ? '#f59e0b' : '#cbd5e1'}
                          style={{ transition: 'color 0.15s ease' }}
                        />
                      </button>
                    ))}
                    <strong style={{ fontSize: '14px', color: '#f59e0b', marginLeft: '8px' }}>
                      {reviewRating} of 5 Stars
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Review Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smooth driving, clean interior & great mileage"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      background: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Vehicle Feedback *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="How did the car perform? Was it clean, comfortable, and well-maintained?"
                    value={reviewComment}
                    onChange={(e) => {
                      setReviewComment(e.target.value);
                      if (reviewErrors.comment) setReviewErrors(prev => ({ ...prev, comment: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: reviewErrors.comment ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      background: '#fff'
                    }}
                  />
                  {reviewErrors.comment && <span style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{reviewErrors.comment}</span>}
                </div>
              </div>

              {/* SECTION 2: Driver Rating (Only for trips with driver) */}
              {(reviewBooking.withDriver || reviewBooking.driver) && (
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#7e22ce', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaUserTie size={16} />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#581c87' }}>
                          2. {reviewBooking.driver?.name || 'Assigned Driver'}
                        </strong>
                        <span style={{ fontSize: '12px', color: '#7e22ce' }}>
                          {reviewBooking.driver?.phone ? `Phone: ${reviewBooking.driver.phone}` : 'Verified Driver'}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#f3e8ff', color: '#6b21a8' }}>
                      Driver Service
                    </span>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b21a8', marginBottom: '6px' }}>
                      Driver Punctuality &amp; Driving Rating
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewDriverRating(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        >
                          <FaStar
                            size={24}
                            color={star <= reviewDriverRating ? '#9333ea' : '#cbd5e1'}
                            style={{ transition: 'color 0.15s ease' }}
                          />
                        </button>
                      ))}
                      <strong style={{ fontSize: '14px', color: '#7e22ce', marginLeft: '8px' }}>
                        {reviewDriverRating} of 5 Stars
                      </strong>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b21a8', marginBottom: '6px' }}>
                      Driver Experience Feedback *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="How was the driver's service? Punctuality, route knowledge, driving comfort, politeness..."
                      value={reviewDriverComment}
                      onChange={(e) => {
                        setReviewDriverComment(e.target.value);
                        if (reviewErrors.driverComment) setReviewErrors(prev => ({ ...prev, driverComment: '' }));
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: reviewErrors.driverComment ? '1.5px solid #ef4444' : '1px solid #d8b4fe',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        background: '#fff'
                      }}
                    />
                    {reviewErrors.driverComment && <span style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{reviewErrors.driverComment}</span>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f96d00',
                    color: '#fff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(249, 109, 0, 0.3)'
                  }}
                >
                  {reviewLoading
                    ? 'Submitting...'
                    : (reviewBooking.withDriver || reviewBooking.driver)
                      ? 'Submit Trip Reviews (Vehicle & Driver)'
                      : 'Submit Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {bookingToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 999999,
            background: 'linear-gradient(135deg, #065f46, #047857)',
            color: '#ffffff',
            padding: '16px 20px',
            borderRadius: '14px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '420px',
            border: '1px solid #10b981',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
              <FiCheckCircle size={20} style={{ color: '#34d399' }} />
              <span>Reservation Request Sent!</span>
            </div>
            <button
              onClick={() => setBookingToast(null)}
              style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '2px', display: 'flex' }}
              aria-label="Dismiss notification"
            >
              <FiX size={18} />
            </button>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#ecfdf5', lineHeight: 1.4 }}>
            {bookingToast.text}
          </div>
          {bookingToast.waUrl && (
            <div style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
              <a
                href={bookingToast.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: '#10b981',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textDecoration: 'none'
                }}
              >
                <FaWhatsapp size={14} /> Re-open WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  setBookingToast(null);
                  handleTabChange('bookings');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <FiCalendar size={14} /> View My Rentals
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Confirmation / Alert Dialog */}
      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
