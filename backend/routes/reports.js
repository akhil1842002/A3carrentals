const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const TyreOrder = require('../models/TyreOrder');
const Car = require('../models/Car');
const Tyre = require('../models/Tyre');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

// GET /api/reports/overview - Full Business KPIs
router.get('/overview', adminAuth, async (req, res) => {
  try {
    const [bookings, orders, cars, tyres, customers] = await Promise.all([
      Booking.find(),
      TyreOrder.find(),
      Car.find(),
      Tyre.find(),
      User.find({ role: 'customer' })
    ]);

    // Helper to calculate actual payments entered (advance, partial, or fully paid)
    const getPaid = (b) => {
      if (!b || b.status === 'cancelled') return 0;
      if (Array.isArray(b.payments) && b.payments.length > 0) {
        const sum = b.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        if (sum > 0) return sum;
      }
      if (typeof b.paidAmount === 'number' && b.paidAmount > 0) return b.paidAmount;
      if (b.paymentStatus === 'fully_paid') return Number(b.totalPrice) || 0;
      if (typeof b.advanceAmount === 'number' && b.advanceAmount > 0) return b.advanceAmount;
      return 0;
    };

    // Financial calculations
    const validBookings = bookings.filter(b => b.status !== 'cancelled');

    const totalBookedValue = validBookings
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    // Actual revenue collected (paid amounts: advance, partial, full)
    const totalCollected = validBookings
      .reduce((sum, b) => sum + getPaid(b), 0);

    const rentalRevenue = totalCollected; // Earnings are actual collected payments
    const totalRevenue = rentalRevenue;

    const totalOutstanding = Math.max(0, totalBookedValue - totalCollected);

    // Deposit calculations
    const activeDeposits = bookings
      .filter(b => ['confirmed', 'ongoing', 'driver_assigned'].includes(b.status))
      .reduce((sum, b) => sum + (b.securityDeposit !== undefined && b.securityDeposit !== null ? b.securityDeposit : 0), 0);

    const totalDepositsRefunded = bookings
      .reduce((sum, b) => sum + (b.depositRefund?.amount || 0), 0);

    const totalDamageCharges = bookings
      .reduce((sum, b) => {
        const fromArray = (b.damageCharges || []).reduce((s, d) => s + (d.amount || 0), 0);
        const fromInsp = b.inspection?.extraCharges || 0;
        return sum + Math.max(fromArray, fromInsp);
      }, 0);

    // Channel breakdown (WhatsApp vs Admin Direct)
    const isAdmin = (b) => b.bookingSource === 'admin';

    const adminBookings = validBookings.filter(isAdmin);
    const whatsappBookings = validBookings.filter(b => !isAdmin(b));

    const adminRevenue = adminBookings.reduce((sum, b) => sum + getPaid(b), 0);
    const whatsappRevenue = whatsappBookings.reduce((sum, b) => sum + getPaid(b), 0);

    const availableCars = cars.filter(c => c.status === 'available').length;
    const rentedCars = cars.filter(c => c.status === 'rented').length;
    const maintenanceCars = cars.filter(c => c.status === 'maintenance').length;
    const utilizationRate = cars.length > 0 ? Math.round((rentedCars / cars.length) * 100) : 0;

    const lowStockTyres = tyres.filter(t => (t.stockQuantity || 0) <= (t.lowStockThreshold || 5)).length;

    res.json({
      totalRevenue,
      rentalRevenue,
      totalBookedValue,
      totalCollected,
      totalOutstanding,
      depositsHeld: activeDeposits,
      totalDepositsRefunded,
      totalDamageCharges,
      bookingsCount: bookings.length,
      ordersCount: orders.length,
      customersCount: customers.length,
      carsTotal: cars.length,
      availableCars,
      rentedCars,
      maintenanceCars,
      utilizationRate,
      lowStockTyres,
      channelStats: {
        whatsappCount: whatsappBookings.length,
        adminCount: adminBookings.length,
        whatsappRevenue,
        adminRevenue,
        webCount: 0,
        webRevenue: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
