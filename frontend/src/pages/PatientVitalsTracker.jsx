import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, ArrowLeft, Plus, Activity, Droplets,
  Scale, Thermometer, Wind, AlertCircle, CheckCircle2,
  Trash2, TrendingUp, Calendar, Info, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsService } from '../services/api';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import '../styles/PatientPortal.css';

const getBPStatus = (sys, dia) => {
  if (!sys || !dia) return null;
  const s = Number(sys);
  const d = Number(dia);
  if (s >= 180 || d >= 120) return { label: 'Hypertensive Crisis', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  if (s >= 140 || d >= 90) return { label: 'Hypertension Stage 2', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' };
  if (s >= 130 || d >= 80) return { label: 'Hypertension Stage 1', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
  if (s >= 120 && d < 80) return { label: 'Elevated BP', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' };
  return { label: 'Normal Blood Pressure', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
};

const getGlucoseStatus = (val) => {
  if (!val) return null;
  const v = Number(val);
  if (v < 70) return { label: 'Low (Hypoglycemia)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
  if (v <= 99) return { label: 'Normal (Fasting)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
  if (v <= 125) return { label: 'Elevated / Prediabetic', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
  return { label: 'High (Hyperglycemia)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
};

const getBMICategory = (bmi) => {
  if (!bmi) return null;
  const b = Number(bmi);
  if (b < 18.5) return { label: 'Underweight', color: '#38bdf8' };
  if (b < 25) return { label: 'Normal Weight', color: '#10b981' };
  if (b < 30) return { label: 'Overweight', color: '#f59e0b' };
  return { label: 'Obese', color: '#ef4444' };
};

const PatientVitalsTracker = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);

  // Form state
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [pulseRate, setPulseRate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vLogs, prof] = await Promise.all([
        appointmentsService.getVitalsLogs(),
        appointmentsService.getPatientProfile().catch(() => null),
      ]);
      setLogs(vLogs);
      setPatientProfile(prof);
    } catch (err) {
      console.error('Failed to load vitals data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveLog = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await appointmentsService.createVitalsLog({
        blood_pressure_systolic: systolic ? Number(systolic) : null,
        blood_pressure_diastolic: diastolic ? Number(diastolic) : null,
        blood_sugar: bloodSugar ? Number(bloodSugar) : null,
        pulse_rate: pulseRate ? Number(pulseRate) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        oxygen_saturation: oxygenSaturation ? Number(oxygenSaturation) : null,
        temperature: temperature ? Number(temperature) : null,
        notes: notes.trim(),
      });
      setShowLogModal(false);
      setSystolic('');
      setDiastolic('');
      setBloodSugar('');
      setPulseRate('');
      setWeightKg('');
      setOxygenSaturation('');
      setTemperature('');
      setNotes('');
      loadData();
    } catch (err) {
      console.error('Failed to save log:', err);
      alert('Failed to save vitals log.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vital log entry?')) return;
    try {
      await appointmentsService.deleteVitalsLog(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  // Latest readings
  const latestLog = logs[0] || null;
  const latestBP = latestLog?.blood_pressure_systolic && latestLog?.blood_pressure_diastolic
    ? `${latestLog.blood_pressure_systolic}/${latestLog.blood_pressure_diastolic}`
    : null;
  const bpStatus = latestLog ? getBPStatus(latestLog.blood_pressure_systolic, latestLog.blood_pressure_diastolic) : null;
  const sugarStatus = latestLog?.blood_sugar ? getGlucoseStatus(latestLog.blood_sugar) : null;

  // BMI Calculation (assume height from profile if available or placeholder ~170cm)
  const heightCm = 172; // standard baseline or derived from consultation
  const bmiVal = latestLog?.weight_kg
    ? (Number(latestLog.weight_kg) / Math.pow(heightCm / 100, 2)).toFixed(1)
    : null;
  const bmiCat = getBMICategory(bmiVal);

  return (
    <div className="patient-portal-page">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/patient"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '12px',
              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'grid', placeItems: 'center', color: '#ef4444',
            }}>
              <HeartPulse size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                Vitals & Chronic Health Tracker
              </h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Track daily blood pressure, blood glucose, weight, and vital trends
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowLogModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: '0.86rem', fontWeight: 700,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
            }}
          >
            <Plus size={16} /> Log Today's Vitals
          </button>
          <PatientAvatarMenu />
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Blood Pressure Card */}
        <div style={{
          padding: '20px', borderRadius: '18px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Blood Pressure</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'grid', placeItems: 'center' }}>
              <HeartPulse size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--heading-color)', marginBottom: '4px' }}>
            {latestBP || '— / —'} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>mmHg</span>
          </div>
          {bpStatus ? (
            <span style={{
              display: 'inline-block', padding: '3px 9px', borderRadius: '20px',
              background: bpStatus.bg, color: bpStatus.color, fontSize: '0.74rem', fontWeight: 800,
            }}>
              {bpStatus.label}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No readings recorded</span>
          )}
        </div>

        {/* Blood Sugar Card */}
        <div style={{
          padding: '20px', borderRadius: '18px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Blood Glucose</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'grid', placeItems: 'center' }}>
              <Droplets size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--heading-color)', marginBottom: '4px' }}>
            {latestLog?.blood_sugar || '—'} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>mg/dL</span>
          </div>
          {sugarStatus ? (
            <span style={{
              display: 'inline-block', padding: '3px 9px', borderRadius: '20px',
              background: sugarStatus.bg, color: sugarStatus.color, fontSize: '0.74rem', fontWeight: 800,
            }}>
              {sugarStatus.label}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: 70-99 mg/dL</span>
          )}
        </div>

        {/* Heart Rate / Pulse Card */}
        <div style={{
          padding: '20px', borderRadius: '18px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Resting Pulse</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'grid', placeItems: 'center' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--heading-color)', marginBottom: '4px' }}>
            {latestLog?.pulse_rate || '—'} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>bpm</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Healthy resting: 60 – 100 bpm
          </span>
        </div>

        {/* Weight & BMI Card */}
        <div style={{
          padding: '20px', borderRadius: '18px',
          background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Body Weight & BMI</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'grid', placeItems: 'center' }}>
              <Scale size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--heading-color)', marginBottom: '4px' }}>
            {latestLog?.weight_kg || '—'} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
          </div>
          {bmiVal ? (
            <span style={{ fontSize: '0.78rem', color: bmiCat?.color, fontWeight: 700 }}>
              BMI: {bmiVal} ({bmiCat?.label})
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Log weight to compute BMI</span>
          )}
        </div>
      </div>

      {/* Visual Trends Preview */}
      {logs.length > 1 && (
        <div style={{
          background: 'var(--bg-glass-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          padding: '20px 24px',
          marginBottom: '24px',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#0ea5e9" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                Recent Vitals Trajectory ({logs.length} data points)
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} /> Systolic BP
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0ea5e9' }} /> Diastolic BP
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> Blood Sugar
              </span>
            </div>
          </div>

          {/* Simple Sparkline / Visual Trend Bars */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            height: '110px',
            padding: '10px 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {logs.slice(0, 10).reverse().map((item, idx) => {
              const sysHeight = item.blood_pressure_systolic ? Math.min(100, Math.max(20, (item.blood_pressure_systolic / 180) * 100)) : 10;
              const diaHeight = item.blood_pressure_diastolic ? Math.min(80, Math.max(15, (item.blood_pressure_diastolic / 180) * 100)) : 8;
              const sugarHeight = item.blood_sugar ? Math.min(100, Math.max(15, (item.blood_sugar / 200) * 100)) : 0;

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
                    <div
                      title={`Systolic: ${item.blood_pressure_systolic} mmHg`}
                      style={{
                        width: '8px', height: `${sysHeight}%`,
                        background: '#ef4444', borderRadius: '4px 4px 0 0',
                      }}
                    />
                    <div
                      title={`Diastolic: ${item.blood_pressure_diastolic} mmHg`}
                      style={{
                        width: '8px', height: `${diaHeight}%`,
                        background: '#0ea5e9', borderRadius: '4px 4px 0 0',
                      }}
                    />
                    {sugarHeight > 0 && (
                      <div
                        title={`Blood Sugar: ${item.blood_sugar} mg/dL`}
                        style={{
                          width: '8px', height: `${sugarHeight}%`,
                          background: '#10b981', borderRadius: '4px 4px 0 0',
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date(item.recorded_at).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Logs Table */}
      <div style={{
        background: 'var(--bg-glass-card)',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-color)' }}>
            Historical Readings & Logs
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {logs.length} recorded entries
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading vitals log...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <HeartPulse size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>No vitals recorded yet</p>
            <p style={{ margin: '4px 0 16px', fontSize: '0.84rem' }}>
              Begin tracking your blood pressure, sugar, and heart rate for doctor visibility.
            </p>
            <button
              onClick={() => setShowLogModal(true)}
              style={{
                padding: '8px 18px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700,
              }}
            >
              + Log First Reading
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>Date & Time</th>
                  <th style={{ padding: '14px 20px' }}>Blood Pressure</th>
                  <th style={{ padding: '14px 20px' }}>Glucose</th>
                  <th style={{ padding: '14px 20px' }}>Pulse</th>
                  <th style={{ padding: '14px 20px' }}>Weight / SpO2</th>
                  <th style={{ padding: '14px 20px' }}>Context / Notes</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const bp = log.blood_pressure_systolic && log.blood_pressure_diastolic
                    ? `${log.blood_pressure_systolic}/${log.blood_pressure_diastolic}`
                    : '—';
                  const st = getBPStatus(log.blood_pressure_systolic, log.blood_pressure_diastolic);

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s' }}>
                      <td style={{ padding: '14px 20px', color: 'var(--heading-color)', fontWeight: 600 }}>
                        {new Date(log.recorded_at).toLocaleString([], {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--heading-color)' }}>{bp} mmHg</div>
                        {st && (
                          <span style={{ fontSize: '0.72rem', color: st.color, fontWeight: 700 }}>
                            {st.label}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--heading-color)', fontWeight: 600 }}>
                        {log.blood_sugar ? `${log.blood_sugar} mg/dL` : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--heading-color)' }}>
                        {log.pulse_rate ? `${log.pulse_rate} bpm` : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                        {log.weight_kg ? `${log.weight_kg} kg` : ''}
                        {log.oxygen_saturation ? ` • SpO2: ${log.oxygen_saturation}%` : ''}
                        {!log.weight_kg && !log.oxygen_saturation ? '—' : ''}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {log.notes || '—'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(log.id)}
                          title="Delete entry"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '4px',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Log Today's Vitals */}
      {showLogModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'grid', placeItems: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-glass-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            backdropFilter: 'blur(30px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                  display: 'grid', placeItems: 'center',
                }}>
                  <HeartPulse size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  Log Daily Health Metrics
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* BP Inputs */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Blood Pressure (Systolic / Diastolic mmHg)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="Systolic (e.g. 120)"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Diastolic (e.g. 80)"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Blood Sugar & Pulse */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Blood Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 95.0"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Pulse Rate (BPM)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    value={pulseRate}
                    onChange={(e) => setPulseRate(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Weight & SpO2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Oxygen Saturation (SpO2 %)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 98"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Context / Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Context / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning fasting, post 30min walk, before dinner"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px', borderRadius: '10px',
                    border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff', cursor: 'pointer', fontWeight: 700,
                  }}
                >
                  {saving ? 'Saving...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVitalsTracker;
