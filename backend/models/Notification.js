const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'booking_created',
      'payment_received',
      'booking_cancelled',
      'deposit_collected',
      'deposit_updated',
      'deposit_refunded',
      'damage_charged',
      'driver_assigned',
      'trip_completed',
      'trip_dispatched'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  bookingReference: { type: String, default: '' },
  customerName: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  read: { type: Boolean, default: false },
  source: { type: String, enum: ['whatsapp', 'web', 'admin', 'system'], default: 'system' },
  link: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ booking: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
