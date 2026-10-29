import { FiPrinter, FiX, FiPackage } from 'react-icons/fi';
import { formatDate } from '../utils/format';

export default function TyreReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const addr = order.deliveryAddress || {};

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div
        className="modal-content invoice-printable"
        style={{
          maxWidth: '680px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          padding: '2rem',
          borderRadius: '16px',
        }}
      >
        {/* Header Bar */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Tyre Order Receipt</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FiPrinter /> Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
            >
              <FiX />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="printable-sheet" style={{ fontFamily: 'system-ui, sans-serif', color: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0284c7', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0284c7' }}>CarBook Tyre Store</h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Genuine Tyres &amp; Professional Installation<br />
                orders@carbook.com • +91 98765 43210
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace' }}>#{order.orderNumber}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {formatDate(order.createdAt)}</div>
              <span style={{ display: 'inline-block', marginTop: '6px', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: '#ecfdf5', color: '#059669' }}>
                Status: {order.status}
              </span>
            </div>
          </div>

          {/* Delivery & Customer Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Recipient &amp; Delivery</div>
              <div style={{ fontWeight: 600 }}>{addr.recipientName || 'Customer'}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>{addr.phone}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>{addr.street}, {addr.city} {addr.zip}</div>
              <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600, marginTop: '4px' }}>
                Method: {order.deliveryMethod === 'pickup' ? 'Workshop Fitting' : 'Doorstep Courier'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Shipping &amp; Tracking</div>
              {order.trackingNumber ? (
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Carrier: <strong>{order.carrier || 'Standard Courier'}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace', fontWeight: 700, marginTop: '2px' }}>
                    Tracking: {order.trackingNumber}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {order.deliveryMethod === 'pickup' ? 'Ready for fitting at main service workshop.' : 'Tracking will be assigned once dispatched.'}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '6px' }}>
                Payment: <strong style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replace(/_/g, ' ') || 'Cash on Delivery'}</strong>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px' }}>Product</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Fitment Size</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Price</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <strong>{item.brand} - {item.model}</strong>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.size || 'Standard'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>${item.price?.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}

              <tr style={{ borderTop: '2px solid #cbd5e1' }}>
                <td colSpan="4" style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>Subtotal:</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>${order.itemsSubtotal?.toFixed(2) || (order.totalAmount - (order.shippingFee || 0)).toFixed(2)}</td>
              </tr>
              {order.shippingFee > 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '6px 12px', textAlign: 'right', color: '#64748b' }}>Shipping:</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>${order.shippingFee.toFixed(2)}</td>
                </tr>
              )}
              {order.taxAmount > 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '6px 12px', textAlign: 'right', color: '#64748b' }}>Tax:</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>${order.taxAmount.toFixed(2)}</td>
                </tr>
              )}
              <tr style={{ background: '#f8fafc', fontSize: '1.05rem', fontWeight: 700 }}>
                <td colSpan="4" style={{ padding: '10px 12px', textAlign: 'right' }}>Total Paid / Due:</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0284c7' }}>${order.totalAmount?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            Thank you for shopping with CarBook Tyres! For fitment appointments or order assistance, call +91 98765 43210.
          </div>
        </div>
      </div>
    </div>
  );
}
