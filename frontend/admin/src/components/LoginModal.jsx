import { useState } from 'react';
import { FaUserShield, FaLock, FaUser } from 'react-icons/fa';

export default function LoginModal({ isOpen, onLogin, error, loading }) {
  const [username, setUsername] = useState(() => localStorage.getItem('rememberedAdminIdentifier') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedAdminIdentifier'));

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onLogin({ username: username.trim(), password, rememberMe });
  };

  return (
    <div className="modal-overlay">
      <div className="login-box">
        <div className="login-icon-circle">
          <FaUserShield />
        </div>

        <div>
          <h2>Admin Console</h2>
          <p>Administrator authentication for fleet reservations &amp; management</p>
        </div>

        {error && (
          <div style={{ background: '#FEEAEA', color: '#D32F2F', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Username or Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                required
                style={{ width: '100%', paddingLeft: '38px' }}
              />
              <FaUser style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', paddingLeft: '38px' }}
              />
              <FaLock style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary, #666)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: 'var(--primary, #2563eb)', cursor: 'pointer' }}
              />
              <span>Remember me</span>
            </label>
            <span style={{ fontSize: '12px', color: '#888' }}>30 days</span>
          </div>

          <button
            type="submit"
            className="btn-admin-primary"
            style={{ width: '100%', padding: '13px', marginTop: '6px', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
