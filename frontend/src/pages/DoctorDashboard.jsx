import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Activity,
  Calendar,
  CalendarDays,
  Clock,
  ShieldCheck,
  Users,
  ClipboardList,
  HeartPulse,
  Plus,
  CheckCircle2,
  XCircle,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEPT_LABELS = {
  CARDIOLOGY: 'Cardiology',
  NEUROLOGY: 'Neurology',
  GENERAL_MEDICINE: 'General Medicine',
  ORTHOPEDICS: 'Orthopedics',
  PEDIATRICS: 'Pediatrics',
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'Doctor';

  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: '',
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchSchedules();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoadingAppts(true);
      const data = await appointmentsService.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAppts(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const data = await appointmentsService.getSchedules();
      setSchedules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSavingSchedule(true);
    try {
      await appointmentsService.createSchedule(scheduleForm);
      setShowScheduleForm(false);
      setScheduleForm({ day_of_week: '', start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30 });
      fetchSchedules();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await appointmentsService.deleteSchedule(id);
      fetchSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const upcomingAppointments = appointments.filter(a => a.status === 'SCHEDULED');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = upcomingAppointments.filter(a => a.appointment_datetime?.startsWith(todayStr));

  const inputStyle = {
    background: 'var(--surface-input)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-main)',
    padding: '0 14px',
    borderRadius: '10px',
    height: '44px',
    outline: 'none',
    fontSize: '0.9rem',
    width: '100%',
  };

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
              border: '2px solid rgba(255, 255, 255, 0.5)',
              letterSpacing: '0.05em'
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
            Manage your schedule, view patient appointments, and access your clinical tools — all in one place.
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

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '28px' }}>
        {[
          { icon: CalendarDays, label: 'Total Appointments', value: appointments.length, color: '#0ea5e9' },
          { icon: CalendarCheck, label: 'Upcoming', value: upcomingAppointments.length, color: '#10b981' },
          { icon: Users, label: "Today's Patients", value: todayAppts.length, color: '#f59e0b' },
          { icon: Clock, label: 'Schedule Slots', value: schedules.length, color: '#8b5cf6' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            padding: '20px 24px',
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', gap: '16px'
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
      <div style={{ display: 'flex', gap: '8px', marginTop: '32px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
        {[
          { id: 'overview', label: 'Appointments', icon: ClipboardList },
          { id: 'schedule', label: 'My Schedule', icon: Calendar },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === id ? '2px solid var(--color-doctor)' : '2px solid transparent',
            color: activeTab === id ? 'var(--color-doctor)' : 'var(--text-muted)',
            fontWeight: activeTab === id ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '-1px',
            transition: 'all 0.2s',
          }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Appointments Tab */}
      {activeTab === 'overview' && (
        <div className="patient-profile-card" style={{ marginTop: '20px' }}>
          <div className="patient-profile-card__title">
            <h2>Patient Appointments</h2>
            <p>All scheduled consultations for your account.</p>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingAppts && <p style={{ color: 'var(--text-muted)' }}>Loading appointments...</p>}
            {!loadingAppts && appointments.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No appointments yet. Patients will book once you have a schedule configured.</p>
            )}
            {appointments.map(apt => (
              <div key={apt.id} style={{
                padding: '18px 20px',
                borderRadius: '12px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700
                  }}>
                    {apt.patient_details?.first_name?.[0] || 'P'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{apt.patient_details?.full_name || 'Patient'}</h3>
                    <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CalendarCheck size={13} /> {formatDateTime(apt.appointment_datetime)}
                    </p>
                    {apt.reason_for_visit && (
                      <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-dim)' }}>Reason: {apt.reason_for_visit}</p>
                    )}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                  background: apt.status === 'SCHEDULED' ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.15)',
                  color: apt.status === 'SCHEDULED' ? '#10b981' : 'var(--text-muted)',
                  border: apt.status === 'SCHEDULED' ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-subtle)'
                }}>
                  {apt.status}
                </span>
              </div>
            ))}
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
                <p>Configure your working days and consultation slot durations.</p>
              </div>
              <button className="patient-primary-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={() => setShowScheduleForm(!showScheduleForm)}>
                <Plus size={16} /> Add Day
              </button>
            </div>

            {/* Add schedule form */}
            {showScheduleForm && (
              <form onSubmit={handleSaveSchedule} style={{
                marginTop: '20px', padding: '20px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '14px'
              }}>
                <p style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--color-doctor)', fontSize: '0.85rem' }}>NEW SCHEDULE ENTRY</p>
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
                    Slot Duration (mins)
                    <select value={scheduleForm.slot_duration_minutes} onChange={e => setScheduleForm({ ...scheduleForm, slot_duration_minutes: Number(e.target.value) })} style={inputStyle}>
                      <option value={15} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>15 min</option>
                      <option value={20} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>20 min</option>
                      <option value={30} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>30 min</option>
                      <option value={45} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>45 min</option>
                      <option value={60} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>60 min</option>
                    </select>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button type="button" className="patient-secondary-button" onClick={() => setShowScheduleForm(false)}>Cancel</button>
                  <button type="submit" className="patient-primary-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} disabled={savingSchedule}>
                    {savingSchedule ? 'Saving...' : <><CheckCircle2 size={15} /> Save Schedule</>}
                  </button>
                </div>
              </form>
            )}

            {/* Schedule list */}
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
                  background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarDays size={18} color="var(--color-doctor)" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{DAYS[s.day_of_week]}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {s.start_time} – {s.end_time} &nbsp;·&nbsp; {s.slot_duration_minutes} min slots
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

          {/* Quick Info Card */}
          <div style={{
            marginTop: '16px', padding: '20px 24px', borderRadius: '14px',
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '16px'
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
