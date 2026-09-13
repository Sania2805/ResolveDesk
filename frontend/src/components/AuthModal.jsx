import React, { useState } from 'react';

export default function AuthModal({ onLogin, onRegister, isAuthenticating }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setError('');
    onLogin(demoEmail, demoPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }

    if (mode === 'login') {
      onLogin(email.trim(), password).catch((err) => setError(err.message));
    } else {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      onRegister(email.trim(), name.trim(), password, role).catch((err) => setError(err.message));
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '32px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
            marginBottom: '12px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>ResolveAI Access Portal</h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
            Sign in to view your tickets or access the IT admin triage desk
          </p>
        </div>

        

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            type="button"
            className={`nav-item ${mode === 'login' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In with Credentials
          </button>
          <button
            type="button"
            className={`nav-item ${mode === 'register' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register New Account
          </button>
        </div>

        {error && (
          <div className="warning-box" style={{ margin: '0 0 16px 0', borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isAuthenticating}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAuthenticating}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAuthenticating}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select
                className="filter-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isAuthenticating}
              >
                <option value="user">Employee / Requester (View own tickets)</option>
                <option value="admin">IT Administrator (Manage all tickets)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account & Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

