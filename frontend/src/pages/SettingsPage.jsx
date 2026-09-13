import React, { useState, useEffect } from 'react';
import { fetchAllUsers } from '../services/api';

export default function SettingsPage({ health, onClearTickets, isClearing, currentUser }) {
  const isKeyConfigured = health?.gemini_configured ?? false;
  const currentModel = health?.gemini_model || 'gemini-2.5-flash';
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers().then(setUsers).catch(() => {});
    }
  }, [isAdmin]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <div>
              <h2 className="card-title">Settings & System Configuration</h2>
              <p className="card-subtitle">Manage AI models, user directory, and ticket data lifecycle</p>
            </div>
          </div>
        </div>

        <div className="settings-section">
          {/* AI Connection Status */}
          <div className="settings-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Gemini AI Integration</h3>
                <p>Official Google GenAI Python SDK</p>
              </div>
              <div className="status-pill" style={{
                background: isKeyConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderColor: isKeyConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
              }}>
                <span className={`status-indicator ${isKeyConfigured ? 'pulse' : ''}`} style={{
                  backgroundColor: isKeyConfigured ? '#10b981' : '#f59e0b',
                  boxShadow: isKeyConfigured ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
                }} />
                <span style={{ color: isKeyConfigured ? '#34d399' : '#fbbf24' }}>
                  {isKeyConfigured ? 'Online & Configured' : 'API Key Required'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <p>
                API key configured in <code>backend/.env</code>:
              </p>
              <div className="code-snippet">
                GEMINI_MODEL={currentModel}
              </div>
            </div>
          </div>

          {/* User Directory (Admin Only) */}
          {isAdmin && (
            <div className="settings-box">
              <h3>Registered User Accounts & Access Roles</h3>
              <p style={{ marginBottom: '14px' }}>
                All user accounts created in ResolveAI. End-users only see tickets they raised; admins see all tickets.
              </p>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Email Address</th>
                      <th>Assigned Role</th>
                      <th>Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td><span className="table-ticket-id">USR-{u.id}</span></td>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td style={{ color: '#94a3b8' }}>{u.email}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: u.role === 'admin' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: u.role === 'admin' ? '#38bdf8' : '#34d399',
                              border: `1px solid ${u.role === 'admin' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
                            }}
                          >
                            {u.role === 'admin' ? 'IT Admin' : 'Employee'}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{u.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ticket Lifecycle Management */}
          {isAdmin && (
            <div className="settings-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3>Purge Ticket Data</h3>
                  <p>Permanently remove all tickets and audit logs from the database to start from scratch.</p>
                </div>
                <button
                  className="btn-demo-load"
                  style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                  onClick={onClearTickets}
                  disabled={isClearing}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>{isClearing ? 'Clearing...' : 'Clear All Tickets'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Built-in Safety Policies */}
          <div className="settings-box">
            <h3>Built-In Safety & Triage Policies</h3>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.8' }}>
              <li><strong>Zero Auto-Resolve on Security:</strong> Phishing, ransomware, data breaches, and credential compromise are strictly routed to InfoSec.</li>
              <li><strong>Physical Hardware Protection:</strong> Swollen batteries, broken chassis, and hardware swaps require physical depot inspection.</li>
              <li><strong>Privileged Access Segregation:</strong> Production and administrative IAM elevations require approval workflow.</li>
              <li><strong>Confidence Guardrail:</strong> Any classification below 60% confidence is automatically re-routed to <em>Needs Manual Review</em>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
