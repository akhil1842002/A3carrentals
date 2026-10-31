const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Universal JWT Verification
const verifyToken = (req) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'carbook_secret_key_2024');
  } catch (err) {
    return null;
  }
};

// Admin auth middleware (compatible with Admin model & User with admin/superadmin role)
const adminAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Session expired or token invalid', tokenExpired: true });
    }
    // Verify admin/superadmin/staff role
    const role = decoded.role || (decoded.username ? 'admin' : null);
    if (!role || !['admin', 'superadmin', 'staff'].includes(role)) {
      return res.status(403).json({ message: 'Access denied: Administrator privileges required' });
    }
    req.admin = decoded;
    req.user = decoded;
    return next();
  }

  // If no token provided
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  // Allow local development / demo access only when no Authorization header is present
  req.admin = { id: 'admin-dev', role: 'superadmin', name: 'CarBook Super Admin' };
  req.user = req.admin;
  next();
};

// User auth middleware (customer, driver, staff, admin)
const userAuth = (req, res, next) => {
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ message: 'No token or token is invalid, authorization denied' });
  }
  req.user = decoded;
  next();
};

// Role-based access control middleware
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRole = decoded.role || (decoded.username ? 'admin' : 'customer');
    if (!allowedRoles.includes(userRole) && userRole !== 'superadmin') {
      return res.status(403).json({ 
        message: `Forbidden: role '${userRole}' is not permitted to perform this action` 
      });
    }

    req.user = decoded;
    if (['admin', 'superadmin', 'staff'].includes(userRole)) {
      req.admin = decoded;
    }
    next();
  };
};

module.exports = adminAuth;
module.exports.adminAuth = adminAuth;
module.exports.userAuth = userAuth;
module.exports.requireRole = requireRole;
module.exports.verifyToken = verifyToken;
