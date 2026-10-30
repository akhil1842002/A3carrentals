import { useState } from 'react';
import { FaUserShield, FaLock, FaUser } from 'react-icons/fa';

export default function LoginModal({ isOpen, onLogin, error, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onLogin({ username: username.trim(), password });
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
