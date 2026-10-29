import { useState } from 'react';
import { 
  FiMail, FiPhone, FiLock, FiUser, FiEye, FiEyeOff, 
  FiArrowRight, FiX, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import { loginUser, registerUser, verifySignupOtp, resendSignupOtp } from '../api';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onGuestContinue,
  initialMode = 'login', 
  message = 'Sign in or register to confirm your vehicle reservation' 
}) {
  if (!isOpen) return null;

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const { login } = useAuth();

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup extra fields
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOtpStep, setSignupOtpStep] = useState(1); // 1 = Form, 2 = Verify OTP
  const [signupOtpVal, setSignupOtpVal] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please enter your email address and password.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ email: cleanEmail, password, rememberMe });
      login(res.data.token, res.data.user);
      if (onSuccess) onSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your full name.');
    if (!signupEmail.trim() || !signupEmail.includes('@')) return setError('Please enter a valid email address.');
    const cleanPhone = signupPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) return setError('Please enter a valid 10-digit mobile number.');
    if (!signupPassword || signupPassword.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const res = await registerUser({
        name: name.trim(),
        email: signupEmail.trim().toLowerCase(),
        phone: signupPhone.trim(),
        password: signupPassword,
        role: 'customer'
      });

      if (res.data.requiresOtp) {
        if (res.data.devOtp) setDevOtp(res.data.devOtp);
        setInfoMsg(res.data.message || `A 6-digit code was sent to ${signupEmail}`);
        setSignupOtpStep(2);
      } else {
        login(res.data.token, res.data.user);
        if (onSuccess) onSuccess(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Email or phone may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = signupOtpVal.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await verifySignupOtp({ 
        email: signupEmail.trim().toLowerCase(), 
        otp: cleanOtp 
      });
      login(res.data.token, res.data.user);
      if (onSuccess) onSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    setError('');
    try {
      const res = await resendSignupOtp({ email: signupEmail.trim().toLowerCase() });
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      setInfoMsg(res.data.message || 'Fresh code dispatched to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    }
  };

  const handleGoogleSuccess = (userData) => {
    if (onSuccess) onSuccess(userData);
    onClose();
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
    >
      <div 
        className="auth-modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '460px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              {mode === 'login' ? 'Sign In to Your Account' : 'Create Free Account'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              {message}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.2s'
            }}
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#f96d00' : '#64748b',
              fontWeight: 700,
              fontSize: '0.88rem',
              borderBottom: mode === 'login' ? '2.5px solid #f96d00' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? '#f96d00' : '#64748b',
              fontWeight: 700,
              fontSize: '0.88rem',
              borderBottom: mode === 'signup' ? '2.5px solid #f96d00' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', maxHeight: '75vh' }}>
          {/* Google One-Click Button */}
          <div style={{ marginBottom: '14px' }}>
            <GoogleAuthButton 
              text={mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
              onSuccess={handleGoogleSuccess}
              onError={err => setError(err)}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '14px 0',
            color: '#94a3b8',
            fontSize: '0.74rem',
            fontWeight: 700
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Or with {mode === 'login' ? 'credentials' : 'details'}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '14px'
            }}>
              <FiAlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Mode: LOGIN */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiMail style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Password</label>
                  <a href="/confirm-password" target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 600 }}>
                    Forgot?
                  </a>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiLock style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 36px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
                <input
                  type="checkbox"
                  id="modal-remember"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#f96d00', cursor: 'pointer' }}
                />
                <label htmlFor="modal-remember" style={{ cursor: 'pointer' }}>Keep me logged in</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#f96d00',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(249, 109, 0, 0.3)',
                  transition: 'background 0.2s'
                }}
              >
                {loading ? 'Signing in...' : <>Sign In &amp; Proceed <FiArrowRight /></>}
              </button>
            </form>
          ) : signupOtpStep === 2 ? (
            /* Mode: SIGNUP OTP VERIFY */
            <form onSubmit={handleVerifySignupOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#0f172a' }}>Verify Your Email</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  Enter the 6-digit code sent to <br />
                  <strong style={{ color: '#0f172a' }}>{signupEmail}</strong>
                </p>
              </div>

              {devOtp && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#92400e' }}>⚡ Test OTP: {devOtp}</span>
                  <button type="button" onClick={() => setSignupOtpVal(devOtp)} style={{ background: 'none', border: 'none', color: '#f96d00', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                    Autofill
                  </button>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="••••••"
                  value={signupOtpVal}
                  onChange={e => setSignupOtpVal(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '1.15rem', letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || signupOtpVal.length < 6}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#f96d00',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: signupOtpVal.length < 6 ? 'not-allowed' : 'pointer',
                  opacity: signupOtpVal.length < 6 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {loading ? 'Verifying...' : <>Confirm &amp; Proceed <FiArrowRight /></>}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <button type="button" onClick={() => setSignupOtpStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                  ← Edit Details
                </button>
                <button type="button" onClick={handleResendSignupOtp} style={{ background: 'none', border: 'none', color: '#f96d00', cursor: 'pointer', fontWeight: 700 }}>
                  Resend Code
                </button>
              </div>
            </form>
          ) : (
            /* Mode: SIGNUP */
            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiUser style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiMail style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Mobile Number *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiPhone style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={signupPhone}
                    onChange={e => setSignupPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Create Password * (min. 6 chars)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiLock style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 36px 9px 36px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '6px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#f96d00',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(249, 109, 0, 0.3)'
                }}
              >
                {loading ? 'Creating Account...' : <>Create Account &amp; Proceed <FiArrowRight /></>}
              </button>
            </form>
          )}

          {onGuestContinue && (
            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGuestContinue();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Skip &amp; continue as guest without account →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
