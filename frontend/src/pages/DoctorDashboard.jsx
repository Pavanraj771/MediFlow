import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, Activity, Calendar, CalendarDays, Clock, ShieldCheck,
  Users, ClipboardList, HeartPulse, Plus, CheckCircle2, XCircle,
  CalendarCheck, ChevronRight, UserRound, AlertCircle, MessageSquare, RotateCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorDashboard = () => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [refills, setRefills] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingRefills, setLoadingRefills] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: '', start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchSchedules();
    fetchRefills();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoadingAppts(true);
      const data = await appointmentsService.getAppointments();
      setAppointments(data);
    } catch (err) { console.error(err); }
    finally { setLoadingAppts(false); }
  };

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const data = await appointmentsService.getSchedules();
      setSchedules(data);
    } catch (err) { console.error(err); }
    finally { setLoadingSchedules(false); }
  };

  const fetchRefills = async () => {
    try {
      setLoadingRefills(true);
      const data = await appointmentsService.getRefills();
      setRefills(data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingRefills(false); }
  };

  const handleRefillDecision = async (id, decision) => {
    const notes = prompt(`Enter optional physician response for ${decision}:`) || '';
    try {
      await appointmentsService.decideRefill(id, decision, notes);
      fetchRefills();
    } catch (err) {
      console.error(err);
      alert('Failed to update refill request.');
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setSavingSchedule(true);
    try {
      await appointmentsService.createSchedule(scheduleForm);
      setShowScheduleForm(false);
      setScheduleForm({ day_of_week: '', start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30 });
      fetchSchedules();
    } catch (err) {
      const msg = err.response?.data?.detail ||
                  (typeof err.response?.data === 'object' ? Object.values(err.response.data).flat().join(' ') : null) ||
                  'Failed to save schedule. Please check for time conflicts.';
      setScheduleError(msg);
      console.error(err);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try { await appointmentsService.deleteSchedule(id); fetchSchedules(); } catch (err) { console.error(err); }
  };

  const formatDateTime = (iso) => new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const upcomingAppointments = appointments.filter(a => a.status === 'SCHEDULED');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = upcomingAppointments.filter(a => a.appointment_datetime?.startsWith(todayStr));
  const pendingRefills = refills.filter(r => r.status === 'PENDING');

  const inputStyle = {
    background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
    color: 'var(--text-main)', padding: '0 14px', borderRadius: '10px',
    height: '44px', outline: 'none', fontSize: '0.9rem', width: '100%',
  };

  const TABS = [
    { id: 'overview', label: 'Appointments', icon: ClipboardList },
    { id: 'refills', label: `Refills (${pendingRefills.length})`, icon: RotateCw },
    { id: 'schedule', label: 'My Schedule', icon: Calendar },
  ];

  const QUICK_LINKS = [
    { icon: MessageSquare, label: 'Care Messages', sub: 'Patient follow-up inbox', to: '/doctor/messages', color: '#0ea5e9' },
    { icon: CalendarCheck, label: 'All Appointments', sub: 'Manage & update status', to: '/doctor/appointments', color: '#10b981' },
    { icon: Users, label: 'My Patients', sub: 'View patient records', to: '/doctor/patients', color: '#8b5cf6' },
    { icon: UserRound, label: 'My Profile', sub: 'Edit professional details', to: '/doctor/profile', color: '#f59e0b' },
  ];

  return (
    <div className="patient-portal-page">
      {/* Hero Banner */}
      <section className="patient-welcome-card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.08) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <div className="patient-welcome-card__topline">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '1.25rem',
              boxShadow: '0 0 20px rgba(16,185,129,0.4)',
            }}>
              {(user?.full_name || user?.first_name || 'Dr').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-doctor)', letterSpacing: '0.08em' }}>CLINICAL WORKSTATION</p>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Dr. {user?.full_name || user?.first_name}</h1>
            </div>
          </div>
          <span className="patient-role-pill" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--color-doctor)' }}>
            <ShieldCheck size={14} /> DOCTOR PORTAL
          </span>
        </div>
        <div className="patient-welcome-card__content" style={{ paddingTop: '10px' }}>
          <p className="patient-welcome-card__intro" style={{ maxWidth: '480px' }}>
            Manage your schedule, view patient appointments, add consultation notes — all in one place.
          </p>
        </div>
        <div className="patient-welcome-card__decoration" aria-hidden="true">
          <div className="patient-welcome-card__orb patient-welcome-card__orb--one" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)' }} />
          <div className="patient-welcome-card__orb patient-welcome-card__orb--two" style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.4) 0%, transparent 70%)' }} />
          <div className="patient-welcome-card__pulse" style={{ color: 'var(--color-doctor)' }}><Activity size={36} /></div>
        </div>
        <div className="patient-welcome-card__footer">
          <span><span className="patient-live-dot" style={{ background: '#10b981' }} /> Today's appointments: <strong>{todayAppts.length}</strong></span>
          <span>{user?.email}</span>
        </div>
      </section>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '28px' }}>
        {QUICK_LINKS.map(({ icon: Icon, label, sub, to, color }) => (
          <Link key={label} to={to} style={{
            padding: '18px 20px', borderRadius: '14px', textDecoration: 'none',
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--heading-color)' }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</p>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '20px' }}>
        {[
          { icon: CalendarDays, label: 'Total Appointments', value: appointments.length, color: '#0ea5e9' },
          { icon: CalendarCheck, label: 'Upcoming', value: upcomingAppointments.length, color: '#10b981' },
          { icon: Users, label: "Today's Patients", value: todayAppts.length, color: '#f59e0b' },
          { icon: Clock, label: 'Schedule Slots', value: schedules.length, color: '#8b5cf6' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            padding: '20px 24px', background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)', borderRadius: '16px',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</p>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading-color)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '32px', borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === id ? '2px solid var(--color-doctor)' : '2px solid transparent',
            color: activeTab === id ? 'var(--color-doctor)' : 'var(--text-muted)',
            fontWeight: activeTab === id ? 700 : 500, fontSize: '0.9rem', marginBottom: '-1px', transition: 'all 0.2s',
          }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Appointments Tab */}
      {activeTab === 'overview' && (
        <div className="patient-profile-card" style={{ marginTop: '20px' }}>
          <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2>Recent Appointments</h2>
              <p>Showing your latest patient consultations.</p>
            </div>
            <Link to="/doctor/appointments" style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px',
              fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none',
              background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)',
            }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingAppts && <p style={{ color: 'var(--text-muted)' }}>Loading appointments...</p>}
            {!loadingAppts && appointments.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No appointments yet. Patients will book once you have a schedule configured.</p>
            )}
            {appointments.slice(0, 5).map(apt => (
              <div key={apt.id} style={{
                padding: '16px 18px', borderRadius: '12px',
                background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700,
                  }}>
                    {apt.patient_details?.first_name?.[0] || 'P'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{apt.patient_details?.full_name || 'Patient'}</h3>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarCheck size={12} /> {formatDateTime(apt.appointment_datetime)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                    background: apt.status === 'SCHEDULED' ? 'rgba(16,185,129,0.15)' : apt.status === 'COMPLETED' ? 'rgba(99,102,241,0.15)' : 'rgba(100,100,100,0.15)',
                    color: apt.status === 'SCHEDULED' ? '#10b981' : apt.status === 'COMPLETED' ? '#6366f1' : 'var(--text-muted)',
                  }}>
                    {apt.status}
                  </span>
                  <Link to={`/doctor/appointments/${apt.id}/consult`} style={{
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '7px',
                    fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                    background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)',
                  }}>
                    <Stethoscope size={12} /> {apt.consultation ? 'Edit Notes' : 'Add Notes'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refills Tab */}
      {activeTab === 'refills' && (
        <div style={{ marginTop: '20px' }}>
          <div className="patient-profile-card">
            <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2>Prescription Refill Requests</h2>
                <p>Review and authorize medication renewals requested by your patients.</p>
              </div>
              <button
                onClick={fetchRefills}
                style={{
                  padding: '7px 14px', borderRadius: '10px',
                  background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>

            {loadingRefills ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Loading refill requests...
              </div>
            ) : refills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                <RotateCw size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                <p style={{ margin: 0, fontWeight: 700 }}>No refill requests currently pending</p>
                <p style={{ margin: '4px 0', fontSize: '0.82rem' }}>
                  When your patients request a prescription renewal, it will appear here for 1-click decision.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {refills.map(r => (
                  <div
                    key={r.id}
                    style={{
                      padding: '18px 20px', borderRadius: '14px',
                      background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--heading-color)' }}>
                          {r.prescription_details?.medication_name || 'Medication'}
                        </strong>
                        <span style={{
                          padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800,
                          background: r.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.12)' : r.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: r.status === 'APPROVED' ? '#10b981' : r.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                        }}>
                          {r.status}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Patient: <strong>{r.patient_details?.full_name}</strong> • Requested: {new Date(r.created_at).toLocaleDateString()}
                      </p>
                      {r.patient_notes && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "Patient Note: {r.patient_notes}"
                        </p>
                      )}
                      {r.doctor_response && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#10b981' }}>
                          Physician Response: {r.doctor_response}
                        </p>
                      )}
                    </div>

                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleRefillDecision(r.id, 'APPROVED')}
                          style={{
                            padding: '8px 16px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Approve Refill
                        </button>
                        <button
                          onClick={() => handleRefillDecision(r.id, 'REJECTED')}
                          style={{
                            padding: '8px 16px', borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div style={{ marginTop: '20px' }}>
          <div className="patient-profile-card">
            <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>My Weekly Schedule</h2>
                <p>Configure multiple shift blocks per day with customized slot durations (15m, 30m, 45m). Blocks on the same day cannot overlap.</p>
              </div>
              <button className="patient-primary-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={() => { setShowScheduleForm(!showScheduleForm); setScheduleError(''); }}>
                <Plus size={16} /> Add Slot Block
              </button>
            </div>

            {showScheduleForm && (
              <form onSubmit={handleSaveSchedule} style={{
                marginTop: '20px', padding: '20px',
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-doctor)', fontSize: '0.85rem' }}>NEW SCHEDULE SHIFT BLOCK</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Non-overlapping shifts allowed on same day</span>
                </div>

                {scheduleError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
                    background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444', fontSize: '0.88rem', fontWeight: 600,
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{scheduleError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                    Day of Week
                    <select required value={scheduleForm.day_of_week} onChange={e => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })} style={inputStyle}>
                      <option value="" disabled style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>Select day</option>
                      {DAYS.map((d, i) => <option key={i} value={i} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{d}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                    Start Time
                    <input type="time" required value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} style={inputStyle} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                    End Time
                    <input type="time" required value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} style={inputStyle} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                    Slot Duration
                    <select value={scheduleForm.slot_duration_minutes} onChange={e => setScheduleForm({ ...scheduleForm, slot_duration_minutes: Number(e.target.value) })} style={inputStyle}>
                      {[15, 20, 30, 45, 60].map(v => <option key={v} value={v} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{v} min slots</option>)}
                    </select>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button type="button" className="patient-secondary-button" onClick={() => { setShowScheduleForm(false); setScheduleError(''); }}>Cancel</button>
                  <button type="submit" className="patient-primary-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} disabled={savingSchedule}>
                    {savingSchedule ? 'Saving...' : <><CheckCircle2 size={15} /> Save Schedule</>}
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingSchedules && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}
              {!loadingSchedules && schedules.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Calendar size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No schedule configured yet. Add your working days above.</p>
                </div>
              )}
              {schedules.map(s => (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', borderRadius: '12px',
                  background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarDays size={18} color="var(--color-doctor)" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{DAYS[s.day_of_week]}</h3>
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)',
                        }}>
                          {s.slot_duration_minutes} min slots
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                      background: s.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.15)',
                      color: s.is_active ? '#10b981' : 'var(--text-muted)',
                    }}>{s.is_active ? 'Active' : 'Inactive'}</span>
                    <button onClick={() => handleDeleteSchedule(s.id)} className="patient-secondary-button"
                      style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)', padding: '6px 12px', fontSize: '0.8rem' }}>
                      <XCircle size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '16px', padding: '20px 24px', borderRadius: '14px',
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <HeartPulse size={24} color="var(--color-doctor)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Slot Generator is Live</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Once you add a schedule, patients can see and book your available time slots dynamically. ACID conflict locks prevent double-bookings.
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="patient-portal-footer">
        <span>MediFlow Doctor Portal</span>
        <span>Clinical tools for your daily practice.</span>
      </footer>
    </div>
  );
};

export default DoctorDashboard;
