import { useState } from 'react';
import { 
  FaUserShield, 
  FaLock, 
  FaEnvelope, 
  FaEye, 
  FaEyeSlash, 
  FaArrowRight, 
  FaCar, 
  FaShieldAlt 
} from 'react-icons/fa';

export default function AdminLoginScreen({ onLogin, error, loading, settings }) {
  const [identifier, setIdentifier] = useState(() => localStorage.getItem('rememberedAdminIdentifier') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedAdminIdentifier'));
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    onLogin({ 
      email: identifier.trim(), 
      username: identifier.trim(), 
      password,
      rememberMe
    });
  };

  return (
    <div className="admin-login-page-root">
      {/* Background Ambience */}
      <div className="admin-login-backdrop">
        <div className="admin-login-ambient-glow glow-1"></div>
        <div className="admin-login-ambient-glow glow-2"></div>
      </div>

      <div className="admin-login-card">
        {/* Top Brand & Badge */}
        <div className="admin-login-brand">
          <div className="admin-login-logo-badge">
            <FaCar className="admin-car-icon" />
            <div className="admin-shield-icon-badge">
              <FaUserShield />
            </div>
          </div>
          <h1 className="admin-login-title">{settings?.businessName || 'CarBook'} Admin Portal</h1>
          <p className="admin-login-subtitle">
            Executive control console for fleet management, driver dispatch &amp; billing
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="admin-login-error-alert" role="alert">
            <FaShieldAlt style={{ fontSize: '16px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="admin-email-field">
              Admin Email or Username
            </label>
            <div className="admin-input-wrapper">
              <FaEnvelope className="admin-input-icon" />
              <input
                id="admin-email-field"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email or username"
                required
                autoComplete="username"
                className="admin-login-input"
              />
            </div>
          </div>

          <div className="admin-input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="admin-input-label" htmlFor="admin-password-field">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="admin-toggle-pwd-btn"
                tabIndex="-1"
              >
                {showPassword ? <><FaEyeSlash /> Hide</> : <><FaEye /> Show</>}
              </button>
            </div>
            <div className="admin-input-wrapper">
              <FaLock className="admin-input-icon" />
              <input
                id="admin-password-field"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="admin-login-input"
              />
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="admin-remember-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px', userSelect: 'none' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <span>Remember me</span>
            </label>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>30-day session</span>
          </div>

          <button
            type="submit"
            className="admin-login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                Authenticating Super Admin...
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Sign In to Console <FaArrowRight style={{ fontSize: '13px' }} />
              </span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="admin-login-footer">
          <span>🔒 256-Bit Encrypted Admin Session</span>
          <span>•</span>
          <span>{settings?.businessName || 'A3 Car Rentals'} Admin Console</span>
        </div>
      </div>
    </div>
  );
}
