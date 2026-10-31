import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' });

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
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

// Response interceptor to catch 401s and refresh expired access tokens automatically
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const storedRefreshToken = localStorage.getItem('adminRefreshToken');
      if (!storedRefreshToken) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        window.dispatchEvent(new CustomEvent('admin:auth-expired'));
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
        const res = await axios.post(`${baseURL}/auth/refresh-token`, {
          refreshToken: storedRefreshToken
        });

        const { token: newToken, refreshToken: newRefreshToken, admin } = res.data;
        if (newToken) {
          localStorage.setItem('adminToken', newToken);
          if (newRefreshToken) {
            localStorage.setItem('adminRefreshToken', newRefreshToken);
          }
          if (admin) {
            localStorage.setItem('adminUser', JSON.stringify(admin));
          }

          API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return API(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        window.dispatchEvent(new CustomEvent('admin:auth-expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');
export const refreshToken = (token) => API.post('/auth/refresh-token', { refreshToken: token });
export const logoutAdmin = (token) => API.post('/auth/logout', { refreshToken: token });

// Cars
export const getCars = (params) => API.get('/cars', { params });
export const getCar = (id) => API.get(`/cars/${id}`);
export const getCarStats = () => API.get('/cars/stats/overview');
export const createCar = (data) => API.post('/cars', data);
export const updateCar = (id, data) => API.put(`/cars/${id}`, data);
export const deleteCar = (id) => API.delete(`/cars/${id}`);

// Tyres
export const getTyres = (params) => API.get('/tyres', { params });
export const getTyre = (id) => API.get(`/tyres/${id}`);
export const createTyre = (data) => API.post('/tyres', data);
export const updateTyre = (id, data) => API.put(`/tyres/${id}`, data);
export const deleteTyre = (id) => API.delete(`/tyres/${id}`);

// Settings
export const getSettings = () => API.get('/settings');
export const updateSettings = (data) => API.put('/settings', data);
export const updateLandingPage = (data) => API.put('/settings/landing-page', data);
export const updateEventOffer = (data) => API.put('/settings/event-offer', data);

// Fleet Master Setup (Brands, Vehicle Types, Fuel Types, Features)
export const getFleetMaster = () => API.get('/settings/fleet-master');
export const updateFleetMaster = (data) => API.put('/settings/fleet-master', data);
export const quickAddFleetMasterItem = (category, name) => API.post(`/settings/fleet-master/${category}`, { name });
export const editFleetMasterItem = (category, oldName, newName) => API.put(`/settings/fleet-master/${category}/edit`, { oldName, newName });
export const deleteFleetMasterItem = (category, item) => API.delete(`/settings/fleet-master/${category}/${encodeURIComponent(item)}`);

// Bookings
export const getAdminBookings = (params) => API.get('/bookings', { params });
export const updateBooking = (id, data) => API.put(`/bookings/${id}`, data);
export const updateBookingStatus = (id, data) => API.put(`/bookings/${id}/status`, data);
export const assignDriver = (id, driverId) => API.put(`/bookings/${id}/assign-driver`, { driverId });
export const toggleBookingDriver = (id, withDriver) => API.put(`/bookings/${id}/toggle-driver`, { withDriver });
export const recordInspection = (id, data) => API.put(`/bookings/${id}/inspection`, data);
export const addBookingPayment = (id, data) => API.post(`/bookings/${id}/payments`, data);
export const addAdditionalCharge = (id, data) => API.post(`/bookings/${id}/additional-charges`, data);
export const createAdminBooking = (data) => API.post('/bookings/admin', data);

// Notifications
export const getNotifications = (params) => API.get('/notifications', { params });
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// Drivers
export const getDrivers = () => API.get('/drivers');
export const getDriverDetails = (id) => API.get(`/drivers/${id}/details`);
export const createDriver = (data) => API.post('/drivers', data);
export const updateDriver = (id, data) => API.put(`/drivers/${id}`, data);
export const deleteDriver = (id) => API.delete(`/drivers/${id}`);

// Orders
export const getOrders = () => API.get('/orders');
export const updateOrderStatus = (id, data) => API.put(`/orders/${id}/status`, data);

// Customers
export const getCustomers = () => API.get('/customers');
export const getCustomerDetails = (id) => API.get(`/customers/${id}/details`);
export const updateCustomerStatus = (id, status) => API.put(`/customers/${id}/status`, { status });

// Reviews
export const getReviews = (params) => API.get('/reviews', { params });
export const createAdminReview = (data) => API.post('/reviews/admin-create', data);
export const deleteReview = (id) => API.delete(`/reviews/${id}`);
export const toggleReviewLanding = (id, showOnLanding) => API.put(`/reviews/${id}/landing`, { showOnLanding });

// Reports
export const getReportsOverview = () => API.get('/reports/overview');

export default API;
