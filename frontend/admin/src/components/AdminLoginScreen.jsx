import { useState } from 'react';
import { 
  FaUserShield, 
  FaLock, 
  FaEnvelope, 
  FaEye, 
  FaEyeSlash, 
  FaKey, 
  FaArrowRight, 
  FaCar, 
  FaShieldAlt 
} from 'react-icons/fa';

export default function AdminLoginScreen({ onLogin, error, loading, settings }) {
  const [identifier, setIdentifier] = useState('admin@carbook.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    onLogin({ 
      email: identifier.trim(), 
      username: identifier.trim(), 
      password 
    });
  };

  const handleUseDemo = (type = 'email') => {
    const emailVal = type === 'email' ? 'admin@carbook.com' : 'admin';
    setIdentifier(emailVal);
    setPassword('admin123');
    onLogin({ 
      email: emailVal, 
      username: emailVal, 
      password: 'admin123' 
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
                placeholder="admin@carbook.com or admin"
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="admin-login-input"
              />
            </div>
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

        {/* Quick Credentials / Demo Helper */}
        <div className="admin-credentials-helper">
          <div className="admin-credentials-header">
            <FaKey style={{ color: '#f96d00' }} />
            <span>Default Super Admin Credentials</span>
          </div>

          <div className="admin-cred-row">
            <span className="cred-label">Email:</span>
            <code className="cred-code">admin@carbook.com</code>
          </div>
          <div className="admin-cred-row">
            <span className="cred-label">Username:</span>
            <code className="cred-code">admin</code>
          </div>
          <div className="admin-cred-row">
            <span className="cred-label">Password:</span>
            <code className="cred-code">admin123</code>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => handleUseDemo('email')}
              className="admin-quick-autofill-btn"
            >
              Sign In with Email →
            </button>
            <button
              type="button"
              onClick={() => handleUseDemo('username')}
              className="admin-quick-autofill-btn secondary"
            >
              Sign In with Username →
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="admin-login-footer">
          <span>🔒 256-Bit Encrypted Admin Session</span>
          <span>•</span>
          <span>{settings?.businessName || 'CarBook'} SuperAdmin v2.4</span>
        </div>
      </div>
    </div>
  );
}
