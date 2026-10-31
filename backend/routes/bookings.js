const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Driver = require('../models/Driver');
const Settings = require('../models/Settings');
const User = require('../models/User');
const { userAuth, adminAuth } = require('../middleware/auth');
const { notifyAdmin } = require('../utils/notify');

// 1. Calculate Itemized Rental Quote (Server-Side)
router.post('/quote', async (req, res) => {
  try {
    const { carId, pickupDate, dropoffDate, withDriver, rentalPeriodType } = req.body;
    if (!carId || !pickupDate || !dropoffDate) {
      return res.status(400).json({ message: 'carId, pickupDate, and dropoffDate are required' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const settings = await Settings.getSettings();
    const reqStart = new Date(pickupDate);
    reqStart.setHours(0, 0, 0, 0);
    const reqEnd = new Date(dropoffDate);
    reqEnd.setHours(23, 59, 59, 999);

    const diffDays = Math.round((new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24));
    const days = Math.max(1, diffDays <= 0 ? 1 : diffDays);

    const dailyRate = car.pricePerDay;
    const subtotal = days * car.pricePerDay;
    const rateTypeApplied = rentalPeriodType || (days >= 30 ? 'monthly' : days >= 7 ? 'weekly' : 'daily');
    const driverDailyFee = settings.driverDailyFee !== undefined && settings.driverDailyFee !== null ? Number(settings.driverDailyFee) : 999;
    const driverFee = withDriver ? (days * driverDailyFee) : 0;
    const taxRatePercent = settings.taxRatePercent !== undefined && settings.taxRatePercent !== null ? Number(settings.taxRatePercent) : 0;
    const taxRate = taxRatePercent / 100;
    const taxAmount = Math.round((subtotal + driverFee) * taxRate);
    const securityDeposit = 0;
    const totalPrice = subtotal + driverFee + taxAmount;

    // Check overlap with active bookings
    const overlap = await Booking.findOne({
      car: carId,
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
      $or: [
        { pickupDate: { $lte: reqEnd }, dropoffDate: { $gte: reqStart } }
      ]
    }).select('bookingReference pickupDate dropoffDate');

    res.json({
      days,
      dailyRate,
      standardDailyRate: car.pricePerDay,
      rateTypeApplied,
      subtotal,
      rentalSubtotal: subtotal,
      withDriver: !!withDriver,
      driverDailyFee,
      driverFee,
      driverFeeTotal: driverFee,
      taxRatePercent,
      taxAmount,
      securityDeposit,
      totalPrice,
      totalPayable: totalPrice,
      currency: settings.currency || 'INR',
      currencySymbol: settings.currencySymbol || '₹',
      isAvailable: !overlap,
      conflict: overlap ? {
        bookingReference: overlap.bookingReference,
        pickupDate: overlap.pickupDate,
        dropoffDate: overlap.dropoffDate
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Create Booking with Conflict Prevention (User)
router.post('/', userAuth, async (req, res) => {
  try {
    const { 
      carId, pickupDate, dropoffDate, pickupLocation, dropoffLocation, 
      withDriver, paymentMethod, notes, bookingSource, advanceAmount, transactionId,
      rentalDurationType, rentalPeriodType
    } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    if (car.status === 'unavailable') {
      return res.status(400).json({ message: 'This vehicle is currently decommissioned' });
    }

    const reqStart = new Date(pickupDate);
    reqStart.setHours(0, 0, 0, 0);
    const reqEnd = new Date(dropoffDate);
    reqEnd.setHours(23, 59, 59, 999);

    if (reqStart > reqEnd) {
      return res.status(400).json({ message: 'Drop-off date cannot precede pick-up date' });
    }

    // Check maintenance blocks
    if (car.blockedDates && car.blockedDates.length > 0) {
      const isBlocked = car.blockedDates.some(b => 
        (reqStart <= new Date(b.endDate)) && (reqEnd >= new Date(b.startDate))
      );
      if (isBlocked) {
        return res.status(400).json({ 
          message: 'Vehicle is scheduled for service/maintenance during these dates. Please choose another date range.' 
        });
      }
    }

    // Server-Side Overlap Locking: Check confirmed or ongoing rentals
    const overlappingBooking = await Booking.findOne({
      car: carId,
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
      $or: [
        { pickupDate: { $lte: reqEnd }, dropoffDate: { $gte: reqStart } }
      ]
    });

    if (overlappingBooking) {
      const fromStr = new Date(overlappingBooking.pickupDate).toLocaleDateString();
      const toStr = new Date(overlappingBooking.dropoffDate).toLocaleDateString();
      return res.status(400).json({
        message: `This vehicle already has a confirmed reservation from ${fromStr} to ${toStr} (Ref: ${overlappingBooking.bookingReference}). Please choose other available dates.`
      });
    }

    // Server-Side Price Calculation
    const settings = await Settings.getSettings();
    const durationPlan = rentalDurationType || rentalPeriodType || 'daily';
    const isCustomInquiry = durationPlan !== 'daily';

    const diffDays = Math.round((new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24));
    const days = Math.max(1, diffDays <= 0 ? 1 : diffDays);
    const dailyRate = isCustomInquiry ? 0 : car.pricePerDay;
    const subtotal = isCustomInquiry ? 0 : (days * car.pricePerDay);
    const driverDailyFee = settings.driverDailyFee !== undefined && settings.driverDailyFee !== null ? Number(settings.driverDailyFee) : 999;
    const driverFee = (!isCustomInquiry && withDriver) ? (days * driverDailyFee) : 0;
    const taxRatePercent = settings.taxRatePercent !== undefined && settings.taxRatePercent !== null ? Number(settings.taxRatePercent) : 0;
    const taxRate = taxRatePercent / 100;
    const taxAmount = isCustomInquiry ? 0 : Math.round((subtotal + driverFee) * taxRate);
    const securityDeposit = 0;
    const totalPrice = isCustomInquiry ? 0 : (subtotal + driverFee + taxAmount);

    // All customer reservations are via WhatsApp; admin direct bookings are via Admin
    const resolvedSource = bookingSource === 'admin' ? 'admin' : 'whatsapp';

    // Initial payments processing
    const initialAdvance = Math.max(0, Number(advanceAmount) || 0);
    const paymentsList = [];
    if (initialAdvance > 0) {
      paymentsList.push({
        amount: initialAdvance,
        paymentType: 'advance',
        paymentMethod: paymentMethod === 'whatsapp' ? 'whatsapp' : (paymentMethod || 'cash'),
        transactionId: transactionId || '',
        paymentDate: new Date(),
        notes: 'Advance payment collected at booking reservation',
        receivedBy: 'System'
      });
    }

    let initialPaymentStatus = 'pending';
    if (totalPrice > 0 && initialAdvance >= totalPrice) {
      initialPaymentStatus = 'fully_paid';
    } else if (initialAdvance > 0) {
      initialPaymentStatus = 'partial_paid';
    } else if (paymentMethod === 'card' && totalPrice > 0) {
      initialPaymentStatus = 'fully_paid';
    }

    const booking = new Booking({
      bookingReference: 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      user: req.user.id,
      car: carId,
      rentalType: withDriver ? 'with_driver' : 'self_drive',
      rentalDurationType: durationPlan,
      withDriver: !isCustomInquiry && !!withDriver,
      driverStatus: (!isCustomInquiry && withDriver) ? 'assignment_pending' : 'none',
      pickupDate: reqStart,
      dropoffDate: reqEnd,
      pickupLocation: pickupLocation || (isCustomInquiry ? 'Custom Package on Request' : (car.location || 'Main Airport Hub')),
      dropoffLocation: dropoffLocation || pickupLocation || (isCustomInquiry ? 'Custom Package on Request' : 'Main Airport Hub'),
      days,
      dailyRate,
      subtotal,
      driverFee,
      taxAmount,
      securityDeposit,
      totalPrice,
      bookingSource: resolvedSource,
      paymentMethod: paymentMethod || 'cash_on_pickup',
      paymentStatus: initialPaymentStatus,
      paidAmount: initialAdvance,
      advanceAmount: initialAdvance,
      payments: paymentsList,
      status: 'pending',
      notes: notes || '',
      inspection: {
        pickupOdometer: car.mileage ? parseInt(car.mileage.replace(/\D/g, '')) || 12000 : 12000,
        pickupFuelLevel: 'Full (100%)',
        pickupNotes: 'Pre-rental inspection verified.'
      }
    });

    await booking.save();

    // Trigger Admin Notification
    const customerUser = await User.findById(req.user.id).select('name phone email');
    const customerDisplayName = customerUser?.name || 'Customer';

    await notifyAdmin({
      type: 'booking_created',
      title: resolvedSource === 'admin' ? 'New Admin Direct Booking' : 'New WhatsApp Booking',
      message: `Reservation #${booking.bookingReference} received via ${resolvedSource.toUpperCase()} for ${car.brand} ${car.name}`,
      booking: booking._id,
      bookingReference: booking.bookingReference,
      customerName: customerDisplayName,
      amount: booking.totalPrice,
      source: resolvedSource,
      metadata: { carId: car._id, carName: car.name, days, totalPrice }
    });

    if (initialAdvance > 0) {
      await notifyAdmin({
        type: 'payment_received',
        title: 'Advance Payment Received',
        message: `Advance payment of ₹${initialAdvance} recorded for #${booking.bookingReference}`,
        booking: booking._id,
        bookingReference: booking.bookingReference,
        customerName: customerDisplayName,
        amount: initialAdvance,
        source: resolvedSource
      });
    }

    const populated = await Booking.findById(booking._id)
      .populate('car')
      .populate('user', 'name email phone');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2b. Direct Admin Booking Creation
router.post('/admin', adminAuth, async (req, res) => {
  try {
    const { 
      carId, customerName, customerPhone, customerEmail,
      pickupDate, dropoffDate, pickupLocation, dropoffLocation, 
      withDriver, paymentMethod, notes, bookingSource,
      advanceAmount, transactionId, securityDeposit: customDeposit
    } = req.body;

    const carIdentifier = req.body.carId || req.body.car;
    const finalDropoffDate = req.body.dropoffDate || req.body.returnDate;

    if (!carIdentifier || !pickupDate || !finalDropoffDate) {
      return res.status(400).json({ message: 'Car, pickup date, and return/dropoff date are required' });
    }

    const car = await Car.findById(carIdentifier);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    // Find or create customer
    let customer = null;
    if (customerEmail || customerPhone) {
      customer = await User.findOne({
        $or: [
          ...(customerEmail ? [{ email: customerEmail.toLowerCase() }] : []),
          ...(customerPhone ? [{ phone: customerPhone }] : [])
        ]
      });
    }

    if (!customer) {
      customer = new User({
        name: customerName || 'Direct Customer',
        email: customerEmail ? customerEmail.toLowerCase() : `cust_${Date.now()}@direct.carbook`,
        phone: customerPhone || '',
        password: Math.random().toString(36).slice(2) + 'CarBook@99',
        role: 'customer'
      });
      await customer.save();
    }

    const reqStart = new Date(pickupDate);
    reqStart.setHours(0, 0, 0, 0);
    const reqEnd = new Date(finalDropoffDate);
    reqEnd.setHours(23, 59, 59, 999);

    const settings = await Settings.getSettings();
    const days = Math.max(1, Math.ceil((reqEnd - reqStart) / (1000 * 60 * 60 * 24)));
    const dailyRate = car.pricePerDay;
    const subtotal = days * dailyRate;
    const driverDailyFee = settings.driverDailyFee !== undefined && settings.driverDailyFee !== null ? Number(settings.driverDailyFee) : 999;
    const driverFee = withDriver ? (days * driverDailyFee) : 0;
    const taxRatePercent = settings.taxRatePercent !== undefined && settings.taxRatePercent !== null ? Number(settings.taxRatePercent) : 0;
    const taxRate = taxRatePercent / 100;
    const taxAmount = Math.round((subtotal + driverFee) * taxRate);
    const securityDeposit = 0;
    const totalPrice = subtotal + driverFee + taxAmount;

    const initialAdvance = Math.max(0, Number(advanceAmount) || 0);
    const paymentsList = [];
    if (initialAdvance > 0) {
      paymentsList.push({
        amount: initialAdvance,
        paymentType: 'advance',
        paymentMethod: paymentMethod || 'cash',
        transactionId: transactionId || '',
        paymentDate: new Date(),
        notes: 'Advance payment collected during direct booking entry',
        receivedBy: req.admin?.name || 'Admin'
      });
    }

    let initialPaymentStatus = 'pending';
    if (initialAdvance >= totalPrice) {
      initialPaymentStatus = 'fully_paid';
    } else if (initialAdvance > 0) {
      initialPaymentStatus = 'partial_paid';
    }

    const booking = new Booking({
      bookingReference: 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      user: customer._id,
      car: carId,
      rentalType: withDriver ? 'with_driver' : 'self_drive',
      withDriver: !!withDriver,
      driverStatus: withDriver ? 'assignment_pending' : 'none',
      pickupDate: reqStart,
      dropoffDate: reqEnd,
      pickupLocation: pickupLocation || car.location || 'Main Hub',
      dropoffLocation: dropoffLocation || pickupLocation || 'Main Hub',
      days,
      dailyRate,
      subtotal,
      driverFee,
      taxAmount,
      securityDeposit,
      totalPrice,
      bookingSource: bookingSource || 'admin',
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: initialPaymentStatus,
      paidAmount: initialAdvance,
      advanceAmount: initialAdvance,
      payments: paymentsList,
      status: 'confirmed',
      notes: notes || '',
      inspection: {
        pickupOdometer: car.mileage ? parseInt(car.mileage.replace(/\D/g, '')) || 12000 : 12000,
        pickupFuelLevel: 'Full (100%)',
        pickupNotes: 'Pre-rental verified by Admin'
      }
    });

    await booking.save();

    await notifyAdmin({
      type: 'booking_created',
      title: 'Direct Admin Booking Created',
      message: `Direct reservation #${booking.bookingReference} confirmed for ${car.brand} ${car.name}`,
      booking: booking._id,
      bookingReference: booking.bookingReference,
      customerName: customer.name,
      amount: booking.totalPrice,
      source: 'admin'
    });

    const populated = await Booking.findById(booking._id)
      .populate('car')
      .populate('user', 'name email phone');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Get All Bookings (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, carId, source } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (carId) query.car = carId;
    if (source && source !== 'all') {
      if (source === 'admin') {
        query.bookingSource = 'admin';
      } else {
        query.bookingSource = { $ne: 'admin' };
      }
    }

    const bookings = await Booking.find(query)
      .populate('car')
      .populate('user', 'name email phone')
      .populate('driver', 'name phone licenceNumber rating')
      .sort({ createdAt: -1 });

    const normalized = bookings.map(b => {
      const obj = b.toObject();
      if (!obj.bookingSource || obj.bookingSource === 'web') {
        obj.bookingSource = 'whatsapp';
      }
      return obj;
    });

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Get My Bookings (Customer)
router.get('/my', userAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('car')
      .populate('user', 'name email phone')
      .populate('driver', 'name phone rating avatar')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Get Booking by ID
router.get('/:id', userAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('user', 'name email phone')
      .populate('driver', 'name phone licenceNumber rating');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. Admin Update Status
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Validation: When a trip is ongoing, it cannot be cancelled or reverted - must be completed first
    if (booking.status === 'ongoing' && status !== 'completed') {
      return res.status(400).json({ 
        message: `Cannot transition an ongoing trip to "${status}". The trip is currently in progress and must be completed first.` 
      });
    }

    // Validation: For withDriver bookings, driver must be assigned before dispatching (ongoing)
    if (status === 'ongoing' && booking.withDriver && !booking.driver) {
      return res.status(400).json({
        message: 'Cannot dispatch trip: This booking was reserved with a driver. You must assign a professional driver before dispatching.'
      });
    }

    if (status === 'confirmed') {
      // Overlap check: Ensure no already-confirmed reservation overlaps with this booking
      const overlap = await Booking.findOne({
        _id: { $ne: booking._id },
        car: booking.car,
        status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
        $or: [
          { pickupDate: { $lte: booking.dropoffDate }, dropoffDate: { $gte: booking.pickupDate } }
        ]
      });
      if (overlap) {
        return res.status(400).json({
          message: `Cannot confirm booking: Vehicle already has a confirmed booking (${overlap.bookingReference}) for these dates.`
        });
      }
    }

    booking.status = status;
    if (status === 'completed' || status === 'cancelled' || status === 'refunded') {
      booking.isLocked = true;
      await Car.findByIdAndUpdate(booking.car, { status: 'available' });
      if (booking.driver) {
        await Driver.findByIdAndUpdate(booking.driver, { status: 'active' });
      }
    } else if (status === 'confirmed') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const bStart = new Date(booking.pickupDate);
      const bEnd = new Date(booking.dropoffDate);
      bEnd.setHours(23, 59, 59, 999);

      if (bStart <= todayEnd && bEnd >= todayStart) {
        await Car.findByIdAndUpdate(booking.car, { status: 'rented' });
      }
    } else if (status === 'ongoing') {
      await Car.findByIdAndUpdate(booking.car, { status: 'rented' });
      if (booking.driver) {
        await Driver.findByIdAndUpdate(booking.driver, { status: 'on_duty' });
      }
    }

    await booking.save();

    // Trigger Admin Notification
    const customerName = booking.user?.name || 'Customer';
    if (status === 'confirmed') {
      await notifyAdmin({
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Booking #${booking.bookingReference} confirmed for ${customerName}. Vehicle dispatched / reserved.`,
        booking: booking._id,
        bookingReference: booking.bookingReference,
        customerName,
        amount: booking.totalPrice,
        source: booking.bookingSource || 'admin'
      });
    } else if (status === 'cancelled') {
      await notifyAdmin({
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Booking #${booking.bookingReference} was cancelled`,
        booking: booking._id,
        bookingReference: booking.bookingReference,
        customerName,
        amount: booking.totalPrice,
        source: booking.bookingSource || 'admin'
      });
    }

    const updated = await Booking.findById(booking._id)
      .populate('car')
      .populate('user', 'name email phone')
      .populate('driver');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 7. Admin Assign Driver to Booking
router.put('/:id/assign-driver', adminAuth, async (req, res) => {
  try {
    const { driverId } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const bookingStart = new Date(booking.pickupDate);
    const bookingEnd = new Date(booking.dropoffDate);

    // Check driver overlapping assignments
    const driverConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      driver: driverId,
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
      pickupDate: { $lte: bookingEnd },
      dropoffDate: { $gte: bookingStart }
    }).populate('car', 'name plateNumber');

    if (driverConflict) {
      const conflictStart = new Date(driverConflict.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const conflictEnd = new Date(driverConflict.dropoffDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const carInfo = driverConflict.car?.name ? `with vehicle "${driverConflict.car.name}"` : '';
      return res.status(400).json({
        message: `Driver ${driver.name} is already assigned on duty to booking "${driverConflict.bookingReference}" ${carInfo} from ${conflictStart} to ${conflictEnd}. Once that trip is completed or cancelled, this driver will become assignable.`
      });
    }

    booking.driver = driverId;
    booking.driverStatus = 'assigned';
    booking.status = 'driver_assigned';
    await booking.save();

    // If trip schedule is currently active today, set driver status to on_duty
    const now = new Date();
    if (bookingStart <= now && bookingEnd >= now) {
      await Driver.findByIdAndUpdate(driverId, { status: 'on_duty' });
    }

    res.json(await Booking.findById(booking._id).populate('car').populate('driver').populate('user'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 7b. Admin Toggle Driver (Switch between With Driver and Self-Drive & Recalculate Totals)
router.put('/:id/toggle-driver', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.isLocked || booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        message: 'This booking is completed or cancelled. Driver configuration cannot be modified.'
      });
    }

    const targetWithDriver = req.body.withDriver !== undefined
      ? !!req.body.withDriver
      : !booking.withDriver;

    const settings = await Settings.getSettings();

    if (!targetWithDriver) {
      // Switching to Self-Drive: Remove driver, driver fee, and reset status if needed
      const prevDriverId = booking.driver;
      booking.withDriver = false;
      booking.rentalType = 'self_drive';
      booking.driver = null;
      booking.driverStatus = 'none';
      if (booking.status === 'driver_assigned') {
        booking.status = 'confirmed';
      }
      booking.driverFee = 0;

      // Free up driver status if they have no other ongoing trips
      if (prevDriverId) {
        const otherTrips = await Booking.countDocuments({
          _id: { $ne: booking._id },
          driver: prevDriverId,
          status: { $in: ['driver_assigned', 'ongoing'] }
        });
        if (otherTrips === 0) {
          await Driver.findByIdAndUpdate(prevDriverId, { status: 'active' });
        }
      }
    } else {
      // Switching to With Driver: Add driver fee
      booking.withDriver = true;
      booking.rentalType = 'with_driver';
      booking.driverStatus = 'assignment_pending';
      const driverDailyFee = settings.driverDailyFee !== undefined && settings.driverDailyFee !== null
        ? Number(settings.driverDailyFee)
        : 999;
      booking.driverFee = (Number(booking.days) || 1) * driverDailyFee;
    }

    // Recalculate tax
    const taxRatePercent = settings.taxRatePercent !== undefined && settings.taxRatePercent !== null
      ? Number(settings.taxRatePercent)
      : 0;
    const taxRate = taxRatePercent / 100;
    booking.taxAmount = Math.round(((Number(booking.subtotal) || 0) + (Number(booking.driverFee) || 0)) * taxRate);

    // Recalculate Grand Total
    const baseCharges = (Number(booking.subtotal) || 0) + (Number(booking.driverFee) || 0) + (Number(booking.taxAmount) || 0);
    const totalAdditional = (booking.additionalCharges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const totalDamages = Array.isArray(booking.damageCharges)
      ? booking.damageCharges.reduce((s, d) => s + (Number(d.amount) || 0), 0)
      : (Number(booking.damageCharges) || 0);
    const extraInsp = Number(booking.inspection?.extraCharges) || 0;

    booking.totalPrice = baseCharges + totalAdditional + totalDamages + extraInsp;

    // Recalculate payment status
    const totalPaid = (booking.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    booking.paidAmount = totalPaid;
    if (booking.paidAmount >= booking.totalPrice && booking.totalPrice > 0) {
      booking.paymentStatus = 'fully_paid';
    } else if (booking.paidAmount > 0) {
      booking.paymentStatus = 'partial_paid';
    } else {
      booking.paymentStatus = 'pending';
    }

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('car')
      .populate('driver')
      .populate('user');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 8. Admin Update Booking (Security Deposit, Notes, etc.)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Lock enforcement: once trip is completed or locked, invoice & financials cannot be altered
    if (booking.isLocked || booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'This booking is completed and finalized. Invoice and security deposit are locked and cannot be modified.' 
      });
    }

    if (req.body.securityDeposit !== undefined) {
      booking.securityDeposit = Math.max(0, Number(req.body.securityDeposit) || 0);
    }
    if (req.body.notes !== undefined) {
      booking.notes = req.body.notes;
    }
    if (req.body.paymentStatus !== undefined) {
      booking.paymentStatus = req.body.paymentStatus;
    }

    await booking.save();
    const updated = await Booking.findById(booking._id)
      .populate('car')
      .populate('user', 'name email phone')
      .populate('driver');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 8b. Admin Record Payment (Advance, Partial, Full, Deposit, Damage Fee, Refund)
router.post('/:id/payments', adminAuth, async (req, res) => {
  try {
    const { amount, paymentType, paymentMethod, transactionId, notes, paymentDate } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount greater than zero is required' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Deduplication check: if transactionId provided, ensure it's not already entered for this booking
    if (transactionId && transactionId.trim()) {
      const exists = (booking.payments || []).some(
        p => p.transactionId && p.transactionId.toLowerCase() === transactionId.trim().toLowerCase()
      );
      if (exists) {
        return res.status(400).json({ message: `Transaction ID "${transactionId}" has already been recorded for this booking.` });
      }
    }

    // Clean payment types: advance, partial, full
    const validPaymentType = ['advance', 'partial', 'full'].includes(paymentType)
      ? paymentType
      : 'partial';

    const newPayment = {
      amount: numAmount,
      paymentType: validPaymentType,
      paymentMethod: paymentMethod || 'cash',
      transactionId: transactionId ? transactionId.trim() : '',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes: notes || '',
      receivedBy: req.admin?.name || 'Admin'
    };

    if (!booking.payments) booking.payments = [];
    booking.payments.push(newPayment);

    // Sum all recorded payments
    const totalPaid = booking.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    booking.paidAmount = totalPaid;

    // Track total advance
    booking.advanceAmount = booking.payments
      .filter(p => p.paymentType === 'advance')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Calculate Grand Total: Base rental + all additional charges
    const baseCharges = (Number(booking.subtotal) || 0) + (Number(booking.driverFee) || 0) + (Number(booking.taxAmount) || 0);
    const totalAdditional = (booking.additionalCharges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const totalDamages = Array.isArray(booking.damageCharges)
      ? booking.damageCharges.reduce((s, d) => s + (Number(d.amount) || 0), 0)
      : (Number(booking.damageCharges) || 0);
    const extraInsp = Number(booking.inspection?.extraCharges) || 0;

    booking.totalPrice = (baseCharges > 0 ? baseCharges : (booking.totalPrice || 0)) + totalAdditional + totalDamages + extraInsp;

    // Accurate payment status
    if (booking.paidAmount >= booking.totalPrice) {
      booking.paymentStatus = 'fully_paid';
    } else if (booking.paidAmount > 0) {
      booking.paymentStatus = 'partial_paid';
    } else {
      booking.paymentStatus = 'pending';
    }

    await booking.save();

    // Trigger Admin Notification
    const customerName = booking.user?.name || 'Customer';
    const notifTitle = validPaymentType === 'advance' 
      ? 'Advance Payment Recorded' 
      : validPaymentType === 'full' 
        ? 'Full Payment Settled' 
        : 'Partial Payment Logged';

    const balanceRemaining = Math.max(0, booking.totalPrice - booking.paidAmount);

    await notifyAdmin({
      type: 'payment_received',
      title: notifTitle,
      message: `${validPaymentType.toUpperCase()} of ₹${numAmount} logged for #${booking.bookingReference} (${paymentMethod || 'cash'}). Balance due: ₹${balanceRemaining}`,
      booking: booking._id,
      bookingReference: booking.bookingReference,
      customerName,
      amount: numAmount,
      source: 'admin'
    });

    const updated = await Booking.findById(booking._id)
      .populate('car')
      .populate('user', 'name email phone')
      .populate('driver');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 8c. Admin Add Additional Charge (Late fee, Damage, Fuel, Cleaning, etc.)
router.post('/:id/additional-charges', adminAuth, async (req, res) => {
  try {
    const { category, reason, amount, notes } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid charge amount greater than zero is required' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason for additional charge is required' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!booking.additionalCharges) booking.additionalCharges = [];
    booking.additionalCharges.push({
      category: category || 'other',
      reason: reason.trim(),
      amount: numAmount,
      date: new Date(),
      notes: notes || ''
    });

    // Recalculate Grand Total
    const baseCharges = (Number(booking.subtotal) || 0) + (Number(booking.driverFee) || 0) + (Number(booking.taxAmount) || 0);
    const totalAdditional = booking.additionalCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const totalDamages = Array.isArray(booking.damageCharges)
      ? booking.damageCharges.reduce((s, d) => s + (Number(d.amount) || 0), 0)
      : (Number(booking.damageCharges) || 0);
    const extraInsp = Number(booking.inspection?.extraCharges) || 0;

    booking.totalPrice = (baseCharges > 0 ? baseCharges : (booking.totalPrice || 0)) + totalAdditional + totalDamages + extraInsp;

    // Recalculate payment status
    const totalPaid = (booking.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    booking.paidAmount = totalPaid;
    if (booking.paidAmount >= booking.totalPrice) {
      booking.paymentStatus = 'fully_paid';
    } else if (booking.paidAmount > 0) {
      booking.paymentStatus = 'partial_paid';
    } else {
      booking.paymentStatus = 'pending';
    }

    await booking.save();

    await notifyAdmin({
      type: 'damage_charge',
      title: 'Additional Charge Added',
      message: `${reason.trim()} (+₹${numAmount}) added to #${booking.bookingReference}. Total now: ₹${booking.totalPrice}, Balance due: ₹${Math.max(0, booking.totalPrice - booking.paidAmount)}`,
      booking: booking._id,
      bookingReference: booking.bookingReference,
      customerName: booking.user?.name || 'Customer',
      amount: numAmount,
      source: 'admin'
    });

    const updated = await Booking.findById(booking._id)
      .populate('car')
      .populate('driver')
      .populate('user');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 9. Admin Record Vehicle Return / Inspection
router.put('/:id/inspection', adminAuth, async (req, res) => {
  try {
    const { 
      returnOdometer, returnFuelLevel, returnNotes, extraCharges, inspectedBy,
      damageAmount, damageReason, additionalCharges
    } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.securityDeposit = 0;
    booking.depositStatus = 'waived';

    if (!booking.additionalCharges) booking.additionalCharges = [];

    // Process additionalCharges array if provided
    if (Array.isArray(additionalCharges) && additionalCharges.length > 0) {
      additionalCharges.forEach(chg => {
        const amt = Number(chg.amount) || 0;
        if (amt > 0 && chg.reason) {
          booking.additionalCharges.push({
            category: chg.category || 'other',
            reason: chg.reason.trim(),
            amount: amt,
            date: new Date(),
            notes: chg.notes || ''
          });
        }
      });
    }

    // Process legacy damageAmount / damageReason
    const numDamage = Math.max(0, Number(damageAmount) || 0);
    if (numDamage > 0) {
      booking.additionalCharges.push({
        category: 'damage',
        reason: damageReason || 'Accidental damage assessment',
        amount: numDamage,
        date: new Date(),
        notes: 'Inspection damage charge'
      });
    }

    // Process legacy extraCharges
    const numExtra = Math.max(0, Number(extraCharges) || 0);
    if (numExtra > 0) {
      booking.additionalCharges.push({
        category: 'other',
        reason: 'Post-rental adjustment',
        amount: numExtra,
        date: new Date(),
        notes: ''
      });
    }

    booking.inspection = {
      ...booking.inspection,
      returnOdometer: Number(returnOdometer) || booking.inspection.returnOdometer,
      returnFuelLevel: returnFuelLevel || booking.inspection.returnFuelLevel,
      returnNotes: returnNotes || '',
      damageReason: damageReason || '',
      extraCharges: 0,
      inspectedBy: inspectedBy || 'Admin Inspector'
    };

    // Calculate grand total: base charges + all additional charges
    const baseCharges = (Number(booking.subtotal) || 0) + (Number(booking.driverFee) || 0) + (Number(booking.taxAmount) || 0);
    const totalAdditional = booking.additionalCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    booking.totalPrice = (baseCharges > 0 ? baseCharges : (booking.totalPrice || 0)) + totalAdditional;

    // Recalculate payment status based on updated grand total and all payments
    const totalPaid = (booking.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    booking.paidAmount = totalPaid;
    if (booking.paidAmount >= booking.totalPrice) {
      booking.paymentStatus = 'fully_paid';
    } else if (booking.paidAmount > 0) {
      booking.paymentStatus = 'partial_paid';
    } else {
      booking.paymentStatus = 'pending';
    }

    booking.status = 'completed';
    // Do NOT permanently lock payments if balance is still due!
    booking.isLocked = booking.paymentStatus === 'fully_paid';
    await booking.save();

    // Release car back to available fleet and update mileage
    await Car.findByIdAndUpdate(booking.car._id || booking.car, { 
      status: 'available',
      mileage: `${returnOdometer || 12000} km`
    });

    if (booking.driver) {
      await Driver.findByIdAndUpdate(booking.driver, { 
        status: 'active',
        $inc: { tripsCount: 1 }
      });
    }

    res.json(await Booking.findById(booking._id).populate('car').populate('driver').populate('user'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 10. Cancel Booking (Customer)
router.put('/:id/cancel', userAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    if (booking.status === 'ongoing') {
      return res.status(400).json({ message: 'Cannot cancel a trip that is currently ongoing. Please contact dispatch support.' });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed trip.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    await Car.findByIdAndUpdate(booking.car, { status: 'available' });
    if (booking.driver) {
      await Driver.findByIdAndUpdate(booking.driver, { status: 'active' });
    }

    await notifyAdmin({
      type: 'booking_cancelled',
      title: 'Booking Cancelled by Customer',
      message: `Reservation #${booking.bookingReference} was cancelled by ${req.user.name || 'customer'}`,
      booking: booking._id,
      bookingReference: booking.bookingReference,
      customerName: req.user.name || 'Customer',
      amount: booking.totalPrice,
      source: booking.bookingSource || 'whatsapp'
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
