const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const Review = require('../models/Review');
const { adminAuth, userAuth } = require('../middleware/auth');

// 1. List All Drivers (Admin) - enriched with real-time duty status & booked schedules
router.get('/', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const drivers = await Driver.find().sort({ createdAt: -1 }).lean();

    // Fetch all active/upcoming bookings that have a driver assigned
    const activeBookings = await Booking.find({
      driver: { $ne: null },
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] }
    })
      .populate('car', 'name model plateNumber')
      .populate('user', 'name phone email')
      .sort({ pickupDate: 1 })
      .lean();

    const enrichedDrivers = drivers.map(d => {
      const driverBookings = activeBookings.filter(b => b.driver && b.driver.toString() === d._id.toString());

      // Ongoing trip check (either status is ongoing or current time is within [pickupDate, dropoffDate])
      const ongoingTrip = driverBookings.find(b => 
        b.status === 'ongoing' || (new Date(b.pickupDate) <= now && new Date(b.dropoffDate) >= now)
      );

      // Future scheduled trips
      const futureTrips = driverBookings.filter(b => 
        b.status !== 'ongoing' && new Date(b.pickupDate) > now
      );

      const assignedTrips = driverBookings.map(b => ({
        _id: b._id,
        bookingReference: b.bookingReference,
        carName: b.car?.name || 'Assigned Vehicle',
        carPlate: b.car?.plateNumber || '',
        pickupDate: b.pickupDate,
        dropoffDate: b.dropoffDate,
        status: b.status,
        customerName: b.user?.name || 'Customer',
        customerPhone: b.user?.phone || '',
        isCurrentlyActive: b.status === 'ongoing' || (new Date(b.pickupDate) <= now && new Date(b.dropoffDate) >= now),
        isFuture: b.status !== 'ongoing' && new Date(b.pickupDate) > now
      }));

      const hasOngoingTrip = !!ongoingTrip;
      const effectiveStatus = hasOngoingTrip ? 'on_duty' : d.status;

      return {
        ...d,
        status: effectiveStatus,
        hasOngoingTrip,
        ongoingTrip: ongoingTrip ? {
          _id: ongoingTrip._id,
          bookingReference: ongoingTrip.bookingReference,
          carName: ongoingTrip.car?.name || 'Assigned Vehicle',
          carPlate: ongoingTrip.car?.plateNumber || '',
          pickupDate: ongoingTrip.pickupDate,
          dropoffDate: ongoingTrip.dropoffDate,
          status: ongoingTrip.status
        } : null,
        futureTripsCount: futureTrips.length,
        hasFutureSchedule: futureTrips.length > 0,
        nextTrip: futureTrips[0] ? {
          _id: futureTrips[0]._id,
          bookingReference: futureTrips[0].bookingReference,
          carName: futureTrips[0].car?.name || 'Assigned Vehicle',
          pickupDate: futureTrips[0].pickupDate,
          dropoffDate: futureTrips[0].dropoffDate
        } : null,
        assignedTrips
      };
    });

    res.json(enrichedDrivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Add New Driver (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, email, phone, licenceNumber, experienceYears, supportedVehicleTypes } = req.body;
    const existing = await Driver.findOne({ $or: [{ email }, { licenceNumber }] });
    if (existing) {
      return res.status(400).json({ message: 'Driver with this email or licence already exists' });
    }

    const driver = new Driver({
      name,
      email,
      phone,
      licenceNumber,
      experienceYears: Number(experienceYears) || 3,
      supportedVehicleTypes: supportedVehicleTypes || ['Sedan', 'SUV', 'Luxury'],
      isVerified: true
    });
    await driver.save();
    res.status(201).json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2b. GET Driver Details (Admin) - Full profile, assigned trips & customer reviews
router.get('/:id/details', adminAuth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const [trips, reviews] = await Promise.all([
      Booking.find({ driver: driver._id })
        .populate('car', 'name brand model plateNumber images vehicleType')
        .populate('user', 'name phone email avatar')
        .sort({ pickupDate: -1 })
        .lean(),
      Review.find({ targetType: 'driver', driver: driver._id })
        .populate('user', 'name email avatar')
        .populate('car', 'name brand model images')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const activeTrips = trips.filter(t => ['ongoing', 'confirmed', 'driver_assigned'].includes(t.status)).length;
    const avgRating = reviews.length > 0 
      ? Math.round((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length) * 10) / 10
      : (driver.rating || 4.9);

    res.json({
      driver,
      trips,
      reviews,
      stats: {
        totalTrips: trips.length,
        completedTrips,
        activeTrips,
        reviewsCount: reviews.length,
        averageRating: avgRating
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Update Driver (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Delete Driver (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const driverId = req.params.id;
    await Driver.findByIdAndDelete(driverId);
    await Booking.updateMany(
      { driver: driverId },
      { $set: { driver: null, driverStatus: 'assignment_pending' } }
    );
    await User.updateMany(
      { driverProfile: driverId },
      { $unset: { driverProfile: 1 } }
    );
    res.json({ message: 'Driver removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Driver Portal: Get Assigned Trips (Driver Auth)
router.get('/trips/my', userAuth, async (req, res) => {
  try {
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const userPhone = req.user.phone ? req.user.phone.trim() : '';

    // Find driver matching current user, email, or phone
    const driver = await Driver.findOne({ 
      $or: [
        { user: req.user.id }, 
        { email: userEmail },
        ...(userPhone ? [{ phone: userPhone }] : [])
      ] 
    });

    if (!driver) {
      return res.json({ 
        isDriver: false,
        driver: null,
        trips: [],
        message: 'No driver profile linked to this user account'
      });
    }

    const trips = await Booking.find({ driver: driver._id })
      .populate('car')
      .populate('user', 'name phone email')
      .sort({ pickupDate: -1 });

    res.json({ isDriver: true, driver, trips });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5b. Link or Register Current User as Driver
router.post('/link-me', userAuth, async (req, res) => {
  try {
    const userEmail = (req.user.email || 'driver@carbook.com').toLowerCase();
    const userPhone = req.user.phone || '+91 9198765789';

    let driver = await Driver.findOne({
      $or: [
        { user: req.user.id },
        { email: userEmail },
        { phone: userPhone }
      ]
    });

    if (!driver) {
      driver = new Driver({
        name: req.user.name || 'Verified Driver',
        email: userEmail,
        phone: userPhone,
        licenceNumber: 'DL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        experienceYears: 5,
        supportedVehicleTypes: ['Sedan', 'SUV', 'Luxury'],
        isVerified: true,
        status: 'active',
        user: req.user.id
      });
      await driver.save();
    } else {
      driver.user = req.user.id;
      if (!driver.phone) driver.phone = userPhone;
      await driver.save();
    }

    res.json({ message: 'Driver profile linked successfully', driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. Driver Portal: Update Trip Status
router.put('/trips/:bookingId/status', userAuth, async (req, res) => {
  try {
    const { driverStatus } = req.body;
    const allowed = ['en_route', 'arrived', 'trip_started', 'completed'];
    if (!allowed.includes(driverStatus)) {
      return res.status(400).json({ message: 'Invalid driver status' });
    }

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.driverStatus = driverStatus;
    if (driverStatus === 'trip_started') {
      booking.status = 'ongoing';
      await Car.findByIdAndUpdate(booking.car, { status: 'rented' });
    } else if (driverStatus === 'completed') {
      booking.status = 'completed';
      booking.isLocked = true;
      await Car.findByIdAndUpdate(booking.car, { status: 'available' });
      if (booking.driver) {
        await Driver.findByIdAndUpdate(booking.driver, { status: 'active', $inc: { tripsCount: 1 } });
      }
    }
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
