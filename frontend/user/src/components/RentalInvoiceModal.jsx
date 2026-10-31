import React from 'react';
import { FaPrint, FaCheckCircle, FaBan } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { formatDate } from '../utils/format';

export default function RentalInvoiceModal({ booking, onClose }) {
  if (!booking) return null;

  const { settings } = useSettings();
  const { user: authUser } = useAuth();
  const car = booking.car || {};
  const driver = booking.driver || {};
  const isChauffeured = Boolean(booking.withDriver || booking.rentalType === 'chauffeured');

  const handlePrint = () => {
    window.print();
  };

  const bookingRef = booking.bookingReference || booking._id?.slice(-8).toUpperCase();

  // Resolve customer name, phone, and email cleanly
  let customerName = booking.customerName || (typeof booking.user === 'object' ? booking.user?.name : '') || '';
  let customerPhone = booking.customerPhone || (typeof booking.user === 'object' ? booking.user?.phone : '') || '';
  let customerEmail = booking.customerEmail || (typeof booking.user === 'object' ? booking.user?.email : '') || '';

  if (booking.notes) {
    const nameMatch = booking.notes.match(/Name:\s*([^|]+)/i);
    const phoneMatch = booking.notes.match(/Phone:\s*([^|]+)/i);
    const emailMatch = booking.notes.match(/Email:\s*([^|]+)/i);
    if (!customerName && nameMatch) customerName = nameMatch[1].trim();
    if (!customerPhone && phoneMatch) customerPhone = phoneMatch[1].trim();
    if (!customerEmail && emailMatch) customerEmail = emailMatch[1].trim();
  }

  customerName = customerName || authUser?.name || 'Customer';
  customerPhone = customerPhone || authUser?.phone || 'N/A';
  customerEmail = customerEmail || authUser?.email || 'N/A';

  // Calculate rental duration & totals matching Admin calculations 100%
  const days = Number(booking.days) || Math.max(1, Math.ceil((new Date(booking.dropoffDate || booking.returnDate) - new Date(booking.pickupDate)) / (1000 * 60 * 60 * 24)));
  const dailyRate = Number(booking.dailyRate) || Number(car.pricePerDay) || 0;
  const baseRental = Number(booking.subtotal) || (dailyRate * days);
  const driverFee = Number(booking.driverFee) || 0;
  const taxes = Number(booking.taxAmount) || 0;
  const baseTotal = (baseRental + driverFee + taxes) > 0 ? (baseRental + driverFee + taxes) : (Number(booking.totalPrice) || 0);

  const additionalList = [];
  if (Array.isArray(booking.additionalCharges)) {
    booking.additionalCharges.forEach(chg => {
      if (Number(chg.amount) > 0) {
        additionalList.push({
          category: chg.category || 'other',
          reason: chg.reason || 'Additional Fee',
          amount: Number(chg.amount),
          notes: chg.notes || ''
        });
      }
    });
  }
  if (Array.isArray(booking.damageCharges)) {
    booking.damageCharges.forEach(d => {
      if (Number(d.amount) > 0 && !additionalList.some(a => a.reason === d.description && a.amount === Number(d.amount))) {
        additionalList.push({
          category: 'damage',
          reason: d.description || 'Accidental Damage Repair',
          amount: Number(d.amount),
          notes: ''
        });
      }
    });
  } else if (Number(booking.damageCharges) > 0) {
    additionalList.push({
      category: 'damage',
      reason: 'Accidental Damage Repair',
      amount: Number(booking.damageCharges),
      notes: ''
    });
  }
  if (Number(booking.inspection?.extraCharges) > 0 && !additionalList.some(a => a.category === 'other' && a.amount === Number(booking.inspection.extraCharges))) {
    additionalList.push({
      category: 'other',
      reason: 'Post-Rental Adjustment',
      amount: Number(booking.inspection.extraCharges),
      notes: ''
    });
  }

  const additionalTotal = additionalList.reduce((s, a) => s + a.amount, 0);
  const grandTotal = baseTotal + additionalTotal;
  const totalPaid = Array.isArray(booking.payments) && booking.payments.length > 0
    ? booking.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    : (booking.paymentStatus === 'fully_paid' ? grandTotal : (Number(booking.paidAmount) || Number(booking.advanceAmount) || 0));

  const balanceDue = Math.max(0, grandTotal - totalPaid);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="invoice-modal-content" onClick={e => e.stopPropagation()}>
        {/* Actions Bar - Hidden on print */}
        <div className="invoice-actions-bar no-print">
          <div className="invoice-actions-left">
            {booking.status === 'cancelled' ? (
              <>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', background: '#fef2f2', color: '#b91c1c',
                  border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: 700 
                }}>
                  <FaBan /> Reservation Cancelled • Agreement Void
                </span>
                <small style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  Booking was cancelled • Charges and balance due are void.
                </small>
              </>
            ) : booking.status === 'completed' || booking.isLocked ? (
              <>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', background: '#ecfdf5', color: '#047857',
                  border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '12px', fontWeight: 700 
                }}>
                  <FaCheckCircle /> Invoice Finalized &amp; Locked
                </span>
                <small style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  Trip completed • Financials are permanently locked.
                </small>
              </>
            ) : (
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', background: '#eff6ff', color: '#1d4ed8',
                border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', fontWeight: 700 
              }}>
                📄 Active Rental Agreement &amp; Tax Invoice
              </span>
            )}
          </div>
          <div className="invoice-actions-right">
            <button className="invoice-btn-print" onClick={handlePrint}>
              <FaPrint /> Print / Save PDF
            </button>
            <button className="invoice-btn-close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Invoice Paper Printable Sheet */}
        <div className="invoice-paper">
          <div className="invoice-main-content">
            {/* Header with Dynamic Settings */}
            <div className="invoice-header">
              <div className="invoice-brand-col">
                <h1 className="invoice-logo">
                  {settings?.businessName ? (
                    settings.businessName
                  ) : (
                    <>Car<span>Book</span> Mobility India</>
                  )}
                </h1>
                <p className="invoice-tagline">{settings?.tagline || 'Premium Vehicle Fleet & Driver Dispatch Services'}</p>
                <p className="invoice-contact">{settings?.hubAddress || 'Connaught Place, New Delhi & Indiranagar, Bengaluru, India'}</p>
                <p className="invoice-contact">
                  {settings?.supportEmail || 'Shajanshaji111@gmail.com'} • {settings?.supportPhone || (settings?.whatsappNumber ? `+${settings.whatsappNumber}` : '+91 96291 82095')}
                </p>
              </div>
              <div className="invoice-meta-col">
                <div className="invoice-doc-header-right">
                  <h2 className="invoice-doc-title">TAX INVOICE &amp; AGREEMENT</h2>
                  <span className={`invoice-status-badge status-${booking.status || 'confirmed'}`}>
                    {(booking.status || 'confirmed').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="invoice-meta-grid">
                  <span className="meta-label">Invoice Ref:</span>
                  <strong className="meta-value" style={{ whiteSpace: 'nowrap' }}>{bookingRef}</strong>
                  <span className="meta-label">Invoice Date:</span>
                  <span className="meta-value" style={{ whiteSpace: 'nowrap' }}>{formatDate(booking.createdAt || Date.now())}</span>
                </div>
              </div>
            </div>

            {/* Parties Grid (Customer & Rental Schedule) */}
            <div className="invoice-parties-cards">
              <div className="party-card">
                <div className="party-card-title">BILLED TO (CUSTOMER)</div>
                <div className="party-name">{customerName}</div>
                <div className="party-detail">
                  <span className="p-label">Email:</span> {customerEmail}
                </div>
                <div className="party-detail">
                  <span className="p-label">Phone:</span> {customerPhone}
                </div>
              </div>

              <div className="party-card">
                <div className="party-card-title">RENTAL SCHEDULE &amp; TYPE</div>
                <div className="rental-type-tag">
                  {isChauffeured ? 'Rental With Driver' : 'Self-Drive Rental'}
                </div>
                <div className="party-detail">
                  <span className="p-label">Pick-up:</span> <strong style={{ whiteSpace: 'nowrap' }}>{formatDate(booking.pickupDate)}</strong> <span style={{ color: '#64748b' }}>({booking.pickupLocation || 'Main Hub'})</span>
                </div>
                <div className="party-detail">
                  <span className="p-label">Drop-off:</span> <strong style={{ whiteSpace: 'nowrap' }}>{formatDate(booking.dropoffDate || booking.returnDate)}</strong> <span style={{ color: '#64748b' }}>({booking.dropoffLocation || booking.pickupLocation || 'Main Hub'})</span>
                </div>
                {isChauffeured && (
                  <div className="party-detail highlight-chauffeur">
                    <span className="p-label">Assigned Driver:</span> {driver.name || 'Verified Chauffeur'} ({driver.phone || 'Details provided at dispatch'})
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th style={{ width: '48%', textAlign: 'left' }}>Item Description</th>
                  <th style={{ width: '18%', textAlign: 'center' }}>Daily Rate</th>
                  <th style={{ width: '16%', textAlign: 'center' }}>Duration</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="item-main-title">{car.name || 'Vehicle Rental'}</div>
                    <div className="item-sub-desc">
                      {car.brand} {car.model} ({car.year || 2024}) • Plate: <strong>{car.registrationNumber || car.plateNumber || 'Verified Fleet'}</strong>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>₹{dailyRate}/day</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{days} Day{days > 1 ? 's' : ''}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{baseRental}</td>
                </tr>

                {isChauffeured && (
                  <tr>
                    <td>
                      <div className="item-main-title">Professional Driver Service</div>
                      <div className="item-sub-desc">Dedicated verified driver for entire rental duration</div>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>₹{(driverFee / days).toFixed(0)}/day</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{days} Day{days > 1 ? 's' : ''}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{driverFee}</td>
                  </tr>
                )}

                {/* Itemized Additional Charges (damage, late fee, custom) */}
                {additionalList.map((ac, idx) => {
                  const isDamage = ac.category === 'damage';
                  const getIcon = () => {
                    switch (ac.category) {
                      case 'damage': return '⚠️';
                      case 'late_fee': return '⏱️';
                      default: return '📌';
                    }
                  };
                  return (
                    <tr key={idx} style={{ background: isDamage ? '#fff5f5' : '#f8fafc' }}>
                      <td>
                        <div className="item-main-title" style={{ 
                          color: isDamage ? '#dc2626' : '#0f172a', 
                          fontWeight: isDamage ? 800 : 700,
                          display: 'flex', alignItems: 'center', gap: '6px' 
                        }}>
                          <span>{getIcon()}</span>
                          <span>{ac.reason}</span>
                        </div>
                        {ac.notes && (
                          <div className="item-sub-desc" style={{ color: isDamage ? '#991b1b' : '#64748b' }}>
                            {ac.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>—</td>
                      <td style={{ textAlign: 'center' }}>1</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: isDamage ? '#dc2626' : '#0f172a', whiteSpace: 'nowrap' }}>
                        ₹{ac.amount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom Row: Terms & Summary Box */}
            <div className="invoice-bottom-layout">
              <div className="invoice-terms-box">
                <div className="terms-title">Rental Terms &amp; Policies:</div>
                <ul className="terms-list">
                  <li>Comprehensive commercial rental insurance coverage included.</li>
                  <li>Vehicle must be returned with the same fuel level as dispatched.</li>
                  <li>All rental payments and accidental damage settlements are permanently audited &amp; verified.</li>
                </ul>

                {booking.payments && booking.payments.length > 0 && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Payment Audit Ledger ({booking.payments.length})
                    </div>
                    <div className="invoice-ledger-scroll">
                      <table className="invoice-ledger-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '4px 6px', width: '82px', minWidth: '82px', whiteSpace: 'nowrap' }}>Date</th>
                            <th style={{ padding: '4px 6px', width: '60px', whiteSpace: 'nowrap' }}>Type</th>
                            <th style={{ padding: '4px 6px', width: '60px', whiteSpace: 'nowrap' }}>Method</th>
                            <th style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>Ref #</th>
                            <th style={{ padding: '4px 6px', textAlign: 'right', width: '75px', minWidth: '75px', whiteSpace: 'nowrap' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {booking.payments.map((p, idx) => {
                            const pType = p.paymentType || p.type || 'payment';
                            const pMethod = p.paymentMethod || p.method || 'cash';
                            const pDate = p.paymentDate || p.date || p.createdAt;
                            const isRefund = pType === 'refund';
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', fontWeight: 600 }}>{formatDate(pDate)}</td>
                                <td style={{ padding: '4px 6px', textTransform: 'capitalize', fontWeight: 600, whiteSpace: 'nowrap' }}>{pType.replace('_', ' ')}</td>
                                <td style={{ padding: '4px 6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{pMethod}</td>
                                <td style={{ padding: '4px 6px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{p.transactionId || '—'}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: isRefund ? '#dc2626' : '#059669', whiteSpace: 'nowrap' }}>
                                  {isRefund ? '-' : '+'} ₹{p.amount}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="invoice-summary-box">
                <div className="summary-row">
                  <span>Base Rental ({days} Day{days > 1 ? 's' : ''}):</span>
                  <strong>₹{baseRental}</strong>
                </div>
                {driverFee > 0 && (
                  <div className="summary-row">
                    <span>Professional Chauffeur Fee:</span>
                    <strong>₹{driverFee}</strong>
                  </div>
                )}
                {taxes > 0 && (
                  <div className="summary-row">
                    <span>GST / Govt Taxes:</span>
                    <strong>₹{taxes}</strong>
                  </div>
                )}
                {additionalList.length > 0 && (
                  <div className="summary-row" style={{ color: '#b45309', background: '#fffbeb', padding: '4px 8px', borderRadius: '6px' }}>
                    <span>Additional Charges ({additionalList.length} items):</span>
                    <strong style={{ color: '#b45309' }}>+ ₹{additionalTotal}</strong>
                  </div>
                )}
                <div className="summary-row total-row" style={{ borderTop: '2px solid #e2e8f0', marginTop: '6px', paddingTop: '6px' }}>
                  <span>Total Booking Charges (Grand Total):</span>
                  <strong className="total-amount">₹{grandTotal}</strong>
                </div>
                <div className="summary-row" style={{ color: '#059669' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>Payments Received:</span>
                  <strong style={{ whiteSpace: 'nowrap' }}>- ₹{totalPaid} <span style={{ fontSize: '10.5px', textTransform: 'uppercase', padding: '1px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>{booking.paymentStatus || 'received'}</span></strong>
                </div>
                {booking.status === 'cancelled' ? (
                  <div className="summary-row" style={{ 
                    fontWeight: 800, 
                    fontSize: '13.5px', 
                    color: '#991b1b',
                    background: '#fee2e2',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    marginTop: '6px'
                  }}>
                    <span style={{ whiteSpace: 'nowrap' }}>Reservation Status:</span>
                    <strong style={{ whiteSpace: 'nowrap' }}>❌ Cancelled (₹0 Due / Void)</strong>
                  </div>
                ) : (
                  <div className="summary-row" style={{ 
                    fontWeight: 800, 
                    fontSize: '13.5px', 
                    color: balanceDue > 0 ? '#dc2626' : '#15803d',
                    background: balanceDue > 0 ? '#fef2f2' : '#f0fdf4',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    marginTop: '6px'
                  }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{balanceDue > 0 ? 'Remaining Balance Due:' : 'Settlement Status:'}</span>
                    <strong style={{ whiteSpace: 'nowrap' }}>{balanceDue > 0 ? `₹${balanceDue}` : '✅ Fully Settled (₹0 Due)'}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM: Pinned Signatures & Legal Print Footer */}
          <div className="invoice-bottom-pinned">
            <div className="invoice-signatures-row">
              <div className="sig-block">
                <div className="sig-line"></div>
                <span>Customer Signature / Acknowledgement</span>
              </div>
              <div className="sig-block right">
                <div className="sig-line"></div>
                <span>Authorized Representative ({settings?.businessName || 'CarBook'})</span>
              </div>
            </div>

            <div className="invoice-print-footer">
              <p>
                {settings?.businessName || 'A3 Car rental'} • Official Rental Agreement &amp; Tax Invoice • Support: {settings?.supportPhone || (settings?.whatsappNumber ? `+${settings.whatsappNumber}` : '+91 96291 82095')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
