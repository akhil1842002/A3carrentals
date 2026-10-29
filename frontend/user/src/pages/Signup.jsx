import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail,
  FiLock,
  FiUser,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiShield,
  FiKey
} from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';
import { registerUser, verifySignupOtp, resendSignupOtp } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { renderBrandName } from '../utils/format';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function Signup() {
  const { settings } = useSettings();
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verify Email OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP state
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '#e9ecef', width: '0%' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444', width: '25%' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#F59E0B', width: '50%' };
    if (score === 3) return { score: 3, label: 'Good', color: '#3B82F6', width: '75%' };
    return { score: 4, label: 'Strong', color: '#10B981', width: '100%' };
  }, [password]);

  // Real-time password confirmation check
  const confirmState = useMemo(() => {
    if (!confirmPassword) return 'empty';
    if (confirmPassword === password) return 'match';
    return 'mismatch';
  }, [password, confirmPassword]);

  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Full legal name is required.';
    }
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!phone.trim()) {
      errs.phone = 'Mobile number is compulsory.';
    } else if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(phone.trim().replace(/[\s\-\(\)]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirming your password is required.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    if (!agreeTerms) {
      errs.agreeTerms = 'You must agree to the Terms of Service to create an account.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1: Request Registration OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');

    setLoading(true);
    try {
      const res = await registerUser({ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        phone: phone.trim(), 
        password 
      });

      if (res.data.requiresOtp) {
        if (res.data.devOtp) setDevOtp(res.data.devOtp);
        setInfoMsg(res.data.message || `A 6-digit verification code has been dispatched to ${email}`);
        setStep(2);
      } else {
        setSuccess(true);
        login(res.data.token, res.data.user);
        setTimeout(() => {
          navigate('/dashboard?tab=overview');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit Email OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await verifySignupOtp({ 
        email: email.trim().toLowerCase(), 
        otp: cleanOtp 
      });
      setSuccess(true);
      login(res.data.token, res.data.user);
      setTimeout(() => {
        navigate('/dashboard?tab=overview');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const res = await resendSignupOtp({ email: email.trim().toLowerCase() });
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      setInfoMsg(res.data.message || 'Fresh verification code dispatched to your email.');
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Branding Showcase */}
        <div className="auth-left" style={{ backgroundImage: `url('/images/bg_3.jpg')` }}>
          <div className="auth-left-overlay"></div>
          <div className="auth-left-content">
            <div className="auth-logo">
              <FaCar size={32} />
              <span>{renderBrandName(settings?.businessName || 'CarBook')}</span>
            </div>
            <h2>Join {settings?.businessName || 'CarBook'} Today</h2>
            <p>Create your account in seconds to browse real-time available cars and book your next drive with ease.</p>
            
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Instant access to 50+ premium vehicles
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Real-time available & unavailable fleet tags
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Zero booking fees with instant WhatsApp confirmation
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Free cancellation up to 24 hours before pickup
              </div>
            </div>

            <div className="auth-trust-badge">
              <FiShield size={20} />
              <div>
                <strong>Secure &amp; Verified</strong>
                <span>256-Bit SSL Encrypted Reservations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            {success ? (
              <div className="auth-success-card">
                <div className="auth-success-icon">
                  <FiCheckCircle size={56} />
                </div>
                <h2>Account Created! 🎉</h2>
                <p>Welcome to {settings?.businessName || 'CarBook'}, <strong>{name}</strong>! Your account has been verified and created successfully.</p>
                <div className="auth-success-spinner">
                  <div className="auth-btn-spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
                  <span>Redirecting to your car booking dashboard...</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/dashboard')}
                  style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                >
                  Go to Dashboard Now <FiArrowRight />
                </button>
              </div>
            ) : step === 2 ? (
              <>
                <div className="auth-form-header">
                  <div className="auth-header-icon-pill" style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#fff7ed',
                    border: '2px solid #fdba74',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#f96d00'
                  }}>
                    <FiMail size={26} />
                  </div>
                  <h1>Verify Your Email</h1>
                  <p>
                    We sent a 6-digit verification code to <br />
                    <strong style={{ color: '#0f172a' }}>{email}</strong>
                  </p>
                </div>

                {error && (
                  <div className="auth-error">
                    <span>⚠</span> {error}
                  </div>
                )}

                {infoMsg && (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    marginBottom: '16px'
                  }}>
                    ✓ {infoMsg}
                  </div>
                )}

                {devOtp && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.82rem', color: '#92400e' }}>
                      ⚡ <strong>Testing OTP:</strong> {devOtp}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtp)}
                      style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f96d00', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Autofill Code
                    </button>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
                  <div className="auth-input-group">
                    <label htmlFor="signup-otp">6-Digit Verification Code</label>
                    <div className="auth-input-wrapper">
                      <FiLock className="auth-input-icon" />
                      <input
                        id="signup-otp"
                        type="text"
                        maxLength="6"
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        style={{ letterSpacing: '6px', fontSize: '1.25rem', fontWeight: 800, textAlign: 'center' }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="auth-submit-btn" 
                    disabled={loading || otp.length < 6}
                    style={{
                      opacity: otp.length < 6 ? 0.6 : 1,
                      cursor: otp.length < 6 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? <div className="auth-btn-spinner"></div> : <>Verify &amp; Create Account <FiArrowRight /></>}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.84rem' }}>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(''); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
                    >
                      ← Edit Details
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || resending}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? '#94a3b8' : '#f96d00',
                        cursor: resendCooldown > 0 ? 'default' : 'pointer',
                        fontWeight: 700
                      }}
                    >
                      {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="auth-form-header">
                  <h1>Create Account</h1>
                  <p>Register with Google or fill out your contact details</p>
                </div>

                {/* Google One-Click Quick Signup */}
                <div style={{ marginBottom: '16px' }}>
                  <GoogleAuthButton 
                    text="Sign up with Google"
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
                    Or register with email &amp; mobile
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                </div>

                {error && (
                  <div className="auth-error">
                    <span>⚠</span> {error}
                  </div>
                )}

                <form noValidate onSubmit={handleSubmit} className="auth-form">
                  {/* Full Name */}
                  <div className="auth-input-group">
                    <label htmlFor="signup-name">Full Name *</label>
                    <div className="auth-input-wrapper">
                      <FiUser className="auth-input-icon" />
                      <input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' }));
                        }}
                        className={fieldErrors.name ? 'input-error' : ''}
                      />
                    </div>
                    {fieldErrors.name && (
                      <span className="field-error-text">⚠ {fieldErrors.name}</span>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="auth-input-group">
                    <label htmlFor="signup-email">Email Address *</label>
                    <div className="auth-input-wrapper">
                      <FiMail className="auth-input-icon" />
                      <input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: '' }));
                        }}
                        className={fieldErrors.email ? 'input-error' : ''}
                      />
                    </div>
                    {fieldErrors.email && (
                      <span className="field-error-text">⚠ {fieldErrors.email}</span>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="auth-input-group">
                    <label htmlFor="signup-phone">Phone Number *</label>
                    <div className="auth-input-wrapper">
                      <FiPhone className="auth-input-icon" />
                      <input
                        id="signup-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        className={fieldErrors.phone ? 'input-error' : ''}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                        }}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <span className="field-error-text">⚠ {fieldErrors.phone}</span>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="auth-input-group">
                    <div className="auth-label-row">
                      <label htmlFor="signup-pw">Password *</label>
                      {password && (
                        <span
                          className="auth-strength-text"
                          style={{ color: passwordStrength.color }}
                        >
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                    <div className="auth-input-wrapper">
                      <FiLock className="auth-input-icon" />
                      <input
                        id="signup-pw"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: '' }));
                        }}
                        className={fieldErrors.password ? 'input-error' : ''}
                      />
                      <button
                        type="button"
                        className="auth-toggle-pw"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <span className="field-error-text">⚠ {fieldErrors.password}</span>
                    )}

                    {/* Password strength progress bar */}
                    {password && (
                      <div className="auth-strength-bar-bg">
                        <div
                          className="auth-strength-bar-fill"
                          style={{
                            width: passwordStrength.width,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="auth-input-group">
                    <div className="auth-label-row">
                      <label htmlFor="signup-cpw">Confirm Password *</label>
                      {confirmState === 'match' && (
                        <span className="auth-match-indicator success">
                          <FiCheck size={12} /> Passwords match
                        </span>
                      )}
                      {confirmState === 'mismatch' && (
                        <span className="auth-match-indicator error">
                          <FiX size={12} /> Do not match
                        </span>
                      )}
                    </div>
                    <div
                      className={`auth-input-wrapper ${
                        confirmState === 'match'
                          ? 'wrapper-match'
                          : confirmState === 'mismatch'
                          ? 'wrapper-mismatch'
                          : ''
                      }`}
                    >
                      <FiLock className="auth-input-icon" />
                      <input
                        id="signup-cpw"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) setFieldErrors(p => ({ ...p, confirmPassword: '' }));
                        }}
                        className={fieldErrors.confirmPassword ? 'input-error' : ''}
                      />
                      {/* Match indicator icon */}
                      {confirmState === 'match' && (
                        <span className="auth-status-icon match" title="Passwords match">
                          <FiCheckCircle />
                        </span>
                      )}
                      {confirmState === 'mismatch' && (
                        <span className="auth-status-icon mismatch" title="Passwords do not match yet">
                          <FiAlertCircle />
                        </span>
                      )}
                      <button
                        type="button"
                        className="auth-toggle-pw"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <span className="field-error-text">⚠ {fieldErrors.confirmPassword}</span>
                    )}

                    {/* Helper hint for confirm password */}
                    {confirmState === 'mismatch' && (
                      <div className="auth-helper-msg error">
                        Passwords do not match yet
                      </div>
                    )}
                    {confirmState === 'match' && (
                      <div className="auth-helper-msg success">
                        Passwords match perfectly
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="auth-terms-group">
                    <label className="auth-terms-checkbox">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          if (fieldErrors.agreeTerms) setFieldErrors(p => ({ ...p, agreeTerms: '' }));
                        }}
                      />
                      <span>
                        I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                      </span>
                    </label>
                    {fieldErrors.agreeTerms && (
                      <span className="field-error-text" style={{ marginTop: '6px' }}>⚠ {fieldErrors.agreeTerms}</span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || confirmState === 'mismatch'}
                    style={{
                      opacity: confirmState === 'mismatch' ? 0.6 : 1,
                      cursor: confirmState === 'mismatch' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? (
                      <div className="auth-btn-spinner"></div>
                    ) : (
                      <>Create Account <FiArrowRight /></>
                    )}
                  </button>
                </form>

                <div className="auth-switch">
                  Already have an account?{' '}
                  <Link to="/login">Sign In</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
