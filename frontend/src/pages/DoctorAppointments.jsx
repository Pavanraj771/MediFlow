import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarCheck, Clock, Filter, Search,
  CheckCircle2, XCircle, AlertCircle, ClipboardList,
  UserRound, ChevronRight, Stethoscope,
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
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

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
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = appointments.filter(a => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchSearch = !search ||
      a.patient_details?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.reason_for_visit?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter(a => a.appointment_datetime?.startsWith(todayStr) && a.status === 'SCHEDULED').length;
  const upcomingCount = appointments.filter(a => a.status === 'SCHEDULED').length;
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  const formatDateTime = (iso) => new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

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
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{
          flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 14px', height: '44px',
          background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px',
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input type="text" placeholder="Search patient or reason…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.88rem' }}
          />
        </div>
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

      {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading appointments…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No appointments match your filters.</p>
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
                <div style={{
                  width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem',
                }}>
                  {apt.patient_details?.first_name?.[0] || 'P'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
                    {apt.patient_details?.full_name || 'Patient'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} /> {formatDateTime(apt.appointment_datetime)}
                  </p>
                  {apt.reason_for_visit && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {apt.reason_for_visit}
                    </p>
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
    </div>
  );
};

export default DoctorAppointments;
