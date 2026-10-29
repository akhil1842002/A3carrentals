const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const TyreOrder = require('../models/TyreOrder');
const Review = require('../models/Review');
const Car = require('../models/Car');
const Tyre = require('../models/Tyre');
const Driver = require('../models/Driver');
const { adminAuth } = require('../middleware/auth');

// 1. GET /api/customers - List all registered customers with rich stats
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });

    const enriched = await Promise.all(users.map(async (u) => {
      const [bookings, orders, reviews] = await Promise.all([
        Booking.find({ user: u._id }).populate('car', 'name brand images'),
        TyreOrder.find({ user: u._id }),
        Review.countDocuments({ user: u._id })
      ]);

      const rentalsCount = bookings.length;
      const ordersCount = orders.length;

      const totalRentalsSpent = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      const totalOrdersSpent = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const totalSpent = totalRentalsSpent;

      // Determine latest activity timestamp
      const timestamps = [new Date(u.createdAt).getTime()];
      if (bookings.length > 0) {
        timestamps.push(new Date(bookings[0].createdAt).getTime());
      }
      if (orders.length > 0) {
        timestamps.push(new Date(orders[0].createdAt).getTime());
      }
      const lastActive = new Date(Math.max(...timestamps));

      const latestRental = bookings[0] ? {
        carName: bookings[0].car ? `${bookings[0].car.brand} ${bookings[0].car.name}` : 'Unknown Vehicle',
        date: bookings[0].createdAt,
        status: bookings[0].status
      } : null;

      return {
        ...u.toObject(),
        rentalsCount,
        ordersCount,
        reviewsCount: reviews,
        totalRentalsSpent,
        totalOrdersSpent,
        totalSpent,
        lastActive,
        latestRental
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET /api/customers/:id/details - Comprehensive Drill-down History & Reviews
router.get('/:id/details', adminAuth, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found' });
    }

    const [rentals, orders, reviews] = await Promise.all([
      Booking.find({ user: customer._id })
        .populate('car')
        .populate('driver')
        .sort({ createdAt: -1 }),
      TyreOrder.find({ user: customer._id })
        .populate('items.tyre')
        .sort({ createdAt: -1 }),
      Review.find({ user: customer._id })
        .populate('car', 'name brand model images rating vehicleType')
        .populate('tyre', 'name brand size price image')
        .sort({ createdAt: -1 })
    ]);

    const totalRentalsSpent = rentals
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    const totalOrdersSpent = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const completedRentals = rentals.filter(r => r.status === 'completed').length;
    const activeRentals = rentals.filter(r => ['ongoing', 'confirmed', 'driver_assigned'].includes(r.status)).length;
    const cancelledRentals = rentals.filter(r => r.status === 'cancelled').length;

    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const activeOrders = orders.filter(o => ['processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status)).length;

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : 'N/A';

    res.json({
      customer,
      rentals,
      orders,
      reviews,
      metrics: {
        rentalsCount: rentals.length,
        completedRentals,
        activeRentals,
        cancelledRentals,
        ordersCount: orders.length,
        completedOrders,
        activeOrders,
        reviewsCount: reviews.length,
        totalRentalsSpent,
        totalOrdersSpent,
        totalSpent: totalRentalsSpent,
        avgRating
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. PUT /api/customers/:id/status - Toggle active / suspended status
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'Customer not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
