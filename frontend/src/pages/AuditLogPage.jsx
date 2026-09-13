import React, { useState } from 'react';

export default function AuditLogPage({ auditLogs, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (log.ticket_id || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.result || '').toLowerCase().includes(q) ||
      (log.timestamp || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div>
            <h2 className="card-title">System Audit Log</h2>
            <p className="card-subtitle">
              Immutable chronological record of all AI classification, operator decisions, and routing events ({filteredLogs.length} events)
            </p>
          </div>
        </div>

        <button className="btn-demo-load" onClick={onRefresh} title="Refresh audit log">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="table-filter-bar">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search audit trail by Ticket ID, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
          No audit log entries recorded yet.
        </div>
      ) : (
        <div className="audit-timeline">
          {filteredLogs.map((log) => (
            <div key={log.id} className="audit-item">
              <div className="audit-time">{log.timestamp}</div>
              <div className="audit-content">
                <div className="audit-header-line">
                  <span className="audit-ticket">{log.ticket_id}</span>
                  <span className="audit-action">{log.action}</span>
                </div>
                <div className="audit-result">{log.result}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

