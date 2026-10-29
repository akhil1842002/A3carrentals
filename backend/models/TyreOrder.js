const mongoose = require('mongoose');

const tyreOrderItemSchema = new mongoose.Schema({
  tyre: { type: mongoose.Schema.Types.ObjectId, ref: 'Tyre', required: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  size: { type: String, required: true },
  sku: { type: String, default: '' },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' }
}, { _id: false });

const tyreOrderSchema = new mongoose.Schema({
  orderNumber: { 
    type: String, 
    unique: true, 
    default: () => 'ORD-' + Math.floor(100000 + Math.random() * 900000) 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [tyreOrderItemSchema],
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  deliveryAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    zip: { type: String, required: true }
  },
  deliveryMethod: { 
    type: String, 
    enum: ['shipping', 'workshop_pickup'], 
    default: 'shipping' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['card', 'upi', 'cash_on_delivery', 'whatsapp'], 
    default: 'card' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'paid' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'], 
    default: 'processing' 
  },
  trackingNumber: { type: String, default: '' },
  carrier: { type: String, default: 'FedEx Express' }
}, { timestamps: true });

tyreOrderSchema.index({ user: 1, createdAt: -1 });
tyreOrderSchema.index({ status: 1 });

module.exports = mongoose.model('TyreOrder', tyreOrderSchema);
