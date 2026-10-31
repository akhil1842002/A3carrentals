import { useState, useEffect, useMemo } from 'react';
import { 
  FaCar, FaCalendarAlt, FaDollarSign, FaPlus, FaUserTie, 
  FaArrowRight, FaShieldAlt, FaUsers, FaClock, FaCheckCircle, FaStar,
  FaCalendarCheck, FaChartLine, FaFilter, FaWhatsapp, FaGlobe
} from 'react-icons/fa';
import { FiTrendingUp, FiActivity, FiCalendar } from 'react-icons/fi';
import { getReportsOverview, getAdminBookings, getDrivers, updateCar } from '../api';

export default function ExecutiveOverview({
  cars = [],
  onAddCar,
  onNavigateTab,
  onEditCar,
  onRefreshData
}) {
  const [report, setReport] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date Filter State: 'lifetime' | 'month' | 'week' | 'today' | 'custom'
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      const [reportsRes, bookingsRes, driversRes] = await Promise.all([
        getReportsOverview().catch(() => ({ data: null })),
        getAdminBookings().catch(() => ({ data: [] })),
        getDrivers().catch(() => ({ data: [] }))
      ]);

      if (reportsRes?.data) setReport(reportsRes.data);
      if (Array.isArray(bookingsRes?.data)) setAllBookings(bookingsRes.data);
      if (Array.isArray(driversRes?.data)) setDrivers(driversRes.data);
    } catch (err) {
      console.error('Failed to load executive overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Car Status Toggle
  const handleCarStatusChange = async (car, status) => {
    if (car.hasOngoingTrip && status !== 'rented') {
      alert(`Cannot change status to "${status}". Vehicle "${car.name}" has an ongoing trip (Ref: ${car.ongoingBooking?.bookingReference || 'Active'}). Please complete the trip in Bookings first.`);
      return;
    }
    try {
      await updateCar(car._id, { status });
      car.status = status;
      if (onRefreshData) onRefreshData();
      await loadOverviewData();
    } catch (err) {
      alert('Failed to update car status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Dynamic Date Filtered Bookings
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return allBookings.filter(b => {
      const bDate = new Date(b.createdAt || b.pickupDate || now);
      if (dateFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return bDate >= startOfDay && bDate <= endOfDay;
      }
      if (dateFilter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return bDate >= oneWeekAgo;
      }
      if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return bDate >= startOfMonth;
      }
      if (dateFilter === 'custom') {
        if (customStart && bDate < new Date(customStart)) return false;
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (bDate > end) return false;
        }
        return true;
      }
      return true; // 'lifetime'
    });
  }, [allBookings, dateFilter, customStart, customEnd]);

  // Computed metrics for active date range
  const availableCarsCount = cars.filter(c => c.status === 'available').length;
  const rentedCarsCount = cars.filter(c => c.status === 'rented').length;
  const serviceCarsCount = cars.filter(c => c.status === 'maintenance').length;

  const completedBookings = filteredBookings.filter(b => b.status === 'completed');
  const activeBookings = filteredBookings.filter(b => ['confirmed', 'ongoing', 'driver_assigned'].includes(b.status));
  const pendingBookings = filteredBookings.filter(b => b.status === 'pending');
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled');

  // Actual payments entered by admin (advance, partial, or fully paid)
  const getBookingPaidAmount = (b) => {
    if (!b || b.status === 'cancelled') return 0;
    if (Array.isArray(b.payments) && b.payments.length > 0) {
      const sum = b.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      if (sum > 0) return sum;
    }
    if (typeof b.paidAmount === 'number' && b.paidAmount > 0) return b.paidAmount;
    if (b.paymentStatus === 'fully_paid') return Number(b.totalPrice) || 0;
    if (typeof b.advanceAmount === 'number' && b.advanceAmount > 0) return b.advanceAmount;
    return 0;
  };

  // Only calculate actual payments entered (advance, partial, or full payment) as dashboard earnings
  const periodRevenue = filteredBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + getBookingPaidAmount(b), 0);

  const periodBookedValue = filteredBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

  // Channels calculation (WhatsApp) based on actual collected earnings
  const isAdmin = (b) => b.bookingSource === 'admin';

  const whatsappBookingsInScope = filteredBookings.filter(b => !isAdmin(b));
  const whatsappRevenueInScope = whatsappBookingsInScope
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + getBookingPaidAmount(b), 0);

  // Computed Date Range Text Label
  const dateRangeLabel = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'today') {
      return `Today (${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${weekAgo.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (dateFilter === 'month') {
      return `${now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
    }
    if (dateFilter === 'custom') {
      if (customStart && customEnd) return `${customStart} to ${customEnd}`;
      if (customStart) return `From ${customStart}`;
      if (customEnd) return `Up to ${customEnd}`;
      return 'Custom Range';
    }
    return 'All-Time Lifetime Overview';
  }, [dateFilter, customStart, customEnd]);

  // Generate SVG Data Points for Revenue Over Time Chart
  const chartPoints = useMemo(() => {
    const intervals = 7;
    const now = new Date();
    const points = [];

    for (let i = intervals - 1; i >= 0; i--) {
      let intervalStart, intervalEnd, label;

      if (dateFilter === 'today') {
        const h = Math.floor((24 / intervals) * (intervals - 1 - i));
        intervalStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h);
        intervalEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h + 3, 59, 59);
        label = `${h}:00`;
      } else if (dateFilter === 'week') {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        intervalStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        intervalEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
        label = d.toLocaleDateString(undefined, { weekday: 'short' });
      } else if (dateFilter === 'month') {
        const daysAgo = i * 4;
        const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        intervalStart = new Date(d.getTime() - 4 * 24 * 60 * 60 * 1000);
        intervalEnd = d;
        label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else {
        // lifetime: past 6 months
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        intervalStart = d;
        intervalEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        label = d.toLocaleDateString(undefined, { month: 'short' });
      }

      // Sum revenue for bookings that fall within this interval
      const bInInterval = filteredBookings.filter(b => {
        const bDate = new Date(b.createdAt || b.pickupDate || now);
        return bDate >= intervalStart && bDate <= intervalEnd && b.status !== 'cancelled';
      });

      const rev = bInInterval.reduce((sum, b) => sum + getBookingPaidAmount(b), 0);
      points.push({
        label,
        revenue: rev,
        count: bInInterval.length,
        dateStr: intervalStart.toLocaleDateString()
      });
    }

    return points;
  }, [filteredBookings, dateFilter]);

  // Max value for revenue chart scaling (fallback minimum $500 for clean visualization)
  const maxRevenueVal = Math.max(500, ...chartPoints.map(p => p.revenue));

  // Build SVG path strings (viewBox: 0 0 650 200)
  const svgWidth = 650;
  const svgHeight = 200;
  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const usableWidth = svgWidth - paddingLeft - paddingRight;
  const usableHeight = svgHeight - paddingTop - paddingBottom;

  const mappedPoints = chartPoints.map((pt, idx) => {
    const x = paddingLeft + (idx / Math.max(1, chartPoints.length - 1)) * usableWidth;
    const y = paddingTop + usableHeight - (pt.revenue / maxRevenueVal) * usableHeight;
    return { ...pt, x, y };
  });

  const linePathD = mappedPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPathD = mappedPoints.length > 0
    ? `${linePathD} L ${mappedPoints[mappedPoints.length - 1].x} ${paddingTop + usableHeight} L ${mappedPoints[0].x} ${paddingTop + usableHeight} Z`
    : '';

  // Calculate Top Performing Vehicles from filtered bookings
  const topVehicles = useMemo(() => {
    const carMap = {};
    filteredBookings.forEach(b => {
      const carId = b.car?._id || b.car?.name || 'unknown';
      const carName = b.car?.name || 'Luxury Vehicle';
      const carBrand = b.car?.brand || 'Premium';
      const carImg = b.car?.images?.[0] || '/images/car-1.jpg';
      const price = b.totalPrice || 0;

      if (!carMap[carId]) {
        carMap[carId] = { id: carId, name: carName, brand: carBrand, image: carImg, trips: 0, revenue: 0 };
      }
      carMap[carId].trips += 1;
      if (b.status !== 'cancelled') {
        carMap[carId].revenue += price;
      }
    });

    const list = Object.values(carMap).sort((a, b) => b.revenue - a.revenue);
    return list.slice(0, 4);
  }, [filteredBookings]);

  const maxTopRev = Math.max(1, ...(topVehicles.map(v => v.revenue)));

  // Donut chart calculations
  const totalStatusBookings = Math.max(1, filteredBookings.length);
  const compPct = Math.round((completedBookings.length / totalStatusBookings) * 100);
  const actPct = Math.round((activeBookings.length / totalStatusBookings) * 100);
  const pendPct = Math.round((pendingBookings.length / totalStatusBookings) * 100);
  const cancPct = Math.max(0, 100 - compPct - actPct - pendPct);

  // Circumference for r=40 is ~251.2
  const cCircum = 2 * Math.PI * 40;
  const compDash = (compPct / 100) * cCircum;
  const actDash = (actPct / 100) * cCircum;
  const pendDash = (pendPct / 100) * cCircum;
  const cancDash = (cancPct / 100) * cCircum;

  return (
    <div className="executive-overview-root">

      {/* 1. INTERACTIVE DATE FILTER BAR */}
      <div className="dash-date-filter-bar">
        <div className="dash-date-pills-group">
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
            <FaFilter size={12} color="#f96d00" /> Date Period:
          </span>
          <button
            type="button"
            className={`dash-date-pill ${dateFilter === 'lifetime' ? 'active' : ''}`}
            onClick={() => setDateFilter('lifetime')}
          >
            All-Time Lifetime
          </button>
          <button
            type="button"
            className={`dash-date-pill ${dateFilter === 'month' ? 'active' : ''}`}
            onClick={() => setDateFilter('month')}
          >
            This Month
          </button>
          <button
            type="button"
            className={`dash-date-pill ${dateFilter === 'week' ? 'active' : ''}`}
            onClick={() => setDateFilter('week')}
          >
            This Week
          </button>
          <button
            type="button"
            className={`dash-date-pill ${dateFilter === 'today' ? 'active' : ''}`}
            onClick={() => setDateFilter('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`dash-date-pill ${dateFilter === 'custom' ? 'active' : ''}`}
            onClick={() => setDateFilter('custom')}
          >
            Custom Range
          </button>
        </div>

        {dateFilter === 'custom' ? (
          <div className="dash-custom-date-wrap">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              title="Start Date"
            />
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              title="End Date"
            />
          </div>
        ) : (
          <div className="dash-date-active-label">
            <FiCalendar color="#f96d00" size={14} />
            <span>Scope: <strong>{dateRangeLabel}</strong></span>
          </div>
        )}
      </div>

      {/* 2. TOP EXECUTIVE KPI METRICS (Dynamic with Date Filter) */}
      <div className="overview-kpis-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {/* Metric 1: Fleet Status */}
        <div className="kpi-card fleet-kpi" onClick={() => onNavigateTab('cars')}>
          <div className="kpi-header">
            <span className="kpi-title">Fleet Vehicles</span>
            <div className="kpi-icon-pill orange">
              <FaCar size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-primary-val">{cars.length}</span>
            <span className="kpi-trend-pill positive">
              <FiActivity size={12} /> {availableCarsCount} Ready
            </span>
          </div>
          <div className="kpi-breakdown-bar">
            <div className="kpi-sub-item">
              <span className="dot available"></span>
              <span>{availableCarsCount} Available</span>
            </div>
            <div className="kpi-sub-item">
              <span className="dot rented"></span>
              <span>{rentedCarsCount} Rented</span>
            </div>
            <div className="kpi-sub-item">
              <span className="dot service"></span>
              <span>{serviceCarsCount} Service</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Rental Reservations */}
        <div className="kpi-card booking-kpi" onClick={() => onNavigateTab('bookings')}>
          <div className="kpi-header">
            <span className="kpi-title">Rental Reservations</span>
            <div className="kpi-icon-pill green">
              <FaCalendarAlt size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-primary-val">{filteredBookings.length}</span>
            <span className="kpi-trend-pill positive">
              {pendingBookings.length} Pending
            </span>
          </div>
          <div className="kpi-breakdown-bar">
            <div className="kpi-sub-item">
              <span className="dot rented"></span>
              <span>{activeBookings.length} Active Trips</span>
            </div>
            <div className="kpi-sub-item">
              <span className="dot available"></span>
              <span>{completedBookings.length} Completed</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Active Drivers */}
        <div className="kpi-card" onClick={() => onNavigateTab('drivers')}>
          <div className="kpi-header">
            <span className="kpi-title">Driver Roster</span>
            <div className="kpi-icon-pill blue">
              <FaUserTie size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-primary-val">{drivers.length}</span>
            <span className="kpi-trend-pill positive">
              Verified Drivers
            </span>
          </div>
          <div className="kpi-breakdown-bar">
            <div className="kpi-sub-item">
              <span className="dot available"></span>
              <span>{drivers.filter(d => d.status === 'active').length} Ready</span>
            </div>
            <div className="kpi-sub-item">
              <span className="dot rented"></span>
              <span>{drivers.filter(d => d.status === 'on_duty').length} On Trip</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Rental Fleet Revenue (Scoped by date range) */}
        <div className="kpi-card revenue-kpi" onClick={() => onNavigateTab('reports')}>
          <div className="kpi-header">
            <span className="kpi-title">Fleet Earnings (Collected)</span>
            <div className="kpi-icon-pill gold">
              <FaDollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-primary-val">₹{periodRevenue.toLocaleString('en-IN')}</span>
            <span className="kpi-trend-pill positive">
              <FiTrendingUp size={12} /> {dateFilter.toUpperCase()}
            </span>
          </div>
          <div className="kpi-breakdown-bar">
            <div className="kpi-sub-item">
              <span className="dot orange-dot"></span>
              <span>Collected Payments</span>
            </div>
            {periodBookedValue > periodRevenue && (
              <div className="kpi-sub-item" style={{ marginLeft: 'auto', color: '#64748b', fontSize: '11px' }}>
                Pending: ₹{(periodBookedValue - periodRevenue).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Channel (WhatsApp) */}
      <div style={{ marginBottom: '20px' }}>
        <div 
          onClick={() => onNavigateTab && onNavigateTab('bookings')}
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #bbf7d0',
            borderRadius: '14px',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <FaWhatsapp size={16} color="#16a34a" /> WhatsApp Bookings
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', background: '#bbf7d0', padding: '2px 8px', borderRadius: '12px' }}>
              {dateRangeLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '4px 0' }}>
            <strong style={{ fontSize: '26px', fontWeight: 800, color: '#14532d' }}>
              {whatsappBookingsInScope.length}
            </strong>
            <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>
              ₹{whatsappRevenueInScope.toLocaleString('en-IN')} collected
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d' }}>
            {filteredBookings.length > 0 ? `${Math.round((whatsappBookingsInScope.length / filteredBookings.length) * 100)}% of reservations` : 'Direct WhatsApp customer requests'}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE ANALYTICS & CHARTS GRID */}
      <div className="dash-charts-grid">
        {/* CHART 1: REVENUE OVER TIME (SVG Line & Area Chart) */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <div className="dash-chart-title-box">
              <h3>Earnings Trend &amp; Financial Velocity</h3>
              <p>Actual collected earnings (advance, partial, and full settlements) over {dateRangeLabel}</p>
            </div>
            <span className="dash-chart-stat-badge">
              <FaChartLine /> Total Collected: ₹{periodRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="svg-chart-container">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f96d00" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f96d00" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const yPos = paddingTop + usableHeight * (1 - ratio);
                const val = Math.round(maxRevenueVal * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={svgWidth - paddingRight}
                      y2={yPos}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray={ratio === 0 ? "0" : "4 4"}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={yPos + 4}
                      fontSize="10"
                      fill="#94a3b8"
                      textAnchor="end"
                      fontWeight="600"
                    >
                      ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {areaPathD && <path d={areaPathD} fill="url(#revGrad)" />}

              {/* Main Trend Line */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#f96d00"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points and Tooltip Triggers */}
              {mappedPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.idx === idx ? 7 : 4.5}
                    fill={hoveredPoint?.idx === idx ? "#ffffff" : "#f96d00"}
                    stroke="#f96d00"
                    strokeWidth={hoveredPoint?.idx === idx ? 3.5 : 2}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint({ ...pt, idx })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* X-axis Label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 12}
                    fontSize="11"
                    fill="#64748b"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredPoint.y / svgHeight) * 100 - 32}%`,
                  transform: 'translate(-50%, -100%)',
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  zIndex: 20
                }}
              >
                <div>{hoveredPoint.label}: ₹{hoveredPoint.revenue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{hoveredPoint.count} booking(s)</div>
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: BOOKING STATUS DISTRIBUTION (Donut + Legend) */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <div className="dash-chart-title-box">
              <h3>Booking Lifecycle &amp; Fulfillment</h3>
              <p>Breakdown across completed, active, pending &amp; cancelled trips</p>
            </div>
            <span className="dash-chart-stat-badge green">
              <FaCalendarCheck /> {filteredBookings.length} Total Trips
            </span>
          </div>

          <div className="donut-chart-wrap">
            <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
              <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                
                {/* Completed (Emerald) */}
                <circle
                  cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="14"
                  strokeDasharray={`${compDash} ${cCircum - compDash}`}
                  strokeDashoffset="0"
                />
                {/* Active (Blue) */}
                <circle
                  cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="14"
                  strokeDasharray={`${actDash} ${cCircum - actDash}`}
                  strokeDashoffset={-compDash}
                />
                {/* Pending (Amber) */}
                <circle
                  cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="14"
                  strokeDasharray={`${pendDash} ${cCircum - pendDash}`}
                  strokeDashoffset={-(compDash + actDash)}
                />
                {/* Cancelled (Rose) */}
                <circle
                  cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="14"
                  strokeDasharray={`${cancDash} ${cCircum - cancDash}`}
                  strokeDashoffset={-(compDash + actDash + pendDash)}
                />
              </svg>
              {/* Donut Center Counter */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{filteredBookings.length}</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Bookings</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="donut-legend-list">
              <div className="donut-legend-item">
                <div className="donut-legend-label">
                  <span className="donut-legend-dot" style={{ background: '#10b981' }}></span>
                  <span>Completed Trips</span>
                </div>
                <span className="donut-legend-val">{completedBookings.length} ({compPct}%)</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-legend-label">
                  <span className="donut-legend-dot" style={{ background: '#3b82f6' }}></span>
                  <span>Active &amp; On-Road</span>
                </div>
                <span className="donut-legend-val">{activeBookings.length} ({actPct}%)</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-legend-label">
                  <span className="donut-legend-dot" style={{ background: '#f59e0b' }}></span>
                  <span>Pending Confirmation</span>
                </div>
                <span className="donut-legend-val">{pendingBookings.length} ({pendPct}%)</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-legend-label">
                  <span className="donut-legend-dot" style={{ background: '#ef4444' }}></span>
                  <span>Cancelled</span>
                </div>
                <span className="donut-legend-val">{cancelledBookings.length} ({cancPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 3: FLEET DEPLOYMENT & UTILIZATION */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <div className="dash-chart-title-box">
              <h3>Fleet Readiness &amp; Deployment</h3>
              <p>Real-time vehicle availability across the active catalog</p>
            </div>
            <span className="dash-chart-stat-badge blue">
              {cars.length} Fleet Total
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
            {/* Stacked Progress Bar */}
            <div style={{ width: '100%', height: '14px', borderRadius: '7px', background: '#f1f5f9', display: 'flex', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${cars.length > 0 ? (availableCarsCount / cars.length) * 100 : 60}%`,
                  background: '#10b981',
                  transition: 'width 0.4s ease'
                }}
                title={`Available: ${availableCarsCount}`}
              />
              <div
                style={{
                  width: `${cars.length > 0 ? (rentedCarsCount / cars.length) * 100 : 30}%`,
                  background: '#3b82f6',
                  transition: 'width 0.4s ease'
                }}
                title={`Rented: ${rentedCarsCount}`}
              />
              <div
                style={{
                  width: `${cars.length > 0 ? (serviceCarsCount / cars.length) * 100 : 10}%`,
                  background: '#f59e0b',
                  transition: 'width 0.4s ease'
                }}
                title={`Service: ${serviceCarsCount}`}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>🟢 Available</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{availableCarsCount}</div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Ready to book</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>🔵 Rented Out</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{rentedCarsCount}</div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Currently on road</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>🟠 In Service</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{serviceCarsCount}</div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Maintenance check</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 4: TOP PERFORMING VEHICLES RANKING */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <div className="dash-chart-title-box">
              <h3>Top Generating Rental Vehicles</h3>
              <p>Top car models by booking frequency and total gross revenue</p>
            </div>
            <button
              type="button"
              className="btn-text-link"
              onClick={() => onNavigateTab('cars')}
            >
              View Fleet <FaArrowRight size={10} />
            </button>
          </div>

          <div className="top-vehicles-ranked-list">
            {topVehicles.length > 0 ? (
              topVehicles.map(v => (
                <div key={v.id} className="top-vehicle-row">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="top-vehicle-thumb"
                    onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
                  />
                  <div className="top-vehicle-info">
                    <span className="top-vehicle-name">{v.brand} {v.name}</span>
                    <div className="top-vehicle-bar-wrap">
                      <div
                        className="top-vehicle-bar-fill"
                        style={{ width: `${Math.max(15, Math.round((v.revenue / maxTopRev) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="top-vehicle-meta">
                    <span className="top-vehicle-rev">₹{v.revenue.toLocaleString('en-IN')}</span>
                    <span className="top-vehicle-trips">{v.trips} trip(s)</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
                No vehicle bookings recorded in this date period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. QUICK MANAGEMENT ACTIONS BAR */}
      <div className="overview-quick-bar">
        <div className="quick-bar-heading">
          <span className="bar-badge">COMMAND HUB</span>
          <h3>Quick Management Operations</h3>
        </div>
        <div className="quick-action-buttons">
          <button type="button" className="action-pill-btn primary" onClick={onAddCar}>
            <FaPlus /> Add New Vehicle
          </button>
          <button type="button" className="action-pill-btn outline" onClick={() => onNavigateTab('cars')}>
            <FaCar /> Vehicle Fleet Manager
          </button>
          <button type="button" className="action-pill-btn outline" onClick={() => onNavigateTab('bookings')}>
            <FaCalendarAlt /> Rental Bookings
          </button>
          <button type="button" className="action-pill-btn outline" onClick={() => onNavigateTab('drivers')}>
            <FaUserTie /> Driver Hub
          </button>
          <button type="button" className="action-pill-btn outline" onClick={() => onNavigateTab('customers')}>
            <FaUsers /> Customer Accounts
          </button>
        </div>
      </div>

      {/* 5. LIVE FLEET STATUS HUB */}
      <div className="overview-fleet-hub-card">
        <div className="card-header-flex">
          <div>
            <span className="card-badge">LIVE FLEET</span>
            <h3 className="card-title">Vehicle Fleet Availability &amp; Readiness</h3>
            <p className="card-subtitle">Real-time rental readiness, plate numbers, and vehicle specifications</p>
          </div>
          <button
            type="button"
            className="btn-text-link"
            onClick={() => onNavigateTab('cars')}
          >
            Open Fleet Manager <FaArrowRight size={11} />
          </button>
        </div>

        <div className="overview-fleet-table-wrap">
          <table className="overview-data-table">
            <thead>
              <tr>
                <th>Vehicle &amp; Model</th>
                <th>Plate Number</th>
                <th>Rental Status</th>
                <th>Transmission &amp; Fuel</th>
                <th>Daily Rate</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.slice(0, 6).map(car => {
                const currentStatus = car.status || 'available';

                return (
                  <tr key={car._id || car.name}>
                    <td>
                      <div className="table-car-cell">
                        <img
                          src={car.images && car.images[0] ? car.images[0] : '/images/car-1.jpg'}
                          alt={car.name}
                          className="table-car-thumb"
                          onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
                        />
                        <div>
                          <strong className="table-car-name">{car.name}</strong>
                          <span className="table-car-category">{car.brand} • {car.vehicleType || 'Sedan'} ({car.year || 2024})</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="plate-pill">{car.plateNumber || 'NYC-4521'}</span>
                    </td>
                    <td>
                      <div className="status-toggle-cell">
                        <span className={`status-dot ${currentStatus}`}></span>
                        <select
                          className={`table-status-select ${currentStatus}`}
                          value={currentStatus}
                          disabled={car.hasOngoingTrip}
                          title={car.hasOngoingTrip ? `Trip ongoing (Ref: ${car.ongoingBooking?.bookingReference || 'Active'}). Must complete trip in Bookings first.` : ''}
                          style={car.hasOngoingTrip ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                          onChange={(e) => handleCarStatusChange(car, e.target.value)}
                        >
                          <option value="available">Available</option>
                          <option value="rented">Rented Out</option>
                          <option value="maintenance">In Service</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                        {car.hasOngoingTrip && <span title="Trip ongoing - locked" style={{ fontSize: '11px', marginLeft: '4px' }}>🔒</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <strong>{car.transmission || 'Automatic'}</strong> • {car.fuelType || 'Petrol'} ({car.seats || 5} Seats)
                      </div>
                    </td>
                    <td>
                      <strong className="table-price-text">₹{car.pricePerDay || 158}</strong>
                      <span className="table-price-unit">/day</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => {
                          if (onEditCar) onEditCar(car);
                          else onNavigateTab('cars');
                        }}
                        title="Edit vehicle details"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SPLIT SECTION: RECENT BOOKINGS & CHAUFFEUR ROSTER */}
      <div className="overview-split-grid">
        {/* Left: Recent Bookings */}
        <div className="overview-activity-card">
          <div className="card-header-flex">
            <div>
              <span className="card-badge orange">RENTALS</span>
              <h3 className="card-title">Recent Rental Bookings</h3>
            </div>
            <button
              type="button"
              className="btn-text-link"
              onClick={() => onNavigateTab('bookings')}
            >
              All Bookings <FaArrowRight size={11} />
            </button>
          </div>

          <div className="activity-list">
            {filteredBookings.slice(0, 5).length > 0 ? (
              filteredBookings.slice(0, 5).map(b => (
                <div key={b._id} className="activity-item-row">
                  <div className="activity-left">
                    <div className="activity-avatar orange">
                      <FaCar />
                    </div>
                    <div>
                      <div className="activity-title-line">
                        <strong>{b.car ? `${b.car.brand} ${b.car.name}` : 'Rental Reservation'}</strong>
                        <span className={`booking-status-badge ${b.status || 'pending'}`}>
                          {b.status || 'pending'}
                        </span>
                      </div>
                      <div className="activity-desc">
                        <span>{b.bookingReference || 'BK-001'}</span>
                        <span>•</span>
                        <span>{b.days || 1} day(s)</span>
                        <span>•</span>
                        <span>{b.rentalType === 'with_driver' || b.withDriver ? 'With Driver' : 'Self-Drive'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="activity-right">
                    <strong className="activity-amount">₹{b.totalPrice || 0}</strong>
                    <button
                      type="button"
                      className="btn-quick-view-action"
                      onClick={() => onNavigateTab('bookings')}
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-sub-state">
                <p>No recent bookings recorded in this scope</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Chauffeur Roster */}
        <div className="overview-activity-card">
          <div className="card-header-flex">
            <div>
              <span className="card-badge blue">DRIVERS</span>
              <h3 className="card-title">Driver Dispatch Roster</h3>
            </div>
            <button
              type="button"
              className="btn-text-link"
              onClick={() => onNavigateTab('drivers')}
            >
              Manage Drivers <FaArrowRight size={11} />
            </button>
          </div>

          <div className="activity-list">
            {drivers.length > 0 ? (
              drivers.slice(0, 5).map(d => (
                <div key={d._id} className="activity-item-row">
                  <div className="activity-left">
                    <div className="activity-avatar blue">
                      <FaUserTie />
                    </div>
                    <div>
                      <div className="activity-title-line">
                        <strong>{d.name}</strong>
                        <span className={`order-status-badge ${d.status === 'active' ? 'delivered' : d.status === 'on_duty' ? 'shipped' : 'processing'}`}>
                          {d.status === 'active' ? 'Available' : d.status === 'on_duty' ? 'On Trip' : 'Off Duty'}
                        </span>
                      </div>
                      <div className="activity-desc">
                        <span>{d.licenceNumber}</span>
                        <span>•</span>
                        <span>{d.experienceYears} yrs exp</span>
                        <span>•</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ {d.rating || 4.9}</span>
                      </div>
                    </div>
                  </div>

                  <div className="activity-right">
                    <button
                      type="button"
                      className="btn-quick-view-action"
                      onClick={() => onNavigateTab('drivers')}
                    >
                      View Roster
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-sub-state">
                <p>No drivers registered in fleet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
