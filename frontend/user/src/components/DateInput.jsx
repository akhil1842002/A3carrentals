import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { formatDate, parseDisplayDate, formatDateInput } from '../utils/format';

/**
 * DateInput component that strictly displays date in DD-MM-YYYY format
 * inside the input field while providing a native calendar picker dialog.
 */
export default function DateInput({
  value = '',
  onChange,
  min,
  max,
  name,
  id,
  className = '',
  placeholder = 'DD-MM-YYYY',
  disabled = false,
  required = false,
  style = {}
}) {
  // value is expected in YYYY-MM-DD
  const [displayValue, setDisplayValue] = useState(() => formatDate(value));
  const hiddenDateRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setDisplayValue(formatDate(value));
  }, [value]);

  const handleNativeDateChange = (e) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    setDisplayValue(formatDate(isoVal));
    if (onChange) {
      onChange({
        target: { name: name || id, value: isoVal },
        currentTarget: { name: name || id, value: isoVal }
      });
    }
  };

  const handleOpenPicker = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (disabled) return;
    if (hiddenDateRef.current) {
      try {
        if (typeof hiddenDateRef.current.showPicker === 'function') {
          hiddenDateRef.current.showPicker();
        } else {
          hiddenDateRef.current.focus();
        }
      } catch (err) {
        hiddenDateRef.current.focus();
      }
    }
  };

  const handleTextInputChange = (e) => {
    const raw = e.target.value;
    const formatted = formatDateInput(raw);
    setDisplayValue(formatted);

    if (!formatted) {
      if (onChange) {
        onChange({
          target: { name: name || id, value: '' },
          currentTarget: { name: name || id, value: '' }
        });
      }
      return;
    }

    // If fully formatted DD-MM-YYYY (10 characters)
    if (formatted.length === 10) {
      const iso = parseDisplayDate(formatted);
      if (iso && onChange) {
        onChange({
          target: { name: name || id, value: iso },
          currentTarget: { name: name || id, value: iso }
        });
      }
    }
  };

  const handleBlur = () => {
    if (displayValue && displayValue.length < 10) {
      setDisplayValue(formatDate(value));
    }
  };

  const handleKeyDown = (e) => {
    if ((e.altKey && e.key === 'ArrowDown') || e.key === 'Enter') {
      handleOpenPicker(e);
    }
  };

  return (
    <div
      className="custom-date-input-wrap"
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={handleTextInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`custom-date-display-field ${className || ''}`}
        style={{
          width: '100%',
          paddingRight: '42px',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.4px',
          ...style
        }}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={handleOpenPicker}
        disabled={disabled}
        className="custom-date-icon-trigger"
        title="Open calendar (DD-MM-YYYY)"
        aria-label="Open calendar"
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary, #f96d00)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          borderRadius: '6px',
          transition: 'transform 0.15s, opacity 0.15s',
          zIndex: 1
        }}
      >
        <FiCalendar size={18} />
      </button>

      {/* Invisible native date picker for browser popup */}
      <input
        ref={hiddenDateRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value || ''}
        min={min}
        max={max}
        disabled={disabled}
        onChange={handleNativeDateChange}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '28px',
          height: '28px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
          border: 'none',
          padding: 0,
          margin: 0
        }}
      />
    </div>
  );
}
