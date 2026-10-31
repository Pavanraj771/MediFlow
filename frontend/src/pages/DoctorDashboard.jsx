import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, Activity, Calendar, CalendarDays, Clock, ShieldCheck,
  Users, ClipboardList, HeartPulse, Plus, CheckCircle2, XCircle,
  CalendarCheck, ChevronRight, UserRound, AlertCircle, MessageSquare, RotateCw,
  Star,
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
  const [reviews, setReviews] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingRefills, setLoadingRefills] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleView, setScheduleView] = useState('REMAINING_WEEK'); // 'REMAINING_WEEK' | 'ALL'

  useEffect(() => {
    fetchAppointments();
    fetchSchedules();
    fetchRefills();
    fetchDoctorReviews();
  }, [user]);

  const fetchDoctorReviews = async () => {
    try {
      setLoadingReviews(true);
      const prof = await appointmentsService.getDoctorProfile();
      setDoctorProfile(prof);
      const revData = await appointmentsService.getDoctorReviews(user?.id || prof?.user?.id || prof?.id);
      const list = Array.isArray(revData) ? revData : revData.results || [];
      setReviews(list);
    } catch (err) {
      console.error('Failed to fetch doctor reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

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
      const [y, m, d] = scheduleForm.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const day_of_week = (dateObj.getDay() + 6) % 7;
      await appointmentsService.createSchedule({
        ...scheduleForm,
        day_of_week,
      });
      setShowScheduleForm(false);
      setScheduleForm({
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        slot_duration_minutes: 30,
      });
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

  const isScheduleFinished = (s) => {
    if (s.date) return s.date < todayStr;
    if (s.effectiveDate) return s.effectiveDate < todayStr;
    return false;
  };

  const handleDeleteSchedule = async (id) => {
    const sched = schedules.find(s => s.id === id);
    if (sched && isScheduleFinished(sched)) {
      alert("Cannot remove schedules of dates that are already finished.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this shift block?")) return;
    try {
      await appointmentsService.deleteSchedule(id);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || err.response?.data?.[0] || 'Failed to remove schedule.');
    }
  };

  const formatDateTime = (iso) => new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const upcomingAppointments = appointments
    .filter(a => a.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime());
  const nextUpcomingAppointments = upcomingAppointments.slice(0, 5);
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  const currentDayOfWeek = (now.getDay() + 6) % 7; // Mon=0, ..., Sun=6
  const daysUntilSunday = 6 - currentDayOfWeek;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);
  const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

  const tomorrowObj = new Date(now);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

  // Process and sort schedules
  const remainingWeekSchedules = schedules
    .map(s => {
      let effectiveDate = s.date;
      if (!effectiveDate && s.day_of_week !== undefined && s.day_of_week !== null) {
        const offset = s.day_of_week - currentDayOfWeek;
        const targetD = new Date(now);
        targetD.setDate(now.getDate() + offset);
        effectiveDate = `${targetD.getFullYear()}-${String(targetD.getMonth() + 1).padStart(2, '0')}-${String(targetD.getDate()).padStart(2, '0')}`;
      }
      return { ...s, effectiveDate };
    })
    .filter(s => {
      if (!s.effectiveDate) return false;
      return s.effectiveDate >= todayStr && s.effectiveDate <= endOfWeekStr;
    })
    .sort((a, b) => {
      if (a.effectiveDate !== b.effectiveDate) {
        return a.effectiveDate.localeCompare(b.effectiveDate);
      }
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

  const allSortedSchedules = [...schedules]
    .map(s => {
      let effectiveDate = s.date;
      if (!effectiveDate && s.day_of_week !== undefined && s.day_of_week !== null) {
        const offset = s.day_of_week - currentDayOfWeek;
        const targetD = new Date(now);
        targetD.setDate(now.getDate() + offset);
        effectiveDate = `${targetD.getFullYear()}-${String(targetD.getMonth() + 1).padStart(2, '0')}-${String(targetD.getDate()).padStart(2, '0')}`;
      }
      return { ...s, effectiveDate };
    })
    .sort((a, b) => {
      if (a.effectiveDate && b.effectiveDate && a.effectiveDate !== b.effectiveDate) {
        return a.effectiveDate.localeCompare(b.effectiveDate);
      }
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

  const displayedSchedules = scheduleView === 'REMAINING_WEEK' ? remainingWeekSchedules : allSortedSchedules;

  const formatScheduleHeader = (s) => {
    const targetDate = s.date || s.effectiveDate;
    if (targetDate) {
      const [y, m, d] = targetDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return DAYS[s.day_of_week] || 'Shift Block';
  };

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
    { id: 'reviews', label: `Patient Reviews (${reviews.length})`, icon: Star },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
        {[
          {
            icon: CalendarDays,
            label: 'Total Appointments',
            value: appointments.length,
            color: '#0ea5e9',
            to: '/doctor/appointments',
            sub: 'View all appointments'
          },
          {
            icon: CalendarCheck,
            label: 'Upcoming',
            value: upcomingAppointments.length,
            color: '#10b981',
            to: '/doctor/appointments?status=SCHEDULED',
            sub: 'View upcoming visits'
          },
          {
            icon: Users,
            label: "Today's Patients",
            value: todayAppts.length,
            color: '#f59e0b',
            to: '/doctor/patients?filter=today',
            sub: "View today's patient visits"
          },
          {
            icon: Clock,
            label: 'Schedule Slots',
            value: schedules.length,
            color: '#8b5cf6',
            onClick: () => {
              setActiveTab('schedule');
              setTimeout(() => {
                const el = document.getElementById('doctor-schedule-tab');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            },
            sub: 'Configure working hours'
          },
          {
            icon: Star,
            label: 'Patient Rating',
            value: doctorProfile?.average_rating
              ? `${doctorProfile.average_rating.toFixed(1)} ★`
              : (reviews.length > 0 ? `${(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)} ★` : 'New'),
            color: '#f59e0b',
            onClick: () => {
              setActiveTab('reviews');
              setTimeout(() => {
                const el = document.getElementById('doctor-reviews-tab');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            },
            sub: `${reviews.length} patient review${reviews.length === 1 ? '' : 's'}`
          },
        ].map(({ icon: Icon, label, value, color, to, onClick, sub }) => {
          const cardContent = (
            <div
              style={{
                padding: '18px 20px', background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)', borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                cursor: 'pointer', height: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading-color)' }}>{value}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: color, fontWeight: 700 }}>{sub} →</p>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" style={{ opacity: 0.6 }} />
            </div>
          );

          if (to) {
            return (
              <Link key={label} to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                {cardContent}
              </Link>
            );
          }
          return (
            <div key={label} onClick={onClick} role="button" tabIndex={0} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              {cardContent}
            </div>
          );
        })}
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
              <h2>Upcoming Appointments</h2>
              <p>Displaying your next 5 upcoming scheduled patient visits.</p>
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
            {!loadingAppts && nextUpcomingAppointments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '35px 20px', color: 'var(--text-muted)' }}>
                <CalendarCheck size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>No upcoming appointments scheduled.</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>New patient bookings will appear here.</p>
              </div>
            )}
            {nextUpcomingAppointments.map(apt => (
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
                    {apt.reason_for_visit && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {apt.reason_for_visit}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                    background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.25)',
                  }}>
                    Upcoming
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

          {/* Recent Reviews Card on Overview */}
          <div className="patient-profile-card" style={{ marginTop: '20px' }}>
            <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>Recent Patient Reviews</h2>
                <p>Latest feedback and star ratings submitted by your patients.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews');
                  setTimeout(() => {
                    const el = document.getElementById('doctor-reviews-tab');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px',
                  fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                View All Reviews ({reviews.length}) <ChevronRight size={14} />
              </button>
            </div>

            {loadingReviews ? (
              <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                <Star size={32} style={{ opacity: 0.25, margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>No reviews received yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {reviews.slice(0, 3).map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: '14px 16px', borderRadius: '12px',
                      background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                      display: 'flex', flexDirection: 'column', gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {rev.patient_name || 'Verified Patient'}
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= rev.rating ? '#f59e0b' : 'transparent'}
                            color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                          />
                        ))}
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', marginLeft: '4px' }}>
                          {rev.rating}/5
                        </span>
                      </div>
                    </div>
                    {rev.comment && (
                      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                        "{rev.comment}"
                      </p>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
        <div id="doctor-schedule-tab" style={{ marginTop: '20px' }}>
          <div className="patient-profile-card">
            <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2>My Weekly Schedule</h2>
                <p>Configure multiple shift blocks per day with customized slot durations (15m, 30m, 45m). Blocks on the same day cannot overlap.</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setScheduleView('REMAINING_WEEK')}
                    style={{
                      padding: '5px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      border: scheduleView === 'REMAINING_WEEK' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      background: scheduleView === 'REMAINING_WEEK' ? 'rgba(16,185,129,0.15)' : 'transparent',
                      color: scheduleView === 'REMAINING_WEEK' ? '#10b981' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Remaining Days This Week ({remainingWeekSchedules.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleView('ALL')}
                    style={{
                      padding: '5px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      border: scheduleView === 'ALL' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      background: scheduleView === 'ALL' ? 'rgba(16,185,129,0.15)' : 'transparent',
                      color: scheduleView === 'ALL' ? '#10b981' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                  >
                    All Schedules ({schedules.length})
                  </button>
                </div>
              </div>
              <button className="patient-primary-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={() => { setShowScheduleForm(!showScheduleForm); setScheduleError(''); }}>
                <Plus size={16} /> Add Slot
              </button>
            </div>

            {showScheduleForm && (
              <form onSubmit={handleSaveSchedule} style={{
                marginTop: '20px', padding: '20px',
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-doctor)', fontSize: '0.85rem' }}>NEW SCHEDULE SHIFT BLOCK</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Non-overlapping shifts allowed on same date</span>
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
                    Date
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={scheduleForm.date}
                      onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                      style={inputStyle}
                    />
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
              {loadingSchedules && <p style={{ color: 'var(--text-muted)' }}>Loading schedules...</p>}
              {!loadingSchedules && displayedSchedules.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Calendar size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>
                    {scheduleView === 'REMAINING_WEEK'
                      ? 'No schedule configured for the remaining days of this week.'
                      : 'No schedule configured yet.'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Click "Add Slot" above to set up your availability.
                  </p>
                </div>
              )}
              {displayedSchedules.map(s => (
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{formatScheduleHeader(s)}</h3>
                        {s.effectiveDate === todayStr && (
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                            background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                          }}>
                            Today
                          </span>
                        )}
                        {s.effectiveDate === tomorrowStr && (
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                            background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)',
                          }}>
                            Tomorrow
                          </span>
                        )}
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
                    {isScheduleFinished(s) ? (
                      <span style={{
                        padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                        background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
                        display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'not-allowed',
                      }} title="Finished schedules cannot be removed">
                        <CheckCircle2 size={13} color="#10b981" /> Finished
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        className="btn-danger-action"
                        title="Remove this shift slot"
                      >
                        <XCircle size={14} /> Remove
                      </button>
                    )}
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

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div id="doctor-reviews-tab" style={{ marginTop: '20px' }}>
          <div className="patient-profile-card">
            <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <h2>Patient Ratings & Reviews</h2>
                <p>Feedback and ratings submitted by patients who consulted with you.</p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem'
              }}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <span>
                  {doctorProfile?.average_rating
                    ? `${doctorProfile.average_rating.toFixed(1)} / 5.0`
                    : (reviews.length > 0 ? `${(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)} / 5.0` : 'No ratings yet')}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>

            {loadingReviews ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading patient reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                <Star size={40} style={{ opacity: 0.25, margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--text-main)' }}>No Patient Reviews Yet</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Reviews and star ratings submitted by patients after completed consultations will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: 'var(--bg-glass-card)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.9rem'
                        }}>
                          {rev.patient_name?.[0] || 'P'}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block' }}>
                            {rev.patient_name || 'Verified Patient'}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {rev.created_at ? new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            fill={s <= rev.rating ? '#f59e0b' : 'transparent'}
                            color={s <= rev.rating ? '#f59e0b' : 'var(--border-subtle)'}
                          />
                        ))}
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginLeft: '4px' }}>
                          {rev.rating}/5
                        </span>
                      </div>
                    </div>

                    {rev.comment ? (
                      <p style={{
                        margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-main)',
                        lineHeight: 1.5, background: 'var(--surface-input)', padding: '10px 14px',
                        borderRadius: '10px', fontStyle: 'normal'
                      }}>
                        "{rev.comment}"
                      </p>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No written comments provided.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
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
