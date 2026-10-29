import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiGrid, FiCalendar, FiUser, 
  FiLogOut, FiMenu, FiX, FiChevronRight
} from 'react-icons/fi';
import { FaCar, FaUserTie } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { renderBrandName } from '../utils/format';

export default function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';
  const pathname = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDriver = user?.role === 'driver';

  // Navigation Items
  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard?tab=overview',
      icon: <FiGrid size={18} />,
      isActive: pathname === '/dashboard' && (currentTab === 'overview' || !searchParams.get('tab')),
      badge: null
    },
    {
      title: 'Vehicle Fleet',
      path: '/dashboard?tab=cars',
      icon: <FaCar size={18} />,
      isActive: pathname === '/dashboard' && currentTab === 'cars',
      badge: null
    },
    {
      title: 'My Car Rentals',
      path: '/dashboard?tab=bookings',
      icon: <FiCalendar size={18} />,
      isActive: pathname === '/dashboard' && currentTab === 'bookings',
      badge: null
    },
    {
      title: 'Profile & Address',
      path: '/dashboard?tab=profile',
      icon: <FiUser size={18} />,
      isActive: pathname === '/dashboard' && currentTab === 'profile',
      badge: null
    }
  ];

  // Derive Current Page Title
  let pageTitle = 'Customer Dashboard';
  if (pathname.startsWith('/car/')) pageTitle = 'Vehicle Specification';
  else if (currentTab === 'overview') pageTitle = 'Customer Dashboard Overview';
  else if (currentTab === 'bookings') pageTitle = 'My Car Rentals & Agreements';
  else if (currentTab === 'profile') pageTitle = 'Account Profile & Address';
  else if (currentTab === 'cars') pageTitle = 'Vehicle Fleet & Reservation';

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CB';

  return (
    <div className="portal-app-wrapper">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="portal-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sleek Left Sidebar */}
      <aside className={`portal-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="portal-sidebar-brand">
          <Link to="/dashboard?tab=overview" className="portal-logo-link">
            <div className="portal-logo-icon">🚗</div>
            <div className="portal-logo-text">
              {renderBrandName(settings?.businessName || 'CarBook')}
            </div>
          </Link>
          <button 
            type="button" 
            className="portal-close-mobile-btn" 
            onClick={() => setMobileOpen(false)}
            aria-label="Close Sidebar"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="portal-user-profile-badge">
          <div className="portal-avatar">{userInitials}</div>
          <div className="portal-user-meta">
            <div className="portal-user-name" title={user?.name}>{user?.name || 'Customer'}</div>
            <div className="portal-user-role">
              <span className={`portal-role-tag ${isDriver ? 'driver-role' : 'customer-role'}`}>
                {isDriver ? 'Chauffeur / Driver' : 'Customer Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="portal-nav-section">
          <div className="portal-nav-label">MAIN NAVIGATION</div>
          <nav className="portal-nav-menu">
            {navItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`portal-nav-item ${item.isActive ? 'active' : ''} ${item.highlight ? 'highlight-driver' : ''}`}
              >
                <span className="portal-nav-icon">{item.icon}</span>
                <span className="portal-nav-title">{item.title}</span>
                {item.badge && (
                  <span className={`portal-nav-badge ${item.highlight ? 'badge-driver' : ''}`}>
                    {item.badge}
                  </span>
                )}
                {item.isActive && <FiChevronRight className="portal-active-chevron" size={14} />}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="portal-sidebar-footer">
          <button type="button" className="portal-logout-action-btn" onClick={handleLogout}>
            <FiLogOut size={16} />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="portal-main-area">
        {/* Top App Header */}
        <header className="portal-top-header">
          <div className="portal-top-left">
            <button
              type="button"
              className="portal-hamburger-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <FiMenu size={22} />
            </button>
            <div className="portal-page-header-titles">
              <h1 className="portal-page-title">{pageTitle}</h1>
              <span className="portal-page-subtitle">{settings?.businessName || 'CarBook'} Mobility &amp; Automotive Platform</span>
            </div>
          </div>

          <div className="portal-top-right">
            {/* Quick Profile Pill */}
            <div className="portal-header-user-pill">
              <div className="portal-pill-avatar">{userInitials}</div>
              <span className="portal-pill-name">{user?.name?.split(' ')[0] || 'User'}</span>
            </div>

            {/* Quick Logout */}
            <button
              type="button"
              className="portal-header-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="portal-content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
