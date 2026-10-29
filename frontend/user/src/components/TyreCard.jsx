import { useState } from 'react';
import { FaWhatsapp, FaShieldAlt, FaShoppingCart } from 'react-icons/fa';
import { FiCheckCircle, FiXCircle, FiTag, FiAlertTriangle, FiCheck, FiEye } from 'react-icons/fi';
import { getWhatsAppLink } from '../api';
import { useCart } from '../context/CartContext';

export default function TyreCard({ tyre, onViewDetails }) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const stock = typeof tyre.stockQuantity === 'number' ? tyre.stockQuantity : (tyre.inStock !== false ? 10 : 0);
  const isOutOfStock = stock <= 0 || tyre.inStock === false;
  const isLowStock = stock > 0 && stock <= (tyre.lowStockThreshold || 4);

  const sizeDisplay = tyre.size || (tyre.width ? `${tyre.width}/${tyre.aspectRatio} R${tyre.rimDiameter}` : 'Standard Fitment');

  const waMessage = !isOutOfStock
    ? `Hi CarBook, I want to order the tyre: ${tyre.name || tyre.model} (${tyre.brand} - ${sizeDisplay}) priced at $${tyre.price}. Please provide delivery or fitting details.`
    : `Hi CarBook, I am interested in the tyre: ${tyre.name || tyre.model} (${tyre.brand} - ${sizeDisplay}) which is currently out of stock. When will it be back in stock?`;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(tyre, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleOpenDetail = () => {
    if (onViewDetails) {
      onViewDetails(tyre);
    }
  };

  return (
    <div className={`tyre-product-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}>
      {/* Image Header Area */}
      <div 
        className="tpc-image-wrap" 
        onClick={handleOpenDetail}
        style={{ cursor: 'pointer' }}
        title="Click to view detailed specifications"
      >
        {/* Brand Tag Top Left */}
        <span className="tpc-brand-badge">{tyre.brand}</span>

        {/* Stock Badge Top Right */}
        <span className={`tpc-stock-badge ${isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-in'}`}>
          {isOutOfStock ? (
            <><FiXCircle /> Out of Stock</>
          ) : isLowStock ? (
            <><FiAlertTriangle /> Only {stock} Left</>
          ) : (
            <><FiCheckCircle /> {stock} in Stock</>
          )}
        </span>

        {/* Product Image */}
        <img
          src={tyre.image || '/images/tyre-placeholder.jpg'}
          alt={tyre.name || tyre.model}
          className="tpc-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Hover Hint Overlay */}
        <div className="tpc-hover-overlay">
          <span className="tpc-hover-pill">
            <FiEye size={14} /> View Details
          </span>
        </div>
      </div>

      {/* Product Details Body */}
      <div className="tpc-body">
        {/* Season & Category Tag */}
        <div className="tpc-category-row">
          <span className="tpc-season-pill">
            <FiTag size={12} /> {tyre.type || tyre.season || 'All-Season'}
          </span>
          {tyre.warranty && (
            <span className="tpc-warranty-pill">
              <FaShieldAlt size={10} /> {tyre.warranty}
            </span>
          )}
        </div>

        {/* Model Title */}
        <h3 
          className="tpc-title" 
          title={tyre.name || tyre.model}
          onClick={handleOpenDetail}
          style={{ cursor: 'pointer' }}
        >
          {tyre.name || tyre.model}
        </h3>

        {/* Fitment Specifications Badge */}
        <div 
          className="tpc-specs-chip"
          onClick={handleOpenDetail}
          style={{ cursor: 'pointer' }}
          title="Click to view full fitment specs"
        >
          <span className="tpc-specs-label">Fitment Size</span>
          <span className="tpc-specs-val">{sizeDisplay}</span>
        </div>

        {/* Rating and Load Index */}
        {(tyre.loadIndex || tyre.speedRating) && (
          <div className="tpc-sub-specs">
            <span>Load / Speed Index:</span>
            <strong>{tyre.loadIndex || ''}{tyre.speedRating || ''}</strong>
          </div>
        )}

        {/* Price and Stock Status Row */}
        <div className="tpc-price-section">
          <div>
            <span className="tpc-price-label">Price</span>
            <div className="tpc-price-val">${(tyre.price || 0).toFixed(2)}</div>
          </div>
          <button 
            type="button" 
            className="tpc-view-specs-link"
            onClick={handleOpenDetail}
          >
            <FiEye size={13} /> View Specs
          </button>
        </div>

        {/* Action Buttons */}
        <div className="tpc-actions">
          <button
            type="button"
            className={`tpc-add-cart-btn ${justAdded ? 'added-success' : ''}`}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            {justAdded ? (
              <><FiCheck size={16} /> Added to Cart!</>
            ) : isOutOfStock ? (
              'Sold Out'
            ) : (
              <><FaShoppingCart size={15} /> Add to Cart</>
            )}
          </button>

          <a
            href={getWhatsAppLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="tpc-whatsapp-btn"
            onClick={(e) => e.stopPropagation()}
          >
            <FaWhatsapp size={15} color="#25D366" />
            <span>Order via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
