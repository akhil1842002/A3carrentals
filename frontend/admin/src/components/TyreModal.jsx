import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const DEFAULT_TYRE = {
  name: '',
  brand: 'Michelin',
  sku: '',
  size: '225/45 R17',
  width: 225,
  aspectRatio: 45,
  rimDiameter: 17,
  loadIndex: '94',
  speedRating: 'W',
  type: 'All-Season',
  price: 150,
  stockQuantity: 20,
  lowStockThreshold: 5,
  description: '',
  inStock: true,
  warranty: '2 Years Manufacturer Warranty',
  rating: 4.8,
  image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80'
};

export default function TyreModal({ isOpen, onClose, onSave, tyreToEdit }) {
  const [formData, setFormData] = useState(DEFAULT_TYRE);

  useEffect(() => {
    if (tyreToEdit) {
      setFormData({
        ...DEFAULT_TYRE,
        ...tyreToEdit,
        stockQuantity: tyreToEdit.stockQuantity !== undefined ? tyreToEdit.stockQuantity : 20
      });
    } else {
      setFormData({
        ...DEFAULT_TYRE,
        sku: 'TYR-' + Math.random().toString(36).substring(2, 7).toUpperCase()
      });
    }
  }, [tyreToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: Number(formData.price),
      stockQuantity: Number(formData.stockQuantity),
      lowStockThreshold: Number(formData.lowStockThreshold) || 4,
      width: Number(formData.width) || undefined,
      aspectRatio: Number(formData.aspectRatio) || undefined,
      rimDiameter: Number(formData.rimDiameter) || undefined,
      inStock: Number(formData.stockQuantity) > 0
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{tyreToEdit ? 'Edit Tyre' : 'Add New Tyre'}</h3>
          <button className="detail-action-circle" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Tyre Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Pilot Sport 4S"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Brand *</label>
                <select name="brand" value={formData.brand || 'Michelin'} onChange={handleChange}>
                  {['Michelin', 'Pirelli', 'Bridgestone', 'Continental', 'Goodyear', 'Dunlop', 'Yokohama'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>Size Specification *</label>
                <input
                  type="text"
                  name="size"
                  placeholder="e.g. 245/40R18"
                  value={formData.size || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tyre Type</label>
                <select name="type" value={formData.type || 'All-Season'} onChange={handleChange}>
                  {['All-Season', 'Summer', 'Winter', 'Performance', 'Off-Road'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>Section Width (mm)</label>
                <input
                  type="number"
                  name="width"
                  placeholder="e.g. 245"
                  value={formData.width || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Aspect Ratio (%)</label>
                <input
                  type="number"
                  name="aspectRatio"
                  placeholder="e.g. 40"
                  value={formData.aspectRatio || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Rim Diameter (inches)</label>
                <input
                  type="number"
                  name="rimDiameter"
                  placeholder="e.g. 18"
                  value={formData.rimDiameter || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>Stock Quantity (Units) *</label>
                <input
                  type="number"
                  name="stockQuantity"
                  min="0"
                  value={formData.stockQuantity !== undefined ? formData.stockQuantity : 20}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>SKU Code</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku || ''}
                  onChange={handleChange}
                  placeholder="TYR-MIC-4S"
                />
              </div>

              <div className="form-group">
                <label>Warranty Terms</label>
                <input
                  type="text"
                  name="warranty"
                  placeholder="e.g. 2 Years / 40,000 mi"
                  value={formData.warranty || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description &amp; Fitment Details</label>
              <textarea
                name="description"
                rows="3"
                placeholder="High-performance ultra-grip tyre suitable for sports coupes and sedans..."
                value={formData.description || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {tyreToEdit ? 'Save Changes' : 'Create Tyre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
