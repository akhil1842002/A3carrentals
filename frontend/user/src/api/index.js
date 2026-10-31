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

// Refresh token concurrency control
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to catch 401s and refresh expired user tokens
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = requestUrl.includes('/user-auth/login') || requestUrl.includes('/user-auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const storedRefreshToken = localStorage.getItem('carbook_refresh_token');
      if (!storedRefreshToken) {
        localStorage.removeItem('carbook_token');
        localStorage.removeItem('carbook_refresh_token');
        localStorage.removeItem('carbook_user');
        window.dispatchEvent(new CustomEvent('user:auth-expired'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await axios.post(`${baseURL}/user-auth/refresh-token`, {
          refreshToken: storedRefreshToken
        });

        const { token: newToken, refreshToken: newRefreshToken, user } = res.data;
        if (newToken) {
          localStorage.setItem('carbook_token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('carbook_refresh_token', newRefreshToken);
          }
          if (user) {
            localStorage.setItem('carbook_user', JSON.stringify(user));
          }

          API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return API(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('carbook_token');
        localStorage.removeItem('carbook_refresh_token');
        localStorage.removeItem('carbook_user');
        window.dispatchEvent(new CustomEvent('user:auth-expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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
export const refreshUserToken = (token) => API.post('/user-auth/refresh-token', { refreshToken: token });
export const logoutUserApi = (token) => API.post('/user-auth/logout', { refreshToken: token });
export const forgotPassword = (data) => API.post('/user-auth/forgot-password', data);
export const verifyOtp = (data) => API.post('/user-auth/verify-otp', data);
export const resetPassword = (data) => API.post('/user-auth/reset-password', data);
export const getMe = () => API.get('/user-auth/me');
export const updateProfile = (data) => API.put('/user-auth/me', data);
export const changePassword = (data) => API.post('/user-auth/change-password', data);

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
export const cleanWhatsAppNumber = (phone, fallback = '919629182095') => {
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
