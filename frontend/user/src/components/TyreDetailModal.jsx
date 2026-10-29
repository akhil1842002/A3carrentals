import { useState } from 'react';
import { 
  FiX, FiCheckCircle, FiXCircle, FiTag, FiAlertTriangle, 
  FiShield, FiCheck, FiTruck, FiTool, FiInfo, FiLayers
} from 'react-icons/fi';
import { FaWhatsapp, FaShoppingCart, FaStar } from 'react-icons/fa';
import { getWhatsAppLink } from '../api';
import { useCart } from '../context/CartContext';

const DEFAULT_HIGHLIGHTS = [
  'Optimized Asymmetric Tread for Superior Wet & Dry Grip',
  'Silica-Enhanced Polymer Compound for Shorter Braking Distances',
  'Noise Reduction Groove Technology for a Whisper-Quiet Ride',
  'Reinforced Sidewalls with Kerb & Rim Edge Protection',
  'Includes Free In-Store Professional Valve & Wheel Balancing'
];

export default function TyreDetailModal({ tyre, onClose }) {
  if (!tyre) return null;

  const { addToCart } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const stock = typeof tyre.stockQuantity === 'number' ? tyre.stockQuantity : (tyre.inStock !== false ? 10 : 0);
  const isOutOfStock = stock <= 0 || tyre.inStock === false;
  const isLowStock = stock > 0 && stock <= (tyre.lowStockThreshold || 4);

  const sizeDisplay = tyre.size || (tyre.width ? `${tyre.width}/${tyre.aspectRatio} R${tyre.rimDiameter}` : 'Standard Fitment');
  const unitPrice = tyre.price || 0;
  const totalPrice = unitPrice * selectedQty;

  const waMessage = !isOutOfStock
    ? `Hi CarBook, I want to order ${selectedQty}x tyre(s): ${tyre.name || tyre.model} (${tyre.brand} - ${sizeDisplay}) at $${unitPrice} each (Total: $${totalPrice.toFixed(2)}). Please provide installation or delivery details.`
    : `Hi CarBook, I am interested in the tyre: ${tyre.name || tyre.model} (${tyre.brand} - ${sizeDisplay}) which is currently out of stock. When will it be back in stock?`;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(tyre, selectedQty);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="tyre-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close tyre details">
          <FiX size={20} />
        </button>

        {/* Modal Header */}
        <div className="tdm-header">
          <div className="tdm-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="tdm-brand-pill">{tyre.brand}</span>
              <span className={`tdm-status-pill ${isOutOfStock ? 'status-unavail' : isLowStock ? 'status-low' : 'status-avail'}`}>
                {isOutOfStock ? (
                  <><FiXCircle /> Out of Stock</>
                ) : isLowStock ? (
                  <><FiAlertTriangle /> Only {stock} Left</>
                ) : (
                  <><FiCheckCircle /> In Stock ({stock} available)</>
                )}
              </span>
            </div>
            <h2>{tyre.name || tyre.model}</h2>
            <p className="tdm-subhead">
              Category: <strong>{tyre.type || tyre.season || 'All-Season'}</strong> • SKU: <span style={{ fontFamily: 'monospace' }}>{tyre.sku || 'OEM-FIT'}</span>
            </p>
          </div>

          <div className="tdm-header-right">
            <div className="tdm-rating">
              <FaStar className="star-icon" />
              <span className="rating-score">{tyre.rating || 4.8}</span>
              <span className="rating-count">(Verified OEM)</span>
            </div>
            <div className="tdm-price-box">
              <span className="price-label">Price per Tyre</span>
              <span className="price-amount">${unitPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="tdm-body">
          {/* Main Showcase Showcase */}
          <div className="tdm-showcase-grid">
            <div className="tdm-image-container">
              <img
                src={tyre.image || '/images/tyre-placeholder.jpg'}
                alt={tyre.name || tyre.model}
                className="tdm-main-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <span className="tdm-fitment-badge-float">{sizeDisplay}</span>
            </div>

            {/* Quick Bundle Quantity Selector */}
            <div className="tdm-bundle-selector">
              <span className="bundle-title">Select Quantity / Tyre Set</span>
              <div className="bundle-options">
                <button
                  type="button"
                  className={`bundle-btn ${selectedQty === 1 ? 'active' : ''}`}
                  onClick={() => setSelectedQty(1)}
                  disabled={stock < 1}
                >
                  <div className="bundle-qty">1 Tyre</div>
                  <div className="bundle-desc">Spare / Single</div>
                  <div className="bundle-cost">${(unitPrice * 1).toFixed(2)}</div>
                </button>

                <button
                  type="button"
                  className={`bundle-btn ${selectedQty === 2 ? 'active' : ''}`}
                  onClick={() => setSelectedQty(Math.min(2, stock))}
                  disabled={stock < 2}
                >
                  <div className="bundle-qty">2 Tyres</div>
                  <div className="bundle-desc">Front or Rear Axle</div>
                  <div className="bundle-cost">${(unitPrice * 2).toFixed(2)}</div>
                </button>

                <button
                  type="button"
                  className={`bundle-btn ${selectedQty === 4 ? 'active' : ''}`}
                  onClick={() => setSelectedQty(Math.min(4, stock))}
                  disabled={stock < 4}
                >
                  <div className="bundle-qty">4 Tyres</div>
                  <div className="bundle-desc">Complete Vehicle Set</div>
                  <div className="bundle-cost">${(unitPrice * 4).toFixed(2)}</div>
                </button>
              </div>

              {/* Service Badges */}
              <div className="tdm-perks-box">
                <div className="tdm-perk-item">
                  <FiTool className="perk-icon" />
                  <div>
                    <strong>Free Workshop Installation</strong>
                    <span>Includes wheel balancing and old tyre recycling</span>
                  </div>
                </div>
                <div className="tdm-perk-item">
                  <FiTruck className="perk-icon" />
                  <div>
                    <strong>Express Doorstep Delivery</strong>
                    <span>Shipped securely in 1-3 business days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="tdm-section">
            <h3 className="tdm-section-title">
              <FiLayers /> Technical Fitment Specifications
            </h3>
            <div className="tdm-specs-grid">
              <div className="tdm-spec-card">
                <span className="spec-name">Section Width</span>
                <span className="spec-val">{tyre.width ? `${tyre.width} mm` : '245 mm'}</span>
              </div>
              <div className="tdm-spec-card">
                <span className="spec-name">Aspect Ratio (Profile)</span>
                <span className="spec-val">{tyre.aspectRatio ? `${tyre.aspectRatio} %` : '40 %'}</span>
              </div>
              <div className="tdm-spec-card">
                <span className="spec-name">Rim Diameter</span>
                <span className="spec-val">{tyre.rimDiameter ? `${tyre.rimDiameter}″ (R${tyre.rimDiameter})` : '18″ (R18)'}</span>
              </div>
              <div className="tdm-spec-card">
                <span className="spec-name">Load Index</span>
                <span className="spec-val">{tyre.loadIndex ? `${tyre.loadIndex}` : '97 (730 kg/tyre)'}</span>
              </div>
              <div className="tdm-spec-card">
                <span className="spec-name">Speed Rating</span>
                <span className="spec-val">{tyre.speedRating ? `${tyre.speedRating} (Up to 300 km/h)` : 'Y (300 km/h)'}</span>
              </div>
              <div className="tdm-spec-card">
                <span className="spec-name">Season Category</span>
                <span className="spec-val">{tyre.type || tyre.season || 'All-Season'}</span>
              </div>
              <div className="tdm-spec-card">
                <span className="spec-name">Vehicle Compatibility</span>
                <span className="spec-val">{tyre.vehicleType || 'Passenger / SUV'}</span>
              </div>
              <div className="tdm-spec-card">
                <span className="spec-name">Warranty Protection</span>
                <span className="spec-val">{tyre.warranty || '2 Years Manufacturer'}</span>
              </div>
            </div>
          </div>

          {/* Product Overview & Description */}
          <div className="tdm-section">
            <h3 className="tdm-section-title">
              <FiInfo /> Performance Overview
            </h3>
            <p className="tdm-description">
              {tyre.description ||
                `The ${tyre.brand} ${tyre.name || tyre.model} is engineered to deliver exceptional grip, sharp steering responsiveness, and superior braking performance in both wet and dry conditions. Designed with reinforced tread blocks and advanced noise-cancelling tread pitch.`}
            </p>
          </div>

          {/* Technical Engineering Highlights */}
          <div className="tdm-section">
            <h3 className="tdm-section-title">
              <FiShield /> Engineering Highlights &amp; Features
            </h3>
            <div className="tdm-highlights-grid">
              {DEFAULT_HIGHLIGHTS.map((item, idx) => (
                <div key={idx} className="tdm-highlight-item">
                  <FiCheck className="highlight-check" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="tdm-footer">
          <div className="tdm-footer-pricing">
            <span className="footer-calc">
              {selectedQty} {selectedQty > 1 ? 'tyres' : 'tyre'} × ${unitPrice.toFixed(2)}
            </span>
            <div className="footer-total">
              Total: <strong>${totalPrice.toFixed(2)}</strong>
            </div>
          </div>

          <div className="tdm-footer-actions">
            <button type="button" className="tdm-btn-secondary" onClick={onClose}>
              Back to Catalog
            </button>

            <button
              type="button"
              className={`tdm-btn-primary ${justAdded ? 'added' : ''}`}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              {justAdded ? (
                <><FiCheck size={18} /> Added {selectedQty} to Cart!</>
              ) : (
                <><FaShoppingCart size={16} /> Add to Cart • ${totalPrice.toFixed(2)}</>
              )}
            </button>

            <a
              href={getWhatsAppLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="tdm-btn-whatsapp"
            >
              <FaWhatsapp size={18} /> Order on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
