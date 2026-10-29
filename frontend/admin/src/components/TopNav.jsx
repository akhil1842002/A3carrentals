import { useState, useEffect } from 'react';
import { 
  FaHome, FaCar, FaTools, FaMapMarkerAlt, FaClock, FaSearch, 
  FaPlus, FaSignOutAlt, FaExternalLinkAlt, FaCalendarAlt, FaUserTie, 
  FaShoppingBag, FaUsers, FaChartBar, FaCog 
} from 'react-icons/fa';
import { renderBrandName } from '../utils/format';

export default function TopNav({ activeTab, setActiveTab, onAddCar, adminUser, onLogout, settings }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strTime = `${String(hours).padStart(2, '0')}:${minutes}${ampm}`;
      setCurrentTime(strTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <div className="brand-logo" onClick={() => setActiveTab('overview')}>
          {renderBrandName(settings?.businessName || 'CarBook')}<span>Admin</span>
        </div>

        <div className="nav-pills">
          <button
            className={`nav-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaHome /> Overview
          </button>

          <button
            className={`nav-pill-btn ${activeTab === 'cars' ? 'active' : ''}`}
            onClick={() => setActiveTab('cars')}
          >
            <FaCar /> Cars
          </button>

          <button
            className={`nav-pill-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <FaCalendarAlt /> Bookings
          </button>

          <button
            className={`nav-pill-btn ${activeTab === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveTab('drivers')}
          >
            <FaUserTie /> Drivers
          </button>


          <button
            className={`nav-pill-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <FaUsers /> Customers
          </button>

          <button
            className={`nav-pill-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FaChartBar /> Reports
          </button>

          <button
            className={`nav-pill-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog /> Settings
          </button>
        </div>
      </div>

      <div className="nav-right">
        <button className="btn-add-vehicle" onClick={onAddCar}>
          <FaPlus /> Add Vehicle
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Admin account"
          >
            <div className="profile-avatar">
              {adminUser?.name ? adminUser.name.charAt(0) : 'A'}
            </div>
          </button>

          {showProfileMenu && (
            <div className="profile-menu">
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{adminUser?.name || 'Administrator'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{adminUser?.email || 'admin@carbook.com'}</div>
                <span className="profile-role-badge">Super Admin</span>
              </div>

              <a
                href="http://localhost:5175"
                target="_blank"
                rel="noreferrer"
                className="profile-menu-item"
              >
                <FaExternalLinkAlt style={{ fontSize: '12px' }} /> View Customer Portal
              </a>

              <button
                className="profile-menu-item logout"
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
