import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarCheck, Clock, Filter, Search,
  CheckCircle2, XCircle, AlertCircle, ClipboardList,
  UserRound, ChevronRight, Stethoscope, ArrowUpDown, Calendar, RotateCcw, X, Star
} from 'lucide-react';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const STATUS_CONFIG = {
  SCHEDULED: { bg: 'rgba(14,165,233,0.12)', color: '#0ea5e9', border: 'rgba(14,165,233,0.25)', label: 'Scheduled' },
  COMPLETED: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)', label: 'Completed' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)', label: 'Cancelled' },
  NO_SHOW: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', label: 'No-Show' },
};

const DoctorAppointments = () => {
  const [searchParams] = useSearchParams();
  const paramStatus = searchParams.get('status') || 'ALL';
  const paramDate = searchParams.get('date') || 'ALL';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(paramStatus);
  const [dateFilter, setDateFilter] = useState(paramDate); // 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'CUSTOM'
  const [customDate, setCustomDate] = useState('');
  const [sortOrder, setSortOrder] = useState('ASC'); // 'ASC' (soonest first) | 'DESC' (latest first)
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [cancelModalAppointment, setCancelModalAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelModalError, setCancelModalError] = useState('');

  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('date');
    if (s) setStatusFilter(s);
    if (d) setDateFilter(d);
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    setSearch(val.trim());
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(id + newStatus);
    try {
      await appointmentsService.updateAppointmentStatus(id, newStatus);
      await fetchAppointments();
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDoctorCancel = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setCancelModalError('Please enter a cancellation reason.');
      return;
    }
    setCancelSubmitting(true);
    setCancelModalError('');
    try {
      await appointmentsService.cancelAppointment(cancelModalAppointment.id, cancellationReason.trim());
      setCancelModalAppointment(null);
      setCancellationReason('');
      await fetchAppointments();
    } catch (err) {
      console.error(err);
      setCancelModalError(err.response?.data?.detail || 'Failed to cancel appointment.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7;
  const daysUntilSunday = 6 - currentDayOfWeek;
  const endOfWeekObj = new Date(now);
  endOfWeekObj.setDate(now.getDate() + daysUntilSunday);
  const endOfWeekStr = endOfWeekObj.toISOString().split('T')[0];

  const filtered = appointments.filter(a => {
    // 1. Status Filter
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;

    // 2. Search Filter (patient name, reason, id, formatted date)
    const apptDate = a.appointment_datetime ? new Date(a.appointment_datetime) : null;
    const dateFormatted = apptDate ? apptDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const dateIso = a.appointment_datetime?.split('T')[0] || '';
    const sLower = search.trim().toLowerCase();
    const matchSearch = !sLower ||
      a.patient_details?.full_name?.toLowerCase().includes(sLower) ||
      a.reason_for_visit?.toLowerCase().includes(sLower) ||
      dateFormatted.toLowerCase().includes(sLower) ||
      dateIso.includes(sLower) ||
      String(a.id).toLowerCase().includes(sLower);

    // 3. Date Filter
    let matchDate = true;
    if (dateFilter === 'CUSTOM' && customDate) {
      matchDate = dateIso === customDate;
    } else if (dateFilter === 'TODAY') {
      matchDate = dateIso === todayStr;
    } else if (dateFilter === 'TOMORROW') {
      matchDate = dateIso === tomorrowStr;
    } else if (dateFilter === 'THIS_WEEK') {
      matchDate = dateIso >= todayStr && dateIso <= endOfWeekStr;
    }

    return matchStatus && matchSearch && matchDate;
  }).sort((a, b) => {
    const timeA = new Date(a.appointment_datetime).getTime() || 0;
    const timeB = new Date(b.appointment_datetime).getTime() || 0;
    return sortOrder === 'ASC' ? timeA - timeB : timeB - timeA;
  });

  const todayCount = appointments.filter(a => a.appointment_datetime?.startsWith(todayStr) && a.status === 'SCHEDULED').length;
  const upcomingCount = appointments.filter(a => a.status === 'SCHEDULED').length;
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  const formatDateTime = (iso) => new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const resetAllFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('ALL');
    setDateFilter('ALL');
    setCustomDate('');
    setSortOrder('ASC');
  };

  const hasActiveFilters = search || statusFilter !== 'ALL' || dateFilter !== 'ALL' || customDate;

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/doctor" className="patient-back-link"><ArrowLeft size={17} /> Back to dashboard</Link>
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <CalendarCheck size={24} />
        </div>
        <div>
          <p className="patient-eyebrow" style={{ color: 'var(--color-doctor)' }}>CLINICAL WORKSTATION</p>
          <h1>Patient Appointments</h1>
          <p>Manage your schedule, mark statuses, and access consultations.</p>
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: "Today's Patients", value: todayCount, color: '#f59e0b' },
          { label: 'Upcoming', value: upcomingCount, color: '#0ea5e9' },
          { label: 'Completed', value: completedCount, color: '#10b981' },
          { label: 'Total', value: appointments.length, color: '#8b5cf6' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '16px 20px', borderRadius: '14px',
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {/* Row 1: Search & Status Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
              padding: '0 14px', height: '44px',
              background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px',
            }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search by patient name, reason, date, or ID…"
                value={searchInput}
                onChange={handleSearchChange}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.88rem' }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="patient-primary-button"
              style={{
                height: '44px', padding: '0 18px', background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
              }}
            >
              <Search size={15} /> Search
            </button>
          </form>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={14} color="var(--text-muted)" />
            {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '6px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: statusFilter === s ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                background: statusFilter === s ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: statusFilter === s ? '#10b981' : 'var(--text-muted)', transition: 'all 0.2s',
              }}>{s.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        {/* Row 2: Date Filters & Sort by Date */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
          padding: '12px 16px', borderRadius: '12px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Calendar size={15} color="var(--color-doctor)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Date:</span>
            {[
              { id: 'ALL', label: 'All Dates' },
              { id: 'TODAY', label: "Today" },
              { id: 'TOMORROW', label: 'Tomorrow' },
              { id: 'THIS_WEEK', label: 'This Week' },
            ].map(df => (
              <button
                key={df.id}
                type="button"
                onClick={() => { setDateFilter(df.id); setCustomDate(''); }}
                style={{
                  padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  border: dateFilter === df.id && !customDate ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  background: dateFilter === df.id && !customDate ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: dateFilter === df.id && !customDate ? '#10b981' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {df.label}
              </button>
            ))}

            {/* Custom Date Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                value={customDate}
                onChange={e => {
                  setCustomDate(e.target.value);
                  if (e.target.value) setDateFilter('CUSTOM');
                  else setDateFilter('ALL');
                }}
                style={{
                  height: '32px', padding: '0 10px', borderRadius: '8px',
                  background: 'var(--surface-input)', border: customDate ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none',
                }}
              />
              {customDate && (
                <button
                  type="button"
                  onClick={() => { setCustomDate(''); setDateFilter('ALL'); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'underline',
                  }}
                >
                  Clear date
                </button>
              )}
            </div>
          </div>

          {/* Sort By Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '9px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
              }}
              title="Click to switch date sort order"
            >
              <ArrowUpDown size={14} />
              Sort by Date: {sortOrder === 'ASC' ? 'Soonest First (Asc)' : 'Latest First (Desc)'}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
                }}
                title="Reset all filters"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Results counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 4px' }}>
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{appointments.length}</strong> appointments
            {dateFilter !== 'ALL' && ` (${dateFilter === 'CUSTOM' ? customDate : dateFilter.replace('_', ' ')})`}
          </span>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading appointments…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No appointments match your filters.</p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="patient-secondary-button"
              style={{ marginTop: '12px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(apt => {
          const sc = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED;
          const hasConsult = !!apt.consultation;
          return (
            <div key={apt.id} style={{
              padding: '18px 20px', borderRadius: '14px',
              background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Link
                  to={`/doctor/patients/${apt.patient}`}
                  style={{ textDecoration: 'none' }}
                  title="View patient profile, all visited consultations and clinical notes"
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem',
                    transition: 'transform 0.15s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                  >
                    {apt.patient_details?.first_name?.[0] || 'P'}
                  </div>
                </Link>
                <div>
                  <Link
                    to={`/doctor/patients/${apt.patient}`}
                    style={{
                      margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-doctor)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-main)'; }}
                    title="View patient profile, all visited consultations and clinical notes"
                  >
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'inherit' }}>
                      {apt.patient_details?.full_name || 'Patient'}
                    </h3>
                    <ChevronRight size={13} color="var(--text-muted)" />
                  </Link>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} /> {formatDateTime(apt.appointment_datetime)}
                  </p>
                  {apt.reason_for_visit && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {apt.reason_for_visit}
                    </p>
                  )}
                  {apt.status === 'CANCELLED' && apt.cancellation_reason && (
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>
                      <strong>Cancellation reason:</strong> {apt.cancellation_reason}
                    </p>
                  )}
                  {apt.status === 'COMPLETED' && apt.review && (
                    <div style={{
                      margin: '6px 0 0', padding: '8px 12px', borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', gap: '1px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= apt.review.rating ? '#f59e0b' : 'transparent'}
                              color={s <= apt.review.rating ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>
                          Patient Rating: {apt.review.rating}/5
                        </span>
                      </div>
                      {apt.review.comment && (
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                          "{apt.review.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                  background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                }}>{sc.label}</span>

                {apt.status === 'SCHEDULED' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                      disabled={!!actionLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                      }}
                    >
                      <CheckCircle2 size={14} /> Complete
                    </button>
                    <button
                      onClick={() => handleStatusChange(apt.id, 'NO_SHOW')}
                      disabled={!!actionLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      <XCircle size={14} /> No-Show
                    </button>
                    <button
                      onClick={() => {
                        setCancelModalAppointment(apt);
                        setCancellationReason('');
                        setCancelModalError('');
                      }}
                      disabled={!!actionLoading}
                      className="btn-danger-action"
                      title="Cancel this appointment with reason"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </>
                )}

                {(apt.status === 'COMPLETED' || apt.status === 'SCHEDULED') && (
                  <Link
                    to={`/doctor/appointments/${apt.id}/consult`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                      background: hasConsult ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                      color: hasConsult ? '#6366f1' : '#10b981',
                      border: hasConsult ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(16,185,129,0.3)',
                      textDecoration: 'none',
                    }}
                  >
                    <Stethoscope size={14} />
                    {hasConsult ? 'Edit Notes' : 'Add Notes'}
                    <ChevronRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {cancelModalAppointment && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !cancelSubmitting) setCancelModalAppointment(null); }}
        >
          <div
            style={{
              width: '100%', maxWidth: '480px', backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px', border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} /> Cancel Appointment
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalAppointment(null)}
                disabled={cancelSubmitting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              You are cancelling the appointment with <strong>{cancelModalAppointment.patient_details?.full_name || cancelModalAppointment.patient_details?.email}</strong> on <strong>{formatDateTime(cancelModalAppointment.appointment_datetime)}</strong>.
            </p>

            <form onSubmit={handleDoctorCancel}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Reason for Cancellation <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Doctor called for emergency surgery, clinic rescheduled, physician leave..."
                required
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                  color: 'var(--text-main)', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none',
                  resize: 'vertical', marginBottom: '14px',
                }}
              />

              {cancelModalError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>
                  {cancelModalError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalAppointment(null)}
                  disabled={cancelSubmitting}
                  className="patient-secondary-button"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting || !cancellationReason.trim()}
                  className="btn-danger-action"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
