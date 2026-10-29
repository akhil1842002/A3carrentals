const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  authorName: {
    type: String,
    default: ''
  },
  authorAvatar: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['platform', 'google', 'direct'],
    default: 'platform'
  },
  targetType: { 
    type: String, 
    enum: ['car', 'tyre', 'driver', 'company'], 
    default: 'car'
  },
  car: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Car' 
  },
  tyre: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tyre' 
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking' 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TyreOrder' 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  title: { 
    type: String, 
    default: '' 
  },
  comment: { 
    type: String, 
    required: true 
  },
  verifiedPurchase: { 
    type: Boolean, 
    default: true 
  },
  showOnLanding: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ car: 1 });
reviewSchema.index({ tyre: 1 });
reviewSchema.index({ driver: 1 });
reviewSchema.index({ showOnLanding: 1 });

module.exports = mongoose.model('Review', reviewSchema);
