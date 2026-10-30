import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlus, FaTrash, FaStar, FaUpload, FaImage, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { getFleetMaster, quickAddFleetMasterItem } from '../api';

const DEFAULT_CAR = {
  name: '',
  brand: 'Toyota',
  model: '',
  year: 2024,
  transmission: 'Automatic',
  fuelType: 'Petrol',
  vehicleType: 'Sedan',
  seats: 5,
  luggage: 2,
  mileage: '15',
  pricePerDay: 2000,
  plateNumber: 'TN-75-AB-1234',
  status: 'available',
  rating: 4.9,
  reviewCount: 45,
  distanceFromCenter: '420m',
  estimatedTime: '12min',
  description: '',
  images: [],
  features: []
};

export default function CarModal({ isOpen, onClose, onSave, carToEdit }) {
  const [formData, setFormData] = useState(DEFAULT_CAR);
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [modalToast, setModalToast] = useState({ text: '', type: 'error' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const showModalToast = (text, type = 'error') => {
    setModalToast({ text, type });
    setTimeout(() => setModalToast({ text: '', type: 'error' }), 4500);
  };

  // Master Setup Attributes
  const [masterOptions, setMasterOptions] = useState({
    brands: [
      'Toyota', 'Mahindra', 'Hyundai', 'Maruti Suzuki', 'Tata', 'Honda',
      'Kia', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla'
    ],
    vehicleTypes: [
      'Sedan', 'SUV', 'MUV', 'Hatchback', 'Luxury', 'Van', 'Coupe', 'Convertible'
    ],
    fuelTypes: [
      'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'
    ],
    features: [
      'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'Leather Seats',
      'Parking Sensors', 'Cruise Control', 'Reverse Camera', 'Sunroof',
      'Apple CarPlay / Android Auto', 'USB Fast Charger'
    ]
  });

  // Quick Add Popup State
  const [quickAddModal, setQuickAddModal] = useState({
    isOpen: false,
    category: '', // 'brands', 'vehicleTypes', 'fuelTypes', 'features'
    label: '',
    value: ''
  });
  const [quickAdding, setQuickAdding] = useState(false);

  useEffect(() => {
    loadMasterOptions();
  }, []);

  const loadMasterOptions = async () => {
    try {
      const res = await getFleetMaster();
      if (res.data) {
        setMasterOptions(res.data);
      }
    } catch (err) {
      console.error('Failed to load fleet master in modal:', err);
    }
  };

  useEffect(() => {
    if (carToEdit) {
      // Merge carToEdit features with master features
      const existingFeatures = Array.isArray(carToEdit.features) ? carToEdit.features : [];
      const featureMap = new Map();
      existingFeatures.forEach(f => {
        if (f && f.name) featureMap.set(f.name.toLowerCase(), f);
      });

      const mergedFeatures = (masterOptions.features || []).map(fName => {
        const found = featureMap.get(fName.toLowerCase());
        return found ? found : { name: fName, available: false };
      });

      existingFeatures.forEach(f => {
        if (f && f.name && !masterOptions.features.some(mf => mf.toLowerCase() === f.name.toLowerCase())) {
          mergedFeatures.push(f);
        }
      });

      setFormData({
        ...DEFAULT_CAR,
        ...carToEdit,
        mileage: carToEdit.mileage ? (carToEdit.mileage.includes('15,000') ? '15 km/l' : carToEdit.mileage) : '15 km/l',
        features: mergedFeatures
      });

      const initialImages = Array.isArray(carToEdit.images) && carToEdit.images.length > 0
        ? carToEdit.images.slice(0, 8)
        : [];
      setImages(initialImages);
    } else {
      const defaultFeatures = (masterOptions.features || []).map(fName => ({
        name: fName,
        available: true
      }));

      setFormData({
        ...DEFAULT_CAR,
        brand: masterOptions.brands[0] || 'Toyota',
        vehicleType: masterOptions.vehicleTypes[0] || 'Sedan',
        fuelType: masterOptions.fuelTypes[0] || 'Petrol',
        features: defaultFeatures
      });
      setImages([]);
    }
    setErrors({});
    setIsDragging(false);
  }, [carToEdit, isOpen, masterOptions.features]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFeatureToggle = (index) => {
    setFormData(prev => {
      const updated = [...(prev.features || [])];
      updated[index] = { ...updated[index], available: !updated[index].available };
      return { ...prev, features: updated };
    });
  };

  // QUICK ADD MASTER ATTRIBUTE HANDLER
  const handleOpenQuickAdd = (category, label) => {
    setQuickAddModal({
      isOpen: true,
      category,
      label,
      value: ''
    });
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    const cleanVal = quickAddModal.value.trim();
    if (!cleanVal) return;

    setQuickAdding(true);
    try {
      const res = await quickAddFleetMasterItem(quickAddModal.category, cleanVal);
      if (res.data?.items) {
        setMasterOptions(prev => ({
          ...prev,
          [quickAddModal.category]: res.data.items
        }));

        if (quickAddModal.category === 'brands') {
          setFormData(prev => ({ ...prev, brand: cleanVal }));
        } else if (quickAddModal.category === 'vehicleTypes') {
          setFormData(prev => ({ ...prev, vehicleType: cleanVal }));
        } else if (quickAddModal.category === 'fuelTypes') {
          setFormData(prev => ({ ...prev, fuelType: cleanVal }));
        } else if (quickAddModal.category === 'features') {
          setFormData(prev => ({
            ...prev,
            features: [...(prev.features || []), { name: cleanVal, available: true }]
          }));
        }

        try {
          window.dispatchEvent(new CustomEvent('fleetMasterUpdated', { detail: { [quickAddModal.category]: res.data.items } }));
        } catch (e) { }
      }
      setQuickAddModal({ isOpen: false, category: '', label: '', value: '' });
    } catch (err) {
      showModalToast(err.response?.data?.message || 'Failed to add item');
    } finally {
      setQuickAdding(false);
    }
  };

  // PHOTO UPLOAD HANDLERS (Min 1, Max 8 Photos)
  const processFiles = (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const remainingSlots = 8 - images.length;
    if (remainingSlots <= 0) {
      showModalToast('You have already uploaded the maximum limit of 8 photos. Delete a photo to add a new one.', 'warning');
      return;
    }

    const filesToRead = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      showModalToast(`Only ${remainingSlots} photos were added because the maximum limit is 8 photos.`, 'warning');
    }

    const readPromises = filesToRead.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(newImgs => {
      const valid = newImgs.filter(Boolean);
      if (valid.length > 0) {
        setImages(prev => [...prev, ...valid].slice(0, 8));
        setErrors(prev => ({ ...prev, images: '' }));
      }
    });
  };

  const handleFileUpload = (e) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryCover = (indexToPrimary) => {
    setImages(prev => {
      const selected = prev[indexToPrimary];
      const rest = prev.filter((_, idx) => idx !== indexToPrimary);
      return [selected, ...rest];
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Car Name is required (e.g. Toyota Innova Crysta)';
    }
    if (!formData.brand || !formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }
    if (!formData.model || !formData.model.trim()) {
      newErrors.model = 'Model is required (e.g. Innova Crysta ZX)';
    }
    if (!formData.year || Number(formData.year) < 1990 || Number(formData.year) > 2035) {
      newErrors.year = 'Enter a valid manufacture year (1990 - 2035)';
    }
    if (!formData.vehicleType || !formData.vehicleType.trim()) {
      newErrors.vehicleType = 'Vehicle Type is required';
    }
    if (!formData.fuelType || !formData.fuelType.trim()) {
      newErrors.fuelType = 'Fuel Type is required';
    }
    if (!formData.pricePerDay || Number(formData.pricePerDay) <= 0) {
      newErrors.pricePerDay = 'Rental price per day must be greater than 0';
    }
    if (!formData.seats || Number(formData.seats) <= 0) {
      newErrors.seats = 'Valid seat count required (min 1 seat)';
    }

    // Validation: 1 photo min, 8 photos max
    if (!images || images.length === 0) {
      newErrors.images = 'Please upload at least 1 photo for this vehicle (Minimum: 1 photo, Maximum: 8 photos).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showModalToast('⚠️ Please fill in all required fields highlighted in red below.');
      return;
    }

    setErrors({});
    const payload = {
      ...formData,
      name: formData.name.trim(),
      model: formData.model.trim(),
      plateNumber: (formData.plateNumber || '').trim(),
      images: images.slice(0, 8),
      pricePerDay: Number(formData.pricePerDay),
      pricePerWeek: 0,
      pricePerMonth: 0,
      securityDeposit: 0,
      horsepower: 0,
      year: Number(formData.year) || 2024,
      seats: Number(formData.seats) || 5,
      luggage: Number(formData.luggage) || 2
    };
    try {
      setSubmitting(true);
      await onSave(payload);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (msg.toLowerCase().includes('plate number')) {
        setErrors(prev => ({ ...prev, plateNumber: msg }));
        showModalToast(`⚠️ ${msg}`);
      } else {
        showModalToast(`⚠️ ${msg || 'Failed to save vehicle'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '100%',
          maxHeight: '90vh',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          background: '#fff',
          position: 'relative'
        }}
      >
        <div
          className="modal-header"
          style={{
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '22px 32px 18px',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0,
            background: '#fff'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              {carToEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0' }}>
              Manage model specifications, photos (1-8 photos), and vehicle amenities
            </p>
          </div>
          <button type="button" className="detail-action-circle" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '26px 32px' }}>
            {modalToast.text && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: modalToast.type === 'warning' ? '#fffbeb' : modalToast.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: modalToast.type === 'warning' ? '#b45309' : modalToast.type === 'success' ? '#065f46' : '#991b1b',
                border: modalToast.type === 'warning' ? '1px solid #fde68a' : modalToast.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca'
              }}>
                <FaExclamationTriangle size={16} />
                <span>{modalToast.text}</span>
              </div>
            )}

            {/* Row 1: Vehicle Identity */}
            <div className="form-grid-3">
              <div className="form-group">
                <div className="form-label-header">
                  <label>Car Name <span className="req-star">*</span></label>
                </div>
                <input
                  type="text"
                  name="name"
                  className={errors.name ? 'input-has-error' : ''}
                  placeholder="e.g. Toyota Innova Crysta"
                  value={formData.name || ''}
                  onChange={handleChange}
                />
                {errors.name && <span className="field-error-text">{errors.name}</span>}
              </div>

              {/* Brand with (+) Button */}
              <div className="form-group">
                <div className="form-label-header">
                  <label>Brand <span className="req-star">*</span></label>
                  <button
                    type="button"
                    className="quick-add-btn"
                    onClick={() => handleOpenQuickAdd('brands', 'Brand')}
                    title="Add new Brand to master list"
                  >
                    <FaPlus size={9} /> Add Brand
                  </button>
                </div>
                <select
                  name="brand"
                  className={errors.brand ? 'input-has-error' : ''}
                  value={formData.brand || (masterOptions.brands[0] || 'Toyota')}
                  onChange={handleChange}
                >
                  {(masterOptions.brands || []).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors.brand && <span className="field-error-text">{errors.brand}</span>}
              </div>

              <div className="form-group">
                <div className="form-label-header">
                  <label>Model <span className="req-star">*</span></label>
                </div>
                <input
                  type="text"
                  name="model"
                  className={errors.model ? 'input-has-error' : ''}
                  placeholder="e.g. Innova Crysta ZX"
                  value={formData.model || ''}
                  onChange={handleChange}
                />
                {errors.model && <span className="field-error-text">{errors.model}</span>}
              </div>
            </div>

            {/* Row 2: Registration & Type */}
            <div className="form-grid-3" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <div className="form-label-header">
                  <label>Year <span className="req-star">*</span></label>
                </div>
                <input
                  type="number"
                  name="year"
                  className={errors.year ? 'input-has-error' : ''}
                  placeholder="2024"
                  value={formData.year || 2024}
                  onChange={handleChange}
                />
                {errors.year && <span className="field-error-text">{errors.year}</span>}
              </div>

              <div className="form-group">
                <div className="form-label-header">
                  <label>Plate Number</label>
                </div>
                <input
                  type="text"
                  name="plateNumber"
                  className={errors.plateNumber ? 'input-has-error' : ''}
                  placeholder="e.g. TN-75-AB-1234"
                  value={formData.plateNumber || ''}
                  onChange={(e) => {
                    const up = e.target.value.toUpperCase();
                    setFormData(prev => ({ ...prev, plateNumber: up }));
                    if (errors.plateNumber) setErrors(prev => ({ ...prev, plateNumber: '' }));
                  }}
                />
                {errors.plateNumber && <span className="field-error-text">{errors.plateNumber}</span>}
              </div>

              {/* Vehicle Type with (+) Button */}
              <div className="form-group">
                <div className="form-label-header">
                  <label>Vehicle Type <span className="req-star">*</span></label>
                  <button
                    type="button"
                    className="quick-add-btn"
                    onClick={() => handleOpenQuickAdd('vehicleTypes', 'Vehicle Type')}
                    title="Add new Vehicle Type to master list"
                  >
                    <FaPlus size={9} /> Add Type
                  </button>
                </div>
                <select
                  name="vehicleType"
                  className={errors.vehicleType ? 'input-has-error' : ''}
                  value={formData.vehicleType || (masterOptions.vehicleTypes[0] || 'Sedan')}
                  onChange={handleChange}
                >
                  {(masterOptions.vehicleTypes || []).map(vt => (
                    <option key={vt} value={vt}>{vt}</option>
                  ))}
                </select>
                {errors.vehicleType && <span className="field-error-text">{errors.vehicleType}</span>}
              </div>
            </div>

            {/* Row 3: Transmission, Fuel Type with (+) & Status */}
            <div className="form-grid-3" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <div className="form-label-header">
                  <label>Transmission</label>
                </div>
                <select name="transmission" value={formData.transmission || 'Automatic'} onChange={handleChange}>
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              {/* Fuel Type with (+) Button */}
              <div className="form-group">
                <div className="form-label-header">
                  <label>Fuel Type <span className="req-star">*</span></label>
                  <button
                    type="button"
                    className="quick-add-btn"
                    onClick={() => handleOpenQuickAdd('fuelTypes', 'Fuel Type')}
                    title="Add new Fuel Type to master list"
                  >
                    <FaPlus size={9} /> Add Fuel
                  </button>
                </div>
                <select
                  name="fuelType"
                  className={errors.fuelType ? 'input-has-error' : ''}
                  value={formData.fuelType || (masterOptions.fuelTypes[0] || 'Petrol')}
                  onChange={handleChange}
                >
                  {(masterOptions.fuelTypes || []).map(ft => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </select>
                {errors.fuelType && <span className="field-error-text">{errors.fuelType}</span>}
              </div>

              <div className="form-group">
                <div className="form-label-header">
                  <label>
                    Status {carToEdit?.hasOngoingTrip && <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 600 }}>🔒 Locked</span>}
                  </label>
                </div>
                <select
                  name="status"
                  value={formData.status || 'available'}
                  onChange={handleChange}
                  disabled={carToEdit?.hasOngoingTrip}
                  style={carToEdit?.hasOngoingTrip ? { background: '#f8fafc', cursor: 'not-allowed', borderColor: '#fde68a' } : {}}
                  title={carToEdit?.hasOngoingTrip ? `Status is locked to "Rented" while trip ${carToEdit.ongoingBooking?.bookingReference || 'Active'} is ongoing.` : ''}
                >
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance / Service</option>
                  <option value="unavailable">Unavailable</option>
                </select>
                {carToEdit?.hasOngoingTrip && (
                  <span style={{ fontSize: '11px', color: '#b45309', display: 'block', marginTop: '3px' }}>
                    Trip Ref: {carToEdit.ongoingBooking?.bookingReference || 'Active'}. Must be completed in Bookings before status can be changed.
                  </span>
                )}
              </div>
            </div>

            {/* Row 4: Pricing & Capacity */}
            <div className="form-grid-3" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <div className="form-label-header">
                  <label>Price / Day (₹) <span className="req-star">*</span></label>
                </div>
                <input
                  type="number"
                  name="pricePerDay"
                  className={errors.pricePerDay ? 'input-has-error' : ''}
                  placeholder="e.g. 2000"
                  value={formData.pricePerDay || ''}
                  onChange={handleChange}
                />
                {errors.pricePerDay && <span className="field-error-text">{errors.pricePerDay}</span>}
              </div>

              <div className="form-group">
                <div className="form-label-header">
                  <label>Mileage (km/l)</label>
                </div>
                <input
                  type="text"
                  name="mileage"
                  placeholder="e.g. 15 km/l"
                  value={formData.mileage || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <div className="form-label-header">
                  <label>Seats <span className="req-star">*</span></label>
                </div>
                <input
                  type="number"
                  name="seats"
                  className={errors.seats ? 'input-has-error' : ''}
                  placeholder="5"
                  value={formData.seats || 5}
                  onChange={handleChange}
                />
                {errors.seats && <span className="field-error-text">{errors.seats}</span>}
              </div>
            </div>

            {/* 3. MULTI-PHOTO GALLERY (Min 1, Max 8 photos) */}
            <div style={{
              background: '#f8fafc',
              border: errors.images ? '1.5px solid #f87171' : '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              marginTop: '22px'
            }}>
              {errors.images && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaExclamationTriangle size={15} />
                  <span>{errors.images}</span>
                </div>
              )}
              {/* Photo Box Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaImage style={{ color: '#f96d00', fontSize: '16px' }} />
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      Vehicle Photos (1 to 8 Photos)
                    </h4>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      background: images.length === 0 ? '#fee2e2' : images.length === 8 ? '#ecfdf5' : '#ffedd5',
                      color: images.length === 0 ? '#b91c1c' : images.length === 8 ? '#047857' : '#c2410c'
                    }}>
                      {images.length} of 8 Photos {images.length === 0 && '• Min 1 Required'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Upload genuine photos of the vehicle from your device. The first photo is the <strong>Cover Photo</strong> shown on customer search cards.
                  </p>
                </div>

                {images.length < 8 && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f96d00',
                        color: '#fff',
                        border: 'none',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(249, 109, 0, 0.25)'
                      }}
                    >
                      <FaUpload size={12} /> Upload Photos ({8 - images.length} slots left)
                    </button>
                  </div>
                )}
              </div>

              {/* Drag & Drop Upload Zone (Shown when less than 8 photos) */}
              {images.length < 8 && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? '#f96d00' : '#cbd5e1'}`,
                    background: isDragging ? '#fff7ed' : '#ffffff',
                    borderRadius: '12px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <FaUpload size={22} style={{ color: isDragging ? '#f96d00' : '#94a3b8' }} />
                  <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>
                    Drag &amp; drop photos here, or click to browse
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Select JPG, PNG, or WEBP images • Maximum 8 photos ({8 - images.length} remaining)
                  </span>
                </div>
              )}

              {/* Gallery Grid */}
              {images.length === 0 ? (
                <div style={{
                  padding: '20px',
                  borderRadius: '10px',
                  background: '#fff',
                  border: '1px dashed #fca5a5',
                  textAlign: 'center',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  ⚠️ No vehicle photos uploaded yet. Click above to upload at least 1 photo.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '12px'
                }}>
                  {images.map((imgUrl, index) => {
                    const isPrimary = index === 0;
                    return (
                      <div
                        key={`${imgUrl}-${index}`}
                        style={{
                          position: 'relative',
                          aspectRatio: '16 / 10',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: isPrimary ? '2px solid #f96d00' : '1.5px solid #cbd5e1',
                          background: '#fff',
                          boxShadow: isPrimary ? '0 4px 12px rgba(249, 109, 0, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={`Vehicle photo ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />

                        {/* Top Cover / Index Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: isPrimary ? '#f96d00' : 'rgba(15, 23, 42, 0.75)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          zIndex: 2
                        }}>
                          {isPrimary ? <><FaStar size={10} /> Cover</> : `#${index + 1}`}
                        </div>

                        {/* Hover Overlay Actions */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.85))',
                          padding: '16px 8px 6px',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          gap: '6px',
                          zIndex: 2
                        }}>
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryCover(index)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                color: '#f59e0b',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="Set as Main Cover Photo"
                            >
                              <FaStar size={11} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Delete Photo"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add more button slot */}
                  {images.length < 8 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        aspectRatio: '16 / 10',
                        borderRadius: '10px',
                        border: '2px dashed #cbd5e1',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        color: '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                      title="Upload more photos"
                    >
                      <FaPlus size={16} color="#f96d00" />
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>Add Photo</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Features Checklist with (+) Button & Clean Card Layout */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <label style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                    Vehicle Features / Amenities
                  </label>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>
                    Select features included with this vehicle or click Add Feature to create a new master option.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenQuickAdd('features', 'Vehicle Feature')}
                  style={{
                    background: '#fff7ed',
                    color: '#f96d00',
                    border: '1px solid #fed7aa',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Add new Feature to master list"
                >
                  <FaPlus size={10} /> Add Feature
                </button>
              </div>

              <div className="features-selector">
                {(formData.features || []).map((feat, idx) => (
                  <div
                    key={feat.name || idx}
                    className={`feature-toggle-card ${feat.available ? 'active' : ''}`}
                    onClick={() => handleFeatureToggle(idx)}
                  >
                    <input
                      type="checkbox"
                      checked={!!feat.available}
                      onChange={() => { }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{feat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 32px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={submitting}>
              <FaTimes size={13} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={submitting}
              style={submitting ? { opacity: 0.85, cursor: 'wait', display: 'inline-flex', alignItems: 'center', gap: '8px' } : {}}
            >
              {submitting ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  <span>{carToEdit ? 'Updating Vehicle...' : 'Creating Vehicle...'}</span>
                </>
              ) : (
                <>
                  <FaCheck size={14} />
                  <span>{carToEdit ? 'Update Vehicle' : 'Create Vehicle'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* QUICK ADD MASTER ITEM MODAL OVERLAY */}
        {quickAddModal.isOpen && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                  ✨ Add New {quickAddModal.label}
                </strong>
                <button
                  type="button"
                  onClick={() => setQuickAddModal({ isOpen: false, category: '', label: '', value: '' })}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <form onSubmit={handleQuickAddSubmit} style={{ padding: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {quickAddModal.label} Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. Enter new ${quickAddModal.label.toLowerCase()}...`}
                    value={quickAddModal.value}
                    onChange={(e) => setQuickAddModal(p => ({ ...p, value: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                    autoFocus
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    This will be added to your Master Setup and selected immediately.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setQuickAddModal({ isOpen: false, category: '', label: '', value: '' })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickAdding || !quickAddModal.value.trim()}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      background: '#f96d00',
                      color: '#fff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: quickAdding ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaPlus size={11} /> {quickAdding ? 'Saving...' : 'Save & Select'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
