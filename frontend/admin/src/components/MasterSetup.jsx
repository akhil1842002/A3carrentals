import { useState, useEffect, useRef } from 'react';
import {
  FaSlidersH, FaCar, FaGasPump, FaTag, FaCheck,
  FaPlus, FaEdit, FaTrash, FaUndo, FaSearch, FaTimes,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import {
  getFleetMaster,
  updateFleetMaster,
  quickAddFleetMasterItem,
  editFleetMasterItem,
  deleteFleetMasterItem
} from '../api';

const DEFAULT_FLEET_MASTER = {
  brands: [
    'Toyota', 'Mahindra', 'Hyundai', 'Maruti Suzuki', 'Tata', 'Honda',
    'Kia', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen',
    'Skoda', 'Renault', 'Nissan'
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
};

const CATEGORIES = [
  { id: 'brands', label: 'Vehicle Brands', singular: 'Brand', icon: <FaTag />, desc: 'Car manufacturers and makers available in your fleet (e.g. Toyota, Mahindra, Hyundai)' },
  { id: 'vehicleTypes', label: 'Vehicle Types', singular: 'Vehicle Type', icon: <FaCar />, desc: 'Body styles and fleet categories (e.g. Sedan, SUV, MUV, Hatchback)' },
  { id: 'fuelTypes', label: 'Fuel Types', singular: 'Fuel Type', icon: <FaGasPump />, desc: 'Engine and powertrain energy sources (e.g. Petrol, Diesel, Electric, CNG)' },
  { id: 'features', label: 'Vehicle Features', singular: 'Feature', icon: <FaSlidersH />, desc: 'Cabin amenities, safety, and tech options displayed on vehicle detail cards' }
];

export default function MasterSetup({ onMasterUpdated }) {
  const [activeCategory, setActiveCategory] = useState('brands');
  const [masterData, setMasterData] = useState(DEFAULT_FLEET_MASTER);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const inputRef = useRef(null);

  // Edit Item Modal State
  const [editModal, setEditModal] = useState({
    isOpen: false,
    category: '',
    oldName: '',
    newName: ''
  });

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: null,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: null
  });

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const res = await getFleetMaster();
      if (res.data) {
        setMasterData(res.data);
        if (onMasterUpdated) onMasterUpdated(res.data);
      }
    } catch (err) {
      console.error('Failed to load fleet master:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  const handleAddItem = async (e) => {
    e?.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      showNotification('error', `⚠️ Please type a ${currentCategoryObj.singular.toLowerCase()} name into the input field first!`);
      return;
    }

    const currentList = masterData[activeCategory] || [];
    if (currentList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      showNotification('error', `⚠️ "${trimmed}" already exists in ${currentCategoryObj.label}!`);
      return;
    }

    setSaving(true);
    try {
      const res = await quickAddFleetMasterItem(activeCategory, trimmed);
      if (res.data?.items) {
        const updated = { ...masterData, [activeCategory]: res.data.items };
        setMasterData(updated);
        if (onMasterUpdated) onMasterUpdated(updated);
        try {
          window.dispatchEvent(new CustomEvent('fleetMasterUpdated', { detail: updated }));
        } catch (e) {}
        setNewItemName('');
        showNotification('success', `✅ "${trimmed}" added to ${currentCategoryObj.label} successfully!`);
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to add master item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = (item) => {
    const categoryLabel = currentCategoryObj.singular;
    setConfirmModal({
      isOpen: true,
      title: `Delete ${categoryLabel}?`,
      message: (
        <>
          Are you sure you want to delete <strong style={{ color: '#0f172a' }}>"{item}"</strong> from <strong style={{ color: '#0f172a' }}>{currentCategoryObj.label}</strong>? This action cannot be undone.
        </>
      ),
      confirmText: `Delete ${categoryLabel}`,
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await deleteFleetMasterItem(activeCategory, item);
          if (res.data?.items) {
            const updated = { ...masterData, [activeCategory]: res.data.items };
            setMasterData(updated);
            if (onMasterUpdated) onMasterUpdated(updated);
            try {
              window.dispatchEvent(new CustomEvent('fleetMasterUpdated', { detail: updated }));
            } catch (e) {}
            showNotification('success', `🗑️ "${item}" removed from ${currentCategoryObj.label}.`);
          }
        } catch (err) {
          showNotification('error', err.response?.data?.message || 'Failed to delete item');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleOpenEdit = (item) => {
    setEditModal({
      isOpen: true,
      category: activeCategory,
      oldName: item,
      newName: item
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const cleanNew = editModal.newName.trim();
    if (!cleanNew) return;
    if (cleanNew.toLowerCase() === editModal.oldName.toLowerCase()) {
      setEditModal({ isOpen: false, category: '', oldName: '', newName: '' });
      return;
    }

    try {
      const res = await editFleetMasterItem(editModal.category, editModal.oldName, cleanNew);
      if (res.data?.items) {
        const updated = { ...masterData, [editModal.category]: res.data.items };
        setMasterData(updated);
        if (onMasterUpdated) onMasterUpdated(updated);
        try {
          window.dispatchEvent(new CustomEvent('fleetMasterUpdated', { detail: updated }));
        } catch (e) {}
        showNotification('success', `✏️ Renamed "${editModal.oldName}" to "${cleanNew}".`);
      }
      setEditModal({ isOpen: false, category: '', oldName: '', newName: '' });
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to edit item');
    }
  };

  const handleResetCategoryDefaults = () => {
    const activeObj = CATEGORIES.find(c => c.id === activeCategory);
    setConfirmModal({
      isOpen: true,
      title: `Reset ${activeObj?.label || 'Items'} to Defaults?`,
      message: (
        <>
          This will restore the standard factory list for <strong style={{ color: '#0f172a' }}>{activeObj?.label}</strong> and replace any custom modifications you've made.
        </>
      ),
      confirmText: 'Reset Defaults',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        const updated = {
          ...masterData,
          [activeCategory]: DEFAULT_FLEET_MASTER[activeCategory]
        };

        try {
          await updateFleetMaster(updated);
          setMasterData(updated);
          if (onMasterUpdated) onMasterUpdated(updated);
          try {
            window.dispatchEvent(new CustomEvent('fleetMasterUpdated', { detail: updated }));
          } catch (e) {}
          showNotification('success', `🔄 ${activeObj?.label} reset to standard defaults.`);
        } catch (err) {
          showNotification('error', 'Failed to reset defaults');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentCategoryObj = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
  const items = masterData[activeCategory] || [];
  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="master-setup-root" style={{ padding: '0 0 40px' }}>
      {/* Top Header Bar */}
      <div className="module-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            ⚙️ Fleet Attributes Master Setup
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Manage the master options for Brands, Vehicle Types, Fuel Types, and Features. Any changes made here are immediately reflected across the Vehicle Manager and customer rental filters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetCategoryDefaults}
          style={{
            padding: '9px 16px',
            background: '#fff',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Restore standard fleet defaults for active category"
        >
          <FaUndo size={11} /> Reset Defaults
        </button>
      </div>

      {statusMsg.text && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: statusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
            border: statusMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca'
          }}
        >
          {statusMsg.type === 'success' ? <FaCheckCircle size={18} /> : <FaExclamationTriangle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div
        className="editor-subnav-tabs"
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: '4px 0'
        }}
      >
        {CATEGORIES.map(cat => {
          const count = (masterData[cat.id] || []).length;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
                setNewItemName('');
              }}
              style={{
                padding: '12px 22px',
                borderRadius: '12px',
                border: isActive ? '2px solid #f96d00' : '1px solid #cbd5e1',
                background: isActive ? '#ffffff' : '#f8fafc',
                color: isActive ? '#f96d00' : '#1e293b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? '0 4px 14px rgba(249, 109, 0, 0.16)' : '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ color: isActive ? '#f96d00' : '#64748b', fontSize: '15px' }}>{cat.icon}</span>
              <span>{cat.label}</span>
              <span style={{
                background: isActive ? '#fff7ed' : '#e2e8f0',
                color: isActive ? '#c2410c' : '#475569',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11.5px',
                fontWeight: 700,
                border: isActive ? '1px solid #fed7aa' : '1px solid #cbd5e1'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Category Content Box */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentCategoryObj.icon}
              <span>Manage {currentCategoryObj.label}</span>
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              {currentCategoryObj.desc}
            </p>
          </div>

          {/* Quick Add Bar */}
          <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '8px', minWidth: '320px', flexWrap: 'wrap' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder={`Add new ${currentCategoryObj.singular.toLowerCase()}...`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #f96d00 0%, #ea580c 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
                opacity: 1,
                boxShadow: '0 3px 10px rgba(249, 109, 0, 0.3)',
                transition: 'all 0.15s ease'
              }}
              title={`Click to add new ${currentCategoryObj.singular.toLowerCase()}`}
            >
              <FaPlus size={11} /> {saving ? 'Adding...' : `Add ${currentCategoryObj.singular}`}
            </button>
          </form>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '18px', position: 'relative', maxWidth: '380px' }}>
          <FaSearch size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder={`Search ${currentCategoryObj.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              background: '#f8fafc',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div style={{ background: '#f8fafc', padding: '36px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: 700, fontSize: '14px' }}>
              No {currentCategoryObj.label.toLowerCase()} found
            </p>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
              {searchQuery ? `No matches for "${searchQuery}".` : `Add your first ${currentCategoryObj.singular.toLowerCase()} above.`}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px'
          }}>
            {filteredItems.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#f96d00',
                    flexShrink: 0
                  }} />
                  <strong style={{ fontSize: '13.5px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item}>
                    {item}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '6px 9px',
                      color: '#2563eb',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Rename "${item}"`}
                  >
                    <FaEdit size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      padding: '6px 9px',
                      color: '#dc2626',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Delete "${item}"`}
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RENAME / EDIT ITEM MODAL */}
      {editModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
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
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                ✏️ Edit Item Name
              </h4>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, category: '', oldName: '', newName: '' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={editModal.newName}
                  onChange={(e) => setEditModal(p => ({ ...p, newName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, category: '', oldName: '', newName: '' })}
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
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: '#f96d00',
                    color: '#fff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FaCheck size={12} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '430px',
              width: '100%',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: confirmModal.type === 'danger' ? '#fee2e2' : '#fef3c7',
                color: confirmModal.type === 'danger' ? '#ef4444' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '22px'
              }}>
                {confirmModal.type === 'danger' ? <FaTrash size={22} /> : <FaUndo size={22} />}
              </div>

              <h4 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {confirmModal.title}
              </h4>
              <div style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.55' }}>
                {confirmModal.message}
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: '#475569',
                  border: '1.5px solid #cbd5e1',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1,
                  padding: '11px 20px',
                  borderRadius: '10px',
                  background: confirmModal.type === 'danger'
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #f96d00 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: confirmModal.type === 'danger'
                    ? '0 4px 14px rgba(239, 68, 68, 0.35)'
                    : '0 4px 14px rgba(249, 109, 0, 0.35)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {confirmModal.type === 'danger' ? <FaTrash size={12} /> : <FaCheck size={13} />}
                <span>{confirmModal.confirmText || 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
