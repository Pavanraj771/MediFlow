import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileHeart, HeartPulse, ClipboardList,
  ChevronDown, ChevronUp, CalendarCheck, Clock,
  Pill, Thermometer, Activity, Weight, Droplets, Ruler,
} from 'lucide-react';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const VitalBadge = ({ icon: Icon, label, value, unit }) => {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
      borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
      fontSize: '0.8rem',
    }}>
      <Icon size={13} color="var(--text-muted)" />
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <strong>{value}{unit}</strong>
    </div>
  );
};

const DoctorPatientDetail = () => {
  const { patientId } = useParams();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState({});

  useEffect(() => {
    appointmentsService.getPatientConsultations(patientId)
      .then(setConsultations).catch(console.error).finally(() => setLoading(false));
  }, [patientId]);

  const toggleOpen = (id) => setOpenIds(prev => ({ ...prev, [id]: !prev[id] }));

  const formatDate = (iso) => new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/doctor/patients" className="patient-back-link"><ArrowLeft size={17} /> Back to patients</Link>
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
          <FileHeart size={24} />
        </div>
        <div>
          <p className="patient-eyebrow" style={{ color: 'var(--color-doctor)' }}>PATIENT HEALTH HISTORY</p>
          <h1>Consultation Records</h1>
          <p>All consultation notes you have added for this patient.</p>
        </div>
      </header>

      {loading && <p style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Loading records…</p>}

      {!loading && consultations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No consultation notes yet for this patient.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {consultations.map(c => (
          <div key={c.id} style={{
            borderRadius: '16px', overflow: 'hidden',
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          }}>
            <div
              onClick={() => toggleOpen(c.id)}
              style={{
                padding: '18px 22px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: openIds[c.id] ? 'var(--surface-hover)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '10px',
                  background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ClipboardList size={16} color="#10b981" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                    {c.diagnosis ? c.diagnosis.substring(0, 60) + (c.diagnosis.length > 60 ? '…' : '') : 'Consultation Note'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CalendarCheck size={11} /> {formatDate(c.created_at)}
                  </p>
                </div>
              </div>
              {openIds[c.id] ? <ChevronUp size={17} color="var(--text-muted)" /> : <ChevronDown size={17} color="var(--text-muted)" />}
            </div>

            {openIds[c.id] && (
              <div style={{ padding: '20px 22px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {c.symptoms && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SYMPTOMS</p>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{c.symptoms}</p>
                    </div>
                  )}
                  {c.diagnosis && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.06em' }}>DIAGNOSIS</p>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{c.diagnosis}</p>
                    </div>
                  )}
                  {c.notes && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>NOTES</p>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{c.notes}</p>
                    </div>
                  )}
                  {c.vitals && (
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>VITALS</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {c.vitals.blood_pressure_systolic && <VitalBadge icon={Activity} label="BP" value={`${c.vitals.blood_pressure_systolic}/${c.vitals.blood_pressure_diastolic}`} unit=" mmHg" />}
                        <VitalBadge icon={HeartPulse} label="Pulse" value={c.vitals.pulse_rate} unit=" bpm" />
                        <VitalBadge icon={Thermometer} label="Temp" value={c.vitals.temperature} unit="°F" />
                        <VitalBadge icon={Weight} label="Weight" value={c.vitals.weight_kg} unit=" kg" />
                        <VitalBadge icon={Ruler} label="Height" value={c.vitals.height_cm} unit=" cm" />
                        <VitalBadge icon={Droplets} label="SpO₂" value={c.vitals.oxygen_saturation} unit="%" />
                      </div>
                    </div>
                  )}
                  {c.prescriptions?.length > 0 && (
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>PRESCRIPTIONS</p>
                      {c.prescriptions.map((p, i) => (
                        <div key={p.id || i} style={{
                          padding: '10px 14px', borderRadius: '8px', marginBottom: '6px',
                          background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                        }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{p.medication_name}</p>
                          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {[p.dosage, p.frequency, p.duration].filter(Boolean).join(' · ')}
                          </p>
                          {p.instructions && <p style={{ margin: '3px 0 0', fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-dim)' }}>{p.instructions}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {c.follow_up_date && (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#f59e0b', fontWeight: 600 }}>
                        📅 Follow-up: {new Date(c.follow_up_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorPatientDetail;
