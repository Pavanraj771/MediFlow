import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Stethoscope, HeartPulse, Pill, Plus, Trash2,
  Save, CheckCircle2, AlertCircle, CalendarCheck, FlaskConical,
  ShieldAlert, Activity,
} from 'lucide-react';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const inputStyle = {
  background: 'var(--surface-input)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  padding: '10px 14px',
  borderRadius: '10px',
  outline: 'none',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'flex', flexDirection: 'column', gap: '6px',
  fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)',
};

const SectionTitle = ({ icon: Icon, label, color = '#10b981' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
    <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={16} color={color} />
    </div>
    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--heading-color)' }}>{label}</h3>
  </div>
);

const emptyPrescription = () => ({ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' });

const DoctorConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Vitals
  const [vitals, setVitals] = useState({
    blood_pressure_systolic: '', blood_pressure_diastolic: '',
    pulse_rate: '', temperature: '', weight_kg: '', height_cm: '', oxygen_saturation: '',
  });

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState([emptyPrescription()]);

  // Lab Test Orders
  const [labOrders, setLabOrders] = useState([]);

  // Home Vitals Logs
  const [homeVitals, setHomeVitals] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let apt = null;
        try {
          apt = await appointmentsService.getAppointment(appointmentId);
        } catch {
          const appts = await appointmentsService.getAppointments();
          apt = appts.find(a => String(a.id) === String(appointmentId));
        }
        setAppointment(apt);

        if (apt?.patient) {
          appointmentsService.getVitalsLogs({ patient_id: apt.patient })
            .then(data => setHomeVitals(data || []))
            .catch(() => {});
        }

        if (apt?.consultation) {
          const c = apt.consultation;
          setSymptoms(c.symptoms || '');
          setDiagnosis(c.diagnosis || '');
          setNotes(c.notes || '');
          setFollowUpDate(c.follow_up_date || '');
          if (c.vitals) {
            setVitals({
              blood_pressure_systolic: c.vitals.blood_pressure_systolic || '',
              blood_pressure_diastolic: c.vitals.blood_pressure_diastolic || '',
              pulse_rate: c.vitals.pulse_rate || '',
              temperature: c.vitals.temperature || '',
              weight_kg: c.vitals.weight_kg || '',
              height_cm: c.vitals.height_cm || '',
              oxygen_saturation: c.vitals.oxygen_saturation || '',
            });
          }
          if (c.prescriptions?.length > 0) {
            setPrescriptions(c.prescriptions.map(p => ({
              medication_name: p.medication_name || '',
              dosage: p.dosage || '',
              frequency: p.frequency || '',
              duration: p.duration || '',
              instructions: p.instructions || '',
            })));
          }
        }
      } catch (err) {
        setError('Failed to load appointment data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [appointmentId]);

  const handleVitalChange = (key, value) => setVitals(prev => ({ ...prev, [key]: value }));

  const handlePrescriptionChange = (index, key, value) => {
    setPrescriptions(prev => prev.map((p, i) => i === index ? { ...p, [key]: value } : p));
  };

  const addPrescription = () => setPrescriptions(prev => [...prev, emptyPrescription()]);

  const removePrescription = (index) => setPrescriptions(prev => prev.filter((_, i) => i !== index));

  const addLabOrder = () => setLabOrders(prev => [...prev, { test_name: '', category: 'BLOOD', instructions: '' }]);

  const removeLabOrder = (index) => setLabOrders(prev => prev.filter((_, i) => i !== index));

  const handleLabOrderChange = (index, key, value) => {
    setLabOrders(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim() && !symptoms.trim()) {
      setError('Please enter at least symptoms or a diagnosis.');
      return;
    }
    setError('');
    setSaving(true);

    // Clean vitals: convert empty strings to null
    const cleanVitals = Object.fromEntries(
      Object.entries(vitals).map(([k, v]) => [k, v === '' ? null : Number(v)])
    );
    const hasVitals = Object.values(cleanVitals).some(v => v !== null);

    // Clean prescriptions
    const cleanPrescriptions = prescriptions.filter(p => p.medication_name.trim());

    const payload = {
      symptoms,
      diagnosis,
      notes,
      follow_up_date: followUpDate || null,
      vitals: hasVitals ? cleanVitals : null,
      prescriptions: cleanPrescriptions,
    };

    try {
      await appointmentsService.saveConsultation(appointmentId, payload);

      // Order Lab Tests if any
      const validLabOrders = labOrders.filter(l => l.test_name.trim());
      for (const order of validLabOrders) {
        try {
          await appointmentsService.createLabTest({
            patient: appointment.patient,
            appointment: appointment.id,
            test_name: order.test_name.trim(),
            category: order.category,
            instructions: order.instructions.trim(),
            status: 'ORDERED',
          });
        } catch (labErr) {
          console.error('Failed to order lab test:', labErr);
        }
      }

      setSaved(true);
      setTimeout(() => {
        navigate('/doctor/appointments');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save consultation.';
      setError(msg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (iso) => iso ? new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }) : '—';

  if (loading) {
    return (
      <div className="patient-portal-page patient-profile-page">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px' }}>Loading consultation…</p>
      </div>
    );
  }

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/doctor/appointments" className="patient-back-link"><ArrowLeft size={17} /> Back to appointments</Link>
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <Stethoscope size={24} />
        </div>
        <div>
          <p className="patient-eyebrow" style={{ color: 'var(--color-doctor)' }}>
            {appointment?.consultation ? 'EDIT CONSULTATION' : 'NEW CONSULTATION'}
          </p>
          <h1>Consultation Notes</h1>
          <p>
            {appointment ? (
              <>Patient: <strong>{appointment.patient_details?.full_name}</strong> &nbsp;·&nbsp; <CalendarCheck size={13} style={{ display: 'inline' }} /> {formatDateTime(appointment.appointment_datetime)}</>
            ) : 'Add clinical notes, vitals and prescriptions.'}
          </p>
        </div>
      </header>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444',
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.87rem',
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {saved && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981',
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600,
        }}>
          <CheckCircle2 size={18} /> Consultation saved! Redirecting…
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Clinical Notes */}
        <div className="patient-profile-card">
          <SectionTitle icon={Stethoscope} label="Clinical Notes" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={labelStyle}>
              Symptoms / Presenting Complaint
              <textarea
                value={symptoms} onChange={e => setSymptoms(e.target.value)}
                rows={3} placeholder="Describe patient's symptoms…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </label>
            <label style={labelStyle}>
              Diagnosis *
              <textarea
                value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                rows={3} placeholder="Primary and secondary diagnosis…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </label>
            <label style={labelStyle}>
              Doctor's Notes & Instructions
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} placeholder="Treatment plan, lifestyle advice, referrals…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </label>
            <label style={{ ...labelStyle, maxWidth: '260px' }}>
              Follow-up Date (optional)
              <input
                type="date" value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={inputStyle}
              />
            </label>
          </div>
        </div>

        {/* Vitals */}
        <div className="patient-profile-card">
          <SectionTitle icon={HeartPulse} label="Vital Signs" color="#0ea5e9" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
            {[
              { key: 'blood_pressure_systolic', label: 'BP Systolic (mmHg)', type: 'number', placeholder: 'e.g. 120' },
              { key: 'blood_pressure_diastolic', label: 'BP Diastolic (mmHg)', type: 'number', placeholder: 'e.g. 80' },
              { key: 'pulse_rate', label: 'Pulse Rate (bpm)', type: 'number', placeholder: 'e.g. 72' },
              { key: 'temperature', label: 'Temperature (°F)', type: 'number', placeholder: 'e.g. 98.6', step: '0.1' },
              { key: 'weight_kg', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 70', step: '0.1' },
              { key: 'height_cm', label: 'Height (cm)', type: 'number', placeholder: 'e.g. 170', step: '0.1' },
              { key: 'oxygen_saturation', label: 'SpO₂ (%)', type: 'number', placeholder: 'e.g. 98' },
            ].map(({ key, label, type, placeholder, step }) => (
              <label key={key} style={labelStyle}>
                {label}
                <input
                  type={type} step={step} placeholder={placeholder}
                  value={vitals[key]}
                  onChange={e => handleVitalChange(key, e.target.value)}
                  style={inputStyle}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="patient-profile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={16} color="#8b5cf6" />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Prescriptions</h3>
            </div>
            <button type="button" onClick={addPrescription} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)',
            }}>
              <Plus size={14} /> Add Medication
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {prescriptions.map((p, i) => (
              <div key={i} style={{
                padding: '16px', borderRadius: '12px',
                background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.05em' }}>MEDICATION #{i + 1}</span>
                  {prescriptions.length > 1 && (
                    <button type="button" onClick={() => removePrescription(i)} style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px',
                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                    }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                    Medication Name *
                    <input type="text" placeholder="e.g. Amoxicillin"
                      value={p.medication_name} onChange={e => handlePrescriptionChange(i, 'medication_name', e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Dosage
                    <input type="text" placeholder="e.g. 500mg"
                      value={p.dosage} onChange={e => handlePrescriptionChange(i, 'dosage', e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Frequency
                    <input type="text" placeholder="e.g. Twice daily"
                      value={p.frequency} onChange={e => handlePrescriptionChange(i, 'frequency', e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Duration
                    <input type="text" placeholder="e.g. 7 days"
                      value={p.duration} onChange={e => handlePrescriptionChange(i, 'duration', e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                    Special Instructions
                    <input type="text" placeholder="e.g. Take after meals, avoid alcohol"
                      value={p.instructions} onChange={e => handlePrescriptionChange(i, 'instructions', e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic & Lab Orders */}
        <div className="patient-profile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <SectionTitle icon={FlaskConical} label="Diagnostic & Lab Test Orders" color="#0ea5e9" />
            <button type="button" onClick={addLabOrder} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.3)',
            }}>
              <Plus size={14} /> + Order Lab Test
            </button>
          </div>

          {labOrders.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No diagnostic tests ordered. Click "+ Order Lab Test" to request blood work, imaging, or pathology.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {labOrders.map((l, i) => (
                <div key={i} style={{
                  padding: '16px', borderRadius: '12px',
                  background: 'rgba(14, 165, 233, 0.04)', border: '1px solid rgba(14, 165, 233, 0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.05em' }}>
                      LAB TEST #{i + 1}
                    </span>
                    <button type="button" onClick={() => removeLabOrder(i)} style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px',
                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px' }}>
                    <label style={labelStyle}>
                      Test Name *
                      <input
                        type="text"
                        placeholder="e.g. Complete Blood Count (CBC) or Lipid Panel"
                        value={l.test_name}
                        onChange={e => handleLabOrderChange(i, 'test_name', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <label style={labelStyle}>
                      Category
                      <select
                        value={l.category}
                        onChange={e => handleLabOrderChange(i, 'category', e.target.value)}
                        style={inputStyle}
                      >
                        <option value="BLOOD">Blood Test</option>
                        <option value="IMAGING">Imaging / X-Ray</option>
                        <option value="URINE">Urinalysis</option>
                        <option value="PATHOLOGY">Pathology</option>
                        <option value="CARDIAC">Cardiac Diagnostic</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>
                    <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                      Pre-test Patient Instructions
                      <input
                        type="text"
                        placeholder="e.g. Fasting 12 hours prior, withhold morning medications"
                        value={l.instructions}
                        onChange={e => handleLabOrderChange(i, 'instructions', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' }}>
          <Link to="/doctor/appointments" style={{
            padding: '12px 24px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
            background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
            textDecoration: 'none', display: 'flex', alignItems: 'center',
          }}>
            Cancel
          </Link>
          <button type="submit" disabled={saving || saved} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 28px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700,
            background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', border: 'none', cursor: saving || saved ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          }}>
            {saved ? <><CheckCircle2 size={17} /> Saved!</> :
             saving ? 'Saving…' : <><Save size={17} /> Save Consultation</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorConsultation;
