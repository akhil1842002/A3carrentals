import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' });

// Attach token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('carbook_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Settings
export const getSettings = () => API.get('/settings');

// Cars
export const getCars = (params) => API.get('/cars', { params });
export const getCar = (id) => API.get(`/cars/${id}`);
export const getCarStats = () => API.get('/cars/stats/overview');

// Tyres
export const getTyres = (params) => API.get('/tyres', { params });
export const getTyre = (id) => API.get(`/tyres/${id}`);

// User Auth & Profile
export const registerUser = (data) => API.post('/user-auth/register', data);
export const verifySignupOtp = (data) => API.post('/user-auth/verify-signup-otp', data);
export const resendSignupOtp = (data) => API.post('/user-auth/resend-signup-otp', data);
export const loginUser = (data) => API.post('/user-auth/login', data);
export const googleLogin = (data) => API.post('/user-auth/google-login', data);
export const forgotPassword = (data) => API.post('/user-auth/forgot-password', data);
export const verifyOtp = (data) => API.post('/user-auth/verify-otp', data);
export const resetPassword = (data) => API.post('/user-auth/reset-password', data);
export const getMe = () => API.get('/user-auth/me');
export const updateProfile = (data) => API.put('/user-auth/me', data);

// Bookings
export const getBookingQuote = (data) => API.post('/bookings/quote', data);
export const createBooking = (data) => API.post('/bookings', data);
export const getMyBookings = () => API.get('/bookings/my');
export const cancelBooking = (id) => API.put(`/bookings/${id}/cancel`);

// Tyre Orders
export const createTyreOrder = (data) => API.post('/orders', data);
export const getMyOrders = () => API.get('/orders/my');

// Driver Portal
export const getMyDriverTrips = () => API.get('/drivers/trips/my');
export const updateDriverTripStatus = (bookingId, driverStatus) => API.put(`/drivers/trips/${bookingId}/status`, { driverStatus });
export const linkMyDriverProfile = () => API.post('/drivers/link-me');

// Reviews
export const createReview = (data) => API.post('/reviews', data);
export const createTripReview = (data) => API.post('/reviews/trip', data);
export const getReviews = (params) => API.get('/reviews', { params });
export const getLandingReviews = () => API.get('/reviews/landing');
export const getMyReviews = (userId) => API.get(`/reviews/user/${userId}`);

// WhatsApp Link Generator
export const cleanWhatsAppNumber = (phone, fallback = '917397098447') => {
  if (!phone) return fallback;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return fallback;
  if (digits.length === 10) digits = '91' + digits;
  return digits;
};

export const getWhatsAppLink = (message, phone) => {
  const cleanPhone = cleanWhatsAppNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

export default API;
