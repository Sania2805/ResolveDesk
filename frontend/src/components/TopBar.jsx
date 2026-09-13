import React from 'react';

export default function TopBar({ health, currentUser, onSignOut, onOpenAuth }) {
  const isAiOnline = health?.gemini_configured ?? false;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="topbar">
      <div className="topbar-titles">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1>{isAdmin ? 'IT Service Desk (Admin Portal)' : 'Employee IT Support Portal'}</h1>
          <span
            className="badge"
            style={{
              background: isAdmin ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isAdmin ? '#38bdf8' : '#34d399',
              border: `1px solid ${isAdmin ? 'rgba(56, 189, 248, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            {isAdmin ? 'Admin Console' : 'Requester Workspace'}
          </span>
        </div>
        <p>
          {isAdmin
            ? 'Global IT management: review, triage, and route support tickets across all employees'
            : 'AI-assisted ticket submission & self-service resolution portal'}
        </p>
      </div>

      <div className="topbar-actions">
        {/* AI Health Status */}
        <div className="status-pill" title={isAiOnline ? `Configured Model: ${health.gemini_model}` : "Set GEMINI_API_KEY in backend/.env"}>
          <span
            className={`status-indicator ${isAiOnline ? 'pulse' : ''}`}
            style={{
              backgroundColor: isAiOnline ? '#10b981' : '#f59e0b',
              boxShadow: isAiOnline ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
            }}
          />
          <span style={{ color: isAiOnline ? '#34d399' : '#fbbf24' }}>
            {isAiOnline ? 'AI Online' : 'AI Key Required'}
          </span>
        </div>

        {/* User Profile and Switch/Logout */}
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: '8px'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isAdmin ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'linear-gradient(135deg, #059669, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
              >
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>
                  {currentUser.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {currentUser.email}
                </span>
              </div>
            </div>

            <button
              className="btn-demo-load"
              style={{ padding: '7px 12px', fontSize: '0.78rem' }}
              onClick={onOpenAuth}
              title="Switch between Admin and Employee test accounts"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              <span>Switch User</span>
            </button>

            <button
              className="btn-demo-load"
              style={{ padding: '7px 10px', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              onClick={onSignOut}
              title="Sign out of current account"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={onOpenAuth}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
