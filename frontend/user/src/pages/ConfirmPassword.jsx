import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiKey,
  FiRefreshCw
} from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';
import { forgotPassword, verifyOtp, resetPassword } from '../api';
import { useSettings } from '../context/SettingsContext';
import { renderBrandName } from '../utils/format';

export default function ConfirmPassword() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  // Step management: 1 = Request OTP, 2 = Verify OTP, 3 = Set Password, 4 = Success
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState(location.state?.email || location.state?.identifier || '');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [maskedContact, setMaskedContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

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

  // Step 1: Request OTP (Email Only)
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFieldErrors({ email: 'Please enter your registered email address' });
      return;
    }

    setFieldErrors({});
    setError('');
    setLoading(true);

    try {
      const res = await forgotPassword({ email: cleanEmail });
      setMaskedContact(res.data.maskedEmail || cleanEmail);
      setInfoMsg(res.data.message || 'Verification code dispatched to your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'No account found with this email address. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setFieldErrors({ otp: 'Please enter the complete 6-digit verification code' });
      return;
    }

    setFieldErrors({});
    setError('');
    setLoading(true);

    try {
      const res = await verifyOtp({ email: email.trim().toLowerCase(), otp: cleanOtp });
      setResetToken(res.data.resetToken);
      setInfoMsg('');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!password) {
      errs.password = 'New password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setError('');
    setLoading(true);

    try {
      await resetPassword({ resetToken, newPassword: password });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Branding Showcase */}
        <div className="auth-left" style={{ backgroundImage: `url('/images/bg_1.jpg')` }}>
          <div className="auth-left-overlay"></div>
          <div className="auth-left-content">
            <div className="auth-logo">
              <FaCar size={32} />
              <span>{renderBrandName(settings?.businessName || 'CarBook')}</span>
            </div>
            <h2>Password Security</h2>
            <p>Recover access to your account with our secure tokenized verification system.</p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Instant 6-digit OTP identity verification
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                Cryptographically signed reset tokens
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot"></span>
                High-grade 256-bit password hashing
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            {/* Step Indicators */}
            {step < 4 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: step === num ? '#f96d00' : step > num ? '#10b981' : '#94a3b8'
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: step === num ? '#fff7ed' : step > num ? '#ecfdf5' : '#f1f5f9',
                        border: `1.5px solid ${step === num ? '#f96d00' : step > num ? '#10b981' : '#cbd5e1'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem'
                      }}
                    >
                      {step > num ? '✓' : num}
                    </span>
                    <span>{num === 1 ? 'Contact' : num === 2 ? 'Verify OTP' : 'New Password'}</span>
                    {num < 3 && <span style={{ color: '#cbd5e1' }}>→</span>}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FiAlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
                ℹ️ {infoMsg}
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <>
                <div className="auth-form-header">
                  <div className="auth-header-icon-pill">
                    <FiKey size={20} />
                  </div>
                  <h1>Forgot Password</h1>
                  <p>Enter your registered Email Address to receive a 6-digit OTP</p>
                </div>

                <form onSubmit={handleRequestOtp} className="auth-form" noValidate>
                  <div className="auth-input-group">
                    <label htmlFor="reset-email">Email Address</label>
                    <div className="auth-input-wrapper">
                      <FiMail className="auth-input-icon" />
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="e.g. name@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors({});
                        }}
                        className={fieldErrors.email ? 'input-error' : ''}
                      />
                    </div>
                    {fieldErrors.email && (
                      <span className="field-error-text">⚠ {fieldErrors.email}</span>
                    )}
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? <div className="auth-btn-spinner"></div> : <>Send Verification Code <FiArrowRight /></>}
                  </button>
                </form>
              </>
            )}

            {/* STEP 2: Enter OTP */}
            {step === 2 && (
              <>
                <div className="auth-form-header">
                  <div className="auth-header-icon-pill">
                    <FiKey size={20} />
                  </div>
                  <h1>Enter 6-Digit Code</h1>
                  <p>Enter the OTP sent to <strong>{maskedContact}</strong></p>
                </div>

                <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
                  <div className="auth-input-group">
                    <label htmlFor="reset-otp">6-Digit Verification Code</label>
                    <div className="auth-input-wrapper">
                      <FiLock className="auth-input-icon" />
                      <input
                        id="reset-otp"
                        type="text"
                        maxLength="6"
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ''));
                          if (fieldErrors.otp) setFieldErrors({});
                        }}
                        style={{ letterSpacing: '0.3em', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
                        className={fieldErrors.otp ? 'input-error' : ''}
                      />
                    </div>
                    {fieldErrors.otp && (
                      <span className="field-error-text">⚠ {fieldErrors.otp}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 16px' }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      ← Change Contact
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={loading}
                      style={{ background: 'none', border: 'none', color: '#f96d00', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiRefreshCw size={12} /> Resend OTP
                    </button>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? <div className="auth-btn-spinner"></div> : <>Verify &amp; Continue <FiArrowRight /></>}
                  </button>
                </form>
              </>
            )}

            {/* STEP 3: Set New Password */}
            {step === 3 && (
              <>
                <div className="auth-form-header">
                  <div className="auth-header-icon-pill">
                    <FiLock size={20} />
                  </div>
                  <h1>Set New Password</h1>
                  <p>Choose a secure password for your account</p>
                </div>

                <form onSubmit={handleSetNewPassword} className="auth-form" noValidate>
                  {/* New Password */}
                  <div className="auth-input-group">
                    <div className="auth-label-row">
                      <label htmlFor="confirm-new-pw">New Password *</label>
                      {password && (
                        <span className="auth-strength-text" style={{ color: passwordStrength.color, fontWeight: 700 }}>
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                    <div className={`auth-input-wrapper ${fieldErrors.password ? 'input-error' : ''}`}>
                      <FiLock className="auth-input-icon" />
                      <input
                        id="confirm-new-pw"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password (min. 6 characters)"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                        }}
                      />
                      <button
                        type="button"
                        className="auth-toggle-pw"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>

                    {/* Visual Password Strength Bar */}
                    {password && (
                      <div className="auth-strength-bar-bg" style={{ height: '4px', background: '#e2e8f0', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: passwordStrength.width,
                            height: '100%',
                            background: passwordStrength.color,
                            transition: 'all 0.3s ease'
                          }}
                        />
                      </div>
                    )}
                    {fieldErrors.password && (
                      <span className="field-error-text">⚠ {fieldErrors.password}</span>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="auth-input-group">
                    <div className="auth-label-row">
                      <label htmlFor="confirm-retype-pw">Confirm Password *</label>
                      {confirmPassword && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: confirmState === 'match' ? '#10b981' : '#ef4444' }}>
                          {confirmState === 'match' ? '✓ Passwords match' : '✕ Passwords do not match'}
                        </span>
                      )}
                    </div>
                    <div className={`auth-input-wrapper ${fieldErrors.confirmPassword ? 'input-error' : ''}`}>
                      <FiLock className="auth-input-icon" />
                      <input
                        id="confirm-retype-pw"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                      />
                      <button
                        type="button"
                        className="auth-toggle-pw"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <span className="field-error-text">⚠ {fieldErrors.confirmPassword}</span>
                    )}
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? <div className="auth-btn-spinner"></div> : <>Save &amp; Update Password <FiArrowRight /></>}
                  </button>
                </form>
              </>
            )}

            {/* STEP 4: Success Screen */}
            {step === 4 && (
              <div className="auth-success-card">
                <div className="auth-success-icon" style={{ color: '#10b981', marginBottom: '14px' }}>
                  <FiCheckCircle size={60} />
                </div>
                <h2>Password Reset Completed! 🎉</h2>
                <p>Your password has been successfully verified and updated. You can now sign in using your new credentials.</p>
                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={() => navigate('/login')}
                  style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                >
                  Proceed to Sign In <FiArrowRight />
                </button>
              </div>
            )}

            <div className="auth-switch">
              Remember your password? <Link to="/login">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
