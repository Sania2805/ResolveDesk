import React, { useState } from 'react';

const CATEGORIES = [
  'All',
  'Password Reset',
  'Access Request',
  'Software Issue',
  'Hardware Fault',
  'Network Issue',
  'Email Issue',
  'Account Issue',
  'Security Issue',
  'General IT Query',
  'Needs Manual Review'
];

const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['All', 'Pending Approval', 'Resolved', 'Routed'];

export default function TicketsPage({ tickets, onSelectTicket, currentUser }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const isAdmin = currentUser?.role === 'admin';

  const filteredTickets = tickets.filter((t) => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;
    if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = t.ticket_id.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchSummary = (t.summary || '').toLowerCase().includes(q);
      const matchTeam = (t.assigned_team || '').toLowerCase().includes(q);
      const matchUser = (t.user_name || '').toLowerCase().includes(q) || (t.user_email || '').toLowerCase().includes(q);
      if (!matchId && !matchDesc && !matchSummary && !matchTeam && !matchUser) return false;
    }
    return true;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <div>
            <h2 className="card-title">
              {isAdmin ? 'All Tickets (Admin Management Console)' : 'My Submitted Support Tickets'}
            </h2>
            <p className="card-subtitle">
              {isAdmin
                ? `Showing ${filteredTickets.length} of ${tickets.length} total tickets across all users`
                : `Showing ${filteredTickets.length} of your personal tickets`}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-filter-bar">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder={isAdmin ? "Search by Ticket ID, description, summary, or requester..." : "Search your tickets by ID or issue description..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p === 'All' ? 'All Priorities' : `${p} Priority`}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredTickets.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
          {tickets.length === 0
            ? (isAdmin ? "No tickets have been raised by any user yet." : "You haven't submitted any IT tickets yet. Click 'Submit Ticket' to raise one!")
            : "No tickets found matching the selected filters."}
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
                <th>Auto-Resolve</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => {
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
                    title="Click to view full diagnosis and resolution actions"
                  >
                    <td><span className="table-ticket-id">{t.ticket_id}</span></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.82rem' }}>
                            {t.user_name || 'Requester'}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                            {t.user_email || '—'}
                          </span>
                        </div>
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
                    <td>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: t.auto_resolve ? '#10b981' : '#f59e0b'
                      }}>
                        {t.auto_resolve ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
