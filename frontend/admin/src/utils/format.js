import React from 'react';

// DD-MM-YYYY Date and Indian Rupee Currency Formatting Utilities

export function formatDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
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
