import { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, FaCheck, FaTimes, FaSearch, FaCar, FaUser, 
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaFileInvoiceDollar, FaUserTie, FaCheckCircle, 
  FaPrint, FaTachometerAlt, FaGasPump, FaExclamationTriangle, FaEdit,
  FaWhatsapp, FaGlobe, FaDollarSign, FaHistory, FaPlus, FaShieldAlt, FaTrash, FaBan
} from 'react-icons/fa';
import { 
  getAdminBookings, updateBooking, updateBookingStatus, 
  getDrivers, assignDriver, recordInspection, getSettings,
  addBookingPayment, addAdditionalCharge, getCars, createAdminBooking
} from '../api';
import Pagination from './Pagination';
import ConfirmModal from './ConfirmModal';
import { formatDate } from '../utils/format';

export const DEFAULT_CHARGE_REASONS = [
  { value: 'none', label: '-- Select Charge Reason (Optional) --', defaultReason: '' },
  { value: 'damage', label: '⚠️ Accidental Vehicle Damage & Repairs', defaultReason: 'Accidental Vehicle Damage & Repairs' },
  { value: 'late_fee', label: '⏱️ Late Return Overtime Fee', defaultReason: 'Late Return Overtime Fee' },
  { value: 'other', label: '📌 Other / Custom Reason (Type Custom Reason)', defaultReason: '' }
];

export const getBookingTotals = (b) => {
  if (!b) return { baseRental: 0, driverFee: 0, taxes: 0, baseTotal: 0, additionalTotal: 0, additionalList: [], grandTotal: 0, totalPaid: 0, balanceDue: 0, isFullyPaid: false };
  const baseRental = Number(b.subtotal) || 0;
  const driverFee = Number(b.driverFee) || 0;
  const taxes = Number(b.taxAmount) || 0;
  const baseTotal = (baseRental + driverFee + taxes) > 0 ? (baseRental + driverFee + taxes) : (Number(b.totalPrice) || 0);

  const additionalList = [];
  if (Array.isArray(b.additionalCharges)) {
    b.additionalCharges.forEach(chg => {
      if (Number(chg.amount) > 0) {
        additionalList.push({
          category: chg.category || 'other',
          reason: chg.reason || 'Additional Fee',
          amount: Number(chg.amount),
          notes: chg.notes || ''
        });
      }
    });
  }
  if (Array.isArray(b.damageCharges)) {
    b.damageCharges.forEach(d => {
      if (Number(d.amount) > 0 && !additionalList.some(a => a.reason === d.description && a.amount === Number(d.amount))) {
        additionalList.push({
          category: 'damage',
          reason: d.description || 'Accidental Damage Repair',
          amount: Number(d.amount),
          notes: ''
        });
      }
    });
  } else if (Number(b.damageCharges) > 0) {
    additionalList.push({
      category: 'damage',
      reason: 'Accidental Damage Repair',
      amount: Number(b.damageCharges),
      notes: ''
    });
  }
  if (Number(b.inspection?.extraCharges) > 0 && !additionalList.some(a => a.category === 'other' && a.amount === Number(b.inspection.extraCharges))) {
    additionalList.push({
      category: 'other',
      reason: 'Post-Rental Adjustment',
      amount: Number(b.inspection.extraCharges),
      notes: ''
    });
  }

  const additionalTotal = additionalList.reduce((s, a) => s + a.amount, 0);
  const grandTotal = baseTotal + additionalTotal;
  const totalPaid = Array.isArray(b.payments) && b.payments.length > 0
    ? b.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    : (b.paymentStatus === 'fully_paid' ? grandTotal : (Number(b.paidAmount) || Number(b.advanceAmount) || 0));

  const balanceDue = Math.max(0, grandTotal - totalPaid);
  const isFullyPaid = balanceDue === 0 || b.paymentStatus === 'fully_paid';

  return {
    baseRental,
    driverFee,
    taxes,
    baseTotal,
    additionalTotal,
    additionalList,
    grandTotal,
    totalPaid,
    balanceDue,
    isFullyPaid
  };
};

// Helper to isolate custom user notes without duplicating raw contact strings
const getBookingCustomNote = (notes) => {
  if (!notes) return null;
  if (notes.includes(' | Note: ')) {
    return notes.split(' | Note: ')[1]?.trim();
  }
  if (/^Name:.*\|.*Phone:.*\|.*Email:/i.test(notes.trim())) {
    return null;
  }
  return notes.trim();
};

// Helper to parse contact info reliably
const getContactDetails = (booking) => {
  let name = booking.user?.name;
  let phone = booking.user?.phone;
  let email = booking.user?.email;

  if (booking.notes && (!phone || !email)) {
    const phoneMatch = booking.notes.match(/Phone:\s*([^|]+)/i);
    const emailMatch = booking.notes.match(/Email:\s*([^|]+)/i);
    if (!phone && phoneMatch) phone = phoneMatch[1].trim();
    if (!email && emailMatch) email = emailMatch[1].trim();
  }

  return {
    name: name || 'Customer',
    phone: phone || null,
    email: email || null
  };
};

