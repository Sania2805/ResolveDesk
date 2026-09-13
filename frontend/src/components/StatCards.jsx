import React from 'react';

export default function StatCards({ analytics }) {
  const total = analytics?.total_tickets ?? 0;
  const autoResolved = analytics?.auto_resolved_count ?? 0;
  const manualReview = analytics?.manual_review_count ?? 0;
  const highPriority = analytics?.high_priority_count ?? 0;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div className="stat-info">
          <span className="stat-label">Total Tickets</span>
          <span className="stat-value">{total}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper emerald">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="stat-info">
          <span className="stat-label">Auto-Resolved</span>
          <span className="stat-value">{autoResolved}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="stat-info">
          <span className="stat-label">Manual Review</span>
          <span className="stat-value">{manualReview}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper rose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 22 22 22 12 2" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="stat-info">
          <span className="stat-label">High Priority</span>
          <span className="stat-value">{highPriority}</span>
        </div>
      </div>
    </div>
  );
}

