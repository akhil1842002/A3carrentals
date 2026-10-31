import React from 'react';

// DD-MM-YYYY Date and Indian Rupee Currency Formatting Utilities

export function formatDate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // Pure YYYY-MM-DD string: parse directly to avoid timezone day-shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}-${m}-${y}`;
    }
    // Already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function parseDisplayDate(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    const dNum = parseInt(day, 10);
    const mNum = parseInt(month, 10);
    const yNum = parseInt(year, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31 && yNum >= 1900 && yNum <= 2100) {
      const testDate = new Date(yNum, mNum - 1, dNum);
      if (testDate.getFullYear() === yNum && testDate.getMonth() === mNum - 1 && testDate.getDate() === dNum) {
        return `${year}-${month}-${day}`;
      }
    }
  }
  return '';
}

export function formatDateTime(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function formatCurrency(amount, symbol = '₹') {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString('en-IN')}`;
}

export function renderBrandName(name = 'CarBook') {
  if (!name) {
    return React.createElement(React.Fragment, null, 'Car', React.createElement('span', { className: 'accent' }, 'Book'));
  }
  const trimmed = String(name).trim();
  if (trimmed.includes(' ')) {
    const parts = trimmed.split(' ');
    const first = parts[0];
    const rest = parts.slice(1).join(' ');
    return React.createElement(React.Fragment, null, first, ' ', React.createElement('span', { className: 'accent' }, rest));
  }
  const match = trimmed.match(/^([A-Z][a-z0-9]+)([A-Z].*)$/);
  if (match) {
    return React.createElement(React.Fragment, null, match[1], React.createElement('span', { className: 'accent' }, match[2]));
  }
  return React.createElement(React.Fragment, null, trimmed);
}
