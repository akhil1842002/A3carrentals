const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingReference: { 
    type: String, 
    unique: true, 
    sparse: true,
    default: () => 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase() 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  rentalType: { 
    type: String, 
    enum: ['self_drive', 'with_driver', 'chauffeured'], 
    default: 'self_drive' 
  },
  rentalDurationType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  withDriver: { type: Boolean, default: false },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  driverStatus: {
    type: String,
    enum: ['none', 'assignment_pending', 'assigned', 'en_route', 'arrived', 'trip_started', 'completed'],
    default: 'none'
  },
  pickupDate: { type: Date, required: true },
  dropoffDate: { type: Date, required: true },
  pickupLocation: { type: String, default: 'Main Hub' },
  dropoffLocation: { type: String, default: 'Main Hub' },
  days: { type: Number, default: 1 },
  dailyRate: { type: Number, required: true, default: 0 },
  subtotal: { type: Number, default: 0 },
  driverFee: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  securityDeposit: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'driver_assigned', 'ongoing', 'completed', 'cancelled', 'refunded'], 
    default: 'pending' 
  },
  bookingSource: {
    type: String,
    enum: ['whatsapp', 'admin', 'web'],
    default: 'whatsapp'
  },
  isLocked: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ['pending', 'deposit_paid', 'partial_paid', 'fully_paid', 'refunded'],
    default: 'pending'
  },
  paidAmount: { type: Number, default: 0 },
  advanceAmount: { type: Number, default: 0 },
  payments: [{
    amount: { type: Number, required: true },
    paymentType: { 
      type: String, 
      enum: ['advance', 'partial', 'full', 'deposit', 'damage_fee', 'refund'], 
      default: 'advance' 
    },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'whatsapp', 'other'], 
      default: 'cash' 
    },
    transactionId: { type: String, default: '' },
    paymentDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    receivedBy: { type: String, default: 'Admin' }
  }],
  depositStatus: {
    type: String,
    enum: ['pending', 'held', 'partially_deducted', 'deducted', 'refunded', 'waived'],
    default: 'pending'
  },
  depositDeductions: [{
    amount: { type: Number, required: true },
    reason: { type: String, default: 'Damage / Inspection adjustment' },
    date: { type: Date, default: Date.now },
    deductionType: { type: String, enum: ['damage', 'fuel', 'late_return', 'other'], default: 'damage' }
  }],
  depositRefund: {
    amount: { type: Number, default: 0 },
    refundDate: { type: Date },
    paymentMethod: { type: String, default: 'cash' },
    transactionId: { type: String, default: '' },
    refundStatus: { type: String, enum: ['none', 'pending', 'processed'], default: 'none' },
    notes: { type: String, default: '' }
  },
  additionalCharges: [{
    category: {
      type: String,
      enum: ['late_fee', 'damage', 'fuel', 'cleaning', 'extra_km', 'toll_traffic', 'other'],
      default: 'other'
    },
    reason: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  }],
  damageCharges: [{
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    coveredByDeposit: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ['pending', 'deducted_from_deposit', 'paid_separately'], default: 'pending' }
  }],
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'cash_on_pickup', 'whatsapp', 'bank_transfer', 'other'],
    default: 'cash_on_pickup'
  },
  notes: { type: String, default: '' },
  inspection: {
    pickupOdometer: { type: Number, default: 0 },
    pickupFuelLevel: { type: String, default: 'Full (100%)' },
    pickupNotes: { type: String, default: 'Vehicle in pristine condition, no pre-existing scratches' },
    returnOdometer: { type: Number, default: 0 },
    returnFuelLevel: { type: String, default: 'Full (100%)' },
    returnNotes: { type: String, default: '' },
    extraCharges: { type: Number, default: 0 },
    inspectedBy: { type: String, default: 'Staff Inspector' }
  }
}, { timestamps: true });

// Guarantee bookingReference is always populated
bookingSchema.pre('validate', function(next) {
  if (!this.bookingReference) {
    this.bookingReference = 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Compound indexes for availability check and customer lookups
bookingSchema.index({ car: 1, pickupDate: 1, dropoffDate: 1, status: 1 });
bookingSchema.index({ driver: 1, pickupDate: 1, dropoffDate: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
