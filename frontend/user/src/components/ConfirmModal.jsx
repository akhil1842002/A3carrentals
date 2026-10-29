import React, { useEffect } from 'react';
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';

export default function ConfirmModal({
  isOpen,
  title = 'Please Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  isAlert = false, // If true, only shows 1 button (OK / Dismiss)
  onConfirm,
  onCancel,
  loading = false
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel && onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const iconMap = {
    warning: <FiAlertTriangle className="modal-icon-warning" size={28} />,
    danger: <FiAlertTriangle className="modal-icon-danger" size={28} />,
    info: <FiInfo className="modal-icon-info" size={28} />,
    success: <FiCheckCircle className="modal-icon-success" size={28} />
  };

  const getHeaderBg = () => {
    switch (variant) {
      case 'danger':
        return '#fef2f2';
      case 'warning':
        return '#fffbeb';
      case 'success':
        return '#f0fdf4';
      default:
        return '#f8fafc';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#10b981';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={() => {
        if (!loading) onCancel && onCancel();
      }}
    >
      <div
        className="cb-confirm-dialog"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon + Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '18px 22px',
            backgroundColor: getHeaderBg(),
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div
            style={{
              color: getIconColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              flexShrink: 0
            }}
          >
            {iconMap[variant] || iconMap.warning}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {title}
            </h3>
          </div>
          {!loading && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                padding: '4px',
                borderRadius: '6px'
              }}
              aria-label="Close"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Message Body */}
        <div style={{ padding: '20px 22px', color: '#475569', fontSize: '0.95rem', lineHeight: '1.55' }}>
          {message}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '14px 22px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0'
          }}
        >
          {!isAlert && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: variant === 'danger' ? '#ef4444' : '#f96d00',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: variant === 'danger' ? '0 4px 12px rgba(239, 68, 68, 0.35)' : '0 4px 12px rgba(249, 109, 0, 0.35)',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
