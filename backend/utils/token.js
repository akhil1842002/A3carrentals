const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'carbook_secret_key_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (JWT_SECRET + '_refresh');

// Access token expiry (e.g. 15m or 1h)
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h';

/**
 * Generate Access Token and Refresh Token
 * @param {Object} payload - User or Admin payload (id, email, role, name, username)
 * @param {Boolean} rememberMe - Whether "remember me" was checked
 */
const generateTokens = (payload, rememberMe = false) => {
  const tokenPayload = {
    id: payload.id || payload._id,
    email: payload.email,
    role: payload.role || 'customer',
    name: payload.name || '',
    username: payload.username || ''
  };

  const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });

  // If remember me is true, refresh token lasts 30 days, else 7 days
  const refreshExpiry = rememberMe ? '30d' : '7d';
  const refreshToken = jwt.sign(
    { 
      id: tokenPayload.id, 
      role: tokenPayload.role, 
      rememberMe: !!rememberMe 
    },
    JWT_REFRESH_SECRET,
    { expiresIn: refreshExpiry }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify Refresh Token
 * @param {String} token
 */
const verifyRefreshToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Verify Access Token
 * @param {String} token
 */
const verifyAccessToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateTokens,
  verifyRefreshToken,
  verifyAccessToken,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY
};
