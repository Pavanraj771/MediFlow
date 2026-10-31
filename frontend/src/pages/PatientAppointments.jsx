import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, UserRound, X, Plus, CalendarCheck,
  CalendarDays, History, XCircle, AlertCircle, Stethoscope, ChevronRight,
  Search, RotateCcw, Star
} from 'lucide-react';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import DoctorReviewModal from '../components/DoctorReviewModal';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const STATUS_CONFIG = {
  SCHEDULED: { bg: 'rgba(14,165,233,0.12)', color: '#0ea5e9', border: 'rgba(14,165,233,0.25)', label: 'Scheduled' },
  COMPLETED: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)', label: 'Completed' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)', label: 'Cancelled' },
  NO_SHOW: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', label: 'No-Show' },
};

const PatientAppointments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramDoctorId = searchParams.get('doctorId');
  const paramDept = searchParams.get('department');
  const paramDoctorName = searchParams.get('doctorName');
  const paramReviewAptId = searchParams.get('reviewAppointmentId');
  const isFixedDoctor = Boolean(paramDoctorId && paramDept);

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isBooking, setIsBooking] = useState(Boolean(paramDept));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [activeTab, setActiveTab] = useState('UPCOMING'); // 'UPCOMING' | 'ALL' | 'PAST'
  const [reviewingAppointment, setReviewingAppointment] = useState(null);

  // Date search & filter states
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'CUSTOM'
  const [searchDate, setSearchDate] = useState('');

  // Booking Form State
  const [selectedDept, setSelectedDept] = useState(paramDept || '');
  const [selectedDoctor, setSelectedDoctor] = useState(paramDoctorId || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');

  const departments = ['CARDIOLOGY', 'NEUROLOGY', 'GENERAL_MEDICINE', 'ORTHOPEDICS', 'PEDIATRICS'];

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (paramReviewAptId && appointments.length > 0) {
      const match = appointments.find(a => String(a.id) === String(paramReviewAptId));
      if (match) {
        setReviewingAppointment(match);
      }
    }
  }, [paramReviewAptId, appointments]);

  useEffect(() => {
    if (paramDept) {
      setSelectedDept(paramDept);
      setIsBooking(true);
      appointmentsService.getDoctors({ department: paramDept }).then(docs => {
        setDoctors(docs);
        if (paramDoctorId) {
          setSelectedDoctor(paramDoctorId);
        }
      }).catch(console.error);
    }
  }, [paramDoctorId, paramDept]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (dept) => {
    try {
      const data = await appointmentsService.getDoctors({ department: dept });
      setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSlots = async (doctorId, date) => {
    try {
      const slots = await appointmentsService.getDoctorSlots(doctorId, date);
      setAvailableSlots(slots);
    } catch (err) {
      console.error(err);
      setAvailableSlots([]);
    }
  };

  const handleDeptChange = (e) => {
    const dept = e.target.value;
    setSelectedDept(dept);
    setSelectedDoctor('');
    setSelectedDate('');
    setAvailableSlots([]);
    setSelectedSlot('');
    fetchDoctors(dept);
  };

  const handleDoctorChange = (e) => {
    setSelectedDoctor(e.target.value);
    setSelectedDate('');
    setAvailableSlots([]);
    setSelectedSlot('');
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedDoctor && date) {
      fetchSlots(selectedDoctor, date);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot) return;

    try {
      setLoading(true);
      await appointmentsService.bookAppointment({
        doctor: selectedDoctor,
        appointment_datetime: selectedSlot,
        reason_for_visit: reason
      });
      setIsBooking(false);
      resetForm();
      fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.[0] || 'Booking failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    setCancelError('');
    try {
      await appointmentsService.cancelAppointment(id);
      await fetchAppointments();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to cancel appointment. Please try again.';
      setCancelError(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const clearFixedDoctor = () => {
    setSearchParams({});
    setSelectedDept('');
    setSelectedDoctor('');
    setSelectedDate('');
    setAvailableSlots([]);
    setSelectedSlot('');
    setDoctors([]);
  };

  const resetForm = () => {
    if (isFixedDoctor) {
      setSearchParams({});
    }
    setSelectedDept('');
    setSelectedDoctor('');
    setSelectedDate('');
    setAvailableSlots([]);
    setSelectedSlot('');
    setReason('');
    setError('');
  };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getLocalDateStr = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Date filters setup
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  const tomorrowObj = new Date(now);
  tomorrowObj.setDate(now.getDate() + 1);
  const tomorrowStr = getLocalDateStr(tomorrowObj);

  const currentDayOfWeek = (now.getDay() + 6) % 7; // Mon = 0, Sun = 6
  const daysUntilSunday = 6 - currentDayOfWeek;
  const endOfWeekObj = new Date(now);
  endOfWeekObj.setDate(now.getDate() + daysUntilSunday);
  const endOfWeekStr = getLocalDateStr(endOfWeekObj);

  const hasDateFilter = Boolean(searchDate || dateFilter !== 'ALL');

  const matchesDate = (apt) => {
    if (!apt.appointment_datetime) return false;
    const aptDate = getLocalDateStr(apt.appointment_datetime);

    if (searchDate) {
      return aptDate === searchDate;
    }
    if (dateFilter === 'TODAY') {
      return aptDate === todayStr;
    }
    if (dateFilter === 'TOMORROW') {
      return aptDate === tomorrowStr;
    }
    if (dateFilter === 'THIS_WEEK') {
      return aptDate >= todayStr && aptDate <= endOfWeekStr;
    }
    return true; // 'ALL'
  };

  // Group & Filter Appointments
  const upcomingList = appointments
    .filter(a => a.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.appointment_datetime) - new Date(b.appointment_datetime));

  const pastList = appointments
    .filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW')
    .sort((a, b) => new Date(b.appointment_datetime) - new Date(a.appointment_datetime));

  const allSorted = [...appointments]
    .sort((a, b) => new Date(b.appointment_datetime) - new Date(a.appointment_datetime));

  let displayedAppointments = [];
  if (activeTab === 'UPCOMING') {
    const filteredUpcoming = upcomingList.filter(matchesDate);
    // If user has a specific date searched, show all matches for that date; otherwise next 5 upcoming
    displayedAppointments = hasDateFilter ? filteredUpcoming : filteredUpcoming.slice(0, 5);
  } else if (activeTab === 'PAST') {
    displayedAppointments = pastList.filter(matchesDate);
  } else {
    displayedAppointments = allSorted.filter(matchesDate);
  }

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/patient" className="patient-back-link"><ArrowLeft size={17} /> Back to dashboard</Link>
        <PatientAvatarMenu size={42} />
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon"><Calendar size={24} /></div>
        <div>
          <p className="patient-eyebrow">CARE COORDINATION</p>
          <h1>Appointments</h1>
          <p>Manage your upcoming visits and book new appointments.</p>
        </div>
      </header>

      {error && <div className="patient-form-message patient-form-message--error">{error}</div>}

      {/* Interactive Quick Stats */}
      {!isBooking && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '20px',
          marginBottom: '10px',
        }}>
          {/* Upcoming Card */}
          <div
            onClick={() => setActiveTab('UPCOMING')}
            style={{
              padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
              background: activeTab === 'UPCOMING' ? 'rgba(14,165,233,0.08)' : 'var(--bg-glass-card)',
              border: activeTab === 'UPCOMING' ? '2px solid #0ea5e9' : '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: '10px',
              background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CalendarCheck size={20} color="#0ea5e9" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Upcoming Visits</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9' }}>{upcomingList.length}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#0ea5e9', fontWeight: 600 }}>Next 5 upcoming →</p>
            </div>
          </div>

          {/* All Appointments Card */}
          <div
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
              background: activeTab === 'ALL' ? 'rgba(16,185,129,0.08)' : 'var(--bg-glass-card)',
              border: activeTab === 'ALL' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: '10px',
              background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CalendarDays size={20} color="#10b981" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>All Appointments</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{appointments.length}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Full schedule →</p>
            </div>
          </div>

          {/* Past / Completed Card */}
          <div
            onClick={() => setActiveTab('PAST')}
            style={{
              padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
              background: activeTab === 'PAST' ? 'rgba(139,92,246,0.08)' : 'var(--bg-glass-card)',
              border: activeTab === 'PAST' ? '2px solid #8b5cf6' : '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: '10px',
              background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <History size={20} color="#8b5cf6" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Past / Visited</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>{pastList.length}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 600 }}>Consultation history →</p>
            </div>
          </div>
        </div>
      )}

      {!isBooking ? (
        <div className="patient-profile-card" style={{ marginTop: '16px' }}>
          <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2>{activeTab === 'UPCOMING' ? 'Upcoming Appointments' : activeTab === 'PAST' ? 'Past Appointments' : 'All Appointments'}</h2>
              <p>
                {activeTab === 'UPCOMING'
                  ? 'Displaying your next 5 upcoming scheduled visits with the care team.'
                  : activeTab === 'PAST'
                  ? 'Your previously visited, completed, and cancelled appointments.'
                  : 'All appointments across all statuses.'}
              </p>

              {/* Tab Pills */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('UPCOMING')}
                  style={{
                    padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    border: activeTab === 'UPCOMING' ? '1px solid #0ea5e9' : '1px solid var(--border-subtle)',
                    background: activeTab === 'UPCOMING' ? 'rgba(14,165,233,0.15)' : 'transparent',
                    color: activeTab === 'UPCOMING' ? '#0ea5e9' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  Upcoming Appointments (Next 5)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  style={{
                    padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    border: activeTab === 'ALL' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    background: activeTab === 'ALL' ? 'rgba(16,185,129,0.15)' : 'transparent',
                    color: activeTab === 'ALL' ? '#10b981' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  All Appointments ({appointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PAST')}
                  style={{
                    padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    border: activeTab === 'PAST' ? '1px solid #8b5cf6' : '1px solid var(--border-subtle)',
                    background: activeTab === 'PAST' ? 'rgba(139,92,246,0.15)' : 'transparent',
                    color: activeTab === 'PAST' ? '#8b5cf6' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  Past ({pastList.length})
                </button>
              </div>
            </div>

            <button className="patient-primary-button" onClick={() => setIsBooking(true)}>
              <Plus size={16} /> Book New
            </button>
          </div>

          {/* Date Search & Filter Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
            padding: '12px 16px', borderRadius: '12px', marginTop: '16px',
            background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                <Search size={15} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Search by Date:</span>
              </div>

              {[
                { id: 'ALL', label: 'All Dates' },
                { id: 'TODAY', label: 'Today' },
                { id: 'TOMORROW', label: 'Tomorrow' },
                { id: 'THIS_WEEK', label: 'This Week' },
              ].map(df => (
                <button
                  key={df.id}
                  type="button"
                  onClick={() => { setDateFilter(df.id); setSearchDate(''); }}
                  style={{
                    padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    border: dateFilter === df.id && !searchDate ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    background: dateFilter === df.id && !searchDate ? 'rgba(14,165,233,0.15)' : 'var(--bg-glass-card)',
                    color: dateFilter === df.id && !searchDate ? 'var(--color-primary)' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  {df.label}
                </button>
              ))}

              {/* Custom Date Picker Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="date"
                  value={searchDate}
                  onChange={e => {
                    const val = e.target.value;
                    setSearchDate(val);
                    if (val) setDateFilter('CUSTOM');
                    else setDateFilter('ALL');
                  }}
                  style={{
                    height: '32px', padding: '0 10px', borderRadius: '8px',
                    background: 'var(--surface-input)',
                    border: searchDate ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none',
                    colorScheme: 'auto',
                  }}
                  title="Filter appointments by specific date"
                />
                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={() => { setSearchDate(''); setDateFilter('ALL'); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', borderRadius: '6px',
                    }}
                    title="Clear date filter"
                  >
                    <RotateCcw size={12} /> Clear date
                  </button>
                )}
              </div>
            </div>

            {hasDateFilter && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing <strong>{displayedAppointments.length}</strong> matching visit{displayedAppointments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            {/* Banner when there are more than 5 upcoming appointments and no date filter */}
            {activeTab === 'UPCOMING' && !hasDateFilter && upcomingList.length > 5 && (
              <div style={{
                padding: '10px 16px', borderRadius: '10px', marginBottom: '16px',
                background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)',
                color: 'var(--text-main)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>Showing next <strong>5</strong> of <strong>{upcomingList.length}</strong> upcoming scheduled appointments.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  style={{
                    background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 700, cursor: 'pointer',
                    fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  View All ({upcomingList.length}) <ChevronRight size={13} />
                </button>
              </div>
            )}

            {displayedAppointments.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <CalendarCheck size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>
                  {hasDateFilter
                    ? `No appointments found for ${searchDate || dateFilter.replace('_', ' ').toLowerCase()}.`
                    : activeTab === 'UPCOMING'
                    ? 'No upcoming appointments scheduled.'
                    : activeTab === 'PAST'
                    ? 'No past appointments on record.'
                    : 'You have no appointments booked.'}
                </p>
                {hasDateFilter ? (
                  <button
                    type="button"
                    onClick={() => { setSearchDate(''); setDateFilter('ALL'); }}
                    className="patient-secondary-button"
                    style={{ marginTop: '12px' }}
                  >
                    <RotateCcw size={14} /> Clear date filter
                  </button>
                ) : activeTab === 'UPCOMING' && (
                  <button
                    type="button"
                    onClick={() => setIsBooking(true)}
                    className="patient-secondary-button"
                    style={{ marginTop: '12px' }}
                  >
                    <Plus size={14} /> Book an appointment
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayedAppointments.map(apt => {
                const sc = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED;

                return (
                  <div key={apt.id} style={{
                    padding: '18px 20px',
                    borderRadius: '14px',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '12px',
                        background: apt.status === 'SCHEDULED' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: apt.status === 'SCHEDULED' ? '#0ea5e9' : '#10b981', flexShrink: 0,
                      }}>
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--heading-color)' }}>
                            Dr. {apt.doctor_details?.full_name || 'Doctor'}
                          </h3>
                          {apt.doctor_details?.department && (
                            <span style={{
                              padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600,
                              background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                            }}>
                              {apt.doctor_details.department.replace('_', ' ')}
                            </span>
                          )}
                          <span style={{
                            padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          }}>
                            {sc.label}
                          </span>
                        </div>
                        <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarCheck size={13} color="var(--color-primary)" /> {formatDateTime(apt.appointment_datetime)}
                        </p>
                        {apt.reason_for_visit && (
                          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            Reason: {apt.reason_for_visit}
                          </p>
                        )}
                        {apt.status === 'CANCELLED' && apt.cancellation_reason && (
                          <div style={{
                            margin: '6px 0 0', padding: '6px 12px', borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444', fontSize: '0.82rem',
                          }}>
                            <strong>Cancelled by Doctor:</strong> {apt.cancellation_reason}
                          </div>
                        )}
                        {apt.status === 'CANCELLED' && !apt.cancellation_reason && apt.cancelled_by_role === 'PATIENT' && (
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#ef4444' }}>
                            Cancelled by you
                          </p>
                        )}
                      </div>
                    </div>

                    {apt.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="btn-danger-action"
                        disabled={cancellingId === apt.id}
                        title="Cancel this appointment"
                      >
                        <XCircle size={15} />
                        {cancellingId === apt.id ? 'Cancelling...' : 'Cancel Appointment'}
                      </button>
                    )}

                    {apt.status === 'COMPLETED' && (
                      apt.review ? (
                        <button
                          type="button"
                          onClick={() => setReviewingAppointment(apt)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#d97706',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          title="Click to view or edit your review"
                        >
                          <Star size={15} fill="#f59e0b" color="#f59e0b" />
                          <span>Rated {apt.review.rating}/5</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReviewingAppointment(apt)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            border: 'none',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                            transition: 'all 0.2s ease',
                          }}
                          title="Rate and review your doctor for this completed appointment"
                        >
                          <Star size={15} fill="#ffffff" color="#ffffff" />
                          <span>Rate & Review</span>
                        </button>
                      )
                    )}
                  </div>
                );
              })}

              {cancelError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444', fontSize: '0.88rem', fontWeight: 600,
                }}>
                  <AlertCircle size={16} />
                  <span>{cancelError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="patient-profile-card" style={{ marginTop: '20px' }}>
          <div className="patient-profile-card__title">
            <h2>Book Appointment</h2>
            <p>Select a department, doctor, and an available time slot.</p>
          </div>

          <form id="booking-form" onSubmit={handleBook} style={{ marginTop: '20px' }}>
            <div className="patient-profile-grid">
              {isFixedDoctor ? (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: 'rgba(14, 165, 233, 0.08)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      boxShadow: '0 0 15px rgba(14, 165, 233, 0.3)',
                    }}>
                      <UserRound size={22} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0ea5e9', letterSpacing: '0.08em' }}>
                        FIXED PHYSICIAN APPOINTMENT
                      </span>
                      <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                        Dr. {paramDoctorName || (doctors.find(d => String(d.user?.id) === String(paramDoctorId))?.user?.full_name || 'Selected Doctor')}
                      </h3>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Specialty: <strong style={{ color: 'var(--color-primary)' }}>{paramDept.replace('_', ' ')}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFixedDoctor}
                    style={{
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                    }}
                  >
                    Choose Different Doctor
                  </button>
                </div>
              ) : (
                <>
                  <label className="patient-form-field">
                    <span>Department</span>
                    <select required value={selectedDept} onChange={handleDeptChange} disabled={loading} style={{
                      background: 'var(--surface-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      padding: '0 16px',
                      borderRadius: '12px',
                      height: '46px',
                      outline: 'none'
                    }}>
                      <option value="" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Select Department</option>
                      {departments.map(d => <option key={d} value={d} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>{d.replace('_', ' ')}</option>)}
                    </select>
                  </label>

                  <label className="patient-form-field">
                    <span>Doctor</span>
                    <select required value={selectedDoctor} onChange={handleDoctorChange} disabled={!selectedDept || loading} style={{
                      background: 'var(--surface-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      padding: '0 16px',
                      borderRadius: '12px',
                      height: '46px',
                      outline: 'none'
                    }}>
                      <option value="" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Select Doctor</option>
                      {doctors.map(d => <option key={d.user.id} value={d.user.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Dr. {d.user.full_name}</option>)}
                    </select>
                  </label>
                </>
              )}

              <label className="patient-form-field">
                <span>Date</span>
                <input 
                  type="date" 
                  required 
                  value={selectedDate} 
                  onChange={handleDateChange} 
                  disabled={!selectedDoctor || loading}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    background: 'var(--surface-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    padding: '0 16px',
                    borderRadius: '12px',
                    height: '46px',
                    outline: 'none'
                  }}
                />
              </label>

              <label className="patient-form-field">
                <span>Available Slots</span>
                <select required value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)} disabled={!selectedDate || availableSlots.length === 0 || loading} style={{
                  background: 'var(--surface-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  padding: '0 16px',
                  borderRadius: '12px',
                  height: '46px',
                  outline: 'none'
                }}>
                  <option value="" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>{availableSlots.length > 0 ? "Select Time" : "No slots available"}</option>
                  {availableSlots.map(slot => {
                    const time = new Date(slot).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    return <option key={slot} value={slot} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>{time}</option>
                  })}
                </select>
              </label>

              <label className="patient-form-field" style={{ gridColumn: '1 / -1' }}>
                <span>Reason for Visit (Optional)</span>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  disabled={loading}
                  placeholder="E.g., General checkup, headache..."
                />
              </label>
            </div>
            
            <div className="patient-profile-card__footer">
              <span />
              <div className="patient-profile-actions">
                <button type="button" className="patient-secondary-button" onClick={() => { setIsBooking(false); resetForm(); }} disabled={loading}>
                  <X size={16} /> Cancel
                </button>
                <button type="submit" className="patient-primary-button" disabled={loading || !selectedSlot}>
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {reviewingAppointment && (
        <DoctorReviewModal
          appointment={reviewingAppointment}
          existingReview={reviewingAppointment.review}
          onClose={() => setReviewingAppointment(null)}
          onSuccess={() => {
            setReviewingAppointment(null);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
};

export default PatientAppointments;