require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Also serve the original carbook images
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user-auth', require('./routes/userAuth'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/tyres', require('./routes/tyres'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Background schedule sync function (runs every 60s)
async function syncScheduleStatus() {
  try {
    const now = new Date();
    const Car = require('./models/Car');
    const Booking = require('./models/Booking');
    const Driver = require('./models/Driver');

    // 1. Sync cars
    const activeTrips = await Booking.find({
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
      pickupDate: { $lte: now },
      dropoffDate: { $gte: now }
    }).select('car driver');

    const activeCarIds = activeTrips.map(t => t.car);
    if (activeCarIds.length > 0) {
      await Car.updateMany(
        { _id: { $in: activeCarIds }, status: 'available' },
        { $set: { status: 'rented' } }
      );
    }

    // 2. Sync drivers:
    // If today falls within [pickupDate, dropoffDate] or status is 'ongoing', mark driver on_duty
    const onDutyTrips = await Booking.find({
      driver: { $ne: null },
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
      $or: [
        { status: 'ongoing' },
        { pickupDate: { $lte: now }, dropoffDate: { $gte: now } }
      ]
    }).select('driver');

    const onDutyDriverIds = [...new Set(onDutyTrips.map(t => t.driver.toString()))];

    if (onDutyDriverIds.length > 0) {
      await Driver.updateMany(
        { _id: { $in: onDutyDriverIds }, status: { $ne: 'suspended' } },
        { $set: { status: 'on_duty' } }
      );
    }

    // If a driver was marked on_duty but currently has no active/ongoing trips today, revert to active
    await Driver.updateMany(
      { _id: { $nin: onDutyDriverIds }, status: 'on_duty' },
      { $set: { status: 'active' } }
    );
  } catch (err) {
    console.error('Schedule sync error:', err.message);
  }
}

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Run initial sync on boot
    syncScheduleStatus();
    // Run auto-sync every 60 seconds
    setInterval(syncScheduleStatus, 60000);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
