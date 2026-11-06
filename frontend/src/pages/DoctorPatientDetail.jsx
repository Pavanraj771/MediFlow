import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileHeart, HeartPulse, ClipboardList,
  ChevronDown, ChevronUp, CalendarCheck, Clock,
  Pill, Thermometer, Activity, Weight, Droplets, Ruler,
  FileText, Stethoscope, User, AlertCircle, ShieldAlert,
  Calendar, CheckCircle2, ChevronRight, Star, MessageSquare,
  FlaskConical, Plus, Printer, Edit3, X, AlertTriangle, Check
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

const LAB_CATEGORIES = [
  { value: 'BLOOD', label: 'Blood Test' },
  { value: 'IMAGING', label: 'Imaging / Radiology' },
  { value: 'URINE', label: 'Urinalysis' },
  { value: 'PATHOLOGY', label: 'Pathology & Biopsy' },
  { value: 'CARDIAC', label: 'Cardiology Diagnostics' },
  { value: 'OTHER', label: 'Other Diagnostic' },
];

const LAB_STATUS_CONFIG = {
  ORDERED: { label: 'Test Ordered', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  SAMPLE_COLLECTED: { label: 'Sample Collected', bg: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.3)' },
  COMPLETED: { label: 'Results Ready', bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
  REVIEWED: { label: 'Doctor Reviewed', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
};

const LAB_FLAG_CONFIG = {
  NORMAL: { label: 'Normal Limits', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
  HIGH: { label: 'High / Elevated', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' },
  LOW: { label: 'Low / Subnormal', bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.25)' },
  CRITICAL: { label: 'Critical Alert', bg: 'rgba(239, 68, 68, 0.14)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.35)' },
};

const DoctorPatientDetail = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNotes, setOpenNotes] = useState({});
  const [filterMode, setFilterMode] = useState('VISITED'); // 'VISITED' | 'ALL'

  // Workstation Main Tabs: 'APPOINTMENTS' | 'LABS'
  const [activeSection, setActiveSection] = useState('APPOINTMENTS');
  const [labTests, setLabTests] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [labFilterStatus, setLabFilterStatus] = useState('ALL');

  // Order New Lab Modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    test_name: '',
    category: 'BLOOD',
    instructions: '',
    abnormal_flag: 'NORMAL',
  });
  const [orderingLab, setOrderingLab] = useState(false);

  // Edit / Enter Results Modal state
  const [editingLab, setEditingLab] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'ORDERED',
    abnormal_flag: 'NORMAL',
    results_summary: '',
    doctor_notes: '',
    file_name: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await appointmentsService.getMyPatientDetail(patientId);
      if (res?.patient) {
        setPatient(res.patient);
        setAppointments(res.appointments || []);
      } else {
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

  const loadLabTests = async () => {
    try {
      setLoadingLabs(true);
      const data = await appointmentsService.getLabTests({ patient_id: patientId });
      setLabTests(data || []);
    } catch (err) {
      console.error('Error fetching lab tests:', err);
    } finally {
      setLoadingLabs(false);
    }
  };

  useEffect(() => {
    loadData();
    loadLabTests();
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

  // Lab Actions
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderForm.test_name.trim()) return;
    setOrderingLab(true);
    try {
      await appointmentsService.createLabTest({
        patient: patientId,
        test_name: orderForm.test_name.trim(),
        category: orderForm.category,
        instructions: orderForm.instructions.trim(),
        abnormal_flag: orderForm.abnormal_flag,
        status: 'ORDERED',
      });
      setShowOrderModal(false);
      setOrderForm({ test_name: '', category: 'BLOOD', instructions: '', abnormal_flag: 'NORMAL' });
      await loadLabTests();
    } catch (err) {
      console.error('Failed to order lab test:', err);
      alert('Could not order lab test. Please try again.');
    } finally {
      setOrderingLab(false);
    }
  };

  const openEditModal = (lab) => {
    setEditingLab(lab);
    setEditForm({
      status: lab.status || 'ORDERED',
      abnormal_flag: lab.abnormal_flag || 'NORMAL',
      results_summary: lab.results_summary || '',
      doctor_notes: lab.doctor_notes || '',
      file_name: lab.file_name || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLab) return;
    setSavingEdit(true);
    try {
      const updated = await appointmentsService.updateLabTest(editingLab.id, {
        status: editForm.status,
        abnormal_flag: editForm.abnormal_flag,
        results_summary: editForm.results_summary.trim(),
        doctor_notes: editForm.doctor_notes.trim(),
        file_name: editForm.file_name.trim(),
      });
      setLabTests(prev => prev.map(t => t.id === editingLab.id ? updated : t));
      setEditingLab(null);
    } catch (err) {
      console.error('Failed to update lab test:', err);
      alert('Could not update lab test. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleQuickStatus = async (lab, nextStatus) => {
    try {
      const updated = await appointmentsService.updateLabTest(lab.id, { status: nextStatus });
      setLabTests(prev => prev.map(t => t.id === lab.id ? updated : t));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Status update failed.');
    }
  };

  const handlePrintLab = (lab) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${lab.test_name} - Diagnostic Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
            .box { background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">MediFlow Diagnostic Lab Report</h1>
            <p style="margin: 4px 0 0; color: #64748b;">Hospital Laboratory & Clinical Pathology Services</p>
          </div>
          <div class="grid">
            <div>
              <strong>Patient Name:</strong> ${patient?.full_name || 'Patient'}<br>
              <strong>Email:</strong> ${patient?.email || 'N/A'}<br>
              <strong>Blood Group:</strong> ${patient?.blood_group || 'N/A'}
            </div>
            <div>
              <strong>Test Name:</strong> ${lab.test_name}<br>
              <strong>Category:</strong> ${lab.category}<br>
              <strong>Status:</strong> ${lab.status}<br>
              <strong>Abnormal Flag:</strong> ${lab.abnormal_flag}
            </div>
          </div>
          ${lab.instructions ? `
            <div class="section">
              <div class="section-title">Pre-Test Instructions</div>
              <div class="box">${lab.instructions}</div>
            </div>
          ` : ''}
          <div class="section">
            <div class="section-title">Laboratory Results & Metrics</div>
            <div class="box">${lab.results_summary || 'No laboratory findings recorded.'}</div>
          </div>
          ${lab.doctor_notes ? `
            <div class="section">
              <div class="section-title">Physician Clinical Interpretation</div>
              <div class="box" style="background: #ecfdf5; border: 1px solid #a7f3d0;">${lab.doctor_notes}</div>
            </div>
          ` : ''}
          <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">
            This report was electronically signed and validated via MediFlow Clinical Platform.
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredLabTests = labTests.filter(lab => {
    if (labFilterStatus === 'ALL') return true;
    if (labFilterStatus === 'CRITICAL') return lab.abnormal_flag === 'CRITICAL';
    return lab.status === labFilterStatus;
  });

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
          <p>Complete consultation history, diagnostic lab test management, and clinical records for this patient.</p>
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
            <Link
              to={`/doctor/messages?patientId=${patient.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                fontWeight: 700, fontSize: '0.84rem', textDecoration: 'none',
              }}
              title="Send direct follow-up message to this patient"
            >
              <MessageSquare size={16} />
              <span>Message Patient</span>
            </Link>

            <div style={{
              padding: '10px 16px', borderRadius: '12px', background: 'var(--surface-hover)',
              border: '1px solid var(--border-subtle)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visited Visits</p>
              <p style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                {visitedAppointments.length}
              </p>
            </div>
            <div style={{
              padding: '10px 16px', borderRadius: '12px', background: 'var(--surface-hover)',
              border: '1px solid var(--border-subtle)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lab Reports</p>
              <p style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#0ea5e9' }}>
                {labTests.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Workstation Section Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px',
      }}>
        <button
          type="button"
          onClick={() => setActiveSection('APPOINTMENTS')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeSection === 'APPOINTMENTS' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeSection === 'APPOINTMENTS' ? '#10b981' : 'var(--text-muted)',
            border: activeSection === 'APPOINTMENTS' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
            transition: 'all 0.2s',
          }}
        >
          <ClipboardList size={16} />
          <span>Consultations & Encounters ({appointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('LABS')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeSection === 'LABS' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
            color: activeSection === 'LABS' ? '#0ea5e9' : 'var(--text-muted)',
            border: activeSection === 'LABS' ? '1px solid #0ea5e9' : '1px solid var(--border-subtle)',
            transition: 'all 0.2s',
          }}
        >
          <FlaskConical size={16} />
          <span>Lab Tests & Diagnostics ({labTests.length})</span>
        </button>
      </div>

      {/* SECTION 1: APPOINTMENTS & CONSULTATIONS */}
      {activeSection === 'APPOINTMENTS' && (
        <div>
          {/* Filter Sub-Tabs */}
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
                  <div style={{
                    padding: '18px 22px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                    borderBottom: isNotesOpen ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                        }}>
                          {sc.label}
                        </span>
                        <strong style={{ fontSize: '0.98rem' }}>{formatDate(apt.appointment_datetime)}</strong>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Doctor: <strong>Dr. {apt.doctor_details?.full_name || 'Assigned'}</strong>
                        {apt.reason_for_visit && ` · Reason: "${apt.reason_for_visit}"`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {c ? (
                        <button
                          type="button"
                          onClick={() => toggleNotes(apt.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: isNotesOpen ? 'rgba(16,185,129,0.15)' : 'var(--surface-hover)',
                            color: isNotesOpen ? '#10b981' : 'var(--text-main)',
                            border: '1px solid var(--border-subtle)',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                          }}
                        >
                          <FileText size={15} />
                          <span>{isNotesOpen ? 'Hide Consultation' : 'View Clinical Notes'}</span>
                          {isNotesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          No consultation note entered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Consultation Details */}
                  {c && isNotesOpen && (
                    <div style={{ padding: '20px 24px', background: 'var(--surface-input)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {c.diagnosis && (
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>DIAGNOSIS</p>
                          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#10b981' }}>{c.diagnosis}</p>
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: LAB TESTS & DIAGNOSTICS MANAGEMENT */}
      {activeSection === 'LABS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Metrics KPI Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}>
            {[
              { label: 'Total Diagnostic Tests', value: labTests.length, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
              { label: 'Ordered / In Progress', value: labTests.filter(t => t.status === 'ORDERED' || t.status === 'SAMPLE_COLLECTED').length, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
              { label: 'Results Ready', value: labTests.filter(t => t.status === 'COMPLETED').length, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
              { label: 'Doctor Reviewed', value: labTests.filter(t => t.status === 'REVIEWED').length, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
              { label: 'Critical Alerts', value: labTests.filter(t => t.abnormal_flag === 'CRITICAL').length, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
            ].map((kpi, idx) => (
              <div key={idx} style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {kpi.label}
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: kpi.color, marginTop: '4px' }}>
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar & Filter Pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'var(--bg-glass-card)',
            padding: '12px 18px',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'ALL', label: `All Tests (${labTests.length})` },
                { id: 'ORDERED', label: 'Ordered' },
                { id: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
                { id: 'COMPLETED', label: 'Results Ready' },
                { id: 'REVIEWED', label: 'Reviewed' },
                { id: 'CRITICAL', label: 'Critical Flags' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLabFilterStatus(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: labFilterStatus === f.id ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                    color: labFilterStatus === f.id ? '#0ea5e9' : 'var(--text-muted)',
                    border: labFilterStatus === f.id ? '1px solid #0ea5e9' : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowOrderModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
              }}
            >
              <Plus size={16} />
              <span>Order Diagnostic Test</span>
            </button>
          </div>

          {/* Lab Tests List */}
          {loadingLabs ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading diagnostic lab tests…</p>
          ) : filteredLabTests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <FlaskConical size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>No lab test records found for this filter.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Click "+ Order Diagnostic Test" above to prescribe blood, imaging, urine, or pathology tests.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredLabTests.map(lab => {
                const sBadge = LAB_STATUS_CONFIG[lab.status] || LAB_STATUS_CONFIG.ORDERED;
                const fBadge = LAB_FLAG_CONFIG[lab.abnormal_flag] || LAB_FLAG_CONFIG.NORMAL;

                return (
                  <div key={lab.id} style={{
                    borderRadius: '16px',
                    background: 'var(--bg-glass-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800 }}>{lab.test_name}</h3>
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800,
                            background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.25)',
                          }}>
                            {lab.category || 'BLOOD'}
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                            background: sBadge.bg, color: sBadge.color, border: `1px solid ${sBadge.border}`,
                          }}>
                            {sBadge.label}
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                            background: fBadge.bg, color: fBadge.color, border: `1px solid ${fBadge.border}`,
                          }}>
                            {fBadge.label}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Prescribed by: <strong style={{ color: 'var(--text-main)' }}>Dr. {lab.doctor_details?.full_name || 'Attending Physician'}</strong> · Ordered: {new Date(lab.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Top Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handlePrintLab(lab)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '7px 12px', borderRadius: '8px',
                            background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                            color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          <Printer size={13} />
                          <span>Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(lab)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', borderRadius: '8px',
                            background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.3)',
                            color: '#0ea5e9', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          <Edit3 size={13} />
                          <span>Enter Results / Notes</span>
                        </button>
                      </div>
                    </div>

                    {/* Pre-test instructions */}
                    {lab.instructions && (
                      <div style={{
                        padding: '10px 14px', borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                        fontSize: '0.83rem',
                      }}>
                        <strong style={{ color: '#f59e0b', fontSize: '0.76rem', textTransform: 'uppercase' }}>Preparation Instructions: </strong>
                        {lab.instructions}
                      </div>
                    )}

                    {/* Results Findings & Metrics */}
                    <div style={{
                      padding: '14px 16px', borderRadius: '10px',
                      background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                          Diagnostic Results & Metrics
                        </span>
                        {lab.file_name && (
                          <span style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={12} /> {lab.file_name}
                          </span>
                        )}
                      </div>
                      {lab.results_summary ? (
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {lab.results_summary}
                        </p>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Pending results entry. Click "Enter Results / Notes" to input diagnostic findings.
                        </p>
                      )}
                    </div>

                    {/* Doctor Clinical Notes */}
                    {lab.doctor_notes && (
                      <div style={{
                        padding: '12px 16px', borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Physician Clinical Interpretation & Advice
                        </div>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {lab.doctor_notes}
                        </p>
                      </div>
                    )}

                    {/* Quick Status Workflow Footer */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '10px',
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Status: <strong style={{ color: sBadge.color }}>{sBadge.label}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {lab.status === 'ORDERED' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(lab, 'SAMPLE_COLLECTED')}
                            style={{
                              padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                              background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', border: '1px solid #0ea5e9',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                          >
                            <Check size={13} /> Mark Sample Collected
                          </button>
                        )}
                        {lab.status === 'SAMPLE_COLLECTED' && (
                          <button
                            type="button"
                            onClick={() => openEditModal(lab)}
                            style={{
                              padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                              background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid #8b5cf6',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                          >
                            <Edit3 size={13} /> Enter Results & Mark Ready
                          </button>
                        )}
                        {lab.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(lab, 'REVIEWED')}
                            style={{
                              padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                          >
                            <CheckCircle2 size={13} /> Mark Reviewed by Doctor
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ORDER NEW LAB TEST */}
      {showOrderModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={20} color="#0ea5e9" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Order Diagnostic Test</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Test Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC), Lipid Profile, Chest X-Ray"
                  value={orderForm.test_name}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, test_name: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                    color: 'var(--text-main)', fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={orderForm.category}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                      color: 'var(--text-main)', fontSize: '0.88rem',
                    }}
                  >
                    {LAB_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Initial Urgency / Flag
                  </label>
                  <select
                    value={orderForm.abnormal_flag}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, abnormal_flag: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                      color: 'var(--text-main)', fontSize: '0.88rem',
                    }}
                  >
                    <option value="NORMAL">Normal / Routine</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Pre-Test Instructions / Fasting Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. 12-hour fasting required prior to blood draw. Drink plenty of water."
                  value={orderForm.instructions}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, instructions: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                    color: 'var(--text-main)', fontSize: '0.88rem', resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px',
                    background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderingLab}
                  style={{
                    padding: '9px 20px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', border: 'none',
                    color: '#fff', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                  }}
                >
                  {orderingLab ? 'Prescribing…' : 'Order Diagnostic Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENTER / EDIT LAB TEST RESULTS & NOTES */}
      {editingLab && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', width: '100%', maxWidth: '580px', padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800 }}>Manage Diagnostic Report</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#0ea5e9', fontWeight: 700 }}>
                  {editingLab.test_name} ({editingLab.category})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLab(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Status Workflow
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                      color: 'var(--text-main)', fontSize: '0.88rem',
                    }}
                  >
                    <option value="ORDERED">Test Ordered</option>
                    <option value="SAMPLE_COLLECTED">Sample Collected</option>
                    <option value="COMPLETED">Completed / Results Ready</option>
                    <option value="REVIEWED">Doctor Reviewed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Abnormal Flag
                  </label>
                  <select
                    value={editForm.abnormal_flag}
                    onChange={(e) => setEditForm(prev => ({ ...prev, abnormal_flag: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                      color: 'var(--text-main)', fontSize: '0.88rem',
                    }}
                  >
                    <option value="NORMAL">Normal Limits</option>
                    <option value="HIGH">High / Elevated</option>
                    <option value="LOW">Low / Subnormal</option>
                    <option value="CRITICAL">Critical Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Laboratory Findings & Metrics
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Hemoglobin: 14.2 g/dL, WBC: 6,800 /mcL, Platelets: 250,000 /mcL"
                  value={editForm.results_summary}
                  onChange={(e) => setEditForm(prev => ({ ...prev, results_summary: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                    color: 'var(--text-main)', fontSize: '0.88rem', resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Doctor Clinical Interpretation & Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. All parameters within normal reference ranges. Patient to continue routine diet."
                  value={editForm.doctor_notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, doctor_notes: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                    color: 'var(--text-main)', fontSize: '0.88rem', resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Attached File / PDF Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete_Blood_Report_Nov2026.pdf"
                  value={editForm.file_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, file_name: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-input)',
                    color: 'var(--text-main)', fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingLab(null)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px',
                    background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '9px 20px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                    color: '#fff', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                  }}
                >
                  {savingEdit ? 'Saving…' : 'Save Report & Interpretation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientDetail;
