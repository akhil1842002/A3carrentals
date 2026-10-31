import { useState, useEffect } from 'react';
import { 
  FaShoppingBag, FaSearch, FaBox, FaTruck, FaCheck, 
  FaPrint, FaTimes, FaMapMarkerAlt, FaFileInvoiceDollar 
} from 'react-icons/fa';
import { getOrders, updateOrderStatus } from '../api';
import { formatDate } from '../utils/format';

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Status Modal
  const [editOrder, setEditOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('shipped');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('FedEx Express');
  const [updating, setUpdating] = useState(false);

  // Invoice / Packing Slip Modal
  const [printOrder, setPrintOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (order) => {
    setEditOrder(order);
    setNewStatus(order.status === 'processing' ? 'packed' : order.status === 'packed' ? 'shipped' : 'delivered');
    setTrackingNumber(order.trackingNumber || `TRK-${Math.floor(1000000 + Math.random() * 9000000)}`);
    setCarrier(order.carrier || 'FedEx Express');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateOrderStatus(editOrder._id, {
        status: newStatus,
        trackingNumber,
        carrier
      });
      setEditOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const num = o.orderNumber?.toLowerCase() || '';
      const name = o.deliveryAddress?.fullName?.toLowerCase() || '';
      const trk = o.trackingNumber?.toLowerCase() || '';
      if (!num.includes(q) && !name.includes(q) && !trk.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="orders-mgmt-root">

      <div className="module-filter-bar">
        <div className="dash-status-pills">
          {['all', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'].map(st => (
            <button
              key={st}
              className={`dash-pill-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)} ({st === 'all' ? orders.length : orders.filter(o => o.status === st).length})
            </button>
          ))}
        </div>

        <div className="module-search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by order #, customer, or tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner"></div></div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <FaShoppingBag size={48} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
          <h3>No tyre orders found</h3>
          <p>Orders placed through the customer portal will appear here for packing and dispatch.</p>
        </div>
      ) : (
        <div className="table-card-container">
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Recipient &amp; Destination</th>
                  <th>Items &amp; Quantities</th>
                  <th>Payment / Total</th>
                  <th>Carrier / Tracking</th>
                  <th>Fulfillment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o._id}>
                    <td>
                      <strong>{o.orderNumber}</strong>
                      <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
                        {formatDate(o.createdAt)}
                      </small>
                    </td>
                    <td>
                      <div className="cell-contact">
                        <strong>{o.deliveryAddress?.fullName || 'Customer'}</strong>
                        <small style={{ color: 'var(--text-secondary)' }}>{o.deliveryAddress?.phone}</small>
                        <small style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <FaMapMarkerAlt /> {o.deliveryAddress?.city}, {o.deliveryAddress?.state || o.deliveryAddress?.zip}
                        </small>
                      </div>
                    </td>
                    <td>
                      {o.items?.map((it, idx) => (
                        <div key={idx} style={{ marginBottom: '4px' }}>
                          <strong>{it.brand} {it.name}</strong>
                          <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
                            Size: {it.size} • Qty: {it.quantity} × ${it.unitPrice}
                          </small>
                        </div>
                      ))}
                    </td>
                    <td>
                      <strong className="cell-price">${o.totalAmount}</strong>
                      <small style={{ display: 'block', color: '#10B981', fontWeight: 600 }}>
                        ✓ {o.paymentMethod.toUpperCase()} (Paid)
                      </small>
                    </td>
                    <td>
                      {o.trackingNumber ? (
                        <div>
                          <code>{o.trackingNumber}</code>
                          <small style={{ display: 'block', color: 'var(--text-secondary)' }}>{o.carrier}</small>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Awaiting Dispatch</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-chip chip-${o.status}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        {o.status !== 'delivered' && o.status !== 'cancelled' && (
                          <button
                            className="btn-action-sm confirm"
                            title="Advance Fulfillment Status"
                            onClick={() => openStatusModal(o)}
                          >
                            <FaTruck /> Update Status
                          </button>
                        )}
                        <button
                          className="btn-action-sm"
                          title="Print Packing Slip & Invoice"
                          onClick={() => setPrintOrder(o)}
                        >
                          <FaPrint /> Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Fulfillment Status Modal */}
      {editOrder && (
        <div className="modal-backdrop" onClick={() => setEditOrder(null)}>
          <div className="custom-admin-modal" onClick={e => e.stopPropagation()}>
            <div className="cam-header">
              <h3><FaTruck /> Update Order Fulfillment &amp; Tracking</h3>
              <button className="cam-close" onClick={() => setEditOrder(null)}><FaTimes /></button>
            </div>
            <form onSubmit={handleStatusSubmit} className="cam-body">
              <div className="cam-info-box">
                <strong>Order: {editOrder.orderNumber}</strong>
                <p>Recipient: {editOrder.deliveryAddress?.fullName} ({editOrder.deliveryAddress?.phone})</p>
                <p>Shipping to: {editOrder.deliveryAddress?.street}, {editOrder.deliveryAddress?.city}</p>
              </div>

              <div className="auth-input-group">
                <label>Fulfillment Stage</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="processing">Processing (In Warehouse)</option>
                  <option value="packed">Packed (Ready for Dispatch)</option>
                  <option value="shipped">Shipped (In Transit)</option>
                  <option value="delivered">Delivered (Completed)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="modal-form-row">
                <div className="auth-input-group">
                  <label>Shipping Carrier</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="e.g. FedEx, UPS, DHL"
                  />
                </div>
                <div className="auth-input-group">
                  <label>Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="TRK-9872134"
                  />
                </div>
              </div>

              <div className="cam-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditOrder(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updating}>
                  {updating ? 'Updating...' : 'Save & Update Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packing Slip & Invoice Print Modal */}
      {printOrder && (
        <div className="modal-backdrop" onClick={() => setPrintOrder(null)}>
          <div className="invoice-modal-content" onClick={e => e.stopPropagation()}>
            <div className="invoice-actions-bar no-print">
              <button className="btn-primary" onClick={() => window.print()}>
                <FaPrint /> Print Packing Slip &amp; Invoice
              </button>
              <button className="btn-secondary" onClick={() => setPrintOrder(null)}>
                Close
              </button>
            </div>

            <div className="invoice-paper">
              <div className="invoice-header">
                <div>
                  <h1 className="invoice-logo">Car<span>Book</span> Tyres</h1>
                  <p>Logistics &amp; Distribution Hub • New Delhi &amp; Bengaluru, India</p>
                  <p>Shajanshaji111@gmail.com • +91 96291 82095</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2>PACKING SLIP &amp; ORDER INVOICE</h2>
                  <p><strong>Order Number:</strong> {printOrder.orderNumber}</p>
                  <p><strong>Date:</strong> {formatDate(printOrder.createdAt)}</p>
                  <p><strong>Tracking:</strong> {printOrder.trackingNumber || 'Pending'}</p>
                </div>
              </div>

              <hr />

              <div className="invoice-parties">
                <div>
                  <h4>Ship To:</h4>
                  <p><strong>{printOrder.deliveryAddress?.fullName}</strong></p>
                  <p>{printOrder.deliveryAddress?.street}</p>
                  <p>{printOrder.deliveryAddress?.city}, {printOrder.deliveryAddress?.state} {printOrder.deliveryAddress?.zip}</p>
                  <p>Phone: {printOrder.deliveryAddress?.phone}</p>
                </div>
                <div>
                  <h4>Shipping Information:</h4>
                  <p><strong>Method:</strong> {printOrder.deliveryMethod === 'workshop_pickup' ? 'Workshop Collection' : 'Courier Doorstep Delivery'}</p>
                  <p><strong>Carrier:</strong> {printOrder.carrier || 'FedEx Express'}</p>
                  <p><strong>Payment Method:</strong> {printOrder.paymentMethod.toUpperCase()}</p>
                  <p><strong>Status:</strong> {printOrder.status.toUpperCase()}</p>
                </div>
              </div>

              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Tyre Specification</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {printOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.brand} {item.name}</strong>
                        <small style={{ display: 'block' }}>Size: {item.size}</small>
                      </td>
                      <td><code>{item.sku || 'TYR-GEN'}</code></td>
                      <td>${item.unitPrice}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unitPrice * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-summary-box">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <strong>${printOrder.subtotal}</strong>
                </div>
                <div className="summary-row">
                  <span>Shipping Fee:</span>
                  <strong>${printOrder.shippingFee}</strong>
                </div>
                <div className="summary-row">
                  <span>Sales Tax:</span>
                  <strong>${printOrder.taxAmount}</strong>
                </div>
                <div className="summary-row total-row">
                  <span>Total Paid:</span>
                  <strong>${printOrder.totalAmount}</strong>
                </div>
              </div>

              <div className="invoice-footer-terms">
                <p><strong>Warranty:</strong> All tyres covered by manufacturer warranty against structural defects.</p>
                <p>Thank you for your order with CarBook Tyres!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
