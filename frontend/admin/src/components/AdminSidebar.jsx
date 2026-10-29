import { 
  FaCar, FaCalendarAlt, FaUserTie, FaShoppingBag, 
  FaUsers, FaChartBar, FaCog, FaSignOutAlt, FaSignInAlt, FaExternalLinkAlt, 
  FaShieldAlt, FaChevronRight, FaDesktop, FaTimes, FaSlidersH
} from 'react-icons/fa';
import { FiDisc, FiGrid } from 'react-icons/fi';
import { renderBrandName } from '../utils/format';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  carsCount = 0,
  adminUser,
  isAuthenticated,
  onLogout,
  onOpenLogin,
  mobileOpen = false,
  onCloseMobile,
  settings
}) {
  const adminName = adminUser?.name || 'Administrator';
  const adminInitials = adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FiGrid size={17} />,
      badge: null
    },
    {
      id: 'cars',
      label: 'Vehicles',
      icon: <FaCar size={16} />,
      badge: carsCount ? `${carsCount}` : null
    },
    {
      id: 'master',
      label: 'Master Setup',
      icon: <FaSlidersH size={15} />,
      badge: null
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <FaCalendarAlt size={15} />,
      badge: null
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: <FaUserTie size={15} />,
      badge: null
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <FaUsers size={16} />,
      badge: null
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FaChartBar size={16} />,
      badge: null
    },
    {
      id: 'landing',
      label: 'Landing Page',
      icon: <FaDesktop size={15} />,
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <FaCog size={16} />,
      badge: null
    }
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-brand" onClick={() => handleTabClick('overview')}>
          <div className="admin-brand-icon">🚗</div>
          <div className="admin-brand-text">
            {renderBrandName(settings?.businessName || 'CarBook')}
            <span className="admin-tag">ADMIN</span>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              className="admin-sidebar-mobile-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseMobile();
              }}
              aria-label="Close menu"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Admin User Card */}
        <div className="admin-profile-card">
          <div className="admin-avatar">{adminInitials}</div>
          <div className="admin-meta">
            <div className="admin-name" title={adminName}>{adminName}</div>
            <div className="admin-role-badge">
              <FaShieldAlt size={10} />
              <span>{isAuthenticated ? 'Super Admin' : 'Demo Mode'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="admin-nav-section">
          <div className="admin-nav-label">MANAGEMENT CONSOLE</div>
          <nav className="admin-nav-menu">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(item.id)}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-label-text">{item.label}</span>
                  {item.badge && (
                    <span className="admin-nav-badge">{item.badge}</span>
                  )}
                  {isActive && <FaChevronRight className="admin-chevron" size={11} />}
                </button>
              );
            })}
          </nav>
        </div>

      {/* Quick Link: View Customer Site */}
      <div className="admin-sidebar-ext-link">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-ext-site-btn"
          title="Open customer rental website in new tab"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>🌐</span>
            <span>Customer Website</span>
          </div>
          <FaExternalLinkAlt size={11} />
        </a>
      </div>

      {/* Sign Out / Sign In Button */}
      <div className="admin-sidebar-footer">
        {isAuthenticated ? (
          <button
            type="button"
            className="admin-logout-btn"
            onClick={onLogout}
            title="Sign out of Admin Dashboard"
          >
            <FaSignOutAlt size={14} />
            <span>Sign Out Admin</span>
          </button>
        ) : (
          <button
            type="button"
            className="admin-login-sidebar-btn"
            onClick={onOpenLogin}
            title="Authenticate as Super Admin"
          >
            <FaSignInAlt size={14} />
            <span>Sign In as Admin</span>
          </button>
        )}
      </div>
    </aside>
  </>
  );
}