export default function BookingsManagement({ initialSearch = '', onClearInitialSearch }) {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState(initialSearch || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sync initialSearch if provided
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      setCurrentPage(1);
      setStatusFilter('all');
      setSourceFilter('all');
    }
  }, [initialSearch]);

  // Modals
  const [assignModalBooking, setAssignModalBooking] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignDriverError, setAssignDriverError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const [inspectModalBooking, setInspectModalBooking] = useState(null);
  const [returnOdometer, setReturnOdometer] = useState('');
  const [returnFuelLevel, setReturnFuelLevel] = useState('Full (100%)');
  const [returnNotes, setReturnNotes] = useState('');
  const [additionalChargesList, setAdditionalChargesList] = useState([
    { category: 'none', reason: '', amount: 0, notes: '' }
  ]);
  const [inspectErrors, setInspectErrors] = useState({});
  const [inspectLoading, setInspectLoading] = useState(false);

  // Dedicated Edit Security Deposit Modal (Full admin control anytime)
  const [depositModalBooking, setDepositModalBooking] = useState(null);
  const [depositInput, setDepositInput] = useState(0);
  const [depositError, setDepositError] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  // Payment & Ledger Modal
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('advance');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // New Booking Creation Modal (with advance payment entry)
  const [carsList, setCarsList] = useState([]);
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    carId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickupDate: new Date().toISOString().slice(0, 10),
    returnDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    pickupLocation: 'Main Hub',
    dropoffLocation: 'Main Hub',
    rentalType: 'self',
    withDriver: false,
    securityDeposit: 0,
    advanceAmount: 0,
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [invoiceBooking, setInvoiceBooking] = useState(null);
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

  const fetchDataSilently = async () => {
    try {
      const bookingsRes = await getAdminBookings();
      if (bookingsRes.data) {
        setBookings(bookingsRes.data);
      }
    } catch (err) {
      // background silent sync
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 seconds so new bookings and trip updates pop in live
    const interval = setInterval(() => {
      fetchDataSilently();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, driversRes, settingsRes, carsRes] = await Promise.all([
        getAdminBookings(),
        getDrivers().catch(() => ({ data: [] })),
        getSettings().catch(() => ({ data: null })),
        getCars({ limit: 1000 }).catch(() => ({ data: { cars: [] } }))
      ]);
      setBookings(Array.isArray(bookingsRes?.data) ? bookingsRes.data : []);
      setDrivers(Array.isArray(driversRes?.data) ? driversRes.data : []);
      if (settingsRes?.data) setSettings(settingsRes.data);
      const rawCars = carsRes?.data?.cars || (Array.isArray(carsRes?.data) ? carsRes.data : []);
      setCarsList(Array.isArray(rawCars) ? rawCars : []);
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id, status) => {
    const booking = bookings.find(b => b._id === id);
    if (booking?.status === 'ongoing' && status !== 'completed') {
      setConfirmModal({
        isOpen: true,
        title: 'Trip In Progress',
        message: 'This trip is currently ongoing. It cannot be cancelled while in progress. Please click "Inspect Return" to log the inspection and complete the trip.',
        confirmText: 'Dismiss',
        variant: 'warning',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // Validation: For with-driver bookings, driver must be assigned before dispatching (ongoing)
    if (status === 'ongoing' && booking?.withDriver && !booking?.driver) {
      setConfirmModal({
        isOpen: true,
        title: 'Driver Assignment Required',
        message: `Booking Ref "${booking.bookingReference || ''}" was reserved WITH A DRIVER. A professional driver must be assigned before dispatching this vehicle.`,
        confirmText: 'Assign Driver Now',
        cancelText: 'Cancel',
        variant: 'warning',
        isAlert: false,
        loading: false,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          openAssignModal(booking);
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const isCancel = status === 'cancelled';
    const isApprove = status === 'confirmed';
    setConfirmModal({
      isOpen: true,
      title: isCancel ? 'Cancel Booking?' : isApprove ? 'Approve & Confirm Booking?' : `Update Status to ${status.toUpperCase()}?`,
      message: isCancel 
        ? 'Are you sure you want to cancel this booking reservation? This will mark the booking as cancelled.'
        : isApprove
        ? `Are you sure you want to approve this reservation? Once approved, the vehicle reservation is confirmed and will indicate in trip / reserved for the scheduled rental dates.`
        : `Are you sure you want to transition this booking to "${status.toUpperCase()}"?`,
      confirmText: isCancel ? 'Yes, Cancel' : isApprove ? 'Approve Reservation' : 'Confirm Status',
      cancelText: 'Back',
      variant: isCancel ? 'danger' : 'primary',
      isAlert: false,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await updateBookingStatus(id, { status });
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
          fetchData();
        } catch (err) {
          setConfirmModal({
            isOpen: true,
            title: 'Action Failed',
            message: err.response?.data?.message || 'Failed to update booking status.',
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

  const getDriverAvailability = (driver, booking) => {
    if (!driver || !booking) return { available: true };
    const bStart = new Date(booking.pickupDate);
    const bEnd = new Date(booking.dropoffDate);

    // If driver is currently assigned to this specific booking
    if (booking.driver?._id === driver._id || booking.driver === driver._id) {
      return { available: true, isCurrent: true, label: 'Currently Assigned to This Trip' };
    }

    // Check overlapping trips for this driver
    const conflictTrip = driver.assignedTrips?.find(t => 
      t._id !== booking._id &&
      new Date(t.pickupDate) <= bEnd &&
      new Date(t.dropoffDate) >= bStart
    );

    if (conflictTrip) {
      const cStart = formatDate(conflictTrip.pickupDate);
      const cEnd = formatDate(conflictTrip.dropoffDate);
      return {
        available: false,
        reason: `On Duty: ${cStart} - ${cEnd} (${conflictTrip.carName || 'Vehicle'})`,
        dates: `${cStart} - ${cEnd}`,
        conflictTrip
      };
    }

    // Check if driver has an ongoing live trip right now and this booking starts today or earlier
    const now = new Date();
    if (driver.hasOngoingTrip && bStart <= now) {
      return {
        available: false,
        reason: `Currently On Live Trip (${driver.ongoingTrip?.carName || 'Vehicle'})`,
        dates: driver.ongoingTrip ? `Until ${formatDate(driver.ongoingTrip.dropoffDate)}` : 'In progress',
        conflictTrip: driver.ongoingTrip
      };
    }

    if (driver.hasFutureSchedule) {
      return { available: true, label: 'Available (Has other scheduled trips)' };
    }

    return { available: true, label: 'Available' };
  };

  const openAssignModal = (booking) => {
    setInspectModalBooking(null);
    setInvoiceBooking(null);
    setDepositModalBooking(null);
    setAssignModalBooking(booking);
    setSelectedDriverId(booking.driver?._id || '');
    setAssignDriverError('');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setAssignDriverError('Please select a verified driver from the list.');
      return;
    }

    const targetDriver = drivers.find(d => d._id === selectedDriverId);
    if (!targetDriver) {
      setAssignDriverError('Selected driver was not found. Please choose an available driver.');
      return;
    }

    const avail = getDriverAvailability(targetDriver, assignModalBooking);
    const isCurrent = assignModalBooking.driver?._id === targetDriver._id || assignModalBooking.driver === targetDriver._id;
    if (!avail.available && !isCurrent) {
      setAssignDriverError(`Driver ${targetDriver.name} cannot be assigned: ${avail.reason}`);
      return;
    }

    setAssignDriverError('');
    setAssignLoading(true);
    try {
      await assignDriver(assignModalBooking._id, selectedDriverId);
      setAssignModalBooking(null);
      fetchData();
    } catch (err) {
      setConfirmModal({
        isOpen: true,
        title: 'Assignment Failed',
        message: err.response?.data?.message || 'Failed to assign driver to booking.',
        confirmText: 'Dismiss',
        variant: 'danger',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const openInspectModal = (booking) => {
    setAssignModalBooking(null);
    setInvoiceBooking(null);
    setDepositModalBooking(null);
    setPaymentModalBooking(null);
    setInspectModalBooking(booking);
    setInspectErrors({});
    const startOdo = booking.inspection?.pickupOdometer || 12000;
    setReturnOdometer(startOdo + (booking.days * 85));
    setReturnFuelLevel('Full (100%)');
    setReturnNotes('Vehicle returned in clean condition. Return clearance verified.');
    setAdditionalChargesList([
      { category: 'none', reason: '', amount: 0, notes: '' }
    ]);
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (returnOdometer === '' || returnOdometer === undefined || returnOdometer === null) {
      errs.returnOdometer = 'Return odometer reading is required.';
    } else if (Number(returnOdometer) < 0) {
      errs.returnOdometer = 'Return odometer reading must be a positive number.';
    }
    if (!returnFuelLevel) {
      errs.returnFuelLevel = 'Please select return fuel level.';
    }
    setInspectErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setInspectLoading(true);
    try {
      const validCharges = additionalChargesList
        .filter(c => Number(c.amount) > 0 && c.reason && c.category !== 'none')
        .map(c => ({
          category: c.category,
          reason: c.reason.trim(),
          amount: Number(c.amount),
          notes: c.notes || ''
        }));

      await recordInspection(inspectModalBooking._id, {
        returnOdometer,
        returnFuelLevel,
        returnNotes,
        additionalCharges: validCharges,
        inspectedBy: 'Admin Inspector'
      });
      setInspectModalBooking(null);
      fetchData();
    } catch (err) {
      setConfirmModal({
        isOpen: true,
        title: 'Inspection Failed',
        message: err.response?.data?.message || 'Failed to record return inspection.',
        confirmText: 'Dismiss',
        variant: 'danger',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setInspectLoading(false);
    }
  };

  const openPaymentModal = (booking) => {
    setAssignModalBooking(null);
    setInvoiceBooking(null);
    setDepositModalBooking(null);
    setInspectModalBooking(null);
    setPaymentModalBooking(booking);
    setPaymentError('');
    const totals = getBookingTotals(booking);

    setPaymentAmount(totals.balanceDue > 0 ? totals.balanceDue : '');
    setPaymentType(
      totals.balanceDue > 0 
        ? (booking.status === 'completed' || totals.totalPaid > 0 ? 'full' : 'advance')
        : 'partial'
    );
    setPaymentMethod('cash');
    setPaymentTxnId('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNotes('');
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const num = Number(paymentAmount);
    if (!num || isNaN(num) || num <= 0) {
      setPaymentError('Please enter a valid amount greater than 0.');
      return;
    }

    if (paymentTxnId.trim() && (paymentModalBooking.payments || []).some(p => p.transactionId && p.transactionId.toLowerCase() === paymentTxnId.trim().toLowerCase())) {
      setPaymentError(`Transaction ID "${paymentTxnId.trim()}" is already recorded for this booking.`);
      return;
    }

    setPaymentError('');
    setPaymentLoading(true);
    try {
      const res = await addBookingPayment(paymentModalBooking._id, {
        amount: num,
        paymentType,
        paymentMethod,
        transactionId: paymentTxnId.trim(),
        paymentDate,
        notes: paymentNotes.trim()
      });

      if (res.data) {
        setPaymentModalBooking(res.data);
        fetchData();
        if (invoiceBooking && invoiceBooking._id === paymentModalBooking._id) {
          setInvoiceBooking(res.data);
        }
      }
      setPaymentAmount('');
      setPaymentTxnId('');
      setPaymentNotes('');
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const openDepositModal = (booking) => {
    if (booking.status === 'completed' || booking.status === 'cancelled' || booking.isLocked) {
      setConfirmModal({
        isOpen: true,
        title: 'Invoice Locked',
        message: 'This trip is already completed and finalized. The invoice and security deposit are locked and cannot be modified.',
        confirmText: 'Understood',
        variant: 'info',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setAssignModalBooking(null);
    setInspectModalBooking(null);
    setDepositModalBooking(booking);
    setDepositError('');
    setDepositInput(booking.securityDeposit !== undefined ? booking.securityDeposit : 0);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (depositInput === '' || depositInput === undefined || depositInput === null || Number(depositInput) < 0) {
      setDepositError('Please enter a valid deposit amount (0 or greater).');
      return;
    }
    setDepositError('');
    setDepositLoading(true);
    try {
      const val = Math.max(0, Number(depositInput) || 0);
      await updateBooking(depositModalBooking._id, {
        securityDeposit: val
      });
      setDepositModalBooking(null);
      fetchData();
      if (invoiceBooking && invoiceBooking._id === depositModalBooking._id) {
        setInvoiceBooking(prev => ({ ...prev, securityDeposit: val }));
      }
    } catch (err) {
      setConfirmModal({
        isOpen: true,
        title: 'Update Failed',
        message: err.response?.data?.message || 'Failed to update security deposit.',
        confirmText: 'Dismiss',
        variant: 'danger',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleCreateBookingSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.carId) {
      setCreateError('Please select a vehicle.');
      return;
    }
    if (!createForm.customerName.trim() || !createForm.customerPhone.trim()) {
      setCreateError('Customer name and phone number are required.');
      return;
    }
    if (!createForm.pickupDate || !createForm.returnDate) {
      setCreateError('Please select pickup and return dates.');
      return;
    }
    if (new Date(createForm.returnDate) < new Date(createForm.pickupDate)) {
      setCreateError('Return date cannot be earlier than pickup date.');
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await createAdminBooking(createForm);
      setShowCreateBookingModal(false);
      setCreateForm({
        carId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        pickupDate: new Date().toISOString().slice(0, 10),
        returnDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        pickupLocation: 'Main Hub',
        dropoffLocation: 'Main Hub',
        rentalType: 'self',
        withDriver: false,
        securityDeposit: 0,
        advanceAmount: 0,
        paymentMethod: 'cash',
        transactionId: '',
        notes: ''
      });
      fetchData();
      setConfirmModal({
        isOpen: true,
        title: 'Booking Created Successfully',
        message: `Booking #${res.data?.bookingReference || ''} has been created with advance payment recorded!`,
        confirmText: 'Done',
        variant: 'success',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setCreateLoading(false);
    }
  };

  const isWhatsApp = (b) => (
    b.bookingSource === 'whatsapp' ||
    b.paymentMethod === 'whatsapp' ||
    (b.notes && /whatsapp/i.test(b.notes))
  );

  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'whatsapp' && b.bookingSource === 'admin') return false;
      if (sourceFilter === 'admin' && b.bookingSource !== 'admin') return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const carName = b.car?.name?.toLowerCase() || '';
      const userName = b.user?.name?.toLowerCase() || '';
      const ref = b.bookingReference?.toLowerCase() || '';
      const notes = b.notes?.toLowerCase() || '';
      if (!carName.includes(q) && !userName.includes(q) && !ref.includes(q) && !notes.includes(q)) return false;
    }
    return true;
  });

  const paginatedBookings = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bookings-mgmt-root">

      {/* Top KPI Metrics Overview: Completed vs Pending vs Active */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div 
          onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          style={{
            background: 'var(--bg-card, #ffffff)', padding: '16px 18px', borderRadius: '14px',
            border: statusFilter === 'all' ? '2px solid var(--primary, #f96d00)' : '1px solid var(--border-color, #e2e8f0)',
            cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Bookings</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '4px 0 2px' }}>{bookings.length}</div>
          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
            Collected: ₹{bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => {
              const pSum = (b.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
              const paid = pSum > 0 ? pSum : (Number(b.paidAmount) || (b.paymentStatus === 'fully_paid' ? Number(b.totalPrice) || 0 : Number(b.advanceAmount) || 0));
              return sum + paid;
            }, 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
          style={{
            background: '#fffbeb', padding: '16px 18px', borderRadius: '14px',
            border: statusFilter === 'pending' ? '2px solid #f59e0b' : '1px solid #fde68a',
            cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(245,158,11,0.08)'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>⏳ Pending Approval</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', margin: '4px 0 2px' }}>
            {bookings.filter(b => b.status === 'pending').length}
          </div>
          <div style={{ fontSize: '12px', color: '#b45309' }}>Action required (Click to view)</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('driver_assigned'); setCurrentPage(1); }}
          style={{
            background: '#eff6ff', padding: '16px 18px', borderRadius: '14px',
            border: statusFilter === 'driver_assigned' || statusFilter === 'confirmed' ? '2px solid #3b82f6' : '1px solid #bfdbfe',
            cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(59,130,246,0.08)'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🚗 Active / Scheduled</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', margin: '4px 0 2px' }}>
            {bookings.filter(b => ['confirmed', 'driver_assigned', 'ongoing'].includes(b.status)).length}
          </div>
          <div style={{ fontSize: '12px', color: '#1d4ed8' }}>Confirmed, assigned &amp; in-transit</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('completed'); setCurrentPage(1); }}
          style={{
            background: '#ecfdf5', padding: '16px 18px', borderRadius: '14px',
            border: statusFilter === 'completed' ? '2px solid #10b981' : '1px solid #a7f3d0',
            cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(16,185,129,0.08)'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>✅ Completed Trips</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', margin: '4px 0 2px' }}>
            {bookings.filter(b => b.status === 'completed').length}
          </div>
          <div style={{ fontSize: '12px', color: '#047857' }}>
            Earned: ₹{bookings.filter(b => b.status === 'completed').reduce((sum, b) => {
              const pSum = (b.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
              const paid = pSum > 0 ? pSum : (Number(b.paidAmount) || (b.paymentStatus === 'fully_paid' ? Number(b.totalPrice) || 0 : Number(b.advanceAmount) || 0));
              return sum + paid;
            }, 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="module-filter-bar">
        <div className="dash-status-pills">
          {['all', 'pending', 'confirmed', 'driver_assigned', 'ongoing', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              className={`dash-pill-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
            >
              {st === 'driver_assigned' ? 'Driver Assigned' : st.charAt(0).toUpperCase() + st.slice(1)} (
              {st === 'all' ? bookings.length : bookings.filter(b => b.status === st).length})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Channel Filter Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#334155',
              background: '#ffffff',
              cursor: 'pointer'
            }}
            title="Filter by Booking Source (WhatsApp vs Admin Direct)"
          >
            <option value="all">All Sources ({bookings.length})</option>
            <option value="whatsapp">📱 WhatsApp ({bookings.filter(b => b.bookingSource !== 'admin').length})</option>
            <option value="admin">🏢 Admin Direct ({bookings.filter(b => b.bookingSource === 'admin').length})</option>
          </select>

          <div className="live-sync-indicator" title="Real-time 10-second sync active. No page reload required.">
            <span className="pulse-dot"></span> Live (10s Sync)
          </div>
          <div className="module-search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by car, customer, or ref #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <div className="spinner-text">Syncing fleet reservations...</div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <FaCalendarAlt size={48} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
          <h3>No bookings found</h3>
          <p>No bookings match the selected status or search term.</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>
            <span>⇄ Scroll table horizontally to view all columns</span>
          </div>
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>Booking Ref</th>
                  <th style={{ minWidth: '220px' }}>Vehicle</th>
                  <th style={{ minWidth: '250px' }}>Customer / Contact</th>
                  <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Type / Driver</th>
                  <th style={{ minWidth: '240px', whiteSpace: 'nowrap' }}>Dates &amp; Schedule</th>
                  <th style={{ minWidth: '170px', whiteSpace: 'nowrap' }}>Total / Paid</th>
                  <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ minWidth: '220px', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map(b => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.bookingReference || b._id.substring(b._id.length - 6).toUpperCase()}</strong>
                      <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
                        {formatDate(b.createdAt)}
                      </small>
                      {b.bookingSource === 'admin' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #ddd6fe', marginTop: '3px' }}>
                          🏢 Direct Admin
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', fontWeight: 700, color: '#15803d', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #a7f3d0', marginTop: '3px' }}>
                          <FaWhatsapp size={11} color="#16a34a" /> WhatsApp
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="cell-car-preview">
                        <img src={b.car?.images?.[0] || '/images/car-1.jpg'} alt={b.car?.name || 'Car'} />
                        <div>
                          <strong>{b.car?.name || 'Unknown Car'}</strong>
                          <small>{b.car?.brand} • Plate: {b.car?.plateNumber || 'Verified'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const contact = getContactDetails(b);
                        const customNote = getBookingCustomNote(b.notes);
                        return (
                          <div className="cell-contact">
                            <strong>{contact.name}</strong>
                            <div className="cell-contact-meta">
                              {contact.phone && (
                                <span>
                                  <FaPhone size={10} style={{ color: '#0284c7' }} /> {contact.phone}
                                </span>
                              )}
                              {contact.email && (
                                <span>
                                  <FaEnvelope size={10} style={{ color: '#64748b' }} /> {contact.email}
                                </span>
                              )}
                            </div>
                            {customNote && (
                              <span className="notes-snippet" title={customNote}>
                                📝 {customNote}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <div>
                        <span className={`rental-type-pill ${b.withDriver ? 'with-driver' : 'self-drive'}`}>
                          {b.withDriver ? 'With Driver' : 'Self-Drive'}
                        </span>
                        {b.rentalDurationType && b.rentalDurationType !== 'daily' && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ fontSize: '10.5px', fontWeight: 800, color: b.rentalDurationType === 'monthly' ? '#047857' : '#0369a1', background: b.rentalDurationType === 'monthly' ? '#ecfdf5' : '#f0f9ff', padding: '1px 6px', borderRadius: '4px', border: `1px solid ${b.rentalDurationType === 'monthly' ? '#a7f3d0' : '#bae6fd'}` }}>
                              {b.rentalDurationType === 'monthly' ? '🗓️ Monthly' : '📆 Weekly'} Plan
                            </span>
                          </div>
                        )}
                        {b.withDriver && (
                          <div style={{ marginTop: '4px' }}>
                            {b.driver ? (
                              <small style={{ color: '#059669', fontWeight: 600 }}>
                                <FaUserTie /> {b.driver.name}
                              </small>
                            ) : (
                              <small style={{ color: '#D97706', fontWeight: 600 }}>
                                <FaExclamationTriangle /> Unassigned
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="cell-dates">
                        <div className="cell-dates-range">
                          <span className="date-tag">{formatDate(b.pickupDate)}</span>
                          <span className="date-arrow">→</span>
                          <span className="date-tag">{formatDate(b.dropoffDate)}</span>
                        </div>
                        <div className="cell-dates-sub">
                          <span className="days-pill">{b.days} {b.days === 1 ? 'day' : 'days'}</span>
                          <span>• {b.pickupLocation || 'Main Hub'}</span>
                        </div>
                      </div>
                    </td>
                  <td>
                    {(() => {
                      const t = getBookingTotals(b);
                      if (b.rentalDurationType && b.rentalDurationType !== 'daily' && t.grandTotal === 0) {
                        return (
                          <div>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '2px 7px', borderRadius: '4px', display: 'inline-block' }}>
                              Custom Quote
                            </span>
                            <small style={{ color: '#64748b', display: 'block', marginTop: '2px' }}>Inquiry Request</small>
                          </div>
                        );
                      }
                      if (b.status === 'cancelled') {
                        return (
                          <>
                            <strong className="cell-price" style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                              ₹{t.grandTotal}
                            </strong>
                            <div style={{ fontSize: '11px', marginTop: '2px', lineHeight: 1.4 }}>
                              {t.totalPaid > 0 ? (
                                <span style={{ color: '#047857', fontWeight: 700 }}>
                                  Paid: ₹{t.totalPaid}
                                </span>
                              ) : (
                                <span style={{ color: '#64748b', fontWeight: 600 }}>
                                  ₹0 Paid
                                </span>
                              )}
                              <span style={{ 
                                display: 'inline-block',
                                marginLeft: '6px',
                                color: '#b91c1c', 
                                fontWeight: 800,
                                background: '#fee2e2',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}>
                                Cancelled • No Due
                              </span>
                            </div>
                          </>
                        );
                      }

                      return (
                        <>
                          <strong className="cell-price">₹{t.grandTotal}</strong>
                          <div style={{ fontSize: '11px', marginTop: '2px', lineHeight: 1.4 }}>
                            <span style={{ color: '#047857', fontWeight: 700 }}>
                              Paid: ₹{t.totalPaid}
                            </span>
                            {t.balanceDue > 0 ? (
                              <span style={{ color: '#dc2626', fontWeight: 800, marginLeft: '6px' }}>
                                Due: ₹{t.balanceDue}
                              </span>
                            ) : (
                              <span style={{ color: '#16a34a', fontWeight: 700, marginLeft: '6px' }}>
                                Paid in Full
                              </span>
                            )}
                          </div>
                          {t.additionalTotal > 0 && (
                            <div style={{ fontSize: '10.5px', color: '#b91c1c', fontWeight: 700, marginTop: '2px' }}>
                              ⚠️ Includes ₹{t.additionalTotal} additional fees
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </td>
                  <td>
                    {(() => {
                      const t = getBookingTotals(b);
                      return (
                        <div>
                          <span className={`status-chip chip-${b.status}`}>
                            {b.status.replace('_', ' ')}
                          </span>
                          {b.status === 'completed' && (
                            <div style={{ marginTop: '4px' }}>
                              {t.balanceDue > 0 ? (
                                <span style={{
                                  display: 'inline-block',
                                  background: '#fee2e2', color: '#991b1b',
                                  border: '1px solid #fecaca',
                                  padding: '1px 6px', borderRadius: '4px',
                                  fontSize: '10px', fontWeight: 800
                                }}>
                                  ⚠️ Due: ₹{t.balanceDue}
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-block',
                                  background: '#dcfce7', color: '#166534',
                                  border: '1px solid #bbf7d0',
                                  padding: '1px 6px', borderRadius: '4px',
                                  fontSize: '10px', fontWeight: 700
                                }}>
                                  ✅ Fully Paid
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="cell-actions">
                      {b.status === 'cancelled' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 9px',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>
                            <FaBan size={11} /> Cancelled
                          </span>
                          {/* If payments were previously made, allow admin to view past receipts/ledger */}
                          {(() => {
                            const t = getBookingTotals(b);
                            if (t.totalPaid > 0) {
                              return (
                                <button
                                  type="button"
                                  className="btn-action-sm"
                                  style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', fontSize: '11px', padding: '4px 8px' }}
                                  title={`View Payment History (Paid: ₹${t.totalPaid})`}
                                  onClick={() => openPaymentModal(b)}
                                >
                                  <FaHistory size={11} /> Ledger (₹{t.totalPaid})
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <>
                          {/* Record / Manage Payments & Ledger */}
                          {(() => {
                            const t = getBookingTotals(b);

                            if (t.balanceDue <= 0) {
                              return (
                                <button
                                  className="btn-action-sm disabled"
                                  disabled={true}
                                  style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'not-allowed', opacity: 0.85 }}
                                  title="All charges fully settled"
                                >
                                  <FaCheckCircle color="#16a34a" /> Paid in Full
                                </button>
                              );
                            }

                            if (b.status === 'completed') {
                              return (
                                <button
                                  className="btn-action-sm warning"
                                  style={{ background: '#fef2f2', color: '#b91c1c', border: '1.5px solid #ef4444', fontWeight: 800 }}
                                  title={`Trip finished, collect outstanding balance of ₹${t.balanceDue}`}
                                  onClick={() => openPaymentModal(b)}
                                >
                                  <FaDollarSign /> Collect Due (₹{t.balanceDue})
                                </button>
                              );
                            }

                            return (
                              <button
                                className="btn-action-sm"
                                style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 700 }}
                                title={`Record Advance / Partial Payment (Due: ₹${t.balanceDue})`}
                                onClick={() => openPaymentModal(b)}
                              >
                                <FaDollarSign /> Payments
                              </button>
                            );
                          })()}

                          {/* Driver Assignment for trips with driver */}
                          {b.withDriver && b.status !== 'completed' && (
                            <button
                              className="btn-action-sm"
                              title="Assign or Change Driver"
                              onClick={() => openAssignModal(b)}
                            >
                              <FaUserTie /> {b.driver ? 'Change' : 'Assign'}
                            </button>
                          )}

                          {/* State transitions */}
                          {b.status === 'pending' && (
                            <button
                              className="btn-action-sm confirm"
                              title="Approve & Confirm Reservation"
                              onClick={() => handleStatusChange(b._id, 'confirmed')}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                padding: '6px 12px',
                                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                              }}
                            >
                              <FaCheck /> Approve
                            </button>
                          )}

                          {(b.status === 'confirmed' || b.status === 'driver_assigned') && (
                            b.withDriver && !b.driver ? (
                              <button
                                className="btn-action-sm warning"
                                style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700 }}
                                title="Driver must be assigned before dispatching this trip"
                                onClick={() => openAssignModal(b)}
                              >
                                <FaUserTie /> Assign Driver to Dispatch
                              </button>
                            ) : (
                              <button
                                className="btn-action-sm ongoing"
                                title="Customer picked up vehicle / trip started"
                                onClick={() => handleStatusChange(b._id, 'ongoing')}
                              >
                                Dispatch
                              </button>
                            )
                          )}

                          {b.status === 'ongoing' && (
                            <button
                              className="btn-action-sm complete"
                              title="Vehicle returned - log inspection"
                              onClick={() => openInspectModal(b)}
                            >
                              <FaTachometerAlt /> Inspect Return
                            </button>
                          )}

                          {b.status !== 'completed' && b.status !== 'ongoing' && (
                            <button
                              className="btn-action-sm cancel"
                              title="Cancel Booking"
                              onClick={() => handleStatusChange(b._id, 'cancelled')}
                            >
                              <FaTimes />
                            </button>
                          )}

                          {/* View & Print Invoice */}
                          <button
                            className="btn-action-sm"
                            title="View & Print Rental Agreement / Invoice"
                            onClick={() => {
                              setAssignModalBooking(null);
                              setInspectModalBooking(null);
                              setInvoiceBooking(b);
                            }}
                          >
                            <FaFileInvoiceDollar /> Invoice
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={filteredBookings.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            label="bookings"
          />
        </div>
      )}

      {/* 1. Driver Assignment Modal */}
      {assignModalBooking && (
        <div className="modal-backdrop" onClick={() => { setAssignModalBooking(null); setAssignDriverError(''); }}>
          <div className="custom-admin-modal" onClick={e => e.stopPropagation()}>
            <div className="cam-header">
              <h3><FaUserTie /> Assign Driver to Booking</h3>
              <button 
                type="button"
                className="cam-close" 
                onClick={() => { setAssignModalBooking(null); setAssignDriverError(''); }}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="cam-body" noValidate>
              <div className="cam-info-box">
                <strong>{assignModalBooking.car?.name}</strong>
                <p>Schedule: {formatDate(assignModalBooking.pickupDate)} to {formatDate(assignModalBooking.dropoffDate)}</p>
                <p>Customer: {assignModalBooking.user?.name} ({assignModalBooking.user?.phone})</p>
              </div>

              <div className="auth-input-group">
                <label>
                  Select Verified Driver <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={selectedDriverId}
                  onChange={e => {
                    setSelectedDriverId(e.target.value);
                    if (assignDriverError) setAssignDriverError('');
                  }}
                  className={assignDriverError ? 'input-error' : ''}
                >
                  <option value="">-- Choose an Available Driver --</option>
                  {drivers.map(d => {
                    const avail = getDriverAvailability(d, assignModalBooking);
                    const isCurrent = assignModalBooking.driver?._id === d._id || assignModalBooking.driver === d._id;
                    const isBlocked = !avail.available && !isCurrent;
                    return (
                      <option 
                        key={d._id} 
                        value={d._id}
                        disabled={isBlocked}
                        style={isBlocked ? { color: '#9ca3af', backgroundColor: '#fef2f2' } : {}}
                      >
                        {d.name} • {d.experienceYears}y exp • {
                          isCurrent
                            ? '⭐ Currently Assigned to This Trip'
                            : avail.available
                              ? '✓ Available'
                              : '⛔ ' + avail.reason
                        }
                      </option>
                    );
                  })}
                </select>
                {assignDriverError && (
                  <div className="field-error-text" style={{ marginTop: '6px', fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <FaExclamationTriangle size={12} />
                    <span>{assignDriverError}</span>
                  </div>
                )}
              </div>

              {/* Real-time Driver Roster Duty Roster for Trip Schedule */}
              <div style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FaUserTie /> Driver Availability ({formatDate(assignModalBooking.pickupDate)} to {formatDate(assignModalBooking.dropoffDate)}):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                  {drivers.map(d => {
                    const avail = getDriverAvailability(d, assignModalBooking);
                    const isCurrent = assignModalBooking.driver?._id === d._id || assignModalBooking.driver === d._id;
                    return (
                      <div 
                        key={d._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          background: isCurrent ? '#eff6ff' : avail.available ? '#f0fdf4' : '#fef2f2',
                          border: isCurrent ? '1px solid #bfdbfe' : avail.available ? '1px solid #bbf7d0' : '1px solid #fecaca'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          {d.name} <span style={{ color: '#64748b', fontWeight: 400 }}>({d.experienceYears}y exp)</span>
                        </span>
                        {isCurrent ? (
                          <span style={{ color: '#2563eb', fontWeight: 700 }}>✓ Assigned</span>
                        ) : avail.available ? (
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Free on these dates</span>
                        ) : (
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>⛔ {avail.reason}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cam-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setAssignModalBooking(null); setAssignDriverError(''); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={assignLoading}>
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Vehicle Return & Inspection Modal (Spacious Big Popup) */}
      {inspectModalBooking && (
        <div className="modal-backdrop" onClick={() => { setInspectModalBooking(null); setInspectErrors({}); }}>
          <div 
            className="custom-admin-modal modal-large" 
            onClick={e => e.stopPropagation()}
            style={{ 
              maxWidth: '840px', 
              width: '94%', 
              borderRadius: '20px', 
              maxHeight: '92vh', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.45)'
            }}
          >
            <div className="cam-header" style={{ padding: '20px 28px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaTachometerAlt style={{ color: '#f96d00' }} /> Vehicle Return Inspection &amp; Check-in
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Booking <strong>{inspectModalBooking.bookingReference}</strong> • Finalize vehicle condition, odometer, fuel, damages &amp; deposit release
                </p>
              </div>
              <button 
                type="button"
                className="cam-close" 
                onClick={() => { setInspectModalBooking(null); setInspectErrors({}); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleInspectSubmit} className="cam-body" noValidate style={{ padding: '24px 28px', overflowY: 'auto' }}>
              {/* Vehicle & Customer Overview Card */}
              <div style={{
                background: '#f8fafc', borderLeft: '5px solid #f96d00', border: '1px solid #e2e8f0',
                borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {inspectModalBooking.car?.name} <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>({inspectModalBooking.car?.plateNumber || 'Verified Fleet'})</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                    Customer: <strong>{getContactDetails(inspectModalBooking).name}</strong> • Phone: <strong>{getContactDetails(inspectModalBooking).phone || 'N/A'}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pickup Odometer</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{inspectModalBooking.inspection?.pickupOdometer || 12000} km</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trip Total (Rental)</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      ₹{inspectModalBooking.totalPrice || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Odometer & Fuel Level Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                <div className="auth-input-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Return Odometer (km) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={returnOdometer}
                    onChange={e => {
                      setReturnOdometer(e.target.value);
                      if (inspectErrors.returnOdometer) setInspectErrors(prev => ({ ...prev, returnOdometer: '' }));
                    }}
                    className={inspectErrors.returnOdometer ? 'input-error' : ''}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px' }}
                    placeholder="Enter current odometer reading"
                  />
                  {inspectErrors.returnOdometer && (
                    <div className="field-error-text" style={{ marginTop: '4px', fontSize: '11.5px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <FaExclamationTriangle size={11} />
                      <span>{inspectErrors.returnOdometer}</span>
                    </div>
                  )}
                </div>

                <div className="auth-input-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Return Fuel Level <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={returnFuelLevel}
                    onChange={e => {
                      setReturnFuelLevel(e.target.value);
                      if (inspectErrors.returnFuelLevel) setInspectErrors(prev => ({ ...prev, returnFuelLevel: '' }));
                    }}
                    className={inspectErrors.returnFuelLevel ? 'input-error' : ''}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', background: '#fff' }}
                  >
                    <option value="Full (100%)">Full (100%)</option>
                    <option value="75%">3/4 Tank (75%)</option>
                    <option value="50%">Half Tank (50%)</option>
                    <option value="25%">1/4 Tank (25%)</option>
                    <option value="Low (Refuel Needed)">Low (Refuel Needed)</option>
                  </select>
                  {inspectErrors.returnFuelLevel && (
                    <div className="field-error-text" style={{ marginTop: '4px', fontSize: '11.5px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <FaExclamationTriangle size={11} />
                      <span>{inspectErrors.returnFuelLevel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Charges / Damage / Late Fees Builder */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '18px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaDollarSign color="#f96d00" /> Additional Charges (Late Fee, Damages, Fuel, Fines)
                  </strong>
                  <button
                    type="button"
                    onClick={() => setAdditionalChargesList(prev => [...prev, { category: 'none', reason: '', amount: 0, notes: '' }])}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 12px', borderRadius: '6px',
                      background: '#fff', border: '1px solid #cbd5e1',
                      fontSize: '12px', fontWeight: 700, color: '#f96d00', cursor: 'pointer'
                    }}
                  >
                    <FaPlus size={10} /> Add Another Charge
                  </button>
                </div>

                <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b' }}>
                  Select a default charge reason from the dropdown or customize the reason. All charges will be added to the customer's outstanding balance &amp; itemized on the Tax Invoice.
                </p>

                {additionalChargesList.map((chg, idx) => (
                  <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.6fr 110px 36px', gap: '10px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Charge Category
                        </label>
                        <select
                          value={chg.category}
                          onChange={e => {
                            const cat = e.target.value;
                            const defaultOpt = DEFAULT_CHARGE_REASONS.find(r => r.value === cat);
                            setAdditionalChargesList(prev => prev.map((item, i) => i === idx ? {
                              ...item,
                              category: cat,
                              reason: defaultOpt?.defaultReason || item.reason
                            } : item));
                          }}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#fff' }}
                        >
                          {DEFAULT_CHARGE_REASONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Reason / Description on Invoice
                        </label>
                        <input
                          type="text"
                          value={chg.reason}
                          onChange={e => {
                            const val = e.target.value;
                            setAdditionalChargesList(prev => prev.map((item, i) => i === idx ? { ...item, reason: val } : item));
                          }}
                          placeholder="e.g. Bumper damage repair / 3 hours late return / Custom fee"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={chg.amount || ''}
                          onChange={e => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setAdditionalChargesList(prev => prev.map((item, i) => i === idx ? { ...item, amount: val } : item));
                          }}
                          placeholder="0"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700 }}
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          disabled={additionalChargesList.length <= 1}
                          onClick={() => setAdditionalChargesList(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            width: '34px', height: '34px', borderRadius: '6px',
                            border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: additionalChargesList.length <= 1 ? 'not-allowed' : 'pointer',
                            opacity: additionalChargesList.length <= 1 ? 0.4 : 1
                          }}
                          title="Remove Charge"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Real-time Calculation Card */}
                {(() => {
                  const startTotals = getBookingTotals(inspectModalBooking);
                  const addedSum = additionalChargesList.reduce((s, c) => s + (Number(c.amount) || 0), 0);
                  const estGrandTotal = startTotals.baseTotal + addedSum;
                  const estBalanceDue = Math.max(0, estGrandTotal - startTotals.totalPaid);

                  return (
                    <div style={{
                      marginTop: '12px', padding: '12px 16px', borderRadius: '8px',
                      background: '#fff', border: '1px solid #e2e8f0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
                      fontSize: '12.5px'
                    }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Base Rental:</span> <strong>₹{startTotals.baseTotal}</strong>
                        <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#64748b' }}>Additional Charges:</span> <strong style={{ color: addedSum > 0 ? '#ea580c' : '#0f172a' }}>+₹{addedSum}</strong>
                        <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#64748b' }}>Advance/Paid:</span> <strong style={{ color: '#16a34a' }}>₹{startTotals.totalPaid}</strong>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>
                        {estBalanceDue > 0 ? (
                          <span style={{ color: '#dc2626' }}>
                            Pending Balance to Collect: ₹{estBalanceDue}
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a' }}>
                            ✅ Fully Paid (₹0 Due)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="auth-input-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Inspector Return Notes
                </label>
                <textarea
                  rows="2"
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="Return condition remarks, vehicle exterior/interior clearance..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', minHeight: '65px' }}
                />
              </div>

              <div className="cam-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setInspectModalBooking(null)}
                  style={{ padding: '9px 18px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={inspectLoading}
                  style={{ padding: '9px 20px', fontSize: '13px' }}
                >
                  {inspectLoading ? 'Finalizing...' : 'Complete Return & Release Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Invoice View / Print Modal */}
      {invoiceBooking && (() => {
        const invTotals = getBookingTotals(invoiceBooking);
        return (
        <div className="modal-backdrop" onClick={() => setInvoiceBooking(null)}>
          <div className="invoice-modal-content" onClick={e => e.stopPropagation()}>
            <div className="invoice-actions-bar no-print">
              <div className="invoice-actions-left">
                {invoiceBooking.status === 'cancelled' ? (
                  <>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 12px', background: '#fef2f2', color: '#b91c1c',
                      border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: 700 
                    }}>
                      <FaBan /> Reservation Cancelled • Agreement Void
                    </span>
                    <small style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      Booking was cancelled • Charges and balance due are void.
                    </small>
                  </>
                ) : invoiceBooking.status === 'completed' || invoiceBooking.isLocked ? (
                  <>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 12px', background: '#ecfdf5', color: '#047857',
                      border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '12px', fontWeight: 700 
                    }}>
                      <FaCheckCircle /> Invoice Finalized &amp; Locked
                    </span>
                    <small style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      Trip completed • Financials are permanently locked.
                    </small>
                  </>
                ) : (
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px', background: '#eff6ff', color: '#1d4ed8',
                    border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', fontWeight: 700 
                  }}>
                    📄 Active Rental Agreement &amp; Tax Invoice
                  </span>
                )}
              </div>
              <div className="invoice-actions-right">
                <button className="invoice-btn-print" onClick={() => window.print()}>
                  <FaPrint /> Print / Save PDF
                </button>
                <button className="invoice-btn-close" onClick={() => setInvoiceBooking(null)}>
                  Close
                </button>
              </div>
            </div>

            <div className="invoice-paper">
              {/* TOP: Header, Parties, Items Table, and Terms/Summary */}
              <div className="invoice-main-content">
                {/* Header with Dynamic Settings */}
                <div className="invoice-header">
                  <div className="invoice-brand-col">
                    <h1 className="invoice-logo">
                      {settings?.businessName ? (
                        settings.businessName
                      ) : (
                        <>Car<span>Book</span> Mobility India</>
                      )}
                    </h1>
                    <p className="invoice-tagline">{settings?.tagline || 'Premium Vehicle Fleet & Driver Dispatch Services'}</p>
                    <p className="invoice-contact">{settings?.hubAddress || 'Connaught Place, New Delhi & Indiranagar, Bengaluru, India'}</p>
                    <p className="invoice-contact">
                      {settings?.supportEmail || 'contact@carbookindia.com'} • {settings?.supportPhone || '+91 73970 98447'}
                    </p>
                  </div>
                  <div className="invoice-meta-col">
                    <div className="invoice-doc-header-right">
                      <h2 className="invoice-doc-title">TAX INVOICE &amp; AGREEMENT</h2>
                      <span className={`invoice-status-badge status-${invoiceBooking.status}`}>
                        {invoiceBooking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="invoice-meta-grid">
                      <span className="meta-label">Invoice Ref:</span>
                      <strong className="meta-value" style={{ whiteSpace: 'nowrap' }}>{invoiceBooking.bookingReference}</strong>
                      <span className="meta-label">Invoice Date:</span>
                      <span className="meta-value" style={{ whiteSpace: 'nowrap' }}>{formatDate(invoiceBooking.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Parties Grid (Customer & Rental Schedule) */}
                <div className="invoice-parties-cards">
                  <div className="party-card">
                    <div className="party-card-title">BILLED TO (CUSTOMER)</div>
                    <div className="party-name">{invoiceBooking.user?.name || 'Customer'}</div>
                    <div className="party-detail">
                      <span className="p-label">Email:</span> {invoiceBooking.user?.email || 'N/A'}
                    </div>
                    <div className="party-detail">
                      <span className="p-label">Phone:</span> {invoiceBooking.user?.phone || 'N/A'}
                    </div>
                  </div>

                  <div className="party-card">
                    <div className="party-card-title">RENTAL SCHEDULE &amp; TYPE</div>
                    <div className="rental-type-tag">
                      {invoiceBooking.withDriver ? 'Rental With Driver' : 'Self-Drive Rental'}
                    </div>
                    <div className="party-detail">
                      <span className="p-label">Pick-up:</span> <strong style={{ whiteSpace: 'nowrap' }}>{formatDate(invoiceBooking.pickupDate)}</strong> <span style={{ color: '#64748b' }}>({invoiceBooking.pickupLocation})</span>
                    </div>
                    <div className="party-detail">
                      <span className="p-label">Drop-off:</span> <strong style={{ whiteSpace: 'nowrap' }}>{formatDate(invoiceBooking.dropoffDate || invoiceBooking.returnDate)}</strong> <span style={{ color: '#64748b' }}>({invoiceBooking.dropoffLocation || invoiceBooking.pickupLocation})</span>
                    </div>
                    {invoiceBooking.driver && (
                      <div className="party-detail highlight-chauffeur">
                        <span className="p-label">Assigned Driver:</span> {invoiceBooking.driver.name} ({invoiceBooking.driver.phone})
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <table className="invoice-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48%', textAlign: 'left' }}>Item Description</th>
                      <th style={{ width: '18%', textAlign: 'center' }}>Daily Rate</th>
                      <th style={{ width: '16%', textAlign: 'center' }}>Duration</th>
                      <th style={{ width: '18%', textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="item-main-title">{invoiceBooking.car?.name || 'Vehicle Rental'}</div>
                        <div className="item-sub-desc">
                          {invoiceBooking.car?.brand} {invoiceBooking.car?.model} ({invoiceBooking.car?.year || 2024}) • Plate: <strong>{invoiceBooking.car?.plateNumber || 'Verified Fleet'}</strong>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>₹{invoiceBooking.dailyRate}/day</td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{invoiceBooking.days} Day{invoiceBooking.days > 1 ? 's' : ''}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{invoiceBooking.subtotal}</td>
                    </tr>

                    {invoiceBooking.withDriver && (
                      <tr>
                        <td>
                          <div className="item-main-title">Professional Driver Service</div>
                          <div className="item-sub-desc">Dedicated verified driver for entire rental duration</div>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>₹{(invoiceBooking.driverFee / invoiceBooking.days).toFixed(0)}/day</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{invoiceBooking.days} Day{invoiceBooking.days > 1 ? 's' : ''}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{invoiceBooking.driverFee}</td>
                      </tr>
                    )}

                    {/* Itemized Additional Charges (damage, late fee, fuel, cleaning, custom) */}
                    {invTotals.additionalList.map((ac, idx) => {
                      const isDamage = ac.category === 'damage';
                      const getIcon = () => {
                        switch (ac.category) {
                          case 'damage': return '⚠️';
                          case 'late_fee': return '⏱️';
                          default: return '📌';
                        }
                      };
                      return (
                        <tr key={idx} style={{ background: isDamage ? '#fff5f5' : '#f8fafc' }}>
                          <td>
                            <div className="item-main-title" style={{ 
                              color: isDamage ? '#dc2626' : '#0f172a', 
                              fontWeight: isDamage ? 800 : 700,
                              display: 'flex', alignItems: 'center', gap: '6px' 
                            }}>
                              <span>{getIcon()}</span>
                              <span>{ac.reason}</span>
                            </div>
                            {ac.notes && (
                              <div className="item-sub-desc" style={{ color: isDamage ? '#991b1b' : '#64748b' }}>
                                {ac.notes}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>—</td>
                          <td style={{ textAlign: 'center' }}>1</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: isDamage ? '#dc2626' : '#0f172a', whiteSpace: 'nowrap' }}>
                            ₹{ac.amount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Bottom Row: Terms & Summary Box */}
                <div className="invoice-bottom-layout">
                  <div className="invoice-terms-box">
                    <div className="terms-title">Rental Terms &amp; Policies:</div>
                    <ul className="terms-list">
                      <li>Comprehensive commercial rental insurance coverage included.</li>
                      <li>Vehicle must be returned with the same fuel level as dispatched.</li>
                      <li>All rental payments and accidental damage settlements are permanently audited &amp; verified.</li>
                    </ul>

                    {invoiceBooking.payments && invoiceBooking.payments.length > 0 && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Payment Audit Ledger ({invoiceBooking.payments.length})
                        </div>
                        <div className="invoice-ledger-scroll">
                          <table className="invoice-ledger-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '4px 6px', width: '82px', minWidth: '82px', whiteSpace: 'nowrap' }}>Date</th>
                                <th style={{ padding: '4px 6px', width: '60px', whiteSpace: 'nowrap' }}>Type</th>
                                <th style={{ padding: '4px 6px', width: '60px', whiteSpace: 'nowrap' }}>Method</th>
                                <th style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>Ref #</th>
                                <th style={{ padding: '4px 6px', textAlign: 'right', width: '75px', minWidth: '75px', whiteSpace: 'nowrap' }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoiceBooking.payments.map((p, idx) => {
                                const pType = p.paymentType || p.type || 'payment';
                                const pMethod = p.paymentMethod || p.method || 'cash';
                                const pDate = p.paymentDate || p.date || p.createdAt;
                                const isRefund = pType === 'refund';
                                return (
                                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', fontWeight: 600 }}>{formatDate(pDate)}</td>
                                    <td style={{ padding: '4px 6px', textTransform: 'capitalize', fontWeight: 600, whiteSpace: 'nowrap' }}>{pType.replace('_', ' ')}</td>
                                    <td style={{ padding: '4px 6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{pMethod}</td>
                                    <td style={{ padding: '4px 6px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{p.transactionId || '—'}</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: isRefund ? '#dc2626' : '#059669', whiteSpace: 'nowrap' }}>
                                      {isRefund ? '-' : '+'} ₹{p.amount}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="invoice-summary-box">
                    <div className="summary-row">
                      <span>Base Rental ({invoiceBooking.days} Day{invoiceBooking.days > 1 ? 's' : ''}):</span>
                      <strong>₹{invTotals.baseRental}</strong>
                    </div>
                    {invTotals.driverFee > 0 && (
                      <div className="summary-row">
                        <span>Driver Daily Fee:</span>
                        <strong>₹{invTotals.driverFee}</strong>
                      </div>
                    )}
                    {invTotals.taxes > 0 && (
                      <div className="summary-row">
                        <span>GST / Govt Taxes:</span>
                        <strong>₹{invTotals.taxes}</strong>
                      </div>
                    )}
                    {invTotals.additionalList.length > 0 && (
                      <div className="summary-row" style={{ color: '#b45309', background: '#fffbeb', padding: '4px 8px', borderRadius: '6px' }}>
                        <span>Additional Charges ({invTotals.additionalList.length} items):</span>
                        <strong style={{ color: '#b45309' }}>+ ₹{invTotals.additionalTotal}</strong>
                      </div>
                    )}
                    <div className="summary-row total-row" style={{ borderTop: '2px solid #e2e8f0', marginTop: '6px', paddingTop: '6px' }}>
                      <span>Total Booking Charges (Grand Total):</span>
                      <strong className="total-amount">₹{invTotals.grandTotal}</strong>
                    </div>
                    <div className="summary-row" style={{ color: '#059669' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>Payments Received:</span>
                      <strong style={{ whiteSpace: 'nowrap' }}>- ₹{invTotals.totalPaid} <span style={{ fontSize: '10.5px', textTransform: 'uppercase', padding: '1px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>{invoiceBooking.paymentStatus}</span></strong>
                    </div>
                    {invoiceBooking.status === 'cancelled' ? (
                      <div className="summary-row" style={{ 
                        fontWeight: 800, 
                        fontSize: '13.5px', 
                        color: '#991b1b',
                        background: '#fee2e2',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        marginTop: '6px'
                      }}>
                        <span style={{ whiteSpace: 'nowrap' }}>Reservation Status:</span>
                        <strong style={{ whiteSpace: 'nowrap' }}>❌ Cancelled (₹0 Due / Void)</strong>
                      </div>
                    ) : (
                      <div className="summary-row" style={{ 
                        fontWeight: 800, 
                        fontSize: '13.5px', 
                        color: invTotals.balanceDue > 0 ? '#dc2626' : '#15803d',
                        background: invTotals.balanceDue > 0 ? '#fef2f2' : '#f0fdf4',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        marginTop: '6px'
                      }}>
                        <span style={{ whiteSpace: 'nowrap' }}>{invTotals.balanceDue > 0 ? 'Remaining Balance Due:' : 'Settlement Status:'}</span>
                        <strong style={{ whiteSpace: 'nowrap' }}>{invTotals.balanceDue > 0 ? `₹${invTotals.balanceDue}` : '✅ Fully Settled (₹0 Due)'}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM: Pinned Signatures & Legal Print Footer */}
              <div className="invoice-bottom-pinned">
                <div className="invoice-signatures-row">
                  <div className="sig-block">
                    <div className="sig-line"></div>
                    <span>Customer Signature / Acknowledgement</span>
                  </div>
                  <div className="sig-block right">
                    <div className="sig-line"></div>
                    <span>Authorized Representative (CarBook)</span>
                  </div>
                </div>

                <div className="invoice-print-footer">
                  <p>
                    {settings?.businessName || 'CarBook Mobility India'} • Official Rental Agreement &amp; Tax Invoice • Support: {settings?.supportPhone || '+91 73970 98447'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* 5. Payments & Financial Ledger Modal */}
      {paymentModalBooking && (
        <div className="modal-backdrop" onClick={() => { setPaymentModalBooking(null); setPaymentError(''); }}>
          <div 
            className="cam-modal-card" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '820px', width: '92%', background: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaDollarSign style={{ color: '#10b981' }} /> Payments &amp; Financial Ledger
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Booking <strong>{paymentModalBooking.bookingReference}</strong> • Customer: <strong>{getContactDetails(paymentModalBooking).name}</strong> • Vehicle: <strong>{paymentModalBooking.car?.name}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => { setPaymentModalBooking(null); setPaymentError(''); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                <FaTimes />
              </button>
            </div>

            {/* 4 KPI Summary Cards */}
            {(() => {
              const modalTotals = getBookingTotals(paymentModalBooking);
              const isSettledAndLocked = (paymentModalBooking.status === 'completed' || paymentModalBooking.isLocked) && modalTotals.balanceDue <= 0;

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Charges</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>₹{modalTotals.grandTotal}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Base ₹{modalTotals.baseTotal} {modalTotals.additionalTotal > 0 ? `+ Addl ₹${modalTotals.additionalTotal}` : ''}
                      </div>
                    </div>

                    <div style={{ background: '#ecfdf5', padding: '12px 14px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Amount Paid</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>₹{modalTotals.totalPaid}</div>
                      <div style={{ fontSize: '10.5px', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>
                        {paymentModalBooking.paymentStatus}
                      </div>
                    </div>

                    <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Advance Paid</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>₹{paymentModalBooking.advanceAmount || 0}</div>
                      <div style={{ fontSize: '10.5px', color: '#1d4ed8' }}>Advance Entry</div>
                    </div>

                    <div style={{ 
                      background: modalTotals.balanceDue > 0 ? '#fef2f2' : '#f0fdf4', 
                      padding: '12px 14px', borderRadius: '10px', 
                      border: modalTotals.balanceDue > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0' 
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: modalTotals.balanceDue > 0 ? '#b91c1c' : '#15803d', textTransform: 'uppercase' }}>
                        Outstanding Due
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: modalTotals.balanceDue > 0 ? '#dc2626' : '#16a34a', marginTop: '2px' }}>
                        ₹{modalTotals.balanceDue}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {modalTotals.balanceDue > 0 ? 'Remaining Balance' : 'Fully Settled'}
                      </div>
                    </div>
                  </div>

                  {/* If Trip is Completed & All Settled: Show Reassuring Finalized Badge */}
                  {isSettledAndLocked ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '16px 20px', borderRadius: '12px',
                      background: '#f0fdf4', border: '1.5px solid #86efac',
                      marginBottom: '20px'
                    }}>
                      <FaCheckCircle style={{ color: '#16a34a', fontSize: '26px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#15803d' }}>
                          Booking Finalized &amp; All Accounts Fully Settled
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#166534', marginTop: '2px' }}>
                          Trip is complete and locked. Total charges of ₹{modalTotals.grandTotal} have been 100% collected and verified. No further payment entry is required.
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Payment Entry Form (Only for active bookings or unsettled balances) */
                    <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaPlus size={11} style={{ color: '#f96d00' }} /> Record Payment / Settlement Entry
                      </div>

                      {paymentError && (
                        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaExclamationTriangle /> <span>{paymentError}</span>
                        </div>
                      )}

                      <form onSubmit={handlePaymentSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={paymentAmount}
                              onChange={e => setPaymentAmount(e.target.value)}
                              placeholder="e.g. 500"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Payment Category <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                              value={paymentType}
                              onChange={e => {
                                const nextType = e.target.value;
                                setPaymentType(nextType);
                                if (nextType === 'full' && modalTotals.balanceDue > 0) {
                                  setPaymentAmount(modalTotals.balanceDue);
                                }
                              }}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                            >
                              <option value="partial">Partial Payment / Installment</option>
                              <option value="full">Full Settlement (Clear Balance ₹{modalTotals.balanceDue})</option>
                              <option value="advance">Advance Payment</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Payment Method <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                              value={paymentMethod}
                              onChange={e => setPaymentMethod(e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                            >
                              <option value="cash">Cash</option>
                              <option value="upi">UPI / QR (GPay, PhonePe, Paytm)</option>
                              <option value="card">Credit / Debit Card</option>
                              <option value="bank_transfer">Bank Transfer / IMPS</option>
                              <option value="whatsapp">WhatsApp Pay</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Transaction / Ref ID
                            </label>
                            <input
                              type="text"
                              value={paymentTxnId}
                              onChange={e => setPaymentTxnId(e.target.value)}
                              placeholder="UTR / UPI Ref / Card Txn"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Payment Date
                            </label>
                            <input
                              type="date"
                              value={paymentDate}
                              onChange={e => setPaymentDate(e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                              Notes / Remarks
                            </label>
                            <input
                              type="text"
                              value={paymentNotes}
                              onChange={e => setPaymentNotes(e.target.value)}
                              placeholder="e.g. Paid at hub counter"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="submit"
                            className="btn-primary"
                            disabled={paymentLoading}
                            style={{ padding: '8px 18px', fontSize: '13px' }}
                          >
                            {paymentLoading ? 'Recording...' : 'Record Payment'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Payment History Ledger */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaHistory size={12} style={{ color: '#3b82f6' }} /> Payment History &amp; Transaction Ledger
              </div>

              {(!paymentModalBooking.payments || paymentModalBooking.payments.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '13px' }}>
                  No payment ledger entries recorded yet for this booking.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 12px' }}>Date</th>
                        <th style={{ padding: '10px 12px' }}>Category</th>
                        <th style={{ padding: '10px 12px' }}>Method</th>
                        <th style={{ padding: '10px 12px' }}>Transaction ID</th>
                        <th style={{ padding: '10px 12px' }}>Notes</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentModalBooking.payments.map((p, idx) => {
                        const pType = p.paymentType || p.type || 'payment';
                        const pMethod = p.paymentMethod || p.method || 'cash';
                        const pDate = p.paymentDate || p.date || p.createdAt;
                        const isRefund = pType === 'refund';

                        const getCategoryLabel = (type) => {
                          switch (type) {
                            case 'advance': return 'Advance Payment';
                            case 'deposit': return 'Security Deposit';
                            case 'damage_fee': return 'Damage Charge';
                            case 'refund': return 'Deposit Refund';
                            case 'full': return 'Full Settlement';
                            case 'partial': return 'Partial Payment';
                            default: return type ? type.replace('_', ' ').toUpperCase() : 'Payment';
                          }
                        };

                        const getMethodLabel = (method) => {
                          switch (method?.toLowerCase()) {
                            case 'upi': return 'UPI / QR';
                            case 'card': return 'Card Payment';
                            case 'bank_transfer': return 'Bank Transfer';
                            case 'whatsapp': return 'WhatsApp Pay';
                            case 'cash': return 'Cash Handover';
                            default: return method ? method.toUpperCase() : 'Cash';
                          }
                        };

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontWeight: 600, color: '#334155' }}>
                              {formatDate(pDate)}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ 
                                display: 'inline-block',
                                padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                background: isRefund ? '#fef2f2' : pType === 'advance' ? '#eff6ff' : pType === 'deposit' ? '#fffbeb' : '#ecfdf5',
                                color: isRefund ? '#dc2626' : pType === 'advance' ? '#1d4ed8' : pType === 'deposit' ? '#b45309' : '#047857',
                                border: `1px solid ${isRefund ? '#fecaca' : pType === 'advance' ? '#bfdbfe' : pType === 'deposit' ? '#fde68a' : '#a7f3d0'}`
                              }}>
                                {getCategoryLabel(pType)}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                              {getMethodLabel(pMethod)}
                            </td>
                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>
                              {p.transactionId ? (
                                <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                  {p.transactionId}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>Counter Direct</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>
                              {p.notes || (pType === 'advance' ? 'Advance paid at booking' : pType === 'deposit' ? 'Security deposit hold' : pType === 'refund' ? 'Deposit refund disbursed' : 'Counter payment received')}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: '13.5px', color: isRefund ? '#dc2626' : '#059669' }}>
                              {isRefund ? '-' : '+'} ₹{p.amount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setPaymentModalBooking(null); setPaymentError(''); }}
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Admin Create Booking with Advance Payment Modal */}
      {showCreateBookingModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateBookingModal(false)}>
          <div 
            className="cam-modal-card" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '720px', width: '92%', background: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Create Direct Booking &amp; Record Advance Payment
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Direct admin booking entry with customer details, car selection, and initial payment.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateBookingModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                <FaTimes />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaExclamationTriangle /> <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBookingSubmit}>
              {/* Car Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Vehicle <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={createForm.carId}
                  onChange={e => {
                    const list = Array.isArray(carsList) ? carsList : [];
                    const selectedCar = list.find(c => c._id === e.target.value);
                    setCreateForm(prev => ({
                      ...prev,
                      carId: e.target.value,
                      securityDeposit: selectedCar?.securityDeposit !== undefined ? selectedCar.securityDeposit : prev.securityDeposit
                    }));
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', background: '#fff' }}
                >
                  <option value="">-- Choose available vehicle --</option>
                  {(Array.isArray(carsList) ? carsList : []).map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.brand} {c.model}) • ₹{c.pricePerDay}/day • Plate: {c.plateNumber || 'Fleet'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Customer Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.customerName}
                    onChange={e => setCreateForm(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Customer Phone <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.customerPhone}
                    onChange={e => setCreateForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={createForm.customerEmail}
                    onChange={e => setCreateForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="e.g. ramesh@example.com"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Dates & Rental Type */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Pick-up Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.pickupDate}
                    onChange={e => setCreateForm(prev => ({ ...prev, pickupDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Return Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.returnDate}
                    onChange={e => setCreateForm(prev => ({ ...prev, returnDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={createForm.withDriver}
                      onChange={e => setCreateForm(prev => ({ ...prev, withDriver: e.target.checked }))}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Include Professional Driver
                  </label>
                </div>
              </div>

              {/* Financial & Advance Payment Section */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Advance Payment &amp; Deposit Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Advance Payment Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={createForm.advanceAmount}
                      onChange={e => setCreateForm(prev => ({ ...prev, advanceAmount: e.target.value }))}
                      placeholder="e.g. 1000"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Advance Payment Method
                    </label>
                    <select
                      value={createForm.paymentMethod}
                      onChange={e => setCreateForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / QR</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Advance Txn / UTR Ref
                    </label>
                    <input
                      type="text"
                      value={createForm.transactionId}
                      onChange={e => setCreateForm(prev => ({ ...prev, transactionId: e.target.value }))}
                      placeholder="e.g. UPI-123456"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateBookingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating Booking...' : 'Create Booking & Confirm'}
                </button>
              </div>
            </form>
          </div>
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
