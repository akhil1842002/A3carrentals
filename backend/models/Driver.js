const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  avatar: { type: String, default: '' },
  licenceNumber: { type: String, required: true, unique: true },
  licenceExpiry: { type: Date },
  experienceYears: { type: Number, default: 4 },
  supportedVehicleTypes: [{ 
    type: String, 
    default: ['Sedan', 'SUV', 'Luxury'] 
  }],
  isVerified: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['active', 'on_duty', 'off_duty', 'suspended'], 
    default: 'active' 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, default: 4.9, min: 1, max: 5 },
  tripsCount: { type: Number, default: 0 },
  blockedDates: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, default: 'Leave / Off-duty' }
  }]
}, { timestamps: true });

driverSchema.index({ status: 1, isVerified: 1 });

module.exports = mongoose.model('Driver', driverSchema);
