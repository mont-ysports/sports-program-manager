import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStaffAuth } from '../hooks/useStaffAuth.jsx';
import {
  getAllRegistrations,
  updatePaymentStatus,
  getStats,
} from '../utils/api.js';
import {
  formatDate,
  formatDateTime,
  getProgramColor,
  PROGRAMS,
  truncate,
  debounce,
} from '../utils/helpers.js';
import './StaffPortal.css';

export default function StaffPortal() {
  const navigate = useNavigate();
  const { isAuthenticated, staffName, logout, loading: authLoading } = useStaffAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/staff/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const [tab, setTab] = useState('overview'); // 'overview' | 'registrations' | 'roster'
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Payment update state
  const [updatingPayment, setUpdatingPayment] = useState({});
  const [paymentMsg, setPaymentMsg] = useState({});

  // Selected roster program
  const [rosterProgram, setRosterProgram] = useState(PROGRAMS[0].value);

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [regsResult, statsResult] = await Promise.all([
        getAllRegistrations({ program: filterProgram, status: filterStatus }),
        getStats(),
      ]);
      setRegistrations(Array.isArray(regsResult.registrations) ? regsResult.registrations : []);
      setStats(statsResult);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [filterProgram, filterStatus]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  // ── Client-side search filter ──────────────────────────────
  const filtered = registrations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      `${r.childFirstName} ${r.childLastName}`.toLowerCase().includes(q) ||
      (r.registrationId || '').toLowerCase().includes(q) ||
      (r.parentEmail || '').toLowerCase().includes(q) ||
      (r.parentPhone || '').includes(q)
    );
  });

  const rosterList = registrations.filter((r) => r.program === rosterProgram);

  // ── Payment status update ──────────────────────────────────
  async function handlePaymentUpdate(registrationId, status) {
    setUpdatingPayment((s) => ({ ...s, [registrationId]: true }));
    try {
      await updatePaymentStatus(registrationId, status);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.registrationId === registrationId ? { ...r, paymentStatus: status } : r
        )
      );
      setPaymentMsg((s) => ({ ...s, [registrationId]: '✓ Updated' }));
      setTimeout(() => setPaymentMsg((s) => { const n = { ...s }; delete n[registrationId]; return n; }), 2000);
    } catch (err) {
      setPaymentMsg((s) => ({ ...s, [registrationId]: '✗ Failed' }));
    } finally {
      setUpdatingPayment((s) => ({ ...s, [registrationId]: false }));
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  // ── Status badge ───────────────────────────────────────────
  function statusBadge(status) {
    const map = {
      Pending: 'badge--pending',
      Paid: 'badge--paid',
      Verified: 'badge--verified',
      Waived: 'badge--checkedin',
      Cancelled: 'badge--cancelled',
    };
    return <span className={`badge ${map[status] || 'badge--pending'}`}>{status || 'Pending'}</span>;
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <span className="spinner spinner--lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="staff-portal page-enter">
      <div className="container container--wide">

        {/* ── Top bar ──────────────────────────────────────── */}
        <div className="staff-portal__topbar">
          <div>
            <h1>Staff Portal</h1>
            <p>Welcome, <strong>{staffName}</strong> 👋</p>
          </div>
          <div className="topbar__actions">
            <button className="btn btn--outline btn--sm" onClick={loadData} disabled={loading}>
              {loading ? <span className="spinner spinner--sm" /> : '🔄 Refresh'}
            </button>
            <Link to="/checkin" className="btn btn--primary btn--sm">
              📲 Check-In Station
            </Link>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: 16 }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="staff-portal__tabs">
          {[
            { id: 'overview',      label: '📊 Overview' },
            { id: 'registrations', label: '📋 All Registrations' },
            { id: 'roster',        label: '👥 Program Roster' },
          ].map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: Overview */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="tab-content">
            {loading && !stats ? (
              <div className="loading-center"><span className="spinner spinner--lg" /></div>
            ) : stats ? (
              <>
                {/* Stats grid */}
                <div className="stats-grid">
                  {[
                    { label: 'Total Registrations', value: stats.total || 0,        icon: '📝', color: 'var(--clr-primary)' },
                    { label: 'Paid',                 value: stats.paid || 0,         icon: '✅', color: 'var(--clr-accent-green)' },
                    { label: 'Pending Payment',      value: stats.pending || 0,      icon: '⏳', color: 'var(--clr-warning)' },
                    { label: 'Checked In Today',     value: stats.checkedIn || 0,    icon: '📲', color: 'var(--clr-secondary)' },
                  ].map((stat) => (
                    <div className="stat-card card" key={stat.label}>
                      <div className="stat-card__icon">{stat.icon}</div>
                      <div className="stat-card__value" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                      <div className="stat-card__label">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Program breakdown */}
                {stats.byProgram && (
                  <div className="card overview__programs">
                    <h2>Registrations by Program</h2>
                    <div className="program-breakdown">
                      {PROGRAMS.map((prog) => {
                        const count = stats.byProgram[prog.value] || 0;
                        const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                        const colors = getProgramColor(prog.value);
                        return (
                          <div className="program-row" key={prog.value}>
                            <div className="program-row__info">
                              <span className="program-row__emoji">{prog.emoji}</span>
                              <span className="program-row__name">{prog.label}</span>
                              <span className="program-row__count">{count} / {prog.spots}</span>
                            </div>
                            <div className="program-row__bar-bg">
                              <div
                                className="program-row__bar-fill"
                                style={{ width: `${Math.min(pct, 100)}%`, background: colors.text }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent registrations */}
                <div className="card">
                  <h2>Recent Registrations</h2>
                  <RegistrationTable
                    rows={registrations.slice(0, 10)}
                    onPaymentUpdate={handlePaymentUpdate}
                    updatingPayment={updatingPayment}
                    paymentMsg={paymentMsg}
                    statusBadge={statusBadge}
                  />
                  {registrations.length > 10 && (
                    <button
                      className="btn btn--ghost btn--sm"
                      style={{ marginTop: 12 }}
                      onClick={() => setTab('registrations')}
                    >
                      View All {registrations.length} →
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
                No data available. Check your Apps Script connection.
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: All Registrations */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'registrations' && (
          <div className="tab-content">
            {/* Filters */}
            <div className="card registrations__filters">
              <div className="filters-row">
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <input
                    type="search"
                    className="form-input"
                    placeholder="🔍 Search by name, ID, email, or phone…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select
                    className="form-select"
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                  >
                    <option value="">All Programs</option>
                    {PROGRAMS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Waived">Waived</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <button className="btn btn--outline btn--sm" onClick={loadData} disabled={loading}>
                  Apply
                </button>
              </div>
              <p className="filters-count">
                Showing <strong>{filtered.length}</strong> of <strong>{registrations.length}</strong> registrations
              </p>
            </div>

            {loading ? (
              <div className="loading-center"><span className="spinner spinner--lg" /></div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <RegistrationTable
                  rows={filtered}
                  onPaymentUpdate={handlePaymentUpdate}
                  updatingPayment={updatingPayment}
                  paymentMsg={paymentMsg}
                  statusBadge={statusBadge}
                />
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
                    No registrations match your filters.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: Program Roster */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'roster' && (
          <div className="tab-content">
            <div className="card roster__selector">
              <div className="roster-program-tabs">
                {PROGRAMS.map((p) => (
                  <button
                    key={p.value}
                    className={`roster-tab ${rosterProgram === p.value ? 'active' : ''}`}
                    onClick={() => setRosterProgram(p.value)}
                  >
                    {p.emoji} {p.label}
                    <span className="roster-tab__count">
                      {registrations.filter((r) => r.program === p.value).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="roster__header">
                <h2>{PROGRAMS.find((p) => p.value === rosterProgram)?.emoji} {rosterProgram} Roster</h2>
                <span className="roster__count">{rosterList.length} participants</span>
              </div>
              {rosterList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
                  No registrations yet for {rosterProgram}.
                </div>
              ) : (
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Child Name</th>
                      <th>Date of Birth</th>
                      <th>T-Shirt</th>
                      <th>Parent</th>
                      <th>Phone</th>
                      <th>Payment</th>
                      <th>Checked In</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterList.map((r, i) => (
                      <tr key={r.registrationId} className={r.checkInTime ? 'row--checkedin' : ''}>
                        <td className="td-num">{i + 1}</td>
                        <td>
                          <div className="td-name">
                            {r.childFirstName} {r.childLastName}
                          </div>
                          <div className="td-id">{r.registrationId}</div>
                        </td>
                        <td>{formatDate(r.dateOfBirth)}</td>
                        <td>{r.shirtSize || '—'}</td>
                        <td>{`${r.parentFirstName} ${r.parentLastName}`}</td>
                        <td>{r.parentPhone}</td>
                        <td>{statusBadge(r.paymentStatus)}</td>
                        <td>
                          {r.checkInTime
                            ? <span className="badge badge--checkedin">✓ {formatDateTime(r.checkInTime)}</span>
                            : <span className="td-muted">—</span>
                          }
                        </td>
                        <td>
                          {r.allergies && r.allergies !== 'None' && (
                            <span className="allergy-tag">⚠️ {truncate(r.allergies, 20)}</span>
                          )}
                          {r.medicalNotes && (
                            <span className="allergy-tag">🏥 {truncate(r.medicalNotes, 20)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Reusable registration table ──────────────────────────── */
function RegistrationTable({ rows, onPaymentUpdate, updatingPayment, paymentMsg, statusBadge }) {
  if (!rows.length) return null;

  return (
    <div className="reg-table-wrapper">
      <table className="reg-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Child</th>
            <th>Program</th>
            <th>DOB</th>
            <th>Parent</th>
            <th>Email</th>
            <th>Payment</th>
            <th>Check-In</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const colors = getProgramColor(r.program);
            return (
              <tr key={r.registrationId} className={r.checkInTime ? 'row--checkedin' : ''}>
                <td>
                  <code className="td-reg-id">{r.registrationId}</code>
                </td>
                <td>
                  <div className="td-name">{r.childFirstName} {r.childLastName}</div>
                </td>
                <td>
                  <span
                    className="program-pill"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {r.program}
                  </span>
                </td>
                <td>{formatDate(r.dateOfBirth)}</td>
                <td>{r.parentFirstName} {r.parentLastName}</td>
                <td className="td-email">{r.parentEmail}</td>
                <td>{statusBadge(r.paymentStatus)}</td>
                <td>
                  {r.checkInTime
                    ? <span className="badge badge--checkedin">✓</span>
                    : <span className="td-muted">—</span>
                  }
                </td>
                <td className="td-muted">{formatDate(r.registrationTimestamp)}</td>
                <td>
                  <div className="action-cell">
                    <select
                      className="payment-select"
                      value={r.paymentStatus || 'Pending'}
                      onChange={(e) => onPaymentUpdate(r.registrationId, e.target.value)}
                      disabled={updatingPayment[r.registrationId]}
                      title="Update payment status"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Waived">Waived</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    {paymentMsg[r.registrationId] && (
                      <span className="update-msg">{paymentMsg[r.registrationId]}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
