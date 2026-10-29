const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { userAuth } = require('../middleware/auth');
const { sendEmailOtp, sendSmsOtp } = require('../services/otpService');

// Step 1: Initiate Registration & Dispatch Email OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ message: 'Valid email address is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Mobile number is compulsory' });
    }
    const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
    if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const assignedRole = (role === 'driver') ? 'driver' : 'customer';

    // Check if user already exists
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      if (existingUser.isEmailVerified || existingUser.status === 'active') {
        return res.status(400).json({ message: 'An account with this email address already exists. Please log in.' });
      }
      // If user started registration before but never verified OTP, update their details
      existingUser.name = name.trim();
      existingUser.phone = phone.trim();
      existingUser.password = password; // Will be hashed by pre-save
      existingUser.role = assignedRole;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let user;
    if (existingUser) {
      existingUser.signupOtp = otp;
      existingUser.signupOtpExpires = otpExpires;
      existingUser.status = 'pending';
      user = await existingUser.save();
    } else {
      user = new User({ 
        name: name.trim(), 
        email: cleanEmail, 
        phone: phone.trim(), 
        password,
        role: assignedRole,
        status: 'pending',
        isEmailVerified: false,
        signupOtp: otp,
        signupOtpExpires: otpExpires
      });
      await user.save();
    }

    // Dispatch real email OTP
    sendEmailOtp({ toEmail: user.email, otp, name: user.name }).catch(err => {
      console.error('[SIGNUP OTP EMAIL ERROR]:', err.message);
    });

    res.status(200).json({
      requiresOtp: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}`,
      email: user.email,
      devOtp: otp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Step 2: Verify Signup OTP & Complete Registration
router.post('/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ message: 'Email and 6-digit verification code are required' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'Registration session not found. Please register again.' });
    }

    if (!user.signupOtp || user.signupOtp !== cleanOtp) {
      return res.status(400).json({ message: 'Invalid 6-digit verification code. Please check your email and try again.' });
    }

    if (!user.signupOtpExpires || new Date() > user.signupOtpExpires) {
      return res.status(400).json({ message: 'Verification code has expired. Please click resend code.' });
    }

    user.isEmailVerified = true;
    user.status = 'active';
    user.signupOtp = undefined;
    user.signupOtpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isEmailVerified: true,
        addresses: user.addresses || [],
        avatar: user.avatar,
        authProvider: user.authProvider || 'local'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resend Signup OTP
router.post('/resend-signup-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'Registration session not found. Please register again.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.signupOtp = otp;
    user.signupOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendEmailOtp({ toEmail: user.email, otp, name: user.name }).catch(err => {
      console.error('[SIGNUP OTP RESEND ERROR]:', err.message);
    });

    res.json({
      success: true,
      message: `A fresh 6-digit verification code has been dispatched to ${user.email}`,
      devOtp: otp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const crypto = require('crypto');

// Login (Email and Password with Remember Me)
router.post('/login', async (req, res) => {
  try {
    const { email, identifier, password, rememberMe } = req.body;
    const userEmail = (email || identifier || '').trim().toLowerCase();
    if (!userEmail || !password) {
      return res.status(400).json({ message: 'Email address and password are required' });
    }

    if (!userEmail.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(400).json({ message: 'No registered account found with this email address' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password. Please verify your credentials or reset password.' });
    }

    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn }
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        addresses: user.addresses || [],
        avatar: user.avatar,
        authProvider: user.authProvider || 'local'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google One-Click Login / Auto-Registration
router.post('/google-login', async (req, res) => {
  try {
    const { credential, email: directEmail, name: directName, picture: directPicture, googleId: directGoogleId } = req.body;
    let email = directEmail;
    let name = directName;
    let picture = directPicture;
    let googleId = directGoogleId;

    if (credential) {
      try {
        const decoded = jwt.decode(credential);
        if (decoded) {
          email = decoded.email || email;
          name = decoded.name || name;
          picture = decoded.picture || picture;
          googleId = decoded.sub || googleId;
        }
      } catch (err) {
        console.error('Failed to decode Google token:', err.message);
      }
    }

    if (!email) {
      return res.status(400).json({ message: 'Google account email could not be verified' });
    }

    let user = await User.findOne({
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
      }
      let modified = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        modified = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        modified = true;
      }
      if (modified) await user.save();
    } else {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = new User({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        phone: '',
        password: randomPassword,
        avatar: picture || '',
        role: 'customer',
        status: 'active',
        authProvider: 'google',
        googleId: googleId || ''
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        addresses: user.addresses || [],
        avatar: user.avatar,
        authProvider: user.authProvider || 'google'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Step 1: Request Password Reset OTP
// Step 1: Request Password Reset OTP (Email Only)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, identifier } = req.body;
    const targetEmail = (email || identifier || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid registered email address' });
    }

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email address' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetToken = undefined;
    await user.save();

    const maskedEmail = user.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(Math.max(1, b.length)));

    // Trigger real Email OTP dispatch
    sendEmailOtp({ toEmail: user.email, otp, name: user.name }).catch(err => {
      console.error('[OTP EMAIL DISPATCH ERROR]:', err.message);
    });

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to your email.`,
      maskedEmail,
      devOtp: otp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, identifier, otp } = req.body;
    const targetEmail = (email || identifier || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!targetEmail || !cleanOtp) {
      return res.status(400).json({ message: 'Email address and verification code are required' });
    }

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    if (!user.resetOtp || user.resetOtp !== cleanOtp) {
      return res.status(400).json({ message: 'Invalid 6-digit verification code. Please check your email and try again.' });
    }

    if (!user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Code verified successfully',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Step 3: Set New Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ resetToken });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset session. Please restart verification.' });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user profile
router.get('/me', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update current user profile & addresses
router.put('/me', userAuth, async (req, res) => {
  try {
    const { name, phone, avatar, addresses } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) {
      const cleanPhone = (phone || '').trim().replace(/[\s\-\(\)]/g, '');
      if (!cleanPhone) {
        return res.status(400).json({ message: 'Mobile number is compulsory' });
      }
      if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9' });
      }
      updates.phone = phone.trim();
    }
    if (avatar) updates.avatar = avatar;
    if (addresses) updates.addresses = addresses;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
