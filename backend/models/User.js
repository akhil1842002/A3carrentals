const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  password: { 
    type: String, 
    required: function() { return this.authProvider !== 'google'; } 
  },
  avatar: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['customer', 'driver', 'staff', 'admin', 'superadmin'], 
    default: 'customer' 
  },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'pending'], 
    default: 'active' 
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  signupOtp: { type: String },
  signupOtpExpires: { type: Date },
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
  resetToken: { type: String },
  addresses: [{
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: 'USA' },
    isDefault: { type: Boolean, default: false }
  }],
  driverProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
