import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileHeart, HeartPulse, ClipboardList,
  ChevronDown, ChevronUp, CalendarCheck, Clock,
  Pill, Thermometer, Activity, Weight, Droplets, Ruler,
  FileText, Stethoscope, User, AlertCircle, ShieldAlert,
  Calendar, CheckCircle2, ChevronRight, Star
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
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNotes, setOpenNotes] = useState({});
  const [filterMode, setFilterMode] = useState('VISITED'); // 'VISITED' | 'ALL'

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Primary: fetch aggregated patient details & appointments
        const res = await appointmentsService.getMyPatientDetail(patientId);
        if (res?.patient) {
          setPatient(res.patient);
          setAppointments(res.appointments || []);
        } else {
          // Fallback
          const appts = await appointmentsService.getAppointments({ patient: patientId });
          setAppointments(appts || []);
          if (appts?.length > 0) {
            setPatient(appts[0].patient_details);
          }
        }
      } catch (err) {
        console.error('Error fetching patient detail:', err);
        try {
          const appts = await appointmentsService.getAppointments({ patient: patientId });
          setAppointments(appts || []);
          if (appts?.length > 0) {
            setPatient(appts[0].patient_details);
          }
        } catch (e2) {
          console.error(e2);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  const toggleNotes = (id) => {
    setOpenNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (iso) => new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  const visitedAppointments = appointments.filter(a => a.status === 'COMPLETED' || !!a.consultation);
  const displayedAppointments = filterMode === 'VISITED' ? visitedAppointments : appointments;

  const STATUS_CONFIG = {
    SCHEDULED: { bg: 'rgba(14,165,233,0.12)', color: '#0ea5e9', border: 'rgba(14,165,233,0.25)', label: 'Scheduled' },
    COMPLETED: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)', label: 'Visited / Completed' },
    CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)', label: 'Cancelled' },
    NO_SHOW: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', label: 'No-Show' },
  };

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/doctor/patients" className="patient-back-link">
          <ArrowLeft size={17} /> Back to patients
        </Link>
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <FileHeart size={24} />
        </div>
        <div>
          <p className="patient-eyebrow" style={{ color: 'var(--color-doctor)' }}>CLINICAL WORKSTATION</p>
          <h1>Patient Health Records</h1>
          <p>Complete consultation history, visited appointments, and clinical notes for this patient.</p>
        </div>
      </header>

      {/* Patient Profile Card */}
      {patient && (
        <div style={{
          padding: '22px 24px', borderRadius: '16px', marginBottom: '20px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '1.3rem',
            }}>
              {patient.full_name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{patient.full_name}</h2>
                {patient.blood_group && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                    background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                  }}>
                    Blood: {patient.blood_group}
                  </span>
                )}
                {patient.critical_alert && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                    background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <ShieldAlert size={12} /> Medical Alert
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {patient.email} {patient.phone_number && `· ${patient.phone_number}`}
              </p>
              {patient.date_of_birth && (
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  DOB: {patient.date_of_birth}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              padding: '10px 16px', borderRadius: '12px', background: 'var(--surface-hover)',
              border: '1px solid var(--border-subtle)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visited Consultations</p>
              <p style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                {visitedAppointments.length}
              </p>
            </div>
            <div style={{
              padding: '10px 16px', borderRadius: '12px', background: 'var(--surface-hover)',
              border: '1px solid var(--border-subtle)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Appointments</p>
              <p style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {appointments.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation / Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={() => setFilterMode('VISITED')}
          style={{
            padding: '7px 16px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
            border: filterMode === 'VISITED' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
            background: filterMode === 'VISITED' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: filterMode === 'VISITED' ? '#10b981' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          Visited Appointments ({visitedAppointments.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('ALL')}
          style={{
            padding: '7px 16px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
            border: filterMode === 'ALL' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
            background: filterMode === 'ALL' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: filterMode === 'ALL' ? '#10b981' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          All Appointments ({appointments.length})
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Loading appointment records…</p>}

      {!loading && displayedAppointments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>{filterMode === 'VISITED' ? 'No visited appointments found for this patient.' : 'No appointments on record for this patient.'}</p>
        </div>
      )}

      {/* Appointments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {displayedAppointments.map(apt => {
          const sc = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED;
          const c = apt.consultation;
          const isNotesOpen = !!openNotes[apt.id];

          return (
            <div key={apt.id} style={{
              borderRadius: '16px', overflow: 'hidden',
              background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              {/* Appointment Card Header */}
              <div style={{
                padding: '18px 22px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                background: isNotesOpen ? 'var(--surface-hover)' : 'transparent',
                transition: 'background 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '12px',
                    background: apt.status === 'COMPLETED' ? 'rgba(16,185,129,0.15)' : 'rgba(14,165,233,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: apt.status === 'COMPLETED' ? '#10b981' : '#0ea5e9',
                  }}>
                    <CalendarCheck size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
                        {formatDate(apt.appointment_datetime)}
                      </h3>
                      <span style={{
                        padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                      }}>
                        {sc.label}
                      </span>
                      {apt.duration_minutes && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({apt.duration_minutes} min duration)
                        </span>
                      )}
                    </div>
                    {apt.reason_for_visit && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <strong>Reason:</strong> {apt.reason_for_visit}
                      </p>
                    )}
                    {apt.review && (
                      <div style={{
                        marginTop: '6px', padding: '6px 12px', borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                      }}>
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
                        {apt.review.comment && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                            "{apt.review.comment}"
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {c ? (
                    <button
                      type="button"
                      onClick={() => toggleNotes(apt.id)}
                      className="patient-secondary-button"
                      style={{
                        padding: '6px 14px', fontSize: '0.82rem', minHeight: '36px',
                        borderColor: isNotesOpen ? '#10b981' : 'var(--border-subtle)',
                        color: isNotesOpen ? '#10b981' : 'var(--text-main)',
                      }}
                    >
                      <FileText size={14} />
                      {isNotesOpen ? 'Hide Notes' : 'View Notes'}
                      {isNotesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  ) : (
                    <Link
                      to={`/doctor/appointments/${apt.id}/consult`}
                      className="patient-primary-button"
                      style={{
                        padding: '6px 14px', fontSize: '0.82rem', minHeight: '36px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <Stethoscope size={14} /> Add Notes
                    </Link>
                  )}
                </div>
              </div>

              {/* Consultation Notes Details Dropdown */}
              {c && isNotesOpen && (
                <div style={{
                  padding: '20px 24px', borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--surface-hover)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClipboardList size={16} color="var(--color-doctor)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-doctor)', letterSpacing: '0.04em' }}>
                        CLINICAL CONSULTATION NOTES
                      </span>
                    </div>
                    <Link
                      to={`/doctor/appointments/${apt.id}/consult`}
                      style={{
                        fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <Stethoscope size={13} /> Edit Full Consultation <ChevronRight size={13} />
                    </Link>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {c.diagnosis && (
                      <div style={{
                        padding: '12px 16px', borderRadius: '10px',
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                      }}>
                        <p style={{ margin: '0 0 4px', fontSize: '0.74rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.06em' }}>DIAGNOSIS</p>
                        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600 }}>{c.diagnosis}</p>
                      </div>
                    )}

                    {c.symptoms && (
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SYMPTOMS REPORTED</p>
                        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>{c.symptoms}</p>
                      </div>
                    )}

                    {c.notes && (
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>DOCTOR'S CLINICAL NOTES</p>
                        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>{c.notes}</p>
                      </div>
                    )}

                    {/* Vitals */}
                    {c.vitals && (
                      <div>
                        <p style={{ margin: '0 0 8px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>RECORDED VITALS</p>
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
                        <p style={{ margin: '0 0 8px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>PRESCRIBED MEDICATIONS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {c.prescriptions.map((p, idx) => (
                            <div key={p.id || idx} style={{
                              padding: '10px 14px', borderRadius: '10px',
                              background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
                            }}>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Pill size={14} color="#8b5cf6" /> {p.medication_name}
                                </p>
                                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {[
                                    p.dosage,
                                    p.frequency,
                                    p.duration ? (String(p.duration).toLowerCase().includes('day') ? p.duration : `${p.duration} days`) : ''
                                  ].filter(Boolean).join(' · ')}
                                </p>
                              </div>
                              {p.instructions && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                  {p.instructions}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up */}
                    {c.follow_up_date && (
                      <div style={{
                        padding: '10px 14px', borderRadius: '8px',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <Calendar size={15} color="#f59e0b" />
                        <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
                          Recommended Follow-up Visit: {new Date(c.follow_up_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorPatientDetail;