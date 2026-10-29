import { useState, useEffect } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle, FiSliders, FiRotateCcw, FiTag } from 'react-icons/fi';
import { getTyres } from '../api';
import TyreCard from '../components/TyreCard';
import TyreDetailModal from '../components/TyreDetailModal';
import { useAuth } from '../context/AuthContext';

const POPULAR_BRANDS = ['All Brands', 'Michelin', 'Bridgestone', 'Continental', 'Goodyear', 'Pirelli'];
const TYRE_TYPES = ['All Types', 'Performance', 'All-Season', 'Summer', 'Winter', 'Off-Road'];

export default function Tyres() {
  const { isAuthenticated } = useAuth();
  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedType, setSelectedType] = useState('All Types');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'inStock', 'outOfStock'

  // Detail Modal State
  const [selectedDetailTyre, setSelectedDetailTyre] = useState(null);

  const fetchTyres = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (selectedBrand !== 'All Brands') params.brand = selectedBrand;
      if (selectedType !== 'All Types') params.type = selectedType;

      const res = await getTyres(params);
      const fetchedTyres = res.data.tyres || [];
      
      setTyres(fetchedTyres);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error('Error fetching tyres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTyres();
  }, [page, selectedBrand, selectedType]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTyres();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedBrand('All Brands');
    setSelectedType('All Types');
    setStockFilter('all');
    setPage(1);
  };

  // Client-side stock filtering
  const displayedTyres = tyres.filter((tyre) => {
    const stock = typeof tyre.stockQuantity === 'number' ? tyre.stockQuantity : (tyre.inStock !== false ? 10 : 0);
    if (stockFilter === 'inStock') return stock > 0 && tyre.inStock !== false;
    if (stockFilter === 'outOfStock') return stock <= 0 || tyre.inStock === false;
    return true;
  });

  return (
    <div className="tyres-catalogue-page">
      {/* Banner / Header */}
      <div className="tyres-hero-banner">
        <div className="tyres-hero-badge">
          <FiTag /> Genuine OEM Tyres &amp; Warranty
        </div>
        <h2>Premium Tyre Catalogue &amp; Store</h2>
        <p>
          Browse top manufacturer tyres with exact fitment specifications. Order online with doorstep courier or free in-store workshop fitting. Click any tyre to inspect detailed engineering specifications.
        </p>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="tyres-filter-control-card">
        {/* Top Search Input and Stock Filter */}
        <div className="tyres-search-row">
          <form onSubmit={handleSearch} className="tyres-search-form">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by brand, model, or tyre size (e.g. 245/40 R18)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {/* In Stock / Out of Stock Filter */}
          <div className="tyres-stock-toggle-group">
            <button
              type="button"
              className={`stock-pill ${stockFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStockFilter('all')}
            >
              All Tyres
            </button>
            <button
              type="button"
              className={`stock-pill pill-instock ${stockFilter === 'inStock' ? 'active' : ''}`}
              onClick={() => setStockFilter('inStock')}
            >
              <FiCheckCircle /> In Stock
            </button>
            <button
              type="button"
              className={`stock-pill pill-outofstock ${stockFilter === 'outOfStock' ? 'active' : ''}`}
              onClick={() => setStockFilter('outOfStock')}
            >
              <FiXCircle /> Out of Stock
            </button>
          </div>
        </div>

        {/* Brand Selector Chips */}
        <div className="tyres-chips-section">
          <div className="tyres-chips-label">Brand:</div>
          <div className="tyres-chips-wrapper">
            {POPULAR_BRANDS.map((b) => (
              <button
                key={b}
                type="button"
                className={`filter-chip ${selectedBrand === b ? 'active' : ''}`}
                onClick={() => {
                  setSelectedBrand(b);
                  setPage(1);
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Tyre Season / Type Chips */}
        <div className="tyres-chips-section" style={{ marginTop: '12px' }}>
          <div className="tyres-chips-label">Season / Type:</div>
          <div className="tyres-chips-wrapper">
            {TYRE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`filter-chip ${selectedType === t ? 'active' : ''}`}
                onClick={() => {
                  setSelectedType(t);
                  setPage(1);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header Bar */}
      <div className="tyres-results-bar">
        <div>
          Showing <strong>{displayedTyres.length}</strong> tyres
          {(selectedBrand !== 'All Brands' || selectedType !== 'All Types' || search || stockFilter !== 'all') && (
            <span style={{ color: '#0284c7', marginLeft: '6px' }}>(filtered)</span>
          )}
        </div>
        {(selectedBrand !== 'All Brands' || selectedType !== 'All Types' || search || stockFilter !== 'all') && (
          <button type="button" className="reset-filter-btn" onClick={handleResetFilters}>
            <FiRotateCcw size={13} /> Reset All Filters
          </button>
        )}
      </div>

      {/* Grid of Tyre Cards */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : displayedTyres.length === 0 ? (
        <div className="tyres-empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛞</div>
          <h3>No Tyres Match Your Filter</h3>
          <p>Try searching for a different size, brand, or clear the active filter.</p>
          <button type="button" className="btn btn-primary" onClick={handleResetFilters} style={{ marginTop: '14px' }}>
            View All Tyres
          </button>
        </div>
      ) : (
        <div className="tyres-products-grid">
          {displayedTyres.map((tyre) => (
            <TyreCard 
              key={tyre._id || tyre.name} 
              tyre={tyre} 
              onViewDetails={(t) => setSelectedDetailTyre(t)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination" style={{ marginTop: '40px' }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-outline">
            Previous
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`btn ${p === page ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn btn-outline">
            Next
          </button>
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedDetailTyre && (
        <TyreDetailModal
          tyre={selectedDetailTyre}
          onClose={() => setSelectedDetailTyre(null)}
        />
      )}
    </div>
  );
}
