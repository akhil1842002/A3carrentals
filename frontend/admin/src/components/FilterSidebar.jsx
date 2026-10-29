import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  SiTesla,
  SiBmw,
  SiToyota,
  SiFord
} from 'react-icons/si';

const DEFAULT_BRANDS = [
  { name: 'Tesla', icon: <SiTesla /> },
  { name: 'BMW', icon: <SiBmw /> },
  { name: 'Toyota', icon: <SiToyota /> },
  { name: 'Audi', icon: null },
  { name: 'Ford', icon: <SiFord /> },
  { name: 'Ferrari', icon: null },
  { name: 'Lamborghini', icon: null },
  { name: 'Land Rover', icon: null },
  { name: 'Porsche', icon: null },
  { name: 'Mercedes', icon: null }
];

export default function FilterSidebar({ filters, setFilters, onReset }) {
  const [showAllBrands, setShowAllBrands] = useState(false);

  const handleRentalTypeChange = (type) => {
    setFilters(prev => ({ ...prev, rentalType: type }));
  };

  const handlePriceChange = (e) => {
    setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }));
  };

  const handleCheckboxToggle = (category, value) => {
    setFilters(prev => {
      const currentList = prev[category] || [];
      const updated = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [category]: updated };
    });
  };

  const displayedBrands = showAllBrands ? DEFAULT_BRANDS : DEFAULT_BRANDS.slice(0, 5);

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <h2>Filter by</h2>
        <button className="btn-reset-all" onClick={onReset}>
          Reset all
        </button>
      </div>

      {/* Rental Type */}
      <div className="filter-group">
        <span className="filter-group-title">Rental Type</span>
        <div className="rental-type-segmented">
          {['Daily', 'Weekly', 'Monthly'].map(type => (
            <button
              key={type}
              className={`segment-btn ${filters.rentalType === type.toLowerCase() ? 'active' : ''}`}
              onClick={() => handleRentalTypeChange(type.toLowerCase())}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <span className="filter-group-title">Price Range</span>
        <div className="price-range-info">
          $25 - ${filters.maxPrice || 180} / {filters.rentalType === 'daily' ? 'day' : filters.rentalType === 'weekly' ? 'week' : 'month'}
        </div>
        <input
          type="range"
          min="25"
          max="300"
          step="5"
          value={filters.maxPrice || 180}
          onChange={handlePriceChange}
          className="range-slider-input"
        />
      </div>

      {/* Brand Selection */}
      <div className="filter-group">
        <span className="filter-group-title">Brand</span>
        <div className="checkbox-list">
          {displayedBrands.map(brand => {
            const isChecked = (filters.brands || []).includes(brand.name);
            return (
              <label key={brand.name} className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxToggle('brands', brand.name)}
                />
                {brand.icon && <span className="brand-icon">{brand.icon}</span>}
                <span>{brand.name}</span>
              </label>
            );
          })}
        </div>

        <button
          className="btn-show-more"
          onClick={() => setShowAllBrands(!showAllBrands)}
        >
          {showAllBrands ? (
            <>Show less <FaChevronUp style={{ fontSize: '11px' }} /></>
          ) : (
            <>Show more <FaChevronDown style={{ fontSize: '11px' }} /></>
          )}
        </button>
      </div>

      {/* Vehicle Type */}
      <div className="filter-group">
        <span className="filter-group-title">Vehicle Type</span>
        <div className="checkbox-grid">
          {['Sedan', 'SUV', 'Coupe', 'Luxury', 'Pickup', 'Van'].map(vType => {
            const isChecked = (filters.vehicleTypes || []).includes(vType);
            return (
              <label key={vType} className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxToggle('vehicleTypes', vType)}
                />
                <span>{vType}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Transmission */}
      <div className="filter-group">
        <span className="filter-group-title">Transmission</span>
        <div className="checkbox-grid">
          {['Automatic', 'Manual'].map(tType => {
            const isChecked = (filters.transmissions || []).includes(tType);
            return (
              <label key={tType} className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxToggle('transmissions', tType)}
                />
                <span>{tType}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="filter-group">
        <span className="filter-group-title">Fuel Type</span>
        <div className="checkbox-grid">
          {[
            { label: 'Gasoline', value: 'Petrol' },
            { label: 'Diesel', value: 'Diesel' },
            { label: 'Electric', value: 'Electric' },
            { label: 'Hybrid', value: 'Hybrid' }
          ].map(fType => {
            const isChecked = (filters.fuelTypes || []).includes(fType.value);
            return (
              <label key={fType.label} className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxToggle('fuelTypes', fType.value)}
                />
                <span>{fType.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
