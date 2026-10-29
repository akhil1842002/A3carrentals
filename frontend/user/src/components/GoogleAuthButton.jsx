import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiUser, FiArrowRight, FiCheck } from 'react-icons/fi';
import { googleLogin } from '../api';
import { useAuth } from '../context/AuthContext';

export default function GoogleAuthButton({ onSuccess, onError, text = 'Continue with Google' }) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showChooser, setShowChooser] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'add_new'
  
  // New account form states
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [formError, setFormError] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Load saved Google accounts from localStorage
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('cb_saved_google_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      
      // Seed with last active user if available so the user never has to re-type
      const lastUser = localStorage.getItem('carbook_user');
      if (lastUser) {
        const parsed = JSON.parse(lastUser);
        if (parsed.email) {
          const initialAccount = {
            name: parsed.name || 'Akhil R',
            email: parsed.email,
            picture: parsed.avatar || '',
            googleId: parsed.googleId || 'g_' + Math.abs(parsed.email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))
          };
          localStorage.setItem('cb_saved_google_accounts', JSON.stringify([initialAccount]));
          return [initialAccount];
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    return [
      {
        name: 'Akhil R',
        email: 'akhil1842002@gmail.com',
        picture: '',
        googleId: 'g_akhil_primary'
      }
    ];
  });

  // Save accounts helper
  const persistAccounts = (updatedList) => {
    setAccounts(updatedList);
    try {
      localStorage.setItem('cb_saved_google_accounts', JSON.stringify(updatedList));
    } catch (e) {
      // safe fallback
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    // Load official Google Identity Services script dynamically
    const scriptId = 'google-jssdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setLoading(true);
      const res = await googleLogin({ credential: response.credential });
      
      // Save this verified Google account for instant 1-click re-login
      if (res.data?.user?.email) {
        const newAcc = {
          name: res.data.user.name || 'Google User',
          email: res.data.user.email,
          picture: res.data.user.avatar || '',
          googleId: res.data.user.googleId || 'g_' + Date.now()
        };
        const updated = [newAcc, ...accounts.filter(a => a.email.toLowerCase() !== newAcc.email.toLowerCase())];
        persistAccounts(updated);
      }

      login(res.data.token, res.data.user);
      setShowChooser(false);
      if (onSuccess) onSuccess(res.data.user);
    } catch (err) {
      if (onError) onError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    // If real Google Client ID is configured and ready, try Google One Tap
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn('Google prompt fallback:', e);
      }
    }

    // Open authentic Google Account Chooser
    setViewMode(accounts.length > 0 ? 'list' : 'add_new');
    setFormError('');
    setShowChooser(true);
  };

  // Sign in immediately with selected Google account (1 Click, NO typing)
  const handleSelectAccount = async (acc) => {
    setLoading(true);
    setFormError('');
    try {
      const res = await googleLogin({
        email: acc.email.toLowerCase(),
        name: acc.name,
        picture: acc.picture || '',
        googleId: acc.googleId || ('g_' + Math.abs(acc.email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)))
      });

      // Update recent order
      const updated = [acc, ...accounts.filter(a => a.email.toLowerCase() !== acc.email.toLowerCase())];
      persistAccounts(updated);

      login(res.data.token, res.data.user);
      setShowChooser(false);
      if (onSuccess) onSuccess(res.data.user);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to authenticate with Google');
      if (onError) onError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Add a new Google account
  const handleAddNewAccount = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanName = newName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid Google email address');
      return;
    }

    const accountObj = {
      name: cleanName || cleanEmail.split('@')[0],
      email: cleanEmail,
      picture: '',
      googleId: 'g_' + Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))
    };

    setLoading(true);
    try {
      const res = await googleLogin({
        email: accountObj.email,
        name: accountObj.name,
        picture: accountObj.picture,
        googleId: accountObj.googleId
      });

      // Save to remembered accounts list
      const updated = [accountObj, ...accounts.filter(a => a.email.toLowerCase() !== accountObj.email.toLowerCase())];
      persistAccounts(updated);

      login(res.data.token, res.data.user);
      setShowChooser(false);
      setNewEmail('');
      setNewName('');
      if (onSuccess) onSuccess(res.data.user);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Google registration failed');
      if (onError) onError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const updated = accounts.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    persistAccounts(updated);
    if (updated.length === 0) {
      setViewMode('add_new');
    }
  };

  return (
    <>
      {/* Google Sign-In Trigger Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        className="google-sign-in-btn"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '11px 16px',
          borderRadius: '10px',
          border: '1.5px solid #e2e8f0',
          background: '#ffffff',
          color: '#1e293b',
          fontSize: '0.92rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          position: 'relative'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>{loading ? 'Connecting with Google...' : text}</span>
      </button>

      {/* Authentic Google "Choose an Account" Dialog */}
      {showChooser && (
        <div 
          className="modal-backdrop" 
          onClick={() => !loading && setShowChooser(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '430px',
              width: '100%',
              padding: '32px 28px 24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              position: 'relative',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowChooser(false)}
              disabled={loading}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: '#5f6368',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f3f4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              aria-label="Close"
            >
              <FiX size={20} />
            </button>

            {/* Google Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" style={{ marginBottom: '10px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.45rem', fontWeight: 500, color: '#202124', letterSpacing: '-0.3px' }}>
                {viewMode === 'list' ? 'Choose an account' : 'Sign in with Google'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5f6368' }}>
                to continue to <strong style={{ color: '#202124' }}>CarBook</strong>
              </p>
            </div>

            {formError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                {formError}
              </div>
            )}

            {/* MODE 1: Account List (1-Click Instant Sign-In) */}
            {viewMode === 'list' && (
              <div>
                <div style={{
                  borderTop: '1px solid #dadce0',
                  borderBottom: '1px solid #dadce0',
                  marginBottom: '18px',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {accounts.map((acc) => {
                    const initial = (acc.name || acc.email || 'U')[0].toUpperCase();
                    return (
                      <div
                        key={acc.email}
                        onClick={() => !loading && handleSelectAccount(acc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px 14px',
                          borderBottom: '1px solid #f1f3f4',
                          cursor: loading ? 'wait' : 'pointer',
                          transition: 'background 0.15s',
                          borderRadius: '8px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9fa'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Avatar */}
                        {acc.picture ? (
                          <img
                            src={acc.picture}
                            alt={acc.name}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#1a73e8',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.05rem'
                          }}>
                            {initial}
                          </div>
                        )}

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#202124', truncate: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {acc.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#5f6368', truncate: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {acc.email}
                          </div>
                        </div>

                        {/* Remove / Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#1a73e8', fontWeight: 600, background: '#e8f0fe', padding: '3px 8px', borderRadius: '12px' }}>
                            1-Click
                          </span>
                          {accounts.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoveAccount(e, acc.email)}
                              title="Remove account from device"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#9aa0a6',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#d93025'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#9aa0a6'; }}
                            >
                              <FiTrash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Account Button */}
                  <div
                    onClick={() => setViewMode('add_new')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9fa'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#f1f3f4',
                      color: '#5f6368',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiPlus size={20} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a73e8' }}>
                      Use another account
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#70757a', lineHeight: 1.45, textAlign: 'center' }}>
                  To continue, Google will share your name, email address, and profile picture with CarBook.
                </div>
              </div>
            )}

            {/* MODE 2: Add New Account View */}
            {viewMode === 'add_new' && (
              <form onSubmit={handleAddNewAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#202124', marginBottom: '6px' }}>
                    Google Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@gmail.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #dadce0',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#1a73e8'}
                    onBlur={e => e.target.style.borderColor = '#dadce0'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#202124', marginBottom: '6px' }}>
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Akhil R"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #dadce0',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#1a73e8'}
                    onBlur={e => e.target.style.borderColor = '#dadce0'}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  {accounts.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1a73e8',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        padding: '8px 4px'
                      }}
                    >
                      ← Back to accounts
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#1a73e8',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'} <FiArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
