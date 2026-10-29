import { useState, useEffect, useMemo } from 'react';
import { 
  FaChartBar, FaFileDownload, FaDollarSign, FaRupeeSign, FaCoins, FaCar, 
  FaUsers, FaReceipt, FaCheckCircle, FaClock, FaCheck, FaFileExcel, FaCalendarAlt,
  FaFilter, FaWhatsapp, FaGlobe, FaShieldAlt, FaExclamationTriangle
} from 'react-icons/fa';
import { FiCalendar } from 'react-icons/fi';
import { getReportsOverview, getSettings, getAdminBookings } from '../api';
import { formatDate } from '../utils/format';

export default function ReportsView() {
  const [report, setReport] = useState(null);
  const [settings, setSettings] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date Filter State: 'lifetime' | 'month' | 'week' | 'today' | 'custom'
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportRes, settingsRes, bookingsRes] = await Promise.all([
        getReportsOverview(),
        getSettings().catch(() => ({ data: {} })),
        getAdminBookings({ limit: 500 }).catch(() => ({ data: [] }))
      ]);
      setReport(reportRes.data);
      setSettings(settingsRes.data || {});
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sym = settings?.currencySymbol || '₹';
  const curr = settings?.currency || 'INR';
  const businessName = settings?.businessName || 'CarBook Mobility India';

  // Dynamic Date Filtered Bookings
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(b => {
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
        if (customStart) {
          const start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          if (bDate < start) return false;
        }
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (bDate > end) return false;
        }
        return true;
      }
      return true; // 'lifetime'
    });
  }, [bookings, dateFilter, customStart, customEnd]);

  // Computed Date Range Text Label
  const dateRangeLabel = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'today') {
      return `Today (${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }
    if (dateFilter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${oneWeekAgo.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (dateFilter === 'month') {
      return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    if (dateFilter === 'custom') {
      if (customStart && customEnd) {
        return `${formatDate(customStart)} to ${formatDate(customEnd)}`;
      }
      if (customStart) return `From ${formatDate(customStart)}`;
      if (customEnd) return `Up to ${formatDate(customEnd)}`;
      return 'Custom Date Range';
    }
    return 'All-Time Lifetime';
  }, [dateFilter, customStart, customEnd]);

  // Dynamic Metrics for Current Date Scope
  const filteredRentalRevenue = useMemo(() => {
    return filteredBookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  }, [filteredBookings]);

  // Actual Collected vs Outstanding
  const filteredCollected = useMemo(() => {
    return filteredBookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.paidAmount || (b.paymentStatus === 'fully_paid' ? b.totalPrice : 0)), 0);
  }, [filteredBookings]);

  const filteredOutstanding = useMemo(() => {
    return Math.max(0, filteredRentalRevenue - filteredCollected);
  }, [filteredRentalRevenue, filteredCollected]);

  const filteredDepositsHeld = useMemo(() => {
    return filteredBookings
      .filter(b => ['confirmed', 'ongoing', 'driver_assigned'].includes(b.status))
      .reduce((sum, b) => sum + (b.securityDeposit !== undefined && b.securityDeposit !== null ? Number(b.securityDeposit) : 0), 0);
  }, [filteredBookings]);

  const filteredDepositsRefunded = useMemo(() => {
    return filteredBookings
      .reduce((sum, b) => sum + (b.depositRefund?.amount || 0), 0);
  }, [filteredBookings]);

  const filteredDamageCharges = useMemo(() => {
    return filteredBookings
      .reduce((sum, b) => {
        const fromArr = (b.damageCharges || []).reduce((s, d) => s + (d.amount || 0), 0);
        const fromInsp = b.inspection?.extraCharges || 0;
        return sum + Math.max(fromArr, fromInsp);
      }, 0);
  }, [filteredBookings]);

  // WhatsApp vs Admin Direct Channels in Scope
  const isAdmin = (b) => b.bookingSource === 'admin';

  const whatsappBookingsInScope = useMemo(() => filteredBookings.filter(b => !isAdmin(b)), [filteredBookings]);
  const adminBookingsInScope = useMemo(() => filteredBookings.filter(isAdmin), [filteredBookings]);

  const whatsappRevenueInScope = useMemo(() => {
    return whatsappBookingsInScope
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  }, [whatsappBookingsInScope]);

  const adminRevenueInScope = useMemo(() => {
    return adminBookingsInScope
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  }, [adminBookingsInScope]);

  const completedTripsCount = useMemo(() => filteredBookings.filter(b => b.status === 'completed').length, [filteredBookings]);
  const activeTripsCount = useMemo(() => filteredBookings.filter(b => ['confirmed', 'ongoing', 'driver_assigned'].includes(b.status)).length, [filteredBookings]);
  const cancelledTripsCount = useMemo(() => filteredBookings.filter(b => b.status === 'cancelled').length, [filteredBookings]);

  // Export to Microsoft Excel (.xls XML / HTML Spreadsheet)
  const handleExportExcel = () => {
    if (!report) return;
    const nowStr = new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    const filenameDate = new Date().toISOString().slice(0, 10);

    const scopeSlug = dateFilter === 'custom' && customStart ? `${customStart}_to_${customEnd || 'now'}` : dateFilter;
    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>CarBook Financial Report</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #0f172a; }
          .title { font-size: 18pt; font-weight: bold; color: #f96d00; }
          .subtitle { font-size: 11pt; color: #64748b; font-style: italic; }
          .meta-box { background-color: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; }
          .section-banner { font-size: 13pt; font-weight: bold; background-color: #0f172a; color: #ffffff; padding: 8px 12px; }
          th { background-color: #f96d00; color: #ffffff; font-weight: bold; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11pt; }
          td { border: 1px solid #e2e8f0; padding: 7px 10px; vertical-align: middle; }
          .num { text-align: right; }
          .bold { font-weight: bold; }
          .even { background-color: #f8fafc; }
          .status-confirmed { color: #059669; font-weight: bold; }
          .status-ongoing { color: #2563eb; font-weight: bold; }
          .status-completed { color: #047857; font-weight: bold; }
          .status-cancelled { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="7" class="title">${businessName}</td>
          </tr>
          <tr>
            <td colspan="7" class="subtitle">Official Executive Financial &amp; Operations Statement • Generated: ${nowStr}</td>
          </tr>
          <tr>
            <td colspan="7" class="meta-box">Currency Base: ${curr} (${sym}) • Reporting Scope: ${dateRangeLabel} • Hub: ${settings?.hubAddress || 'India'}</td>
          </tr>
          <tr><td colspan="7"></td></tr>

          <!-- Section 1: Executive KPI Metrics -->
          <tr>
            <td colspan="7" class="section-banner">1. EXECUTIVE FINANCIAL &amp; FLEET PERFORMANCE METRICS (${dateRangeLabel})</td>
          </tr>
          <tr>
            <th colspan="4">Performance KPI Indicator</th>
            <th colspan="3" class="num">Value (${sym})</th>
          </tr>
          <tr>
            <td colspan="4" class="bold">Rental Revenue in Scope</td>
            <td colspan="3" class="num bold">${sym} ${Number(filteredRentalRevenue).toLocaleString('en-IN')}</td>
          </tr>
          <tr class="even">
            <td colspan="4" class="bold">Security Deposits in Escrow</td>
            <td colspan="3" class="num bold">${sym} ${Number(filteredDepositsHeld).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td colspan="4">Total Rental Reservations in Scope</td>
            <td colspan="3" class="num bold">${filteredBookings.length} bookings (${completedTripsCount} completed, ${activeTripsCount} active)</td>
          </tr>
          <tr class="even">
            <td colspan="4">Total Registered Verified Customers</td>
            <td colspan="3" class="num bold">${report.customersCount || 0} users</td>
          </tr>
          <tr>
            <td colspan="4">Total Managed Fleet Size</td>
            <td colspan="3" class="num bold">${report.carsTotal || 0} vehicles</td>
          </tr>
          <tr class="even">
            <td colspan="4">Fleet Available for Dispatch</td>
            <td colspan="3" class="num">${report.availableCars || 0} vehicles</td>
          </tr>
          <tr>
            <td colspan="4">Vehicles Currently on Road (Rented)</td>
            <td colspan="3" class="num">${report.rentedCars || 0} vehicles</td>
          </tr>
          <tr class="even">
            <td colspan="4">Fleet Utilization Rate</td>
            <td colspan="3" class="num bold">${report.utilizationRate || 0}%</td>
          </tr>
          <tr><td colspan="7"></td></tr>

          <!-- Section 2: Detailed Bookings Breakdown -->
          <tr>
            <td colspan="12" class="section-banner">2. ITEMIZED RENTAL BOOKINGS &amp; REVENUE LEDGER (${dateRangeLabel} • ${filteredBookings.length} Bookings)</td>
          </tr>
          <tr>
            <th style="width: 140px;">Booking Ref</th>
            <th style="width: 180px;">Customer Name</th>
            <th style="width: 150px;">Customer Phone</th>
            <th style="width: 190px;">Vehicle Rented</th>
            <th style="width: 120px;">Plate Number</th>
            <th style="width: 130px;">Service Type</th>
            <th style="width: 120px;">Pickup Date</th>
            <th style="width: 120px;">Return Date</th>
            <th style="width: 130px;" class="num">Rental Fee (${sym})</th>
            <th style="width: 130px;" class="num">Deposit (${sym})</th>
            <th style="width: 140px;" class="num">Total Amount (${sym})</th>
            <th style="width: 130px;">Trip Status</th>
          </tr>
          ${filteredBookings.map((b, idx) => `
            <tr class="${idx % 2 === 1 ? 'even' : ''}">
              <td class="bold">${b.bookingReference || '#' + (b._id || '').slice(-6).toUpperCase()}</td>
              <td>${b.user?.name || b.customer?.name || b.customerName || 'Customer'}</td>
              <td>${b.user?.phone || b.user?.email || b.customer?.phone || b.customerPhone || '-'}</td>
              <td class="bold">${b.car?.brand ? `${b.car.brand} ` : ''}${b.car?.name || 'Vehicle'}</td>
              <td>${b.car?.plateNumber || '-'}</td>
              <td>${b.withDriver || b.rentalType === 'chauffeured' || b.rentalType === 'with_driver' ? 'With Driver' : 'Self-Drive'}</td>
              <td>${formatDate(b.pickupDate || b.startDate) || '-'}</td>
              <td>${formatDate(b.dropoffDate || b.endDate) || '-'}</td>
              <td class="num">${sym} ${Number(b.totalPrice || 0).toLocaleString('en-IN')}</td>
              <td class="num">${sym} ${Number(b.securityDeposit || 0).toLocaleString('en-IN')}</td>
              <td class="num bold">${sym} ${Number((b.totalPrice || 0) + (b.securityDeposit || 0)).toLocaleString('en-IN')}</td>
              <td class="status-${b.status || 'confirmed'}">${(b.status || 'confirmed').toUpperCase()}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Financial_Report_${scopeSlug}_${filenameDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (!report) return;
    const filenameDate = new Date().toISOString().slice(0, 10);
    const scopeSlug = dateFilter === 'custom' && customStart ? `${customStart}_to_${customEnd || 'now'}` : dateFilter;
    
    let csvContent = "\uFEFFMetric,Value (" + sym + ")\n";
    csvContent += `Reporting Scope,${dateRangeLabel}\n`;
    csvContent += `Total Rental Revenue in Scope,${sym} ${filteredRentalRevenue}\n`;
    csvContent += `Security Deposits in Scope,${sym} ${filteredDepositsHeld}\n`;
    csvContent += `Total Bookings in Scope,${filteredBookings.length}\n`;
    csvContent += `Completed Bookings,${completedTripsCount}\n`;
    csvContent += `Active Bookings,${activeTripsCount}\n`;
    csvContent += `Cancelled Bookings,${cancelledTripsCount}\n`;
    csvContent += `Total Registered Customers,${report.customersCount || 0}\n`;
    csvContent += `Total Managed Vehicles,${report.carsTotal || 0}\n`;
    csvContent += `Available Vehicles,${report.availableCars || 0}\n`;
    csvContent += `Rented Vehicles,${report.rentedCars || 0}\n`;
    csvContent += `Fleet Utilization Rate,${report.utilizationRate || 0}%\n\n`;

    csvContent += "Booking Ref,Customer,Phone,Vehicle,Plate No,Type,Start Date,End Date,Rental Price (" + sym + "),Security Deposit (" + sym + "),Total (" + sym + "),Status\n";
    filteredBookings.forEach(b => {
      const ref = b.bookingReference || `#${(b._id || '').slice(-6).toUpperCase()}`;
      const custName = `"${(b.user?.name || b.customer?.name || b.customerName || 'Customer').replace(/"/g, '""')}"`;
      const custPhone = `"${(b.user?.phone || b.user?.email || b.customer?.phone || b.customerPhone || '').replace(/"/g, '""')}"`;
      const carName = `"${(b.car?.brand ? `${b.car.brand} ` : '') + (b.car?.name || 'Vehicle')}"`;
      const plate = `"${(b.car?.plateNumber || '').replace(/"/g, '""')}"`;
      const type = b.withDriver || b.rentalType === 'chauffeured' || b.rentalType === 'with_driver' ? 'With Driver' : 'Self-Drive';
      const start = formatDate(b.pickupDate || b.startDate) || '';
      const end = formatDate(b.dropoffDate || b.endDate) || '';
      const price = b.totalPrice || 0;
      const deposit = b.securityDeposit || 0;
      const total = price + deposit;
      const status = b.status || 'confirmed';

      csvContent += `${ref},${custName},${custPhone},${carName},${plate},${type},${start},${end},${price},${deposit},${total},${status}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Financial_Report_${scopeSlug}_${filenameDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <div className="spinner-text">Compiling financial ledgers &amp; fleet metrics...</div>
      </div>
    );
  }

  const availablePercent = report?.carsTotal > 0
    ? Math.round(((report.availableCars || 0) / report.carsTotal) * 100)
    : 60;
  const rentedPercent = report?.carsTotal > 0
    ? Math.round(((report.rentedCars || 0) / report.carsTotal) * 100)
    : 40;

  return (
    <div className="reports-view-root">
      {/* Header bar with Excel and CSV Export buttons */}
      <div className="module-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <h2>Financial Reports &amp; Fleet Analytics</h2>
          <p>Real-time vehicle rental revenue ({sym}), customer accounts, fleet utilization, and deposit ledgers</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn-excel-export"
            onClick={handleExportExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <FaFileExcel size={15} /> Export to Excel (.xls)
          </button>
          <button 
            type="button"
            className="btn-csv-export" 
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              border: '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <FaFileDownload size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Interactive Date Range Filter Bar */}
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

      {/* Primary KPI Cards (Scoped to Active Date Range) */}
      <div className="reports-stats-grid">
        <div className="report-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25D366' }}>
            {sym === '₹' ? <FaRupeeSign /> : sym === '$' ? <FaDollarSign /> : <FaCoins />}
          </div>
          <div>
            <span className="stat-sub">Rental Revenue ({dateFilter === 'lifetime' ? 'All-Time' : 'Scope'})</span>
            <strong className="stat-main">{sym} {Number(filteredRentalRevenue).toLocaleString('en-IN')}</strong>
            <small style={{ color: '#10B981', fontWeight: 600 }}>{filteredBookings.filter(b => b.status !== 'cancelled').length} billable trip(s)</small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <FaCheckCircle />
          </div>
          <div>
            <span className="stat-sub">Payments Collected</span>
            <strong className="stat-main">{sym} {Number(filteredCollected).toLocaleString('en-IN')}</strong>
            <small style={{ color: filteredOutstanding > 0 ? '#ea580c' : '#10b981', fontWeight: 600 }}>
              {filteredOutstanding > 0 ? `${sym} ${filteredOutstanding.toLocaleString('en-IN')} outstanding` : 'Fully settled'}
            </small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(249, 109, 0, 0.1)', color: 'var(--primary)' }}>
            <FaCar />
          </div>
          <div>
            <span className="stat-sub">Bookings in Scope</span>
            <strong className="stat-main">{filteredBookings.length}</strong>
            <small>{completedTripsCount} completed • {activeTripsCount} active</small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
            <FaReceipt />
          </div>
          <div>
            <span className="stat-sub">Security Deposits Held</span>
            <strong className="stat-main">{sym} {Number(filteredDepositsHeld).toLocaleString('en-IN')}</strong>
            <small style={{ color: '#6366f1', fontWeight: 600 }}>
              Refunded: {sym}{Number(filteredDepositsRefunded).toLocaleString('en-IN')} • Damage: {sym}{Number(filteredDamageCharges).toLocaleString('en-IN')}
            </small>
          </div>
        </div>
      </div>

      {/* Acquisition Channel Breakdown: WhatsApp vs Website */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1.5px solid #bbf7d0',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)'
        }}>
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
              {sym} {Number(whatsappRevenueInScope).toLocaleString('en-IN')} revenue
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d' }}>
            {filteredBookings.length > 0 ? `${Math.round((whatsappBookingsInScope.length / filteredBookings.length) * 100)}% of total reservations` : 'Direct WhatsApp customer reservations'}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          border: '1.5px solid #ddd6fe',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🏢 Admin Direct Bookings
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#5b21b6', background: '#ddd6fe', padding: '2px 8px', borderRadius: '12px' }}>
              {dateRangeLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '4px 0' }}>
            <strong style={{ fontSize: '26px', fontWeight: 800, color: '#4c1d95' }}>
              {adminBookingsInScope.length}
            </strong>
            <span style={{ fontSize: '13px', color: '#6d28d9', fontWeight: 600 }}>
              {sym} {Number(adminRevenueInScope).toLocaleString('en-IN')} revenue
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#6d28d9' }}>
            {filteredBookings.length > 0 ? `${Math.round((adminBookingsInScope.length / filteredBookings.length) * 100)}% of total reservations` : 'Direct admin counter reservations'}
          </div>
        </div>
      </div>

      {/* Fleet Utilization Progress */}
      <div className="reports-detail-box" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
          Fleet Deployment Breakdown
        </h3>
        <div className="progress-stacked-bar">
          <div className="progress-segment rental" style={{ width: `${rentedPercent}%` }}>
            Active on Road ({rentedPercent}%)
          </div>
          <div className="progress-segment available" style={{ width: `${availablePercent}%`, background: '#10b981' }}>
            Available Fleet ({availablePercent}%)
          </div>
        </div>
      </div>

      {/* Fleet Utilization Secondary Metrics */}
      <div className="reports-stats-grid">
        <div className="report-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <FaCheckCircle />
          </div>
          <div>
            <span className="stat-sub">Available Vehicles</span>
            <strong className="stat-main">{report?.availableCars || 0}</strong>
            <small>Ready for immediate booking</small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <FaClock />
          </div>
          <div>
            <span className="stat-sub">Currently Rented</span>
            <strong className="stat-main">{report?.rentedCars || 0}</strong>
            <small>Active on road</small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
            <FaChartBar />
          </div>
          <div>
            <span className="stat-sub">Fleet Utilization</span>
            <strong className="stat-main">{report?.utilizationRate || 0}%</strong>
            <small>Current fleet efficiency</small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
            <FaCar />
          </div>
          <div>
            <span className="stat-sub">Total Fleet Size</span>
            <strong className="stat-main">{report?.carsTotal || 0}</strong>
            <small>Managed vehicles</small>
          </div>
        </div>
      </div>

      {/* On-screen Itemized Ledger Table */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Rental Ledger Transactions
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Detailed customer billing records, rental fees ({sym}), and deposits • Scope: <strong>{dateRangeLabel}</strong>
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
            {filteredBookings.length} Total Booking{filteredBookings.length !== 1 ? 's' : ''} in Scope
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 14px' }}>Booking Ref</th>
                <th style={{ padding: '12px 14px' }}>Customer</th>
                <th style={{ padding: '12px 14px' }}>Vehicle</th>
                <th style={{ padding: '12px 14px' }}>Service</th>
                <th style={{ padding: '12px 14px' }}>Dates</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Rental Fee</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Deposit</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px 14px', color: '#64748b' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>No bookings found</div>
                    <div style={{ fontSize: '12px' }}>There are no transactions recorded within the selected date period ({dateRangeLabel}).</div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, idx) => {
                  const price = b.totalPrice || 0;
                  const deposit = b.securityDeposit || 0;
                  const total = price + deposit;
                  return (
                    <tr key={b._id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                      {b.bookingReference || `#${(b._id || '').slice(-6).toUpperCase()}`}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.user?.name || b.customer?.name || b.customerName || 'Customer'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{b.user?.phone || b.user?.email || b.customer?.phone || b.customerPhone || '-'}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {b.car?.name || 'Fleet Car'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                        background: b.withDriver || b.rentalType === 'chauffeured' ? '#f5f3ff' : '#eff6ff',
                        color: b.withDriver || b.rentalType === 'chauffeured' ? '#7c3aed' : '#2563eb'
                      }}>
                        {b.withDriver || b.rentalType === 'chauffeured' || b.rentalType === 'with_driver' ? 'With Driver' : 'Self-Drive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#475569' }}>
                      {formatDate(b.pickupDate || b.startDate) || '-'} → {formatDate(b.dropoffDate || b.endDate) || '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {sym} {Number(price).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>
                      {deposit > 0 ? `${sym} ${Number(deposit).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      {sym} {Number(total).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', textTransform: 'capitalize',
                        background: b.status === 'completed' ? '#ecfdf5' : b.status === 'cancelled' ? '#fef2f2' : '#eff6ff',
                        color: b.status === 'completed' ? '#047857' : b.status === 'cancelled' ? '#dc2626' : '#2563eb'
                      }}>
                        {b.status || 'confirmed'}
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
