import { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, FaSignOutAlt, FaShieldAlt, FaCircle, 
  FaClock, FaBars, FaBell, FaCheckDouble, FaCalendarCheck, 
  FaDollarSign, FaExclamationTriangle, FaTimesCircle, FaCheckCircle
} from 'react-icons/fa';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';

export default function AdminHeader({
  activeTab,
  onAddCar,
  adminUser,
  onLogout,
  onOpenLogin,
  isAuthenticated,
  onToggleMobileSidebar,
  settings,
  onNavigateTab,
  onNavigateBooking
}) {
  const [timeStr, setTimeStr] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch admin notifications and poll every 10s
  const fetchNotifs = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getNotifications({ limit: 30 });
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // background silent fetch
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await markNotificationRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        // ignore
      }
    }
    setNotifOpen(false);

    // Direct navigation to record
    if (notif.bookingReference && onNavigateBooking) {
      onNavigateBooking(notif.bookingReference);
    } else if (onNavigateTab) {
      onNavigateTab('bookings');
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return <FaCalendarCheck style={{ color: '#2563eb' }} />;
      case 'booking_confirmed':
        return <FaCheckCircle style={{ color: '#059669' }} />;
      case 'booking_cancelled':
        return <FaTimesCircle style={{ color: '#dc2626' }} />;
      case 'payment_received':
        return <FaDollarSign style={{ color: '#16a34a' }} />;
      case 'deposit_held':
        return <FaShieldAlt style={{ color: '#7c3aed' }} />;
      case 'deposit_refunded':
        return <FaDollarSign style={{ color: '#0284c7' }} />;
      case 'damage_charge':
        return <FaExclamationTriangle style={{ color: '#d97706' }} />;
      default:
        return <FaBell style={{ color: '#f96d00' }} />;
    }
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Fleet & Sales Overview',
          subtitle: 'Live fleet availability, customer rentals, and quick management controls'
        };
      case 'cars':
        return {
          title: 'Car Fleet & Vehicle Specifications',
          subtitle: 'Manage vehicle models, availability status, pricing tiers, and fleet operations'
        };
      case 'bookings':
        return {
          title: 'Car Rental Bookings & Dispatches',
          subtitle: 'Self-drive reservations, verified driver assignments, and vehicle return inspection logs'
        };
      case 'drivers':
        return {
          title: 'Professional Drivers Roster',
          subtitle: 'Driver verification, experience licenses, and active trip assignments'
        };
      case 'customers':
        return {
          title: 'Customer Directory & Accounts',
          subtitle: 'Registered accounts, booking history, and contact details'
        };
      case 'reports':
        return {
          title: 'Financial Reports & KPI Analytics',
          subtitle: 'Revenue breakdown, fleet occupancy rates, and downloadable CSV records'
        };
      case 'landing':
        return {
          title: 'Landing Page CMS & Content Editor',
          subtitle: 'Customize hero headlines, about text, how-it-works steps, stats, and promotional banners'
        };
      case 'settings':
        return {
          title: 'Business & System Settings',
          subtitle: 'Pricing policies, driver daily fees, tax rates, social channels, and WhatsApp gateway'
        };
      default:
        return {
          title: 'Management Console',
          subtitle: `${settings?.businessName || 'CarBook'} central operational administration`
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <header className="admin-top-header">
      {/* Title & Subtitle + Hamburger Toggle */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          className="admin-header-hamburger-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <FaBars />
        </button>
        <div className="admin-header-title-col">
          <h1 className="admin-page-title">{title}</h1>
          <p className="admin-page-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Right Actions & Status */}
      <div className="admin-header-actions-col">
        {/* System Online Status Pill */}
        <div className="admin-system-status-pill">
          <FaCircle className="status-live-dot" size={8} />
          <span>System Online</span>
          <span className="status-time">• {timeStr}</span>
        </div>

        {/* Notifications Bell Dropdown */}
        {isAuthenticated && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="admin-notif-bell-btn"
              onClick={() => setNotifOpen(prev => !prev)}
              title="Admin Notifications"
              style={{
                position: 'relative',
                background: notifOpen ? '#f1f5f9' : '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: unreadCount > 0 ? '#f96d00' : '#64748b',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              <FaBell size={16} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                    border: '2px solid #ffffff'
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {notifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '360px',
                  maxHeight: '440px',
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
                  zIndex: 1050,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Popover Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>Admin Notifications</strong>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#fee2e2',
                          color: '#dc2626',
                          padding: '2px 7px',
                          borderRadius: '10px'
                        }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f96d00',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Mark all notifications as read"
                    >
                      <FaCheckDouble size={11} /> Mark all read
                    </button>
                  )}
                </div>

                {/* Popover Notifications List */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
                      <FaBell size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>All caught up!</div>
                      <div style={{ fontSize: '11.5px', marginTop: '2px' }}>No new notifications.</div>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          borderBottom: '1px solid #f1f5f9',
                          background: notif.read ? '#ffffff' : 'rgba(249, 109, 0, 0.04)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = notif.read ? '#ffffff' : 'rgba(249, 109, 0, 0.04)'}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: notif.read ? '#f1f5f9' : '#ffedd5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {getNotifIcon(notif.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <strong style={{ fontSize: '12.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {notif.title}
                            </strong>
                            <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                          </div>
                          <p style={{ margin: '2px 0 4px', fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {notif.source === 'whatsapp' ? (
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                                📱 WhatsApp
                              </span>
                            ) : notif.source === 'admin' ? (
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #ddd6fe' }}>
                                🏢 Admin
                              </span>
                            ) : (
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                                🌐 Web
                              </span>
                            )}
                            {notif.bookingReference && (
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>
                                #{notif.bookingReference}
                              </span>
                            )}
                          </div>
                        </div>
                        {!notif.read && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#f96d00',
                              flexShrink: 0,
                              marginTop: '6px'
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contextual Action Button */}
        {(activeTab === 'overview' || activeTab === 'cars') && (
          <button
            type="button"
            className="btn-admin-primary"
            onClick={onAddCar}
            title="Register a new car to the rental fleet"
          >
            <FaPlus size={13} />
            <span>Add Vehicle</span>
          </button>
        )}

        {/* Admin User Section */}
        {isAuthenticated ? (
          <div className="admin-header-user-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="admin-user-avatar-mini">
              {(adminUser?.name || 'Admin')[0].toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
              <span className="admin-user-name-text">{adminUser?.name || 'Administrator'}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{adminUser?.email || ''}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="admin-header-logout-btn"
              title="Sign Out of Admin Console"
              style={{
                marginLeft: '4px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              <FaSignOutAlt size={11} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-admin-login-trigger"
            onClick={onOpenLogin}
          >
            <FaShieldAlt size={13} />
            <span>Admin Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
