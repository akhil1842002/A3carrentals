const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Multer config for car images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'cars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `car-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Auto-sync car rental statuses based on active booking dates
async function syncScheduleStatus() {
  try {
    const now = new Date();
    const activeTrips = await Booking.find({
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
      pickupDate: { $lte: now },
      dropoffDate: { $gte: now }
    }).select('car');

    const activeCarIds = activeTrips.map(t => t.car.toString());
    if (activeCarIds.length > 0) {
      await Car.updateMany(
        { _id: { $in: activeCarIds }, status: 'available' },
        { $set: { status: 'rented' } }
      );
    }

    // Release cars whose trips have ended back to available (if currently marked rented)
    const rentedCars = await Car.find({ status: 'rented' }).select('_id');
    const carsToFree = rentedCars
      .map(c => c._id.toString())
      .filter(id => !activeCarIds.includes(id));

    if (carsToFree.length > 0) {
      await Car.updateMany(
        { _id: { $in: carsToFree } },
        { $set: { status: 'available' } }
      );
    }
  } catch (err) {
    console.error('Schedule sync error:', err.message);
  }
}

// GET all cars (public)
router.get('/', async (req, res) => {
  try {
    await syncScheduleStatus();
    const {
      brand, vehicleType, transmission, fuelType,
      minPrice, maxPrice, status, search, sort, page = 1, limit = 12
    } = req.query;

    const filter = {};
    if (brand) filter.brand = { $in: brand.split(',') };
    if (vehicleType) filter.vehicleType = { $in: vehicleType.split(',') };
    if (transmission) filter.transmission = { $in: transmission.split(',') };
    if (fuelType) filter.fuelType = { $in: fuelType.split(',') };
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { pricePerDay: 1 };
    if (sort === 'price_desc') sortObj = { pricePerDay: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };
    if (sort === 'name') sortObj = { name: 1 };

    const total = await Car.countDocuments(filter);
    const cars = await Car.find(filter)
      .sort(sortObj)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const carIds = cars.map(c => c._id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all active or upcoming bookings for these cars
    const activeBookings = await Booking.find({
      car: { $in: carIds },
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
      dropoffDate: { $gte: todayStart }
    }).select('_id car bookingReference pickupDate dropoffDate status').sort({ pickupDate: 1 });

    const ongoingMap = {};
    const bookedDatesMap = {};

    activeBookings.forEach(b => {
      const cid = b.car.toString();
      if (!bookedDatesMap[cid]) bookedDatesMap[cid] = [];
      bookedDatesMap[cid].push({
        _id: b._id,
        bookingReference: b.bookingReference,
        pickupDate: b.pickupDate,
        dropoffDate: b.dropoffDate,
        status: b.status
      });

      const bStart = new Date(b.pickupDate);
      const bEnd = new Date(b.dropoffDate);
      bEnd.setHours(23, 59, 59, 999);

      const isCurrent = b.status === 'ongoing' || (bStart <= todayEnd && bEnd >= todayStart);
      if (isCurrent && !ongoingMap[cid]) {
        ongoingMap[cid] = {
          _id: b._id,
          bookingReference: b.bookingReference,
          pickupDate: b.pickupDate,
          dropoffDate: b.dropoffDate
        };
      }
    });

    const carsWithOngoing = cars.map(car => {
      const carObj = car.toObject();
      const cid = car._id.toString();
      const ongoing = ongoingMap[cid];
      carObj.hasOngoingTrip = !!ongoing;
      carObj.ongoingBooking = ongoing || null;
      carObj.bookedDates = bookedDatesMap[cid] || [];
      if (ongoing && carObj.status === 'available') {
        carObj.status = 'rented';
      }
      return carObj;
    });

    res.json({
      cars: carsWithOngoing,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET stats (public) - must be before /:id
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCars = await Car.countDocuments();
    const availableCars = await Car.countDocuments({ status: 'available' });
    const rentedCars = await Car.countDocuments({ status: 'rented' });
    const avgRating = await Car.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    res.json({
      totalCars,
      availableCars,
      rentedCars,
      avgRating: avgRating[0]?.avg ? avgRating[0].avg.toFixed(1) : '4.8',
      happyCustomers: '2.4K+'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single car (public)
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    const carObj = car.toObject();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeBookings = await Booking.find({
      car: car._id,
      status: { $in: ['confirmed', 'driver_assigned', 'ongoing'] },
      dropoffDate: { $gte: todayStart }
    }).select('_id car bookingReference pickupDate dropoffDate status').sort({ pickupDate: 1 });

    const ongoing = activeBookings.find(b => {
      if (b.status === 'ongoing') return true;
      const bStart = new Date(b.pickupDate);
      const bEnd = new Date(b.dropoffDate);
      bEnd.setHours(23, 59, 59, 999);
      return bStart <= todayEnd && bEnd >= todayStart;
    });

    carObj.hasOngoingTrip = !!ongoing;
    carObj.ongoingBooking = ongoing ? {
      _id: ongoing._id,
      bookingReference: ongoing.bookingReference,
      pickupDate: ongoing.pickupDate,
      dropoffDate: ongoing.dropoffDate
    } : null;
    carObj.bookedDates = activeBookings.map(b => ({
      _id: b._id,
      bookingReference: b.bookingReference,
      pickupDate: b.pickupDate,
      dropoffDate: b.dropoffDate,
      status: b.status
    }));

    if (ongoing && carObj.status === 'available') {
      carObj.status = 'rented';
    }

    res.json(carObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create car (admin)
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const carData = { ...req.body };
    if (req.files && req.files.length > 0) {
      const uploadedImages = [];
      for (const f of req.files) {
        const cloudUrl = await uploadToCloudinary(f.path, 'cars');
        uploadedImages.push(cloudUrl || `/uploads/cars/${f.filename}`);
      }
      carData.images = uploadedImages;
    } else if (carData.images && typeof carData.images === 'string') {
      try {
        carData.images = JSON.parse(carData.images);
      } catch (e) {
        carData.images = [carData.images];
      }
    }
    if (carData.features && typeof carData.features === 'string') {
      carData.features = JSON.parse(carData.features);
    }
    if (carData.tyreDetails && typeof carData.tyreDetails === 'string') {
      try {
        carData.tyreDetails = JSON.parse(carData.tyreDetails);
      } catch (e) {}
    }
    const car = new Car(carData);
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update car (admin)
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const carData = { ...req.body };
    if (req.files && req.files.length > 0) {
      const uploadedImages = [];
      for (const f of req.files) {
        const cloudUrl = await uploadToCloudinary(f.path, 'cars');
        uploadedImages.push(cloudUrl || `/uploads/cars/${f.filename}`);
      }
      carData.images = uploadedImages;
    } else if (carData.images && typeof carData.images === 'string') {
      try {
        carData.images = JSON.parse(carData.images);
      } catch (e) {
        carData.images = [carData.images];
      }
    }
    if (carData.features && typeof carData.features === 'string') {
      carData.features = JSON.parse(carData.features);
    }
    if (carData.tyreDetails && typeof carData.tyreDetails === 'string') {
      try {
        carData.tyreDetails = JSON.parse(carData.tyreDetails);
      } catch (e) {}
    }

    // Validation: Cannot change vehicle status while a trip is currently ongoing
    if (carData.status && carData.status !== 'rented') {
      const ongoingTrip = await Booking.findOne({
        car: req.params.id,
        status: 'ongoing'
      });
      if (ongoingTrip) {
        return res.status(400).json({
          message: `Cannot change vehicle status to "${carData.status}". Vehicle has an ongoing trip (Ref: ${ongoingTrip.bookingReference || ongoingTrip._id}). You must complete the trip first before changing vehicle status.`
        });
      }
    }

    const car = await Car.findByIdAndUpdate(req.params.id, carData, { new: true, runValidators: true });
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE car (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const ongoingTrip = await Booking.findOne({
      car: req.params.id,
      status: 'ongoing'
    });
    if (ongoingTrip) {
      return res.status(400).json({
        message: `Cannot delete vehicle while a trip is currently ongoing (Ref: ${ongoingTrip.bookingReference || ongoingTrip._id}). You must complete the trip first.`
      });
    }

    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
