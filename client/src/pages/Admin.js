import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import './Admin.css';
import '../components/ReportModal.css';

// ─── Reusable helpers ─────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StatusBadge = ({ status }) => (
  <span className={`admin-badge admin-badge--${status}`}>{status}</span>
);

const Pagination = ({ page, total, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
      <span>{page} / {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next ›</button>
    </div>
  );
};

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
const DashboardTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading stats…</div>;
  if (!stats) return <div className="admin-error">Failed to load stats.</div>;

  const cards = [
    { label: 'Total Users',       value: stats.users.total,             sub: `Students: ${stats.users.byRole?.student || 0} · Tutors: ${stats.users.byRole?.tutor || 0} · Admins: ${stats.users.byRole?.admin || 0}`, color: '#667eea' },
    { label: 'Notes Uploaded',    value: stats.notes.total,             sub: '',                                                                                                                                       color: '#48bb78' },
    { label: 'Payments',          value: stats.payments.total,          sub: `Pending: ${stats.payments.pending} · Approved: ${stats.payments.approved} · Rejected: ${stats.payments.rejected}`,                     color: '#ed8936' },
    { label: 'Forum Questions',   value: stats.questions.total,         sub: '',                                                                                                                                       color: '#9f7aea' },
    { label: 'Sessions',          value: stats.sessions.total,          sub: '',                                                                                                                                       color: '#38b2ac' },
    { label: 'Session Payments',  value: stats.sessionPayments.total,   sub: `Pending: ${stats.sessionPayments.pending} · Approved: ${stats.sessionPayments.approved}`,                                              color: '#f56565' },
    { label: 'Reports',           value: stats.reports?.total ?? 0,     sub: `Pending: ${stats.reports?.pending ?? 0} · Under review: ${stats.reports?.under_review ?? 0}`,                                           color: '#e53e3e' },
  ];

  return (
    <div className="admin-dashboard">
      <h2 className="admin-section-title">Overview</h2>
      <div className="admin-stats-grid">
        {cards.map(c => (
          <div key={c.label} className="admin-stat-card" style={{ borderTopColor: c.color }}>
            <div className="admin-stat-value" style={{ color: c.color }}>{c.value}</div>
            <div className="admin-stat-label">{c.label}</div>
            {c.sub && <div className="admin-stat-sub">{c.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminService.getUsers({ search, role: roleFilter, page, limit: 15 })
      .then(data => { setUsers(data.users); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    setProcessing(userId);
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating role');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setProcessing(userId);
    try {
      await adminService.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting user');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">User Management</h2>

      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search by name / email / username…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="admin-select" value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="tutor">Tutor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading users…</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Notes</th>
                  <th>Payments</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No users found</td></tr>
                )}
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>@{u.username}</div>
                    </td>
                    <td>{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>{u.notes_count}</td>
                    <td>{u.payments_count}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-action-row">
                        <select className="admin-role-select"
                          value={u.role}
                          disabled={processing === u.id}
                          onChange={e => handleRoleChange(u.id, e.target.value)}>
                          <option value="student">student</option>
                          <option value="tutor">tutor</option>
                          <option value="admin">admin</option>
                        </select>
                        <button className="admin-btn admin-btn--danger"
                          disabled={processing === u.id}
                          onClick={() => handleDelete(u.id, u.username)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

// ─── Notes Tab ────────────────────────────────────────────────────────────────
const NotesTab = () => {
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchNotes = useCallback(() => {
    setLoading(true);
    adminService.getNotes({ search, page, limit: 15 })
      .then(data => { setNotes(data.notes); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleDelete = async (noteId, title) => {
    if (!window.confirm(`Delete note "${title}"? This cannot be undone.`)) return;
    setProcessing(noteId);
    try {
      await adminService.deleteNote(noteId);
      fetchNotes();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting note');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Notes Management</h2>

      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search by title / subject…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading ? (
        <div className="admin-loading">Loading notes…</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Uploader</th>
                  <th>Price</th>
                  <th>Downloads</th>
                  <th>Rating</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notes.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>No notes found</td></tr>
                )}
                {notes.map(n => (
                  <tr key={n.id}>
                    <td>
                      <Link to={`/notes/${n.id}`} style={{ color: '#667eea', fontWeight: 600 }}>
                        {n.title}
                      </Link>
                    </td>
                    <td>{n.subject}</td>
                    <td>{n.category}</td>
                    <td>@{n.uploader}</td>
                    <td>{n.is_free ? <span style={{ color: '#48bb78' }}>Free</span> : `NPR ${n.price}`}</td>
                    <td>{n.downloads}</td>
                    <td>{parseFloat(n.rating).toFixed(1)} ★</td>
                    <td>{new Date(n.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="admin-btn admin-btn--danger"
                        disabled={processing === n.id}
                        onClick={() => handleDelete(n.id, n.title)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

// ─── Payments Tab ─────────────────────────────────────────────────────────────
const PaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchPayments = useCallback(() => {
    setLoading(true);
    adminService.getAllPayments(filter)
      .then(data => setPayments(data.payments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleStatus = async (id, status) => {
    const admin_notes = window.prompt(`Add notes for "${status}" (optional):`);
    if (admin_notes === null) return; // cancelled
    setProcessing(id);
    try {
      await adminService.updatePaymentStatus(id, status, admin_notes);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating payment');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Payment Management</h2>

      <div className="admin-toolbar">
        <select className="admin-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading payments…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Note</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Screenshot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>No payments found</td></tr>
              )}
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.username}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{p.email}</div>
                  </td>
                  <td>
                    {p.note_title
                      ? <Link to={`/notes/${p.note_id}`} style={{ color: '#667eea' }}>{p.note_title}</Link>
                      : <span style={{ color: '#aaa' }}>N/A</span>}
                  </td>
                  <td>NPR {p.amount}</td>
                  <td>{p.transaction_reference || '—'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <a className="admin-link"
                      href={`${API_BASE}/${p.screenshot_path}`}
                      target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </td>
                  <td>
                    {p.status === 'pending' ? (
                      <div className="admin-action-row">
                        <button className="admin-btn admin-btn--success"
                          disabled={processing === p.id}
                          onClick={() => handleStatus(p.id, 'approved')}>
                          Approve
                        </button>
                        <button className="admin-btn admin-btn--danger"
                          disabled={processing === p.id}
                          onClick={() => handleStatus(p.id, 'rejected')}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#888' }}>{p.admin_notes || '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Forum Tab ────────────────────────────────────────────────────────────────
const ForumTab = () => {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchQuestions = useCallback(() => {
    setLoading(true);
    adminService.getQuestions({ search, page, limit: 15 })
      .then(data => { setQuestions(data.questions); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question and all its answers?')) return;
    setProcessing(id);
    try {
      await adminService.deleteQuestion(id);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting question');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Forum Management</h2>

      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search by title / subject…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading ? (
        <div className="admin-loading">Loading questions…</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Author</th>
                  <th>Answers</th>
                  <th>Votes</th>
                  <th>Views</th>
                  <th>Answered</th>
                  <th>Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>No questions found</td></tr>
                )}
                {questions.map(q => (
                  <tr key={q.id}>
                    <td>
                      <Link to={`/forum/questions/${q.id}`} style={{ color: '#667eea', fontWeight: 600 }}>
                        {q.title.length > 50 ? q.title.slice(0, 50) + '…' : q.title}
                      </Link>
                    </td>
                    <td>{q.subject || '—'}</td>
                    <td>@{q.author}</td>
                    <td>{q.answer_count}</td>
                    <td>{q.votes}</td>
                    <td>{q.views}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${q.is_answered ? 'approved' : 'pending'}`}>
                        {q.is_answered ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>{new Date(q.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="admin-btn admin-btn--danger"
                        disabled={processing === q.id}
                        onClick={() => handleDelete(q.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

// ─── Reports Tab ──────────────────────────────────────────────────────────────
const REPORT_TYPE_LABEL = {
  harassment:             'Harassment or Bullying',
  fraud:                  'Fraud / Scam',
  inappropriate_behavior: 'Inappropriate Behavior',
  no_show:                'No-Show / Didn\'t Attend',
  spam:                   'Spam or Misleading Content',
  fake_profile:           'Fake / Impersonation Profile',
  other:                  'Other',
};

const ReportsTab = () => {
  const [reports, setReports]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filter, setFilter]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [processing, setProcessing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [actionForm, setActionForm] = useState({ id: null, status: '', action_taken: '' });

  const fetchReports = useCallback(() => {
    setLoading(true);
    adminService.getReports({ status: filter, page, limit: 15 })
      .then(data => { setReports(data.reports); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const openAction = (report, newStatus) => {
    setActionForm({ id: report.id, status: newStatus, action_taken: report.action_taken || '' });
  };

  const handleAction = async () => {
    setProcessing(actionForm.id);
    try {
      await adminService.updateReportStatus(actionForm.id, actionForm.status, actionForm.action_taken);
      setActionForm({ id: null, status: '', action_taken: '' });
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating report');
    } finally {
      setProcessing(null);
    }
  };

  const statusColor = {
    pending:      '#ed8936',
    under_review: '#667eea',
    resolved:     '#48bb78',
    dismissed:    '#a0aec0',
  };

  return (
    <div>
      <h2 className="admin-section-title">Reports Management</h2>

      <div className="admin-toolbar">
        <select className="admin-select" value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading reports…</div>
      ) : (
        <>
          {reports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No reports found</div>
          )}

          {reports.map(r => (
            <div key={r.id} className="admin-report-card">
              {/* Card Header */}
              <div className="admin-report-header" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div className="admin-report-meta">
                  <span className="admin-report-type">{REPORT_TYPE_LABEL[r.report_type] || r.report_type}</span>
                  <span
                    className="admin-badge"
                    style={{ backgroundColor: statusColor[r.status] + '22', color: statusColor[r.status], border: `1px solid ${statusColor[r.status]}` }}
                  >
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="admin-report-summary">
                  <span><strong>{r.reporter_name}</strong> <small>(@{r.reporter_username} · {r.reporter_role})</small></span>
                  <span className="admin-report-arrow"> → </span>
                  <span><strong>{r.reported_name}</strong> <small>(@{r.reported_username} · {r.reported_role})</small></span>
                  {r.session_subject && (
                    <span className="admin-report-session-tag">📅 {r.session_subject} · {r.session_date ? new Date(r.session_date).toLocaleDateString() : ''}</span>
                  )}
                </div>
                <small style={{ color: '#888', marginLeft: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </small>
                <span className="admin-report-chevron">{expanded === r.id ? '▲' : '▼'}</span>
              </div>

              {/* Expanded Body */}
              {expanded === r.id && (
                <div className="admin-report-body">
                  <div className="admin-report-description">
                    <strong>Description:</strong>
                    <p>{r.description}</p>
                  </div>

                  {r.action_taken && (
                    <div className="admin-report-description" style={{ marginTop: '10px' }}>
                      <strong>Action taken:</strong>
                      <p>{r.action_taken}</p>
                      {r.reviewer_name && <small style={{ color: '#888' }}>Reviewed by {r.reviewer_name} on {new Date(r.reviewed_at).toLocaleDateString()}</small>}
                    </div>
                  )}

                  <div className="admin-action-row" style={{ marginTop: '16px', flexWrap: 'wrap' }}>
                    {r.status === 'pending' && (
                      <button className="admin-btn admin-btn--primary"
                        disabled={processing === r.id}
                        onClick={() => openAction(r, 'under_review')}>
                        Mark Under Review
                      </button>
                    )}
                    {(r.status === 'pending' || r.status === 'under_review') && (
                      <>
                        <button className="admin-btn admin-btn--success"
                          disabled={processing === r.id}
                          onClick={() => openAction(r, 'resolved')}>
                          Mark Resolved
                        </button>
                        <button className="admin-btn admin-btn--secondary"
                          disabled={processing === r.id}
                          onClick={() => openAction(r, 'dismissed')}>
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
        </>
      )}

      {/* Action Confirmation Modal */}
      {actionForm.id && (
        <div className="report-overlay" onClick={() => setActionForm({ id: null, status: '', action_taken: '' })}>
          <div className="report-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <h3 style={{ marginTop: 0, textTransform: 'capitalize' }}>
              {actionForm.status === 'under_review' && '🔍 Move to Under Review'}
              {actionForm.status === 'resolved'     && '✅ Mark as Resolved'}
              {actionForm.status === 'dismissed'    && '🚫 Dismiss Report'}
            </h3>
            <div className="report-field">
              <label className="report-label">Admin action notes (optional)</label>
              <textarea
                className="report-textarea"
                rows={4}
                placeholder="Describe any action taken or reason for dismissal…"
                value={actionForm.action_taken}
                onChange={e => setActionForm(f => ({ ...f, action_taken: e.target.value }))}
              />
            </div>
            <div className="report-actions" style={{ marginTop: '16px' }}>
              <button className="report-btn report-btn--secondary"
                onClick={() => setActionForm({ id: null, status: '', action_taken: '' })}>
                Cancel
              </button>
              <button
                className={`report-btn ${actionForm.status === 'dismissed' ? 'report-btn--secondary' : 'report-btn--primary'}`}
                disabled={processing === actionForm.id}
                onClick={handleAction}>
                {processing === actionForm.id ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Admin Page ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'users',     label: '👥 Users' },
  { key: 'notes',     label: '📄 Notes' },
  { key: 'payments',  label: '💳 Payments' },
  { key: 'forum',     label: '💬 Forum' },  { key: 'reports',   label: '🚩 Reports' },];

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (user?.role !== 'admin') {
    return (
      <div className="admin-denied">
        <h2>Access Denied</h2>
        <p>You must be an admin to access this page.</p>
        <Link to="/" className="admin-btn admin-btn--primary">Go Home</Link>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'users':     return <UsersTab />;
      case 'notes':     return <NotesTab />;
      case 'payments':  return <PaymentsTab />;
      case 'forum':     return <ForumTab />;
      case 'reports':   return <ReportsTab />;
      default:          return null;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <span className="admin-badge admin-badge--admin">admin</span>
      </div>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`admin-tab ${activeTab === t.key ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderTab()}
      </div>
    </div>
  );
};

export default Admin;
