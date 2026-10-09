import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, UserRound, X, Plus, CalendarCheck } from 'lucide-react';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isBooking, setIsBooking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Booking Form State
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');

  const departments = ['CARDIOLOGY', 'NEUROLOGY', 'GENERAL_MEDICINE', 'ORTHOPEDICS', 'PEDIATRICS'];

  useEffect(() => {
    fetchAppointments();
  }, []);

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
    try {
      await appointmentsService.cancelAppointment(id);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
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
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

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

      {!isBooking ? (
        <div className="patient-profile-card" style={{ marginTop: '20px' }}>
          <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Upcoming Appointments</h2>
              <p>Your scheduled visits with the care team.</p>
            </div>
            <button className="patient-primary-button" onClick={() => setIsBooking(true)}>
              <Plus size={16} /> Book New
            </button>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            {appointments.length === 0 && !loading && (
              <p style={{ color: 'var(--text-muted)' }}>You have no appointments booked.</p>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {appointments.map(apt => (
                <div key={apt.id} style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  background: 'var(--surface-hover)', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Dr. {apt.doctor_details?.full_name}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarCheck size={14} /> {formatDateTime(apt.appointment_datetime)}
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>Status: <strong>{apt.status}</strong></p>
                  </div>
                  {apt.status === 'SCHEDULED' && (
                    <button 
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="patient-secondary-button"
                      style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
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
    </div>
  );
};

export default PatientAppointments;
