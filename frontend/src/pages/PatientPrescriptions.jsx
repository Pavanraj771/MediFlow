import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ClipboardPlus, Pill, Calendar, AlertCircle,
  Search, Clock, FileHeart, CheckCircle2, RotateCw,
  Sun, Sunset, Moon, Sparkles, Send, X, ShieldCheck
} from 'lucide-react';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const timeSlots = [
  { id: 'morning', label: 'Morning Routine', icon: Sun, color: '#f59e0b', desc: 'Take with breakfast or morning water' },
  { id: 'afternoon', label: 'Afternoon Routine', icon: Sun, color: '#0ea5e9', desc: 'Take with lunch or midday' },
  { id: 'evening', label: 'Evening Routine', icon: Sunset, color: '#8b5cf6', desc: 'Take with dinner' },
  { id: 'night', label: 'Bedtime Routine', icon: Moon, color: '#6366f1', desc: 'Take before sleep' },
];

const PatientPrescriptions = () => {
  const [activeTab, setActiveTab] = useState('ROUTINE'); // 'ROUTINE' | 'LIBRARY' | 'REFILLS'
  const [prescriptions, setPrescriptions] = useState([]);
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Daily adherence tracking stored per date
  const todayKey = `mediflow_pill_${new Date().toISOString().slice(0, 10)}`;
  const [takenPills, setTakenPills] = useState(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Refill Modal state
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [refillNotes, setRefillNotes] = useState('');
  const [submittingRefill, setSubmittingRefill] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appts, refillList] = await Promise.all([
        appointmentsService.getAppointments(),
        appointmentsService.getRefills().catch(() => []),
      ]);

      const all = [];
      appts.forEach(apt => {
        if (apt.consultation?.prescriptions?.length > 0) {
          apt.consultation.prescriptions.forEach(p => {
            all.push({
              ...p,
              doctor: apt.doctor_details?.full_name,
              doctor_id: apt.doctor_details?.id,
              department: apt.doctor_profile?.department?.replace('_', ' '),
              appointment_date: apt.appointment_datetime,
              consultation_id: apt.consultation.id,
            });
          });
        }
      });
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPrescriptions(all);
      setRefills(refillList);
    } catch (err) {
      console.error('Failed to load prescriptions and refills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePillTaken = (pillId, slot) => {
    const key = `${pillId}_${slot}`;
    const updated = { ...takenPills, [key]: !takenPills[key] };
    setTakenPills(updated);
    try {
      localStorage.setItem(todayKey, JSON.stringify(updated));
    } catch {}
  };

  const openRefillModal = (prescription) => {
    setSelectedPrescription(prescription);
    setRefillNotes('Requesting prescription refill. Remaining supply is low.');
    setRefillModalOpen(true);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPrescription) return;

    setSubmittingRefill(true);
    try {
      await appointmentsService.requestRefill({
        prescription: selectedPrescription.id,
        patient_notes: refillNotes.trim(),
      });
      setRefillModalOpen(false);
      setSelectedPrescription(null);
      setRefillNotes('');
      // Refresh refills
      const updatedRefills = await appointmentsService.getRefills();
      setRefills(updatedRefills);
      setActiveTab('REFILLS');
    } catch (err) {
      console.error('Failed to request refill:', err);
      alert('Unable to submit refill request. Please check if you already have a pending refill.');
    } finally {
      setSubmittingRefill(false);
    }
  };

  const filtered = prescriptions.filter(p =>
    p.medication_name.toLowerCase().includes(search.toLowerCase()) ||
    p.doctor?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Calculate adherence
  const totalDosesToday = prescriptions.length * 2; // approximation based on 2x daily
  const takenCount = Object.values(takenPills).filter(Boolean).length;
  const adherenceScore = totalDosesToday > 0 ? Math.min(100, Math.round((takenCount / Math.max(1, prescriptions.length)) * 100)) : 100;

  return (
    <div className="patient-portal-page">
      {/* Topbar */}
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
              background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'grid', placeItems: 'center', color: '#8b5cf6',
            }}>
              <Pill size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                Prescriptions & Daily Medication Routine
              </h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Manage daily pill adherence, treatment guidelines, and 1-click refills
              </p>
            </div>
          </div>
        </div>
        <PatientAvatarMenu />
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px',
      }}>
        {[
          { id: 'ROUTINE', label: "Daily Pill Schedule", icon: Sparkles },
          { id: 'LIBRARY', label: `All Prescriptions (${prescriptions.length})`, icon: Pill },
          { id: 'REFILLS', label: `Refill Requests (${refills.length})`, icon: RotateCw },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '12px',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                color: isActive ? '#a78bfa' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DAILY PILL ROUTINE ───────────────────────────────────────── */}
      {activeTab === 'ROUTINE' && (
        <div>
          {/* Adherence Banner */}
          <div style={{
            padding: '20px 24px', borderRadius: '20px',
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
            marginBottom: '24px', display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'center', gap: '16px',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'grid', placeItems: 'center', color: '#fff',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  Today's Medication Adherence
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {takenCount} doses confirmed taken today • Keep up your healthy treatment routine!
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6' }}>
                  {adherenceScore}%
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Today's Score</div>
              </div>
            </div>
          </div>

          {/* Time of Day Slots */}
          {prescriptions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px', borderRadius: '20px',
              background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}>
              <Pill size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>No active prescriptions scheduled</p>
              <p style={{ margin: '4px 0', fontSize: '0.84rem' }}>
                Your daily medication schedule will appear here once prescribed by your doctor.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {timeSlots.map(slot => {
                const Icon = slot.icon;
                return (
                  <div
                    key={slot.id}
                    style={{
                      background: 'var(--bg-glass-card)',
                      borderRadius: '18px',
                      border: '1px solid var(--border-subtle)',
                      padding: '20px',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: `${slot.color}20`, color: slot.color,
                        display: 'grid', placeItems: 'center',
                      }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                          {slot.label}
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{slot.desc}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {prescriptions.map(p => {
                        const key = `${p.id}_${slot.id}`;
                        const isTaken = Boolean(takenPills[key]);

                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePillTaken(p.id, slot.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              background: isTaken ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-hover)',
                              border: isTaken ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div>
                              <strong style={{
                                fontSize: '0.88rem',
                                color: isTaken ? '#10b981' : 'var(--heading-color)',
                                textDecoration: isTaken ? 'line-through' : 'none',
                              }}>
                                {p.medication_name}
                              </strong>
                              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {p.dosage} • {p.instructions || 'With water'}
                              </p>
                            </div>

                            <div style={{
                              width: '24px', height: '24px', borderRadius: '6px',
                              border: isTaken ? 'none' : '2px solid var(--border-subtle)',
                              background: isTaken ? '#10b981' : 'transparent',
                              display: 'grid', placeItems: 'center', color: '#fff',
                            }}>
                              {isTaken && <CheckCircle2 size={16} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PRESCRIPTION LIBRARY & REFILL ACTIONS ────────────────────── */}
      {activeTab === 'LIBRARY' && (
        <div>
          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '0 16px', height: '46px',
            background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', marginBottom: '20px',
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by medication name or prescribing doctor…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem' }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading prescriptions…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>{search ? 'No prescriptions match your search.' : 'No prescriptions recorded yet.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filtered.map((p, i) => (
                <div key={p.id || i} style={{
                  padding: '20px 22px', borderRadius: '18px',
                  background: 'var(--bg-glass-card)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  backdropFilter: 'blur(20px)',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '10px',
                        background: 'rgba(139,92,246,0.15)', display: 'grid', placeItems: 'center',
                      }}>
                        <Pill size={18} color="#8b5cf6" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                          {p.medication_name}
                        </h3>
                        {p.dosage && (
                          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 700 }}>{p.dosage}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {p.frequency && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <Clock size={14} /> Frequency: {p.frequency}
                      </div>
                    )}
                    {p.duration && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} /> Course Duration: {p.duration}
                      </div>
                    )}
                    {p.instructions && (
                      <p style={{
                        margin: '6px 0 0', padding: '8px 12px', borderRadius: '8px',
                        fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic',
                        background: 'var(--surface-hover)',
                      }}>
                        {p.instructions}
                      </p>
                    )}
                  </div>

                  {/* Refill Button & Doctor info */}
                  <div style={{
                    marginTop: '16px', paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Dr. {p.doctor}
                    </span>
                    <button
                      onClick={() => openRefillModal(p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '8px',
                        background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#8b5cf6', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      <RotateCw size={13} /> Request Refill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: REFILL REQUEST TRACKER ───────────────────────────────────── */}
      {activeTab === 'REFILLS' && (
        <div style={{
          background: 'var(--bg-glass-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
              Prescription Refill Requests ({refills.length})
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Doctor review status & authorizations
            </span>
          </div>

          {refills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              <RotateCw size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>No refill requests submitted</p>
              <p style={{ margin: '4px 0', fontSize: '0.82rem' }}>
                When your medications run low, submit a refill request from the "All Prescriptions" tab.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {refills.map(r => {
                const isApproved = r.status === 'APPROVED';
                const isRejected = r.status === 'REJECTED';

                return (
                  <div
                    key={r.id}
                    style={{
                      padding: '16px 20px', borderRadius: '14px',
                      background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                      display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                      alignItems: 'center', gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--heading-color)' }}>
                          {r.prescription_details?.medication_name || 'Medication'}
                        </strong>
                        <span style={{
                          padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800,
                          background: isApproved ? 'rgba(16, 185, 129, 0.12)' : isRejected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b',
                        }}>
                          {r.status}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Doctor: Dr. {r.doctor_details?.full_name} • Requested: {new Date(r.created_at).toLocaleDateString()}
                      </p>
                      {r.patient_notes && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "Note: {r.patient_notes}"
                        </p>
                      )}
                      {r.doctor_response && (
                        <div style={{
                          marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
                          background: isApproved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          fontSize: '0.8rem', color: isApproved ? '#10b981' : '#ef4444',
                        }}>
                          <strong>Physician Response:</strong> {r.doctor_response}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Request Refill */}
      {refillModalOpen && selectedPrescription && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'grid', placeItems: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-glass-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            backdropFilter: 'blur(30px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6',
                  display: 'grid', placeItems: 'center',
                }}>
                  <RotateCw size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  Request Prescription Refill
                </h3>
              </div>
              <button
                onClick={() => setRefillModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              padding: '12px 14px', borderRadius: '12px',
              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
            }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--heading-color)' }}>
                {selectedPrescription.medication_name}
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Dosage: {selectedPrescription.dosage || 'Standard'} • Doctor: Dr. {selectedPrescription.doctor}
              </div>
            </div>

            <form onSubmit={handleRefillSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Reason / Notes for Doctor (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. 3 days left of medication, requesting a 30-day supply refill."
                  value={refillNotes}
                  onChange={(e) => setRefillNotes(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRefillModalOpen(false)}
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
                  disabled={submittingRefill}
                  style={{
                    padding: '10px 20px', borderRadius: '10px',
                    border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: '#fff', cursor: 'pointer', fontWeight: 700,
                  }}
                >
                  {submittingRefill ? 'Sending...' : 'Submit Refill Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
