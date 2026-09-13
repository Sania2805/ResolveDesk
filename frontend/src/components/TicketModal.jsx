import React from 'react';
import AnalysisResult from './AnalysisResult';

export default function TicketModal({ ticket, onClose, onApprove, onRoute, isProcessingAction }) {
  if (!ticket) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <AnalysisResult
          ticket={ticket}
          onApprove={onApprove}
          onRoute={onRoute}
          isProcessingAction={isProcessingAction}
        />
      </div>
    </div>
  );
}

