import React, { useState } from 'react';
import { reportService } from '../services/reportService';
import './ReportModal.css';

const REPORT_TYPES = [
  { value: 'harassment',             label: 'Harassment or Bullying' },
  { value: 'fraud',                  label: 'Fraud / Scam' },
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'no_show',                label: 'No-Show / Didn\'t Attend' },
  { value: 'spam',                   label: 'Spam or Misleading Content' },
  { value: 'fake_profile',           label: 'Fake / Impersonation Profile' },
  { value: 'other',                  label: 'Other' },
];

const ReportModal = ({ show, onClose, reportedUser, sessionId = null }) => {
  const [form, setForm] = useState({ report_type: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  const handleClose = () => {
    setForm({ report_type: '', description: '' });
    setSuccess(false);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.report_type) {
      setError('Please select a report type.');
      return;
    }
    if (form.description.trim().split(/\s+/).filter(Boolean).length < 5) {
      setError('Please provide a description of at least 5 words.');
      return;
    }

    setSubmitting(true);
    try {
      await reportService.submitReport({
        reported_id: reportedUser.id,
        report_type: form.report_type,
        description: form.description.trim(),
        ...(sessionId ? { related_session_id: sessionId } : {}),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-overlay" onClick={handleClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>

        {success ? (
          <div className="report-success">
            <div className="report-success-icon">✓</div>
            <h3>Report Submitted</h3>
            <p>
              Your report against <strong>{reportedUser?.full_name || reportedUser?.username}</strong> has
              been submitted. Our admin team will review it shortly.
            </p>
            <button className="report-btn report-btn--primary" onClick={handleClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="report-header">
              <h3 className="report-title">
                🚩 Report User
              </h3>
              <button className="report-close" onClick={handleClose}>✕</button>
            </div>

            <p className="report-subtitle">
              Reporting <strong>{reportedUser?.full_name || reportedUser?.username}</strong>
              {sessionId && <span className="report-session-tag"> · Related to a session</span>}
            </p>

            {error && <div className="report-error">{error}</div>}

            <form onSubmit={handleSubmit} className="report-form">
              <div className="report-field">
                <label className="report-label">Reason *</label>
                <div className="report-type-grid">
                  {REPORT_TYPES.map(t => (
                    <label
                      key={t.value}
                      className={`report-type-option ${form.report_type === t.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="report_type"
                        value={t.value}
                        checked={form.report_type === t.value}
                        onChange={() => setForm(f => ({ ...f, report_type: t.value }))}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="report-field">
                <label className="report-label">
                  Describe what happened *
                  <span className="report-char-count">
                    {form.description.length} / 1000
                  </span>
                </label>
                <textarea
                  className="report-textarea"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 1000) }))}
                  placeholder="Please provide details to help us investigate…"
                  rows={5}
                  required
                />
              </div>

              <p className="report-disclaimer">
                False reports may result in action against your account.
              </p>

              <div className="report-actions">
                <button type="button" className="report-btn report-btn--secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="report-btn report-btn--danger" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
