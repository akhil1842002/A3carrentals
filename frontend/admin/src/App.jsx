import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import ExecutiveOverview from './components/ExecutiveOverview';
import StatsCards from './components/StatsCards';
import CarCard from './components/CarCard';
import VehicleDetailModal from './components/VehicleDetailModal';
import CarModal from './components/CarModal';
import LoginModal from './components/LoginModal';
import AdminLoginScreen from './components/AdminLoginScreen';
import BookingsManagement from './components/BookingsManagement';
import DriversManagement from './components/DriversManagement';
import CustomersManagement from './components/CustomersManagement';
import ReportsView from './components/ReportsView';
import LandingPageEditor from './components/LandingPageEditor';
import SettingsView from './components/SettingsView';
import MasterSetup from './components/MasterSetup';
import Pagination from './components/Pagination';
import ConfirmModal from './components/ConfirmModal';
import {
  login as apiLogin,
  getMe,
  logoutAdmin,
  getCars,
  getCarStats,
  createCar,
  updateCar,
  deleteCar,
  getSettings
} from './api';

const DEFAULT_FILTERS = {
  rentalType: 'daily',
  maxPrice: null,
  brands: [],
  vehicleTypes: [],
  transmissions: [],
  fuelTypes: []
};

export default function App() {
  // Navigation & View with Persistent URL Sync
  const getInitialTab = () => {
    try {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab) return urlTab;
      const stored = localStorage.getItem('adminActiveTab');
      if (stored) return stored;
    } catch (e) {}
    return 'overview';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('adminActiveTab', tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  useEffect(() => {
    const handlePopState = () => {
      const tab = new URLSearchParams(window.location.search).get('tab') || 'overview';
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [carStatusFilter, setCarStatusFilter] = useState('all');
  const [carBrandFilter, setCarBrandFilter] = useState('all');
  const [carSearch, setCarSearch] = useState('');
  const [carPage, setCarPage] = useState(1);
  const [carPageSize, setCarPageSize] = useState(8);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');

  const handleNavigateBooking = (ref) => {
    setBookingSearchQuery(ref || '');
    setActiveTab('bookings');
  };

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
    isAlert: false,
    loading: false,
    onConfirm: () => {}
  });

  // Settings State
  const [settings, setSettings] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await getSettings();
      if (res.data) setSettings(res.data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.businessName) {
      document.title = `${settings.businessName} Admin Portal`;
    }
  }, [settings?.businessName]);

  // Data State
  const [cars, setCars] = useState([]);
  const [stats, setStats] = useState(null);
  const [detailCar, setDetailCar] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [carToEdit, setCarToEdit] = useState(null);

  // Filters
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Listen for session expiry from axios refresh interceptor
  useEffect(() => {
    const onAuthExpired = () => {
      setIsAuthenticated(false);
      setAdminUser(null);
      setAuthError('Your session has expired. Please sign in again.');
    };
    window.addEventListener('admin:auth-expired', onAuthExpired);
    return () => window.removeEventListener('admin:auth-expired', onAuthExpired);
  }, []);

  // Check auth status
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (token || refreshToken) {
      getMe()
        .then(res => {
          const user = res.data?.admin || res.data;
          const role = user?.role || 'admin';
          if (!['admin', 'superadmin', 'staff'].includes(role)) {
            throw new Error('Access denied: Administrator role required');
          }
          setAdminUser(user);
          localStorage.setItem('adminUser', JSON.stringify(user));
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminUser');
          setIsAuthenticated(false);
          setAdminUser(null);
        })
        .finally(() => {
          setCheckingAuth(false);
        });
    } else {
      setIsAuthenticated(false);
      setCheckingAuth(false);
    }
  }, []);

  // Fetch cars and stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 1000 };
      if (filters.brands.length) params.brand = filters.brands.join(',');
      if (filters.vehicleTypes.length) params.vehicleType = filters.vehicleTypes.join(',');
      if (filters.transmissions.length) params.transmission = filters.transmissions.join(',');
      if (filters.fuelTypes.length) params.fuelType = filters.fuelTypes.join(',');
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const [carsRes, statsRes] = await Promise.all([
        getCars(params),
        getCarStats().catch(() => ({ data: null }))
      ]);

      const fetchedCars = carsRes.data.cars || [];
      setCars(fetchedCars);
      if (statsRes?.data) setStats(statsRes.data);

      // If a vehicle detail modal is currently open, keep it updated with fresh data
      setDetailCar(prev => {
        if (!prev) return null;
        return fetchedCars.find(c => c._id === prev._id) || null;
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Silent 10-second background polling so stats and cars update live without reloading
  const fetchDataSilently = useCallback(async () => {
    try {
      const params = { limit: 1000 };
      if (filters.brands.length) params.brand = filters.brands.join(',');
      if (filters.vehicleTypes.length) params.vehicleType = filters.vehicleTypes.join(',');
      if (filters.transmissions.length) params.transmission = filters.transmissions.join(',');
      if (filters.fuelTypes.length) params.fuelType = filters.fuelTypes.join(',');
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const [carsRes, statsRes] = await Promise.all([
        getCars(params),
        getCarStats().catch(() => ({ data: null }))
      ]);

      const fetchedCars = carsRes.data.cars || [];
      setCars(fetchedCars);
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      // background silent update
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchDataSilently();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchDataSilently]);

  // Auth Handlers
  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const payload = {
        username: credentials.email || credentials.username,
        email: credentials.email || credentials.username,
        password: credentials.password,
        rememberMe: !!credentials.rememberMe
      };
      const res = await apiLogin(payload);
      const token = res.data.token;
      const refreshToken = res.data.refreshToken;
      const user = res.data.admin || res.data;

      // Role check: ensure user possesses an admin/superadmin/staff role
      const role = user?.role || 'admin';
      if (!['admin', 'superadmin', 'staff'].includes(role)) {
        throw new Error('Access denied: You do not possess administrator credentials to access this portal.');
      }

      localStorage.setItem('adminToken', token);
      if (refreshToken) {
        localStorage.setItem('adminRefreshToken', refreshToken);
      }
      localStorage.setItem('adminUser', JSON.stringify(user));

      // Handle Remember Me identifier storage
      const identifier = credentials.email || credentials.username;
      if (credentials.rememberMe && identifier) {
        localStorage.setItem('rememberedAdminIdentifier', identifier);
      } else {
        localStorage.removeItem('rememberedAdminIdentifier');
      }

      setAdminUser(user);
      setIsAuthenticated(true);
      setLoginModalOpen(false);
      fetchData();
    } catch (err) {
      setAuthError(err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    const rfToken = localStorage.getItem('adminRefreshToken');
    if (rfToken) {
      logoutAdmin(rfToken).catch(() => {});
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  const requireAuth = (callback) => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    callback();
  };

  // Car Handlers
  const handleAddCar = () => {
    requireAuth(() => {
      setCarToEdit(null);
      setCarModalOpen(true);
    });
  };

  const handleEditCar = (car) => {
    requireAuth(() => {
      setCarToEdit(car);
      setCarModalOpen(true);
    });
  };

  const handleSaveCar = async (carData) => {
    try {
      if (carToEdit && carToEdit._id) {
        await updateCar(carToEdit._id, carData);
      } else {
        await createCar(carData);
      }
      setCarModalOpen(false);
      setCarToEdit(null);
      await fetchData();
    } catch (err) {
      setConfirmModal({
        isOpen: true,
        title: 'Save Vehicle Failed',
        message: 'Failed to save vehicle: ' + (err.response?.data?.message || err.message),
        confirmText: 'Dismiss',
        variant: 'danger',
        isAlert: true,
        loading: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      throw err;
    }
  };

  const handleDeleteCar = (id) => {
    requireAuth(() => {
      const car = cars.find(c => c._id === id);
      if (car?.hasOngoingTrip) {
        setConfirmModal({
          isOpen: true,
          title: 'Cannot Delete Vehicle',
          message: `Vehicle "${car.name}" has an ongoing trip (Ref: ${car.ongoingBooking?.bookingReference || 'Active'}). Complete the trip first before deleting.`,
          confirmText: 'Dismiss',
          variant: 'danger',
          isAlert: true,
          loading: false,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }

      setConfirmModal({
        isOpen: true,
        title: 'Delete Vehicle?',
        message: `Are you sure you want to permanently delete "${car?.name || 'this vehicle'}" from the fleet? This action cannot be undone.`,
        confirmText: 'Yes, Delete Vehicle',
        cancelText: 'Cancel',
        variant: 'danger',
        isAlert: false,
        loading: false,
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, loading: true }));
          try {
            await deleteCar(id);
            setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            fetchData();
          } catch (err) {
            setConfirmModal({
              isOpen: true,
              title: 'Delete Failed',
              message: 'Failed to delete vehicle: ' + (err.response?.data?.message || err.message),
              confirmText: 'Dismiss',
              variant: 'danger',
              isAlert: true,
              loading: false,
              onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
          }
        }
      });
    });
  };

  const handleSetCarStatus = async (car, targetStatus) => {
    requireAuth(async () => {
      const newStatus = targetStatus || (car.status === 'rented' ? 'available' : 'rented');

      // Validation: Block status change if trip is ongoing
      if (car.hasOngoingTrip && newStatus !== 'rented') {
        const ref = car.ongoingBooking?.bookingReference || 'Active Trip';
        setConfirmModal({
          isOpen: true,
          title: 'Cannot Change Vehicle Status',
          message: `Vehicle "${car.name}" currently has an ONGOING TRIP (Booking Ref: ${ref}). You cannot change its status to "${newStatus}" while the trip is in progress. The trip must be marked as completed in Bookings first.`,
          confirmText: 'Go to Bookings',
          cancelText: 'Dismiss',
          variant: 'warning',
          isAlert: false,
          loading: false,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setActiveSection('bookings');
          },
          onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }

      try {
        await updateCar(car._id, { status: newStatus });
        setDetailCar(prev => prev && prev._id === car._id ? { ...prev, status: newStatus } : prev);
        fetchData();
      } catch (err) {
        setConfirmModal({
          isOpen: true,
          title: 'Status Update Failed',
          message: 'Failed to update vehicle status: ' + (err.response?.data?.message || err.message),
          confirmText: 'Dismiss',
          variant: 'danger',
          isAlert: true,
          loading: false,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
      }
    });
  };

  // Filtered cars for cars management view
  const filteredCars = cars.filter(car => {
    if (carStatusFilter !== 'all' && (car.status || 'available') !== carStatusFilter) return false;
    if (carBrandFilter !== 'all' && (car.brand || '').toLowerCase() !== carBrandFilter.toLowerCase()) return false;
    if (carSearch.trim()) {
      const q = carSearch.toLowerCase();
      const name = (car.name || '').toLowerCase();
      const brand = (car.brand || '').toLowerCase();
      const plate = (car.plateNumber || '').toLowerCase();
      if (!name.includes(q) && !brand.includes(q) && !plate.includes(q)) return false;
    }
    return true;
  });

  const paginatedCars = filteredCars.slice((carPage - 1) * carPageSize, carPage * carPageSize);

  const availableCarsCount = cars.filter(c => c.status === 'available').length;
  const rentedCarsCount = cars.filter(c => c.status === 'rented').length;
  const serviceCarsCount = cars.filter(c => c.status === 'maintenance').length;

  if (checkingAuth) {
    return (
      <div className="admin-login-page-root">
        <div className="spinner"></div>
        <div className="spinner-text" style={{ color: '#ffffff', marginTop: '14px', fontSize: '14px' }}>
          Verifying administrative credentials...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLoginScreen
        onLogin={handleLogin}
        error={authError}
        loading={authLoading}
        settings={settings}
      />
    );
  }

  return (
    <div className="admin-app-layout">
      {/* 1. Sleek Dark Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        carsCount={cars.length}
        adminUser={adminUser}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onOpenLogin={() => setLoginModalOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        settings={settings}
      />

      {/* 2. Main Area (Sticky Header + Fluid Scrollable Body) */}
      <div className="admin-main-container">
        <AdminHeader
          activeTab={activeTab}
          onAddCar={handleAddCar}
          adminUser={adminUser}
          onLogout={handleLogout}
          onOpenLogin={() => setLoginModalOpen(true)}
          isAuthenticated={isAuthenticated}
          onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
          settings={settings}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onNavigateBooking={handleNavigateBooking}
        />

        <div className="admin-content-area">
          {/* Module Router */}
          {activeTab === 'overview' ? (
            <ExecutiveOverview
              cars={cars}
              onAddCar={handleAddCar}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onEditCar={handleEditCar}
              onRefreshData={fetchData}
            />
          ) : activeTab === 'bookings' ? (
            <BookingsManagement
              initialSearch={bookingSearchQuery}
              onClearInitialSearch={() => setBookingSearchQuery('')}
            />
          ) : activeTab === 'drivers' ? (
            <DriversManagement />
          ) : activeTab === 'customers' ? (
            <CustomersManagement />
          ) : activeTab === 'reports' ? (
            <ReportsView />
          ) : activeTab === 'landing' ? (
            <LandingPageEditor />
          ) : activeTab === 'master' ? (
            <MasterSetup onMasterUpdated={() => fetchData && fetchData()} />
          ) : activeTab === 'settings' ? (
            <SettingsView onSettingsUpdated={(newSettings) => setSettings(newSettings)} />
          ) : (
            <div className="cars-management-root">
              {/* Fleet Filter Bar */}
              <div className="fleet-top-bar">
                <div className="fleet-status-filter-pills">
                  <button
                    type="button"
                    className={`fleet-status-pill ${carStatusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => { setCarStatusFilter('all'); setCarPage(1); }}
                  >
                    All Vehicles ({cars.length})
                  </button>
                  <button
                    type="button"
                    className={`fleet-status-pill available ${carStatusFilter === 'available' ? 'active' : ''}`}
                    onClick={() => { setCarStatusFilter('available'); setCarPage(1); }}
                  >
                    🟢 Available ({availableCarsCount})
                  </button>
                  <button
                    type="button"
                    className={`fleet-status-pill rented ${carStatusFilter === 'rented' ? 'active' : ''}`}
                    onClick={() => { setCarStatusFilter('rented'); setCarPage(1); }}
                  >
                    🔵 Rented ({rentedCarsCount})
                  </button>
                  <button
                    type="button"
                    className={`fleet-status-pill maintenance ${carStatusFilter === 'maintenance' ? 'active' : ''}`}
                    onClick={() => { setCarStatusFilter('maintenance'); setCarPage(1); }}
                  >
                    🟠 In Service ({serviceCarsCount})
                  </button>
                </div>

                <div className="fleet-controls-right">
                  <select
                    className="fleet-brand-select"
                    value={carBrandFilter}
                    onChange={(e) => { setCarBrandFilter(e.target.value); setCarPage(1); }}
                    title="Filter by vehicle brand"
                  >
                    <option value="all">All Brands</option>
                    {[...new Set([...['Tesla', 'BMW', 'Toyota', 'Audi', 'Ford', 'Mahindra', 'Hyundai', 'Tata', 'Maruti Suzuki', 'Kia'], ...cars.map(c => c.brand).filter(Boolean)])].sort().map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  <div className="fleet-search-wrap" style={{ flex: '1', maxWidth: '380px' }}>
                    <input
                      type="text"
                      placeholder="Search by vehicle, plate number, brand or model..."
                      value={carSearch}
                      onChange={(e) => { setCarSearch(e.target.value); setCarPage(1); }}
                    />
                    {carSearch && (
                      <button className="clear-btn" onClick={() => { setCarSearch(''); setCarPage(1); }}>✕</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full-width Vehicle Fleet Grid (No sidebars squishing cards) */}
              <main className="vehicles-fleet-fullwidth">
                {loading ? (
                  <div className="spinner-container">
                    <div className="spinner"></div>
                  </div>
                ) : filteredCars.length > 0 ? (
                  <>
                    <div className="cars-grid">
                      {paginatedCars.map(car => (
                        <CarCard
                          key={car._id || car.name}
                          car={car}
                          isSelected={detailCar && detailCar._id === car._id}
                          onSelect={(c) => setDetailCar(c)}
                          onEdit={handleEditCar}
                          onDelete={handleDeleteCar}
                          onQuickStatusChange={handleSetCarStatus}
                          rentalType={filters.rentalType}
                        />
                      ))}
                    </div>
                    <Pagination
                      currentPage={carPage}
                      totalItems={filteredCars.length}
                      pageSize={carPageSize}
                      pageSizeOptions={[4, 8, 16, 32]}
                      onPageChange={setCarPage}
                      onPageSizeChange={setCarPageSize}
                      label="vehicles"
                    />
                  </>
                ) : (
                  <div className="empty-state">
                    <h3>No vehicles found</h3>
                    <p>Try resetting the status filter or search parameters.</p>
                    <button
                      className="btn-admin-primary"
                      onClick={() => {
                        setCarStatusFilter('all');
                        setCarBrandFilter('all');
                        setCarSearch('');
                        setFilters(DEFAULT_FILTERS);
                      }}
                      style={{ marginTop: '12px' }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </main>
            </div>
          )}
        </div>
      </div>

      {/* Car Modal */}
      <CarModal
        isOpen={carModalOpen}
        onClose={() => {
          setCarModalOpen(false);
          setCarToEdit(null);
        }}
        onSave={handleSaveCar}
        carToEdit={carToEdit}
      />

      {/* Vehicle Detail View Modal */}
      <VehicleDetailModal
        isOpen={!!detailCar}
        car={detailCar}
        onClose={() => setDetailCar(null)}
        onEdit={(car) => {
          setDetailCar(null);
          handleEditCar(car);
        }}
        onDelete={(id) => {
          setDetailCar(null);
          handleDeleteCar(id);
        }}
        onUpdateStatus={handleSetCarStatus}
      />

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onLogin={handleLogin}
        error={authError}
        loading={authLoading}
      />

      {/* Custom Confirmation / Alert Dialog */}
      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
