import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { renderBrandName } from '../utils/format';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function Login() {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);

    try {
      const res = await loginUser({ 
        email: email.trim().toLowerCase(), 
        password,
        rememberMe
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard?tab=overview');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left" style={{ backgroundImage: `url('/images/bg_1.jpg')` }}>
          <div className="auth-left-overlay"></div>
          <div className="auth-left-content">
            <div className="auth-logo">
              <FaCar size={32} />
              <span>{renderBrandName(settings?.businessName || 'CarBook')}</span>
            </div>
            <h2>Welcome Back!</h2>
            <p>Log in to access your dashboard, view available cars, and manage your bookings.</p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Browse premium vehicles &amp; tyres
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Instant online booking &amp; reservations
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Live trip status, driver details &amp; invoices
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h1>Sign In</h1>
              <p>Log in with your Email, Mobile Number, or Google</p>
            </div>

            {error && (
              <div className="auth-error" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                lineHeight: 1.4,
                marginBottom: '16px'
              }}>
                <FiAlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                <div>
                  <strong>Authentication Failed:</strong> {error}
                  {error.toLowerCase().includes('password') && (
                    <div style={{ marginTop: '4px' }}>
                      <Link to="/confirm-password" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'underline' }}>
                        Reset your password here →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Google One-Click Login */}
            <div style={{ marginBottom: '16px' }}>
              <GoogleAuthButton 
                onSuccess={() => navigate('/dashboard?tab=overview')}
                onError={(msg) => setError(msg)}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '16px 0',
              color: '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Or sign in with password
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            </div>

            <form noValidate onSubmit={handleSubmit} className="auth-form">
              {/* Email Address */}
              <div className="auth-input-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <FiMail className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={fieldErrors.email ? 'input-error' : ''}
                  />
                </div>
                {fieldErrors.email && (
                  <span className="field-error-text">⚠ {fieldErrors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label htmlFor="login-password">Password</label>
                  <Link to="/confirm-password" state={{ email }} className="auth-forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrapper">
                  <FiLock className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className={fieldErrors.password ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span className="field-error-text">⚠ {fieldErrors.password}</span>
                )}
              </div>

              {/* Remember Me Option */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0 16px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#475569', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#f96d00', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Keep me signed in for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <div className="auth-btn-spinner"></div>
                ) : (
                  <>Sign In <FiArrowRight /></>
                )}
              </button>
            </form>

            <div className="auth-switch">
              Don't have an account?{' '}
              <Link to="/signup">Create Account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
