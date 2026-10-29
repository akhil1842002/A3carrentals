const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Login with Email or Username and Password
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (email || username || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }
    const admin = await Admin.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: admin._id, username: admin.username, email: admin.email, role: 'superadmin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: 'superadmin',
        avatar: admin.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current admin
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const adminId = req.admin?.id;
    if (!adminId || adminId === 'admin-dev') {
      // Find default superadmin
      const defaultAdmin = await Admin.findOne();
      if (!defaultAdmin) return res.status(404).json({ message: 'Admin not found' });
      return res.json({
        admin: {
          id: defaultAdmin._id,
          username: defaultAdmin.username,
          email: defaultAdmin.email,
          name: defaultAdmin.name,
          role: 'superadmin',
          avatar: defaultAdmin.avatar
        }
      });
    }
    const admin = await Admin.findById(adminId).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: 'superadmin',
        avatar: admin.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
