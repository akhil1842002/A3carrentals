import { useState, useEffect } from 'react';
import { 
  FaUsers, FaSearch, FaEnvelope, FaPhone, FaCheckCircle, 
  FaBan, FaCalendarAlt, FaCar, FaTools, FaEye, FaStar, 
  FaDollarSign, FaFilter, FaSortAmountDown, FaCircle
} from 'react-icons/fa';
import { getCustomers, updateCustomerStatus } from '../api';
import CustomerDetailModal from './CustomerDetailModal';
import Pagination from './Pagination';
import { formatDate } from '../utils/format';

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'rentals' | 'spend'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Selected Customer for Details Modal & initial tab
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState('rentals');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      if (res.data && Array.isArray(res.data)) {
        setCustomers(res.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.warn('Backend customers API error:', err?.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customer, e) => {
    if (e) e.stopPropagation();
    const nextStatus = customer.status === 'suspended' ? 'active' : 'suspended';
    if (!window.confirm(`Set customer ${customer.name}'s status to ${nextStatus.toUpperCase()}?`)) return;
    
    // Optimistic local update
    setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, status: nextStatus } : c));

    try {
      await updateCustomerStatus(customer._id, nextStatus);
    } catch (err) {
      console.log('Status updated in local session');
    }
  };

  const openCustomerModal = (customerId, tab = 'rentals', e) => {
    if (e) e.stopPropagation();
    setModalInitialTab(tab);
    setSelectedCustomerId(customerId);
  };

  // Top KPIs
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status !== 'suspended').length;
  const totalBookings = customers.reduce((sum, c) => sum + (c.rentalsCount || 0), 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || c.totalRentalsSpent || 0), 0);
  const totalReviews = customers.reduce((sum, c) => sum + (c.reviewsCount || 0), 0);

  // Filter & Sort
  const filtered = customers.filter(c => {
    if (statusFilter !== 'all' && (c.status || 'active') !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = c.name?.toLowerCase() || '';
      const email = c.email?.toLowerCase() || '';
      const phone = c.phone?.toLowerCase() || '';
      const id = c._id?.toLowerCase() || '';
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !id.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'rentals') return (b.rentalsCount || 0) - (a.rentalsCount || 0);
    if (sortBy === 'spend') return (b.totalSpent || 0) - (a.totalSpent || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // Paginated slice
  const paginatedCustomers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="customers-mgmt-root">
      {/* 4 Premium Metric KPI Cards */}
      <div className="cust-stats-grid">
        <div className="cust-stat-card">
          <div className="cust-stat-icon-box" style={{ background: 'rgba(249, 109, 0, 0.12)', color: 'var(--primary)' }}>
            <FaUsers />
          </div>
          <div className="cust-stat-info-col">
            <span className="cust-stat-label-text">Registered Customers</span>
            <strong className="cust-stat-val-text">{totalCustomers}</strong>
            <span className="cust-stat-sub-text">
              <FaCircle size={7} /> {activeCustomers} Active Accounts
            </span>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-box" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
            <FaCar />
          </div>
          <div className="cust-stat-info-col">
            <span className="cust-stat-label-text">Vehicle Rentals</span>
            <strong className="cust-stat-val-text">{totalBookings}</strong>
            <span className="cust-stat-sub-text" style={{ color: '#2563eb' }}>
              <FaCircle size={7} /> Fleet Bookings
            </span>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-box" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' }}>
            <FaDollarSign />
          </div>
          <div className="cust-stat-info-col">
            <span className="cust-stat-label-text">Customer Lifetime Spend</span>
            <strong className="cust-stat-val-text">₹{totalRevenue.toLocaleString('en-IN')}</strong>
            <span className="cust-stat-sub-text" style={{ color: '#9333ea' }}>
              <FaCircle size={7} /> Total Rental Value
            </span>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
            <FaStar />
          </div>
          <div className="cust-stat-info-col">
            <span className="cust-stat-label-text">Customer Reviews</span>
            <strong className="cust-stat-val-text">{totalReviews}</strong>
            <span className="cust-stat-sub-text" style={{ color: '#d97706' }}>
              <FaCircle size={7} /> Verified Feedback
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cust-toolbar-bar">
        <div className="cust-search-input-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by customer name, email, phone or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="cust-dropdown-select"
            style={{ minWidth: '150px' }}
          >
            <option value="all">All Accounts ({customers.length})</option>
            <option value="active">Active Only ({customers.filter(c => c.status !== 'suspended').length})</option>
            <option value="suspended">Suspended Only ({customers.filter(c => c.status === 'suspended').length})</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="cust-dropdown-select"
            style={{ minWidth: '180px' }}
          >
            <option value="newest">Sort: Newest Registered</option>
            <option value="rentals">Sort: Most Car Rentals</option>
            <option value="spend">Sort: Highest Total Spend</option>
          </select>
        </div>
      </div>

      {/* Customers Data Table */}
      {loading ? (
        <div className="spinner-container"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FaUsers size={48} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
          <h3>No customers found</h3>
          <p>{search ? 'Try clearing your search query or status filter.' : 'Registered customer accounts will appear here.'}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Customer Profile</th>
                <th>Contact Details</th>
                <th>Registered Date</th>
                <th>Vehicle Rentals</th>
                <th>Reviews</th>
                <th>Total Spent</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map(c => (
                <tr 
                  key={c._id} 
                  className="clickable-row"
                  onClick={() => openCustomerModal(c._id, 'rentals')}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="driver-avatar-circle" style={{ width: '42px', height: '42px', fontSize: '16px', background: 'linear-gradient(135deg, #f96d00 0%, #ea580c 100%)', color: '#fff', fontWeight: 800 }}>
                        {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>{c.name}</strong>
                        <small style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                          ID: {c._id.slice(-6).toUpperCase()}
                          {c.addresses?.[0] ? ` • ${c.addresses[0].city}` : ''}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <FaEnvelope style={{ fontSize: '11px', color: 'var(--primary)' }} /> {c.email}
                      </span>
                      <small style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <FaPhone style={{ fontSize: '10px' }} /> {c.phone || 'No phone recorded'}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {formatDate(c.createdAt)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="cust-count-badge badge-rentals"
                      onClick={(e) => openCustomerModal(c._id, 'rentals', e)}
                      title="Click to view Vehicle Rental History"
                    >
                      <FaCar size={11} /> {c.rentalsCount || 0} Bookings
                    </button>
                  </td>
                  <td>
                    <button 
                      className="cust-count-badge badge-reviews"
                      onClick={(e) => openCustomerModal(c._id, 'reviews', e)}
                      title="Click to view Customer Reviews"
                    >
                      <FaStar size={11} /> {c.reviewsCount || 0} Reviews
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <span className={`status-chip ${c.status === 'suspended' ? 'chip-cancelled' : 'chip-active'}`}>
                      {c.status === 'suspended' ? <FaBan style={{ marginRight: '4px' }} /> : <FaCheckCircle style={{ marginRight: '4px' }} />}
                      {c.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="btn-action-sm"
                        style={{ background: 'rgba(249, 109, 0, 0.1)', color: 'var(--primary)', borderColor: 'rgba(249, 109, 0, 0.25)', fontWeight: 700 }}
                        onClick={(e) => openCustomerModal(c._id, 'rentals', e)}
                        title="View Full History, Bookings & Reviews"
                      >
                        <FaEye /> View History
                      </button>

                      <button
                        className={`btn-action-sm ${c.status === 'suspended' ? 'confirm' : 'cancel'}`}
                        onClick={(e) => handleToggleStatus(c, e)}
                        title={c.status === 'suspended' ? 'Reactivate Customer' : 'Suspend Customer'}
                      >
                        {c.status === 'suspended' ? <FaCheckCircle /> : <FaBan />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            label="customers"
          />
        </div>
      )}

      {/* Comprehensive Customer Profile & History Modal */}
      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          initialTab={modalInitialTab}
          onClose={() => setSelectedCustomerId(null)}
          onCustomerUpdated={fetchCustomers}
        />
      )}
    </div>
  );
}
