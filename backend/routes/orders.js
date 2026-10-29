const express = require('express');
const router = express.Router();
const TyreOrder = require('../models/TyreOrder');
const Tyre = require('../models/Tyre');
const Settings = require('../models/Settings');
const { userAuth, adminAuth } = require('../middleware/auth');

// 1. Checkout & Create Tyre Order with Atomic Stock Deduction (Customer)
router.post('/', userAuth, async (req, res) => {
  try {
    const { items, deliveryAddress, deliveryMethod, paymentMethod } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Cart cannot be empty' });
    }
    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.street) {
      return res.status(400).json({ message: 'Complete delivery address is required' });
    }

    const settings = await Settings.getSettings();
    const verifiedItems = [];
    let subtotal = 0;

    // Verify each product and atomically decrement stock
    for (const item of items) {
      // Atomic concurrency lock: only decrement if stockQuantity >= requested quantity
      const tyre = await Tyre.findOneAndUpdate(
        { _id: item.tyreId, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
        { new: true }
      );

      if (!tyre) {
        return res.status(400).json({
          message: `Product is out of stock or does not have ${item.quantity} available in stock.`
        });
      }

      // If stock hits 0, flag inStock as false
      if (tyre.stockQuantity <= 0) {
        tyre.inStock = false;
        await tyre.save();
      }

      const itemTotal = tyre.price * item.quantity;
      subtotal += itemTotal;

      verifiedItems.push({
        tyre: tyre._id,
        name: tyre.name,
        brand: tyre.brand,
        size: tyre.size,
        sku: tyre.sku || 'TYR-GEN',
        unitPrice: tyre.price,
        quantity: item.quantity,
        image: tyre.image || '/images/car-1.jpg'
      });
    }

    const shippingFee = (deliveryMethod === 'workshop_pickup' || subtotal >= (settings.freeShippingThreshold || 200))
      ? 0
      : (settings.standardShippingFee || 15);

    const taxRate = (settings.taxRatePercent || 8) / 100;
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + shippingFee + taxAmount;

    const order = new TyreOrder({
      user: req.user.id,
      items: verifiedItems,
      subtotal,
      shippingFee,
      taxAmount,
      totalAmount,
      deliveryAddress,
      deliveryMethod: deliveryMethod || 'shipping',
      paymentMethod: paymentMethod || 'card',
      paymentStatus: 'paid',
      status: 'processing',
      trackingNumber: 'TRK-' + Math.floor(1000000 + Math.random() * 9000000)
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Get My Tyre Orders (Customer)
router.get('/my', userAuth, async (req, res) => {
  try {
    const orders = await TyreOrder.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Get All Tyre Orders (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await TyreOrder.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Update Order Status & Tracking (Admin)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, trackingNumber, carrier } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (carrier) updates.carrier = carrier;

    const order = await TyreOrder.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
