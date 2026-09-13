import React from 'react';
import TicketInput from '../components/TicketInput';
import AnalysisResult from '../components/AnalysisResult';

export default function DashboardPage({
  onAnalyze,
  isAnalyzing,
  currentAnalysis,
  onApprove,
  onRoute,
  isProcessingAction,
  recentTickets,
  onSelectTicket,
  currentUser
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Ticket Input */}
      <TicketInput
        onAnalyze={onAnalyze}
        isAnalyzing={isAnalyzing}
        currentUser={currentUser}
      />

      {/* 2. Analysis Result Card (if any analyzed) */}
      {currentAnalysis && (
        <div>
          <h2 style={{ fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Latest AI Analysis Result
          </h2>
          <AnalysisResult
            ticket={currentAnalysis}
            onApprove={onApprove}
            onRoute={onRoute}
            isProcessingAction={isProcessingAction}
          />
        </div>
      )}

      {/* 3. Recent Tickets Quick View */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <div>
              <h2 className="card-title">
                {isAdmin ? 'Recent Global Tickets' : 'My Recent Tickets'}
              </h2>
              <p className="card-subtitle">
                {isAdmin
                  ? 'Recently triaged support requests submitted by all organization members'
                  : 'Tickets you have recently submitted'}
              </p>
            </div>
          </div>
        </div>

        {recentTickets.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748b' }}>
            {isAdmin
              ? "No tickets submitted yet. Submit a ticket above to begin."
              : "You haven't submitted any tickets yet. Describe your IT problem above to get instant AI assistance!"}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  {isAdmin && <th>Requester</th>}
                  <th>Description</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Assigned Team</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.slice(0, 8).map((t) => {
                  const conf = Math.round((t.confidence || 0) * 100);
                  const prioClass = `badge-priority-${(t.priority || 'medium').toLowerCase()}`;
                  const statClass = t.status === 'Resolved'
                    ? 'badge-status-resolved'
                    : t.status === 'Routed'
                    ? 'badge-status-routed'
                    : 'badge-status-pending';

                  return (
                    <tr
                      key={t.ticket_id}
                      className="clickable-row"
                      onClick={() => onSelectTicket(t)}
                      title="Click to view complete details"
                    >
                      <td><span className="table-ticket-id">{t.ticket_id}</span></td>
                      {isAdmin && (
                        <td>
                          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                            {t.user_name || 'Requester'}
                          </span>
                        </td>
                      )}
                      <td><div className="table-desc-cell">{t.description}</div></td>
                      <td><span className="badge badge-category">{t.category}</span></td>
                      <td><span className={`badge ${prioClass}`}>{t.priority}</span></td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: conf >= 80 ? '#34d399' : conf >= 60 ? '#38bdf8' : '#f87171'
                        }}>
                          {conf}%
                        </span>
                      </td>
                      <td><span className={`badge ${statClass}`}>{t.status}</span></td>
                      <td style={{ color: '#cbd5e1' }}>{t.assigned_team}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
