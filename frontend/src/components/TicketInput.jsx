import React, { useState } from 'react';

const SAMPLE_PROMPTS = [
  { label: 'Password Reset', text: "I can't log into my laptop, it says my password expired." },
  { label: 'Vague Issue', text: "It doesn't work." },
  { label: 'Security Alert', text: "Ransomware pop-up appeared on workstation demanding Bitcoin to decrypt files!" },
  { label: 'Network Down', text: "The entire 4th floor switch is down, nobody can access the internet or ERP." },
  { label: 'Hinglish Query', text: "mera laptop login nahi ho raha, blue screen aa rahi hai bar bar restart karne par" }
];

export default function TicketInput({ onAnalyze, isAnalyzing }) {
  const [description, setDescription] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [inputError, setInputError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setInputError('Please describe your IT issue before submitting.');
      return;
    }
    setInputError('');
    onAnalyze(description, ticketId);
  };

  const handleSelectSample = (sampleText) => {
    setDescription(sampleText);
    setInputError('');
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <div>
            <h2 className="card-title">Submit a Support Ticket</h2>
            <p className="card-subtitle">Enter issue details for automated AI triage, classification, and resolution steps</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ticket-input-form">
        <div className="form-row">
          <div className="form-group small">
            <label className="form-label" htmlFor="ticketIdInput">
              <span>Ticket ID</span>
              <span className="hint">Optional</span>
            </label>
            <input
              id="ticketIdInput"
              type="text"
              className="input-field"
              placeholder="e.g. TKT-1001 (auto if blank)"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ticketDescInput">
              <span>Issue Description <strong style={{ color: '#f43f5e' }}>*</strong></span>
              <span className="hint">{description.length}/4000</span>
            </label>
            <textarea
              id="ticketDescInput"
              className="textarea-field"
              placeholder="Describe the IT issue in detail (e.g., 'I can't log into my laptop, it says my password expired.')"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (inputError) setInputError('');
              }}
              disabled={isAnalyzing}
              rows={3}
            />
          </div>
        </div>

        {inputError && (
          <div className="warning-box" style={{ margin: '0' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{inputError}</span>
          </div>
        )}

        <div className="sample-chips-row">
          <span className="sample-chip-label">Test Samples:</span>
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              className="sample-chip"
              onClick={() => handleSelectSample(sample.text)}
              disabled={isAnalyzing}
            >
              {sample.label}
            </button>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner" />
                <span>Analyzing Ticket with Gemini...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Analyze Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

