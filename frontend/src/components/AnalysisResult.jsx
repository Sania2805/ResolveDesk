import React from 'react';

export default function AnalysisResult({ ticket, onApprove, onRoute, isProcessingAction }) {
  if (!ticket) return null;

  const confidencePct = Math.round((ticket.confidence || 0) * 100);
  const isConfidenceHigh = confidencePct >= 80;
  const isConfidenceMed = confidencePct >= 60 && confidencePct < 80;
  const confidenceClass = isConfidenceHigh ? 'high' : isConfidenceMed ? 'med' : 'low';

  const priorityClass = `badge-priority-${(ticket.priority || 'medium').toLowerCase()}`;
  const statusClass = ticket.status === 'Resolved'
    ? 'badge-status-resolved'
    : ticket.status === 'Routed'
    ? 'badge-status-routed'
    : 'badge-status-pending';

  return (
    <div className="card result-card">
      {/* Header */}
      <div className="result-header">
        <div className="ticket-id-tag">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>{ticket.ticket_id}</span>
        </div>

        <div className="badges-group">
          <span className="badge badge-category">{ticket.category}</span>
          <span className={`badge ${priorityClass}`}>{ticket.priority} Priority</span>
          <span className={`badge ${statusClass}`}>{ticket.status}</span>
        </div>

        <div className="confidence-container">
          <div className="confidence-header">
            <span className="confidence-label">AI Confidence</span>
            <span className={`confidence-pct ${confidenceClass}`}>{confidencePct}%</span>
          </div>
          <div className="confidence-track">
            <div
              className={`confidence-bar ${confidenceClass}`}
              style={{ width: `${Math.min(100, Math.max(5, confidencePct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warning Box (if confidence < 60% or specific warning present) */}
      {(ticket.warning || confidencePct < 60) && (
        <div className="warning-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <strong>Warning: </strong>
            <span>{ticket.warning || "Low confidence — manual review recommended."}</span>
          </div>
        </div>
      )}

      {/* Meta Grid */}
      <div className="result-meta-grid">
        <div className="meta-item">
          <span className="meta-label">Original Ticket</span>
          <span className="meta-value" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
            "{ticket.description}"
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Assigned Team</span>
          <span className="meta-value" style={{ color: '#38bdf8' }}>{ticket.assigned_team}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Auto-Resolution</span>
          <span className="meta-value" style={{ color: ticket.auto_resolve ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
            {ticket.auto_resolve ? 'Eligible (Yes)' : 'Manual Intervention (No)'}
          </span>
        </div>
      </div>

      {/* AI Summary */}
      <div className="result-section-block">
        <h3 className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          AI Summary
        </h3>
        <p className="summary-text">{ticket.summary}</p>
      </div>

      {/* Suggested Resolution */}
      <div className="result-section-block">
        <h3 className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Suggested Resolution
        </h3>
        <ol className="resolution-steps">
          {(ticket.suggested_resolution || []).map((step, idx) => (
            <li key={idx} className="resolution-step-item">
              <span className="step-number">{idx + 1}</span>
              <span className="step-content">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* AI Reasoning */}
      <div className="result-section-block">
        <h3 className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          AI Reasoning
        </h3>
        <p className="reasoning-text">{ticket.reason}</p>
      </div>

      {/* Workflow Action Buttons */}
      <div className="workflow-actions-card">
        {ticket.auto_resolve ? (
          <>
            <div className="workflow-status-notice auto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              <span>Auto-resolution recommended — safe for self-service execution.</span>
            </div>

            {ticket.status === 'Pending Approval' ? (
              <button
                className="btn-approve"
                onClick={() => onApprove(ticket.ticket_id)}
                disabled={isProcessingAction}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{isProcessingAction ? 'Processing...' : 'Approve Resolution'}</span>
              </button>
            ) : (
              <span className={`badge ${statusClass}`} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                Status: {ticket.status}
              </span>
            )}
          </>
        ) : (
          <>
            <div className="workflow-status-notice manual">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Manual intervention required — dispatch ticket to specialist engineering team.</span>
            </div>

            {ticket.status === 'Pending Approval' ? (
              <button
                className="btn-route"
                onClick={() => onRoute(ticket.ticket_id)}
                disabled={isProcessingAction}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{isProcessingAction ? 'Routing...' : `Route Ticket to ${ticket.assigned_team}`}</span>
              </button>
            ) : (
              <span className={`badge ${statusClass}`} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                Status: {ticket.status}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

