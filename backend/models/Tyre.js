const mongoose = require('mongoose');

const tyreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  sku: { 
    type: String, 
    unique: true, 
    default: () => 'TYR-' + Math.random().toString(36).substring(2, 7).toUpperCase() 
  },
  size: { type: String, required: true },
  width: { type: Number, default: 225 },
  aspectRatio: { type: Number, default: 55 },
  rimDiameter: { type: Number, default: 17 },
  loadIndex: { type: String, default: '97Y' },
  speedRating: { type: String, default: 'V' },
  type: { 
    type: String, 
    enum: ['All-Season', 'Summer', 'Winter', 'Performance', 'Off-Road'], 
    required: true 
  },
  price: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  image: { type: String, default: '/images/car-1.jpg' },
  description: { type: String, default: 'High performance tyre with reinforced sidewalls and superior wet road traction.' },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 20 },
  lowStockThreshold: { type: Number, default: 5 },
  vehicleType: { type: String, default: 'Sedan' },
  warranty: { type: String, default: '2 Years Manufacturer Warranty' },
  rating: { type: Number, default: 4.8, min: 0, max: 5 }
}, { timestamps: true });

tyreSchema.index({ brand: 1, type: 1, stockQuantity: 1 });

module.exports = mongoose.model('Tyre', tyreSchema);
