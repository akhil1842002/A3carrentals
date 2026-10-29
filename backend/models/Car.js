const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  transmission: { type: String, default: 'Automatic' },
  fuelType: { type: String, required: true, default: 'Petrol' },
  seats: { type: Number, required: true },
  luggage: { type: Number, default: 2 },
  mileage: { type: String, default: '15,000 km' },
  horsepower: { type: Number, default: 0 },
  pricePerDay: { type: Number, required: true },
  pricePerWeek: { type: Number, default: 0 },
  pricePerMonth: { type: Number, default: 0 },
  securityDeposit: { type: Number, default: 0 },
  mileageLimitPerDay: { type: Number, default: 250 },
  extraKmRate: { type: Number, default: 0.35 },
  vehicleType: { 
    type: String, 
    required: true, 
    default: 'Sedan'
  },
  tyreDetails: {
    brand: { type: String, default: 'Michelin' },
    model: { type: String, default: 'Pilot Sport 4' },
    size: { type: String, default: '225/45 R18' },
    condition: { type: String, default: 'Excellent (95% Tread)' },
    treadDepthMm: { type: Number, default: 7.5 },
    spareTyre: { type: String, default: 'Full-Size Alloy Spare Included' },
    pressureFront: { type: String, default: '32 PSI' },
    pressureRear: { type: String, default: '32 PSI' }
  },
  features: [{
    name: { type: String },
    available: { type: Boolean, default: true }
  }],
  images: [{ type: String }],
  rating: { type: Number, default: 4.8, min: 0, max: 5 },
  reviewCount: { type: Number, default: 12 },
  plateNumber: { type: String },
  status: { type: String, enum: ['available', 'unavailable', 'rented', 'maintenance'], default: 'available' },
  description: { type: String },
  location: { type: String, default: 'Main Hub' },
  distanceFromCenter: { type: String, default: '1.2 km' },
  estimatedTime: { type: String, default: '10 min' },
  blockedDates: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, default: 'Scheduled Maintenance' }
  }]
}, { timestamps: true });

// Add index for fast availability queries
carSchema.index({ status: 1, brand: 1, vehicleType: 1 });

module.exports = mongoose.model('Car', carSchema);
