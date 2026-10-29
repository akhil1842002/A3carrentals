import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createTyreOrder, getSettings, getWhatsAppLink } from '../api';

export default function TyreCheckoutModal({ isOpen, onClose, onOrderPlaced }) {
  const { user } = useAuth();
  const { items, cartTotal, clearCart } = useCart();

  const [settings, setSettings] = useState({
    currencySymbol: '$',
    taxRatePercent: 5,
    shippingFee: 20,
    freeShippingThreshold: 150,
    whatsappNumber: '919876543210',
  });

  const [formData, setFormData] = useState({
    recipientName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    deliveryMethod: 'delivery', // 'delivery' or 'pickup'
    paymentMethod: 'cash_on_delivery', // 'cash_on_delivery', 'online', 'in_store'
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    getSettings().then((res) => {
      if (res.data) setSettings((prev) => ({ ...prev, ...res.data }));
    }).catch(() => {});
  }, []);

  // Autofill from user profile if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        recipientName: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        street: user.addresses?.[0]?.street || '',
        city: user.addresses?.[0]?.city || '',
        state: user.addresses?.[0]?.state || '',
        zip: user.addresses?.[0]?.zip || '',
      }));
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const isDelivery = formData.deliveryMethod === 'delivery';
  const calculatedShipping = !isDelivery || (settings.freeShippingThreshold > 0 && cartTotal >= settings.freeShippingThreshold)
    ? 0
    : Number(settings.shippingFee || 0);

  const calculatedTax = (cartTotal * (settings.taxRatePercent || 0)) / 100;
  const grandTotal = cartTotal + calculatedShipping + calculatedTax;

  const validate = () => {
    const errs = {};
    if (!formData.recipientName.trim()) {
      errs.recipientName = 'Recipient name is required';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Mobile number is compulsory';
    } else if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(formData.phone.trim().replace(/[\s\-\(\)]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9';
    }
    if (formData.deliveryMethod === 'delivery') {
      if (!formData.street.trim()) {
        errs.street = 'Street address is required';
      }
      if (!formData.city.trim()) {
        errs.city = 'City is required';
      }
      if (!formData.state.trim()) {
        errs.state = 'State is required';
      }
      if (!formData.zip.trim()) {
        errs.zip = 'PIN / ZIP code is required';
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;
    setLoading(true);
    setError('');

    try {
      const orderPayload = {
        items: items.map((i) => ({
          tyre: i.tyre._id,
          quantity: i.quantity,
        })),
        deliveryAddress: {
          recipientName: formData.recipientName,
          phone: formData.phone,
          street: formData.street || 'In-store fitting request',
          city: formData.city || 'N/A',
          state: formData.state || 'N/A',
          zip: formData.zip || 'N/A',
        },
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      const res = await createTyreOrder(orderPayload);
      clearCart();
      setConfirmedOrder(res.data);
      if (onOrderPlaced) onOrderPlaced(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place tyre order. Please check stock and try again.');
    } finally {
      setLoading(false);
    }
  };

  const sym = settings.currencySymbol || '₹';

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content checkout-modal" style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
        {confirmedOrder ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2rem' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Tyre Order Confirmed!</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Order Reference: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{confirmedOrder.orderNumber}</strong>
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Recipient</span>
                <strong>{confirmedOrder.deliveryAddress?.recipientName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Contact Phone</span>
                <strong>{confirmedOrder.deliveryAddress?.phone}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Fulfillment Method</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{confirmedOrder.deliveryMethod === 'pickup' ? 'Workshop Fitting' : 'Doorstep Courier'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                <span>Total Amount</span>
                <strong style={{ color: '#0284c7' }}>{sym}{confirmedOrder.totalAmount?.toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={getWhatsAppLink(
                  `Hello CarBook Team, I just placed Tyre Order #${confirmedOrder.orderNumber} for total ${sym}${confirmedOrder.totalAmount?.toFixed(2)}. Please confirm my order status.`,
                  settings.whatsappNumber
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ background: '#25D366', borderColor: '#25D366', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>💬</span> Chat on WhatsApp
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setConfirmedOrder(null);
                  onClose();
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>Checkout Tyre Order</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{items.length} product(s) in order</span>
              </div>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Fulfillment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, deliveryMethod: 'delivery' }))}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: formData.deliveryMethod === 'delivery' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: formData.deliveryMethod === 'delivery' ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>🚚 Courier Delivery</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Shipped to your doorstep</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, deliveryMethod: 'pickup' }))}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: formData.deliveryMethod === 'pickup' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: formData.deliveryMethod === 'pickup' ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>🔧 Workshop Fitting</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Free fitting at workshop</div>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Recipient Name *</label>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors.recipientName ? 'input-error' : ''}`}
                    value={formData.recipientName}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, recipientName: e.target.value }));
                      if (fieldErrors.recipientName) setFieldErrors(prev => ({ ...prev, recipientName: '' }));
                    }}
                    placeholder="Full Name"
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: fieldErrors.recipientName ? '1.5px solid #ef4444' : '1px solid #cbd5e1' }}
                  />
                  {fieldErrors.recipientName && <span className="field-error-text">{fieldErrors.recipientName}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Phone Number *</label>
                  <input
                    type="tel"
                    className={`form-control ${fieldErrors.phone ? 'input-error' : ''}`}
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, phone: e.target.value }));
                      if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="e.g. +91 9876543210"
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: fieldErrors.phone ? '1.5px solid #ef4444' : '1px solid #cbd5e1' }}
                  />
                  {fieldErrors.phone && <span className="field-error-text">{fieldErrors.phone}</span>}
                </div>
              </div>

              {formData.deliveryMethod === 'delivery' && (
                <>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Street Address *</label>
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.street ? 'input-error' : ''}`}
                      value={formData.street}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, street: e.target.value }));
                        if (fieldErrors.street) setFieldErrors(prev => ({ ...prev, street: '' }));
                      }}
                      placeholder="Flat, House no., Building, Street"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: fieldErrors.street ? '1.5px solid #ef4444' : '1px solid #cbd5e1' }}
                    />
                    {fieldErrors.street && <span className="field-error-text">{fieldErrors.street}</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>City *</label>
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.city ? 'input-error' : ''}`}
                        value={formData.city}
                        onChange={(e) => {
                          setFormData((p) => ({ ...p, city: e.target.value }));
                          if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: '' }));
                        }}
                        placeholder="City"
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: fieldErrors.city ? '1.5px solid #ef4444' : '1px solid #cbd5e1' }}
                      />
                      {fieldErrors.city && <span className="field-error-text">{fieldErrors.city}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>State *</label>
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.state ? 'input-error' : ''}`}
                        value={formData.state}
                        onChange={(e) => {
                          setFormData((p) => ({ ...p, state: e.target.value }));
                          if (fieldErrors.state) setFieldErrors(prev => ({ ...prev, state: '' }));
                        }}
                        placeholder="State"
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: fieldErrors.state ? '1.5px solid #ef4444' : '1px solid #cbd5e1' }}
                      />
                      {fieldErrors.state && <span className="field-error-text">{fieldErrors.state}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>PIN / ZIP *</label>
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.zip ? 'input-error' : ''}`}
                        value={formData.zip}
                        onChange={(e) => {
                          setFormData((p) => ({ ...p, zip: e.target.value }));
                          if (fieldErrors.zip) setFieldErrors(prev => ({ ...prev, zip: '' }));
                        }}
                        placeholder="PIN Code"
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: fieldErrors.zip ? '1.5px solid #ef4444' : '1px solid #cbd5e1' }}
                      />
                      {fieldErrors.zip && <span className="field-error-text">{fieldErrors.zip}</span>}
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: formData.paymentMethod === 'cash_on_delivery' ? '#f0f9ff' : '#fff' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={formData.paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value }))}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>💵 Cash on Delivery</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: formData.paymentMethod === 'in_store' ? '#f0f9ff' : '#fff' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="in_store"
                      checked={formData.paymentMethod === 'in_store'}
                      onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value }))}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>🏢 Pay at Workshop</span>
                  </label>
                </div>
              </div>

              {/* Order Calculation Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#475569' }}>
                  <span>Items Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>{sym}{cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#475569' }}>
                  <span>Shipping & Handling</span>
                  <span>{calculatedShipping === 0 ? <strong style={{ color: '#10b981' }}>FREE</strong> : `${sym}${calculatedShipping.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#475569' }}>
                  <span>Estimated Tax ({settings.taxRatePercent}%)</span>
                  <span>{sym}{calculatedTax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#0284c7' }}>{sym}{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Back to Cart
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '160px' }}>
                  {loading ? 'Processing...' : `Confirm Order • ${sym}${grandTotal.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
