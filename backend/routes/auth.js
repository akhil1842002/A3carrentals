const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const { generateTokens, verifyRefreshToken } = require('../utils/token');

// Allowed administrative roles
const ALLOWED_ADMIN_ROLES = ['admin', 'superadmin', 'staff'];

// Login with Email or Username and Password (with Role Check & Remember Me)
router.post('/login', async (req, res) => {
  try {
    const { username, email, password, rememberMe } = req.body;
    const identifier = (email || username || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const caseRegex = new RegExp(`^${escaped}$`, 'i');

    // 1. Look up in Admin collection (case-insensitive for username & email)
    let account = await Admin.findOne({
      $or: [
        { email: caseRegex },
        { username: caseRegex },
        { username: identifier },
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });

    // Fallback: check User collection if role is admin/superadmin/staff
    if (!account) {
      account = await User.findOne({
        email: caseRegex,
        role: { $in: ALLOWED_ADMIN_ROLES }
      });
    }

    if (!account) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 2. Validate Password
    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 3. Strict Role Verification
    const assignedRole = account.role || 'admin';
    if (!ALLOWED_ADMIN_ROLES.includes(assignedRole)) {
      return res.status(403).json({
        message: 'Access denied: You do not possess administrator credentials to access this portal.'
      });
    }

    // 4. Generate Access Token & Refresh Token (incorporating rememberMe)
    const { accessToken, refreshToken } = generateTokens({
      id: account._id,
      username: account.username || account.email,
      email: account.email,
      role: assignedRole,
      name: account.name
    }, !!rememberMe);

    // Save refresh token to document
    account.refreshToken = refreshToken;
    await account.save();

    res.json({
      token: accessToken,
      refreshToken,
      admin: {
        id: account._id,
        username: account.username || account.email,
        email: account.email,
        name: account.name,
        role: assignedRole,
        avatar: account.avatar || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Refresh Admin Access Token using Refresh Token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Find account in Admin or User collection
    let account = await Admin.findById(decoded.id);
    if (!account) {
      account = await User.findById(decoded.id);
    }

    if (!account) {
      return res.status(401).json({ message: 'Admin account not found' });
    }

    // Ensure token in DB matches the submitted refresh token
    if (account.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token has expired or been revoked. Please log in again.' });
    }

    // Verify role is still an admin role
    const assignedRole = account.role || 'admin';
    if (!ALLOWED_ADMIN_ROLES.includes(assignedRole)) {
      return res.status(403).json({ message: 'Access denied: Administrator privileges revoked' });
    }

    // Issue refreshed token pair (preserve rememberMe flag from previous token)
    const isRemembered = !!decoded.rememberMe;
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: account._id,
      username: account.username || account.email,
      email: account.email,
      role: assignedRole,
      name: account.name
    }, isRemembered);

    account.refreshToken = newRefreshToken;
    await account.save();

    res.json({
      token: accessToken,
      refreshToken: newRefreshToken,
      admin: {
        id: account._id,
        username: account.username || account.email,
        email: account.email,
        name: account.name,
        role: assignedRole,
        avatar: account.avatar || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout Admin & invalidate Refresh Token
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await Admin.updateOne({ refreshToken }, { $set: { refreshToken: '' } });
      await User.updateOne({ refreshToken }, { $set: { refreshToken: '' } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current admin profile
router.get('/me', adminAuth, async (req, res) => {
  try {
    const adminId = req.admin?.id;
    if (!adminId || adminId === 'admin-dev') {
      const defaultAdmin = await Admin.findOne();
      if (!defaultAdmin) return res.status(404).json({ message: 'Admin not found' });
      return res.json({
        admin: {
          id: defaultAdmin._id,
          username: defaultAdmin.username,
          email: defaultAdmin.email,
          name: defaultAdmin.name,
          role: defaultAdmin.role || 'admin',
          avatar: defaultAdmin.avatar || ''
        }
      });
    }

    let admin = await Admin.findById(adminId).select('-password');
    if (!admin) {
      admin = await User.findById(adminId).select('-password');
    }
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const assignedRole = admin.role || 'admin';
    if (!ALLOWED_ADMIN_ROLES.includes(assignedRole)) {
      return res.status(403).json({ message: 'Access denied: Administrator privileges required' });
    }

    res.json({
      admin: {
        id: admin._id,
        username: admin.username || admin.email,
        email: admin.email,
        name: admin.name,
        role: assignedRole,
        avatar: admin.avatar || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
