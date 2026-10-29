import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import TyreCheckoutModal from './TyreCheckoutModal';

export default function CartDrawer() {
  const { isCartOpen, closeCart, items, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="cart-drawer-backdrop"
        onClick={closeCart}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 9998,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Slide-out Drawer */}
      <div
        className="cart-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '460px',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🛒</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              Your Tyre Cart
            </h3>
            <span
              style={{
                fontSize: '0.8rem',
                background: '#0284c7',
                color: '#fff',
                padding: '0.15rem 0.55rem',
                borderRadius: '999px',
                fontWeight: 600,
              }}
            >
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <button
            onClick={closeCart}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.6rem',
              cursor: 'pointer',
              color: '#64748b',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛞</div>
              <h4 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.5rem' }}>Your Cart is Empty</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Browse our premium all-weather and performance tyres with verified fitment specs.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  closeCart();
                  navigate('/tyres');
                }}
              >
                Shop Tyres Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => {
                const tyre = item.tyre;
                const maxStock = typeof tyre.stockQuantity === 'number' ? tyre.stockQuantity : 999;
                return (
                  <div
                    key={tyre._id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={tyre.image || '/images/tyre-placeholder.jpg'}
                      alt={tyre.model}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=200&auto=format&fit=crop&q=60';
                      }}
                      style={{
                        width: '70px',
                        height: '70px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {tyre.brand}
                      </div>
                      <h4
                        style={{
                          margin: '0.15rem 0 0.3rem',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {tyre.model}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {tyre.size || `${tyre.width || ''}/${tyre.aspectRatio || ''} R${tyre.rimDiameter || ''}`}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                          ${(tyre.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          background: '#fff',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(tyre._id, item.quantity - 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: 'none',
                            background: '#f1f5f9',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          -
                        </button>
                        <span style={{ width: '32px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= maxStock}
                          onClick={() => updateQuantity(tyre._id, item.quantity + 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: 'none',
                            background: item.quantity >= maxStock ? '#e2e8f0' : '#f1f5f9',
                            cursor: item.quantity >= maxStock ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(tyre._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer & Checkout Call to Action */}
        {items.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' }}>
              <span style={{ color: '#64748b' }}>Subtotal</span>
              <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>${cartTotal.toFixed(2)}</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem' }}>
              Taxes and doorstep shipping calculated at checkout. In-store fitting is free.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={clearCart}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={() => setShowCheckout(true)}
              >
                Checkout Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <TyreCheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onOrderPlaced={() => {
            setShowCheckout(false);
            closeCart();
          }}
        />
      )}
    </>
  );
}
