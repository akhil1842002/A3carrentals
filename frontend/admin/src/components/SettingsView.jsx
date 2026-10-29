import { useState, useEffect } from 'react';
import { FaCog, FaSave, FaCheck, FaExclamationTriangle, FaUserTie, FaPhone, FaDollarSign } from 'react-icons/fa';
import { getSettings, updateSettings } from '../api';

export default function SettingsView({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    businessName: '',
    tagline: '',
    currency: 'USD',
    currencySymbol: '$',
    taxRatePercent: 8,
    driverDailyFee: 35,
    standardShippingFee: 15,
    freeShippingThreshold: 200,
    supportEmail: '',
    supportPhone: '',
    whatsappNumber: '',
    operatingHours: '',
    hubAddress: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      if (res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await updateSettings(settings);
      setSettings(res.data);
      if (onSettingsUpdated) {
        onSettingsUpdated(res.data);
      }
      try {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: res.data }));
      } catch (e) {}
      setStatusMsg({ type: 'success', text: '✅ Business settings saved successfully!' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Save settings error:', err);
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="settings-view-root">
      <div className="settings-header">
        <div>
          <h2>Platform &amp; Business Settings</h2>
          <p>Configure pricing rules, Indian Rupee currency (₹), driver fees, and contact details. Changes immediately update the customer portal header, footer, contact page, and WhatsApp concierge.</p>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`settings-alert ${statusMsg.type}`}>
          {statusMsg.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        {/* Section 1: Business Identity */}
        <div className="settings-card">
          <div className="settings-card-title">
            <FaCog /> General Business Identity
          </div>
          <div className="settings-grid">
            <div className="settings-field">
              <label>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={settings.businessName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="settings-field">
              <label>Tagline / Motto</label>
              <input
                type="text"
                name="tagline"
                value={settings.tagline}
                onChange={handleChange}
              />
            </div>
            <div className="settings-field">
              <label>Operating Hours</label>
              <input
                type="text"
                name="operatingHours"
                value={settings.operatingHours}
                onChange={handleChange}
              />
            </div>
            <div className="settings-field">
              <label>Main Hub / Showroom Address</label>
              <input
                type="text"
                name="hubAddress"
                value={settings.hubAddress}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Currency & Rental Policies */}
        <div className="settings-card">
          <div className="settings-card-title">
            <FaDollarSign /> Currency, Fees &amp; Deposits
          </div>
          <div className="settings-grid">
            <div className="settings-field">
              <label>Currency Code</label>
              <input
                type="text"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                placeholder="USD, EUR, INR"
                required
              />
            </div>
            <div className="settings-field">
              <label>Currency Symbol</label>
              <input
                type="text"
                name="currencySymbol"
                value={settings.currencySymbol}
                onChange={handleChange}
                placeholder="$, €, ₹"
                required
              />
            </div>
            <div className="settings-field">
              <label>Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="taxRatePercent"
                value={settings.taxRatePercent}
                onChange={handleChange}
              />
            </div>
            <div className="settings-field">
              <label>Driver Daily Surcharge ({settings.currencySymbol})</label>
              <input
                type="number"
                step="1"
                min="0"
                name="driverDailyFee"
                value={settings.driverDailyFee}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contact & WhatsApp */}
        <div className="settings-card">
          <div className="settings-card-title">
            <FaPhone /> Customer Support &amp; WhatsApp Notifications
          </div>
          <div className="settings-grid">
            <div className="settings-field">
              <label>Support Email</label>
              <input
                type="email"
                name="supportEmail"
                value={settings.supportEmail}
                onChange={handleChange}
              />
            </div>
            <div className="settings-field">
              <label>Support Phone Number</label>
              <input
                type="text"
                name="supportPhone"
                value={settings.supportPhone}
                onChange={handleChange}
              />
            </div>
            <div className="settings-field">
              <label>Official WhatsApp Number (Country code + phone digits)</label>
              <input
                type="text"
                name="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={handleChange}
                placeholder="e.g. 917397098447 or +91 73970 98447"
              />
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn-save-settings" disabled={saving}>
            <FaSave /> {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
