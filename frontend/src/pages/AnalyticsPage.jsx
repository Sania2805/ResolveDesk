import React from 'react';

export default function AnalyticsPage({ analytics }) {
  const total = analytics?.total_tickets ?? 0;
  const autoRate = analytics?.auto_resolution_rate ?? 0;
  const manualRate = analytics?.manual_review_rate ?? 0;
  const avgConfidence = analytics?.average_confidence ?? 0;

  const categoryDist = analytics?.category_distribution || {};
  const priorityDist = analytics?.priority_distribution || {};
  const statusDist = analytics?.status_distribution || {};

  // Find max category count for bar scale
  const maxCatCount = Math.max(1, ...Object.values(categoryDist));
  const maxPrioCount = Math.max(1, ...Object.values(priorityDist));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Key KPI Rates */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            <div>
              <h2 className="card-title">Resolution & Efficiency Metrics</h2>
              <p className="card-subtitle">AI automation throughput and confidence benchmarks</p>
            </div>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi-box">
            <span className="kpi-label">Auto-Resolution Rate</span>
            <span className="kpi-value" style={{ color: '#10b981' }}>{autoRate}%</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tickets marked safe for self-service</span>
          </div>

          <div className="kpi-box">
            <span className="kpi-label">Manual Review Rate</span>
            <span className="kpi-value" style={{ color: '#f59e0b' }}>{manualRate}%</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>High-risk or low-confidence routed</span>
          </div>

          <div className="kpi-box">
            <span className="kpi-label">Average AI Confidence</span>
            <span className="kpi-value" style={{ color: '#38bdf8' }}>{avgConfidence}%</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mean model certainty score</span>
          </div>
        </div>
      </div>

      {/* Distribution Charts Grid */}
      <div className="analytics-grid">
        {/* Category Breakdown */}
        <div className="card chart-card">
          <div className="card-header">
            <div className="card-title-group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <div>
                <h3 className="card-title" style={{ fontSize: '1rem' }}>Category Distribution</h3>
                <p className="card-subtitle">{Object.keys(categoryDist).length} active IT categories</p>
              </div>
            </div>
          </div>

          <div className="bar-chart-container">
            {Object.keys(categoryDist).length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No category data yet.</p>
            ) : (
              Object.entries(categoryDist)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const pct = Math.round((count / (total || 1)) * 100);
                  const barWidth = Math.round((count / maxCatCount) * 100);
                  return (
                    <div key={cat} className="bar-row">
                      <div className="bar-labels">
                        <span className="bar-label-name">{cat}</span>
                        <span className="bar-label-count">{count} ({pct}%)</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Priority & Status Breakdown */}
        <div className="card chart-card">
          <div className="card-header">
            <div className="card-title-group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 22 22 22 12 2" />
              </svg>
              <div>
                <h3 className="card-title" style={{ fontSize: '1rem' }}>Priority Breakdown</h3>
                <p className="card-subtitle">Urgency and business impact weighting</p>
              </div>
            </div>
          </div>

          <div className="bar-chart-container">
            {['Critical', 'High', 'Medium', 'Low'].map((prio) => {
              const count = priorityDist[prio] || 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              const barWidth = maxPrioCount ? Math.round((count / maxPrioCount) * 100) : 0;
              const prioLower = prio.toLowerCase();

              return (
                <div key={prio} className="bar-row">
                  <div className="bar-labels">
                    <span className="bar-label-name">{prio} Priority</span>
                    <span className="bar-label-count">{count} ({pct}%)</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill prio-${prioLower}`} style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Breakdown Mini Row */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span className="section-title">Workflow State Breakdown</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#f59e0b' }}>Pending</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {statusDist['Pending Approval'] || 0}
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Resolved</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {statusDist['Resolved'] || 0}
                </div>
              </div>
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#818cf8' }}>Routed</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {statusDist['Routed'] || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

