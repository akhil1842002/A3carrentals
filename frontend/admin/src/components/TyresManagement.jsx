import { useState } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, 
  FaTimes, FaShieldAlt, FaBox, FaExclamationTriangle, 
  FaThLarge, FaTable, FaBoxes, FaDollarSign, FaTag
} from 'react-icons/fa';
import { FiDisc } from 'react-icons/fi';
import { updateTyre } from '../api';

export default function TyresManagement({ tyres = [], onAddTyre, onEditTyre, onDeleteTyre }) {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, in_stock, low_stock, out_stock
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [adjustingId, setAdjustingId] = useState(null);

  const handleQuickStockAdjust = async (tyre, delta) => {
    const current = tyre.stockQuantity !== undefined ? tyre.stockQuantity : 20;
    const newQty = Math.max(0, current + delta);
    try {
      setAdjustingId(tyre._id);
      await updateTyre(tyre._id, { 
        stockQuantity: newQty, 
        inStock: newQty > 0 
      });
      tyre.stockQuantity = newQty;
      tyre.inStock = newQty > 0;
      // Trigger local state re-render
      setSearch(s => s + ' ');
      setTimeout(() => setSearch(s => s.trim()), 10);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjustingId(null);
    }
  };

  // Filter logic
  const filteredTyres = tyres.filter(tyre => {
    const matchesSearch = tyre.name.toLowerCase().includes(search.toLowerCase()) ||
      tyre.brand.toLowerCase().includes(search.toLowerCase()) ||
      tyre.size.toLowerCase().includes(search.toLowerCase()) ||
      (tyre.sku && tyre.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesBrand = selectedBrand === 'all' || tyre.brand.toLowerCase() === selectedBrand.toLowerCase();
    const matchesType = selectedType === 'all' || tyre.type?.toLowerCase() === selectedType.toLowerCase();

    const qty = tyre.stockQuantity !== undefined ? tyre.stockQuantity : 20;
    const threshold = tyre.lowStockThreshold || 5;

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = qty > threshold;
    else if (stockFilter === 'low_stock') matchesStock = qty <= threshold && qty > 0;
    else if (stockFilter === 'out_stock') matchesStock = qty <= 0;

    return matchesSearch && matchesBrand && matchesType && matchesStock;
  });

  const standardBrands = ['Michelin', 'Bridgestone', 'Goodyear', 'Continental', 'Pirelli', 'Yokohama', 'Dunlop', 'Hankook'];
  const brands = ['all', ...new Set([...tyres.map(t => t.brand).filter(Boolean), ...standardBrands])];
  const tyreTypes = ['all', 'All-Season', 'Summer', 'Winter', 'Performance', 'Off-Road'];

  // Metrics
  const totalStockUnits = tyres.reduce((sum, t) => sum + (t.stockQuantity || 0), 0);
  const lowStockCount = tyres.filter(t => (t.stockQuantity || 0) <= (t.lowStockThreshold || 5) && (t.stockQuantity || 0) > 0).length;
  const outOfStockCount = tyres.filter(t => (t.stockQuantity || 0) <= 0).length;
  const totalInventoryValue = tyres.reduce((sum, t) => sum + ((t.stockQuantity || 0) * (t.price || 0)), 0);

  return (
    <div className="tyres-management-view">
      {/* 1. TOP HEADER & METRIC SUMMARY CARDS */}
      <div className="tyres-header-row">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-black)', margin: 0 }}>
            Tyre Inventory &amp; Stock Operations
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Real-time numerical stock quantities, low-stock alerts, dimensional fitment specs, and bulk price control
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
            >
              <FaThLarge size={13} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table Inventory View"
            >
              <FaTable size={13} />
              <span>Table</span>
            </button>
          </div>

          <button className="btn-admin-primary" onClick={onAddTyre}>
            <FaPlus /> Add Tyre Product
          </button>
        </div>
      </div>

      {/* 2. INVENTORY METRICS BAR */}
      <div className="tyre-inventory-stats-bar">
        <div className="inv-stat-card">
          <div className="inv-icon-box orange">
            <FiDisc size={20} />
          </div>
          <div>
            <span className="inv-stat-label">Total SKUs</span>
            <strong className="inv-stat-val">{tyres.length} Products</strong>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-icon-box blue">
            <FaBoxes size={18} />
          </div>
          <div>
            <span className="inv-stat-label">Total In-Stock Units</span>
            <strong className="inv-stat-val">{totalStockUnits} Tyres</strong>
          </div>
        </div>

        <div className="inv-stat-card" onClick={() => setStockFilter(stockFilter === 'low_stock' ? 'all' : 'low_stock')} style={{ cursor: 'pointer' }}>
          <div className="inv-icon-box amber">
            <FaExclamationTriangle size={17} />
          </div>
          <div>
            <span className="inv-stat-label">Low Stock Alerts</span>
            <strong className="inv-stat-val" style={{ color: lowStockCount > 0 ? '#f59e0b' : 'inherit' }}>
              {lowStockCount} Products
            </strong>
          </div>
        </div>

        <div className="inv-stat-card" onClick={() => setStockFilter(stockFilter === 'out_stock' ? 'all' : 'out_stock')} style={{ cursor: 'pointer' }}>
          <div className="inv-icon-box red">
            <FaTimes size={16} />
          </div>
          <div>
            <span className="inv-stat-label">Out of Stock</span>
            <strong className="inv-stat-val" style={{ color: outOfStockCount > 0 ? '#ef4444' : 'inherit' }}>
              {outOfStockCount} Products
            </strong>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-icon-box green">
            <FaDollarSign size={18} />
          </div>
          <div>
            <span className="inv-stat-label">Inventory Valuation</span>
            <strong className="inv-stat-val">${totalInventoryValue.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & ADVANCED FILTERS WITH BRAND & TYPE DROPDOWNS */}
      <div className="tyre-filter-controls-box">
        <div className="tyre-search-input-wrap">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tyre by model name, size (e.g. 225/45 R17) or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {/* Brand & Type Dropdown Filters */}
        <div className="tyre-dropdown-filters">
          <select
            className="tyre-filter-dropdown"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            title="Filter by Tyre Brand"
          >
            <option value="all">All Brands</option>
            {brands.filter(b => b !== 'all').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            className="tyre-filter-dropdown"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            title="Filter by Tyre Type"
          >
            <option value="all">All Types</option>
            {tyreTypes.filter(t => t !== 'all').map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Stock Filter Pills */}
        <div className="stock-filter-pills">
          <button
            type="button"
            className={`stock-filter-btn ${stockFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStockFilter('all')}
          >
            All Stock
          </button>
          <button
            type="button"
            className={`stock-filter-btn ${stockFilter === 'in_stock' ? 'active' : ''}`}
            onClick={() => setStockFilter('in_stock')}
          >
            In Stock
          </button>
          <button
            type="button"
            className={`stock-filter-btn warning ${stockFilter === 'low_stock' ? 'active' : ''}`}
            onClick={() => setStockFilter('low_stock')}
          >
            ⚠️ Low Stock ({lowStockCount})
          </button>
          <button
            type="button"
            className={`stock-filter-btn danger ${stockFilter === 'out_stock' ? 'active' : ''}`}
            onClick={() => setStockFilter('out_stock')}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* 4. CONTENT VIEW: GRID OR TABLE */}
      {viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="tyres-grid">
          {filteredTyres.map(tyre => {
            const qty = tyre.stockQuantity !== undefined ? tyre.stockQuantity : 20;
            const threshold = tyre.lowStockThreshold || 5;
            const isLow = qty <= threshold && qty > 0;
            const isOut = qty <= 0;

            return (
              <div key={tyre._id || tyre.name} className="tyre-admin-card">
                <div className="tyre-card-img-box">
                  <img
                    src={tyre.image || '/images/car-1.jpg'}
                    alt={tyre.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/car-1.jpg'; }}
                  />
                  <span className={`tyre-floating-status-badge ${isOut ? 'out' : isLow ? 'low' : 'ok'}`}>
                    {isOut ? 'Out of Stock' : isLow ? `Low: ${qty} Left` : `${qty} Units`}
                  </span>
                </div>

                <div className="tyre-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="tyre-brand-badge">{tyre.brand}</span>
                    <span className="tyre-type-badge">{tyre.type || 'All-Season'}</span>
                  </div>

                  <h4 className="tyre-title">{tyre.name}</h4>

                  <div className="tyre-specs-line">
                    <span className="tyre-size-highlight">
                      <FiDisc size={13} style={{ color: 'var(--primary)', marginRight: '4px' }} />
                      <strong>{tyre.size}</strong>
                    </span>
                    {tyre.sku && <code className="tyre-sku-code">{tyre.sku}</code>}
                  </div>

                  {tyre.warranty && (
                    <div className="tyre-warranty-note">
                      <FaShieldAlt style={{ color: '#f59e0b' }} />
                      <span>{tyre.warranty}</span>
                    </div>
                  )}

                  {/* Numerical Stock Count & Controls */}
                  <div className="tyre-stock-control-panel">
                    <div className="stock-label-group">
                      <span className="stock-text-small">Live Inventory:</span>
                      <strong className={`stock-number-highlight ${isOut ? 'red' : isLow ? 'amber' : 'green'}`}>
                        {qty} Available
                      </strong>
                    </div>

                    <div className="stock-stepper-cluster">
                      <button 
                        type="button"
                        className="btn-stock-step"
                        title="Deduct 4 (Complete Vehicle Set)"
                        onClick={() => handleQuickStockAdjust(tyre, -4)}
                        disabled={qty < 4 || adjustingId === tyre._id}
                      >
                        -4
                      </button>
                      <button 
                        type="button"
                        className="btn-stock-step"
                        title="Deduct 1 unit"
                        onClick={() => handleQuickStockAdjust(tyre, -1)}
                        disabled={qty <= 0 || adjustingId === tyre._id}
                      >
                        -1
                      </button>
                      <button 
                        type="button"
                        className="btn-stock-step plus"
                        title="Add 5 units to stock"
                        onClick={() => handleQuickStockAdjust(tyre, 5)}
                        disabled={adjustingId === tyre._id}
                      >
                        +5
                      </button>
                      <button 
                        type="button"
                        className="btn-stock-step plus"
                        title="Add 10 units to stock"
                        onClick={() => handleQuickStockAdjust(tyre, 10)}
                        disabled={adjustingId === tyre._id}
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>

                <div className="tyre-card-bottom">
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Unit Price</span>
                    <div className="tyre-price">${tyre.price}</div>
                  </div>

                  <div className="tyre-actions">
                    <button
                      type="button"
                      className="btn-icon-action"
                      title="Edit Tyre Specs & Pricing"
                      onClick={() => onEditTyre(tyre)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      type="button"
                      className="btn-icon-action delete"
                      title="Delete Tyre"
                      onClick={() => onDeleteTyre(tyre._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* INVENTORY TABLE VIEW */
        <div className="tyres-table-card">
          <table className="tyres-inventory-table">
            <thead>
              <tr>
                <th>Product &amp; SKU</th>
                <th>Brand &amp; Type</th>
                <th>Fitment Size</th>
                <th>Unit Price</th>
                <th>Live Stock</th>
                <th>Quick Adjustments</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTyres.map(tyre => {
                const qty = tyre.stockQuantity !== undefined ? tyre.stockQuantity : 20;
                const threshold = tyre.lowStockThreshold || 5;
                const isLow = qty <= threshold && qty > 0;
                const isOut = qty <= 0;

                return (
                  <tr key={tyre._id || tyre.name}>
                    <td>
                      <div className="table-tyre-product-cell">
                        <img
                          src={tyre.image || '/images/car-1.jpg'}
                          alt={tyre.name}
                          className="table-tyre-thumb"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/images/car-1.jpg'; }}
                        />
                        <div>
                          <strong className="table-tyre-name">{tyre.name}</strong>
                          <span className="table-tyre-sku">{tyre.sku || 'SKU-NONE'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className="tyre-brand-badge">{tyre.brand}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tyre.type || 'All-Season'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-fitment-badge">
                        <FiDisc size={13} style={{ color: 'var(--primary)' }} />
                        <span>{tyre.size}</span>
                      </div>
                    </td>
                    <td>
                      <strong className="table-price-val">${tyre.price}</strong>
                    </td>
                    <td>
                      <span className={`table-stock-badge ${isOut ? 'out' : isLow ? 'low' : 'ok'}`}>
                        {isOut ? 'Out of Stock (0)' : isLow ? `Low Stock (${qty})` : `${qty} In Stock`}
                      </span>
                    </td>
                    <td>
                      <div className="table-stepper-cluster">
                        <button
                          type="button"
                          className="btn-table-step"
                          onClick={() => handleQuickStockAdjust(tyre, -1)}
                          disabled={qty <= 0 || adjustingId === tyre._id}
                          title="Deduct 1"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="btn-table-step"
                          onClick={() => handleQuickStockAdjust(tyre, -4)}
                          disabled={qty < 4 || adjustingId === tyre._id}
                          title="Deduct 4 (car set)"
                        >
                          -4
                        </button>
                        <button
                          type="button"
                          className="btn-table-step plus"
                          onClick={() => handleQuickStockAdjust(tyre, 5)}
                          disabled={adjustingId === tyre._id}
                          title="Add 5"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          className="btn-table-step plus"
                          onClick={() => handleQuickStockAdjust(tyre, 10)}
                          disabled={adjustingId === tyre._id}
                          title="Add 10"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => onEditTyre(tyre)}
                          title="Edit"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action delete"
                          onClick={() => onDeleteTyre(tyre._id)}
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredTyres.length === 0 && (
        <div className="empty-state">
          <FiDisc size={42} style={{ color: 'var(--text-secondary)', marginBottom: '10px' }} />
          <h3>No tyres found matching the filter criteria</h3>
          <p>Try clearing your search query or setting the brand &amp; stock filters to "All".</p>
          <button
            type="button"
            className="btn-admin-primary"
            onClick={() => {
              setSearch('');
              setSelectedBrand('all');
              setSelectedType('all');
              setStockFilter('all');
            }}
            style={{ marginTop: '14px' }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
