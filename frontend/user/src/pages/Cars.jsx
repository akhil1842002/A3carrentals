import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiX, FiCheck } from 'react-icons/fi';
import { getCars } from '../api';
import CarCard from '../components/CarCard';
import { useSettings } from '../context/SettingsContext';

const DEFAULT_BRANDS = ['Ferrari', 'Lamborghini', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Toyota', 'Ford', 'Chevrolet', 'Land Rover', 'Porsche', 'Range Rover'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Coupe', 'Pickup', 'Luxury', 'Van'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];

export default function Cars() {
  const { settings } = useSettings();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [availableBrands, setAvailableBrands] = useState(DEFAULT_BRANDS);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('');

  const fetchCars = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (selectedBrands.length) params.brand = selectedBrands.join(',');
      if (selectedTypes.length) params.vehicleType = selectedTypes.join(',');
      if (selectedTransmissions.length) params.transmission = selectedTransmissions.join(',');
      if (selectedFuelTypes.length) params.fuelType = selectedFuelTypes.join(',');
      if (selectedStatus) params.status = selectedStatus;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sort) params.sort = sort;

      const res = await getCars(params);
      const fetchedCars = res.data.cars || [];
      setCars(fetchedCars);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);

      // Dynamically discover all unique brands from the fleet
      if (fetchedCars.length > 0) {
        const foundBrands = [...new Set(fetchedCars.map(c => c.brand).filter(Boolean))];
        setAvailableBrands(prev => [...new Set([...prev, ...foundBrands])]);
      }
    } catch (err) {
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [page, selectedBrands, selectedTypes, selectedTransmissions, selectedFuelTypes, selectedStatus, minPrice, maxPrice, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCars();
  };

  const toggleFilter = (arr, setArr, value) => {
    setPage(1);
    setArr(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSelectedTransmissions([]);
    setSelectedFuelTypes([]);
    setSelectedStatus('');
    setMinPrice('');
    setMaxPrice('');
    setSort('');
    setPage(1);
  };

  const hasActiveFilters = selectedBrands.length || selectedTypes.length || selectedTransmissions.length || selectedFuelTypes.length || selectedStatus || minPrice || maxPrice;

  return (
    <div className="cars-page-root">
      {/* Page Header with dedicated padding for fixed navbar */}
      <section className="page-header" style={{ backgroundImage: `url('/images/bg_2.jpg')` }}>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="page-header-content">
            <div className="breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span>Cars</span>
            </div>
            <h1>Our Fleet & Rental Vehicles</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', marginTop: '6px' }}>
              Explore luxury sports cars, SUVs, and sedans. Contact directly via WhatsApp to book.
            </p>
          </div>
        </div>
      </section>

      <section className="section cars-section-wrapper">
        <div className="container">
          {/* Top Search and Sort Bar */}
          <div className="search-sort-bar">
            <form onSubmit={handleSearch} className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search by car name, brand, or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px' }}>Search</button>
            </form>

            <div className="sort-controls">
              {/* Quick Status Filter */}
              <div className="status-filter-pills">
                <button
                  type="button"
                  className={`status-pill-btn ${selectedStatus === '' ? 'active' : ''}`}
                  onClick={() => { setSelectedStatus(''); setPage(1); }}
                >
                  All Vehicles
                </button>
                <button
                  type="button"
                  className={`status-pill-btn ${selectedStatus === 'available' ? 'active' : ''}`}
                  onClick={() => { setSelectedStatus('available'); setPage(1); }}
                >
                  <span className="dot dot-available"></span> Available
                </button>
                <button
                  type="button"
                  className={`status-pill-btn ${selectedStatus === 'rented' ? 'active' : ''}`}
                  onClick={() => { setSelectedStatus('rented'); setPage(1); }}
                >
                  <span className="dot dot-rented"></span> Rented
                </button>
              </div>

              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                <option value="">Sort By</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
              </select>

              <button className="btn btn-outline filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <FiX /> : <FiFilter />}
                {showFilters ? 'Hide' : 'Filters'}
              </button>
            </div>
          </div>

          <div className="cars-page-layout">
            {/* Filters Sidebar */}
            <aside className={`filters-sidebar ${showFilters ? 'open' : ''}`}>
              <div className="filters-header">
                <h3><FiFilter /> Filter by</h3>
                {hasActiveFilters ? (
                  <button onClick={clearFilters} className="clear-filters">Reset all</button>
                ) : null}
              </div>

              {/* Price Range */}
              <div className="filter-group">
                <h4>Price Range ({settings.currencySymbol || '₹'}/day)</h4>
                <div className="price-range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  />
                  <span>–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              {/* Brand (dynamically includes all brands added by admin) */}
              <div className="filter-group">
                <h4>Brand</h4>
                <div className="filter-options">
                  {availableBrands.map(b => (
                    <label key={b} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(b)}
                        onChange={() => toggleFilter(selectedBrands, setSelectedBrands, b)}
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="filter-group">
                <h4>Vehicle Type</h4>
                <div className="filter-options">
                  {VEHICLE_TYPES.map(t => (
                    <label key={t} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(t)}
                        onChange={() => toggleFilter(selectedTypes, setSelectedTypes, t)}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div className="filter-group">
                <h4>Transmission</h4>
                <div className="filter-options">
                  {TRANSMISSIONS.map(t => (
                    <label key={t} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTransmissions.includes(t)}
                        onChange={() => toggleFilter(selectedTransmissions, setSelectedTransmissions, t)}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fuel Type */}
              <div className="filter-group">
                <h4>Fuel Type</h4>
                <div className="filter-options">
                  {FUEL_TYPES.map(f => (
                    <label key={f} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFuelTypes.includes(f)}
                        onChange={() => toggleFilter(selectedFuelTypes, setSelectedFuelTypes, f)}
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Cars Main Area */}
            <div className="cars-main">
              <div className="results-header-info">
                <p className="results-count">
                  Showing <strong>{cars.length}</strong> of <strong>{total}</strong> vehicles
                </p>
                {selectedStatus && (
                  <span className="active-filter-badge">
                    Status: {selectedStatus}
                    <button onClick={() => setSelectedStatus('')}><FiX /></button>
                  </span>
                )}
              </div>

              {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
              ) : cars.length === 0 ? (
                <div className="empty-state">
                  <h3>No vehicles found</h3>
                  <p>Try adjusting your filters or search terms to see available vehicles</p>
                  <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: '12px' }}>
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="cars-grid">
                  {cars.map(car => (
                    <CarCard key={car._id} car={car} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="btn btn-outline"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`btn ${p === page ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page >= pages}
                    onClick={() => setPage(p => p + 1)}
                    className="btn btn-outline"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
