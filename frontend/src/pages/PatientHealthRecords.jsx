import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, FileHeart, HeartPulse, Thermometer, Activity,
  Weight, Ruler, Droplets, CalendarCheck, ChevronDown, ChevronUp,
  ClipboardList, AlertCircle, Stethoscope,
} from 'lucide-react';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const statusColors = {
  COMPLETED: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  SCHEDULED: { bg: 'rgba(14,165,233,0.12)', color: '#0ea5e9', border: 'rgba(14,165,233,0.25)' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  NO_SHOW: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
};

const VitalBadge = ({ icon: Icon, label, value, unit }) => {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 14px', borderRadius: '10px',
      background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
      fontSize: '0.83rem',
    }}>
      <Icon size={14} color="var(--text-muted)" />
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <strong style={{ color: 'var(--heading-color)' }}>{value}{unit}</strong>
    </div>
  );
};

const ConsultationCard = ({ appointment }) => {
  const [open, setOpen] = useState(false);
  const c = appointment.consultation;
  const sc = statusColors[appointment.status] || statusColors.SCHEDULED;

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  return (
    <div style={{
      borderRadius: '16px',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
      background: 'var(--bg-glass-card)',
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px', cursor: 'pointer',
          background: open ? 'var(--surface-hover)' : 'transparent',
          transition: 'background 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '12px',
            background: c ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c ? <ClipboardList size={18} color="#10b981" /> : <CalendarCheck size={18} color="var(--text-muted)" />}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--heading-color)' }}>
              Dr. {appointment.doctor_details?.full_name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CalendarCheck size={12} /> {formatDate(appointment.appointment_datetime)}
              {appointment.doctor_profile?.department && (
                <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                  {appointment.doctor_profile.department.replace('_', ' ')}
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
          }}>
            {appointment.status.replace('_', ' ')}
          </span>
          {c && (open ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />)}
        </div>
      </div>

      {/* Expanded consultation details */}
      {open && c && (
        <div style={{ padding: '20px 22px', borderTop: '1px solid var(--border-subtle)' }}>
          {appointment.reason_for_visit && (
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong>Reason for visit:</strong> {appointment.reason_for_visit}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {c.symptoms && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SYMPTOMS</p>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>{c.symptoms}</p>
              </div>
            )}
            {c.diagnosis && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.06em' }}>DIAGNOSIS</p>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>{c.diagnosis}</p>
              </div>
            )}
            {c.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>DOCTOR'S NOTES</p>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>{c.notes}</p>
              </div>
            )}
          </div>

          {/* Vitals */}
          {c.vitals && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>VITALS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {c.vitals.blood_pressure_systolic && (
                  <VitalBadge icon={Activity} label="BP" value={`${c.vitals.blood_pressure_systolic}/${c.vitals.blood_pressure_diastolic}`} unit=" mmHg" />
                )}
                <VitalBadge icon={HeartPulse} label="Pulse" value={c.vitals.pulse_rate} unit=" bpm" />
                <VitalBadge icon={Thermometer} label="Temp" value={c.vitals.temperature} unit="°F" />
                <VitalBadge icon={Weight} label="Weight" value={c.vitals.weight_kg} unit=" kg" />
                <VitalBadge icon={Ruler} label="Height" value={c.vitals.height_cm} unit=" cm" />
                <VitalBadge icon={Droplets} label="SpO₂" value={c.vitals.oxygen_saturation} unit="%" />
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {c.prescriptions?.length > 0 && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>PRESCRIPTIONS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {c.prescriptions.map((p, i) => (
                  <div key={p.id || i} style={{
                    padding: '12px 16px', borderRadius: '10px',
                    background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                  }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--heading-color)' }}>{p.medication_name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {[
                        p.dosage,
                        p.frequency,
                        p.duration ? (String(p.duration).toLowerCase().includes('day') ? p.duration : `${p.duration} days`) : ''
                      ].filter(Boolean).join(' · ')}
                    </p>
                    {p.instructions && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>{p.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.follow_up_date && (
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#f59e0b', fontWeight: 600 }}>
                📅 Follow-up: {new Date(c.follow_up_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* No consultation yet message */}
      {open && !c && appointment.status === 'SCHEDULED' && (
        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Notes will appear here after your consultation.
        </div>
      )}
    </div>
  );
};

const PatientHealthRecords = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    appointmentsService.getAppointments().then(data => {
      setAppointments(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filters = ['ALL', 'COMPLETED', 'SCHEDULED', 'CANCELLED', 'NO_SHOW'];
  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);
  const completedWithConsult = appointments.filter(a => a.consultation).length;

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/patient" className="patient-back-link"><ArrowLeft size={17} /> Back to dashboard</Link>
        <PatientAvatarMenu size={42} />
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <FileHeart size={24} />
        </div>
        <div>
          <p className="patient-eyebrow">YOUR HEALTH HISTORY</p>
          <h1>Health Records</h1>
          <p>View your consultations, clinical notes, vitals, and prescriptions.</p>
        </div>
      </header>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Visits', value: appointments.length, color: '#0ea5e9' },
          { label: 'Consultations', value: completedWithConsult, color: '#10b981' },
          { label: 'Upcoming', value: appointments.filter(a => a.status === 'SCHEDULED').length, color: '#8b5cf6' },
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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
              border: filter === f ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
              background: filter === f ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: filter === f ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >{f.replace('_', ' ')}</button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Activity size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>Loading your health records…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No records found for this filter.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(apt => <ConsultationCard key={apt.id} appointment={apt} />)}
      </div>

      <div style={{
        marginTop: '28px', padding: '18px 24px', borderRadius: '14px',
        background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <Stethoscope size={22} color="var(--text-muted)" />
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Clinical notes, vitals, and prescriptions are added by your doctor after each consultation.
          Click any completed visit to expand the full record.
        </p>
      </div>
    </div>
  );
};

export default PatientHealthRecords;
