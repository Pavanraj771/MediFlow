import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ClipboardPlus, Pill, Calendar, AlertCircle,
  Search, Clock, FileHeart, CheckCircle2, RotateCw,
  Sun, Sunset, Moon, Sparkles, Send, X, ShieldCheck,
  Utensils, Check, CalendarDays, UserRound, ChevronRight
} from 'lucide-react';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

// The 6 standard meal-timing slots suggested by physicians
const ROUTINE_SLOTS = [
  { id: 'Before Breakfast', label: 'Before Breakfast', group: 'Morning', icon: Sun, color: '#f59e0b', desc: 'Take ~30 minutes prior to morning breakfast' },
  { id: 'After Breakfast', label: 'After Breakfast', group: 'Morning', icon: Sun, color: '#eab308', desc: 'Take immediately after your morning meal' },
  { id: 'Before Lunch', label: 'Before Lunch', group: 'Afternoon', icon: Sun, color: '#0ea5e9', desc: 'Take ~30 minutes before afternoon lunch' },
  { id: 'After Lunch', label: 'After Lunch', group: 'Afternoon', icon: Sun, color: '#0284c7', desc: 'Take immediately following lunch' },
  { id: 'Before Dinner', label: 'Before Dinner', group: 'Night', icon: Sunset, color: '#8b5cf6', desc: 'Take ~30 minutes before evening dinner' },
  { id: 'After Dinner', label: 'After Dinner', group: 'Night', icon: Moon, color: '#6366f1', desc: 'Take after dinner before resting' },
];

const getPrescriptionTimings = (prescription) => {
  if (!prescription.frequency) return [];
  if (Array.isArray(prescription.frequency)) return prescription.frequency;
  return prescription.frequency.split(',').map(s => s.trim()).filter(Boolean);
};

const doesPrescriptionMatchSlot = (prescription, slotId) => {
  const timings = getPrescriptionTimings(prescription);
  const slotLower = slotId.toLowerCase();

  // Direct check
  if (timings.some(t => t.toLowerCase() === slotLower || t.toLowerCase().includes(slotLower))) {
    return true;
  }

  // Fallbacks for legacy/freeform frequency strings
  const freqRaw = (prescription.frequency || '').toLowerCase();
  if (slotId === 'Before Breakfast' && freqRaw.includes('before breakfast')) return true;
  if (slotId === 'After Breakfast' && (freqRaw.includes('after breakfast') || freqRaw.includes('morning') || freqRaw.includes('breakfast') || freqRaw.includes('once daily') || freqRaw.includes('od'))) return true;
  if (slotId === 'Before Lunch' && freqRaw.includes('before lunch')) return true;
  if (slotId === 'After Lunch' && (freqRaw.includes('after lunch') || freqRaw.includes('afternoon') || freqRaw.includes('lunch') || freqRaw.includes('midday'))) return true;
  if (slotId === 'Before Dinner' && freqRaw.includes('before dinner')) return true;
  if (slotId === 'After Dinner' && (freqRaw.includes('after dinner') || freqRaw.includes('night') || freqRaw.includes('dinner') || freqRaw.includes('bedtime') || freqRaw.includes('evening') || freqRaw.includes('twice daily') || freqRaw.includes('bd') || freqRaw.includes('bid'))) return true;

  return false;
};

const DAYS_LEFT_STORAGE_KEY = 'mediflow_pill_days_left';

const PatientPrescriptions = () => {
  const [activeTab, setActiveTab] = useState('ROUTINE'); // 'ROUTINE' | 'LIBRARY' | 'REFILLS'
  const [slotFilter, setSlotFilter] = useState('ALL'); // 'ALL' | 'Morning' | 'Afternoon' | 'Night'
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

  // Persistent days left tracking per (pillId, slotId)
  const [daysLeftMap, setDaysLeftMap] = useState(() => {
    try {
      const saved = localStorage.getItem(DAYS_LEFT_STORAGE_KEY);
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
      all.sort((a, b) => new Date(b.created_at || b.appointment_date) - new Date(a.created_at || a.appointment_date));
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

  const getDaysLeft = (pillId, slotId, originalDuration) => {
    const key = `${pillId}_${slotId}`;
    if (daysLeftMap[key] !== undefined) {
      return daysLeftMap[key];
    }
    const num = parseInt(String(originalDuration || '').replace(/[^0-9]/g, ''), 10);
    return !isNaN(num) && num > 0 ? num : 5;
  };

  const handleMarkTaken = (pillId, slotId, originalDuration) => {
    const key = `${pillId}_${slotId}`;
    const currentDays = getDaysLeft(pillId, slotId, originalDuration);
    if (currentDays <= 0) return;

    const newDays = currentDays - 1;

    const updatedDays = { ...daysLeftMap, [key]: newDays };
    setDaysLeftMap(updatedDays);
    try {
      localStorage.setItem(DAYS_LEFT_STORAGE_KEY, JSON.stringify(updatedDays));
    } catch (e) {
      console.error(e);
    }

    const updatedTaken = { ...takenPills, [key]: true };
    setTakenPills(updatedTaken);
    try {
      localStorage.setItem(todayKey, JSON.stringify(updatedTaken));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTaken = (pillId, slotId, originalDuration) => {
    const key = `${pillId}_${slotId}`;
    const isTaken = Boolean(takenPills[key]);

    if (isTaken) {
      const currentDays = getDaysLeft(pillId, slotId, originalDuration);
      const parsedOriginal = parseInt(String(originalDuration || '').replace(/[^0-9]/g, ''), 10) || 5;
      const newDays = Math.min(parsedOriginal, currentDays + 1);

      const updatedDays = { ...daysLeftMap, [key]: newDays };
      setDaysLeftMap(updatedDays);
      try {
        localStorage.setItem(DAYS_LEFT_STORAGE_KEY, JSON.stringify(updatedDays));
      } catch (e) {}

      const updatedTaken = { ...takenPills, [key]: false };
      setTakenPills(updatedTaken);
      try {
        localStorage.setItem(todayKey, JSON.stringify(updatedTaken));
      } catch (e) {}
    } else {
      handleMarkTaken(pillId, slotId, originalDuration);
    }
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
    p.medication_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.doctor?.toLowerCase().includes(search.toLowerCase()) ||
    p.frequency?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Calculate adherence based only on active scheduled doses today (daysLeft > 0)
  let totalScheduledDoses = 0;
  let takenScheduledDoses = 0;

  ROUTINE_SLOTS.forEach(slot => {
    const slotMeds = prescriptions.filter(p => doesPrescriptionMatchSlot(p, slot.id) && getDaysLeft(p.id, slot.id, p.duration) > 0);
    totalScheduledDoses += slotMeds.length;
    slotMeds.forEach(p => {
      const key = `${p.id}_${slot.id}`;
      if (takenPills[key]) {
        takenScheduledDoses += 1;
      }
    });
  });

  const adherenceScore = totalScheduledDoses > 0
    ? Math.min(100, Math.round((takenScheduledDoses / totalScheduledDoses) * 100))
    : 100;

  const displayedSlots = slotFilter === 'ALL'
    ? ROUTINE_SLOTS
    : ROUTINE_SLOTS.filter(s => s.group === slotFilter);

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
              <ClipboardPlus size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                Prescriptions & Daily Medication Routine
              </h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Daily pill adherence schedule with meal-timing routines, days remaining tracking, and refills
              </p>
            </div>
          </div>
        </div>
        <PatientAvatarMenu />
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '24px',
        borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px',
      }}>
        {[
          { id: 'ROUTINE', label: "Today's Pill Routine", icon: Clock },
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
                padding: '9px 18px', borderRadius: '12px',
                border: isActive ? '1px solid #8b5cf6' : '1px solid transparent',
                background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: isActive ? '#8b5cf6' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DAILY PILL ROUTINE (6 MEAL TIMINGS WITH DAYS LEFT TRACKING) ── */}
      {activeTab === 'ROUTINE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Adherence Card Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(99, 102, 241, 0.08) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: '20px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'grid', placeItems: 'center', color: '#fff',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#8b5cf6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  MEDICATION ADHERENCE TODAY
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  {totalScheduledDoses === 0
                    ? 'All active courses completed or none scheduled'
                    : adherenceScore === 100
                    ? 'All prescribed doses completed for today!'
                    : `${takenScheduledDoses} of ${totalScheduledDoses} doses taken`}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Pills display remaining course days. When remaining days reach 0, completed medications automatically leave the routine.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: adherenceScore === 100 ? '#10b981' : '#8b5cf6' }}>
                  {adherenceScore}%
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Today's Compliance</div>
              </div>
            </div>
          </div>

          {/* Meal Routine Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>
              Meal Time Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Meal Timings' },
              { id: 'Morning', label: 'Morning (Breakfast)' },
              { id: 'Afternoon', label: 'Afternoon (Lunch)' },
              { id: 'Night', label: 'Night (Dinner)' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSlotFilter(f.id)}
                style={{
                  padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  border: slotFilter === f.id ? '1px solid #8b5cf6' : '1px solid var(--border-subtle)',
                  background: slotFilter === f.id ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-glass-card)',
                  color: slotFilter === f.id ? '#8b5cf6' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {f.label}
              </button>
            ))}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {displayedSlots.map(slot => {
                const Icon = slot.icon;
                // Only show medications for this slot that have days left > 0
                const slotMeds = prescriptions.filter(p => doesPrescriptionMatchSlot(p, slot.id) && getDaysLeft(p.id, slot.id, p.duration) > 0);
                const hasMeds = slotMeds.length > 0;

                return (
                  <div
                    key={slot.id}
                    style={{
                      background: 'var(--bg-glass-card)',
                      borderRadius: '18px',
                      border: hasMeds ? '1.5px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-subtle)',
                      padding: '20px',
                      backdropFilter: 'blur(20px)',
                      display: 'flex',
                      flexDirection: 'column',
                      opacity: hasMeds ? 1 : 0.65,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Slot Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: `${slot.color}20`, color: slot.color,
                          display: 'grid', placeItems: 'center',
                        }}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                              {slot.label}
                            </h4>
                            <span style={{
                              padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                              background: 'var(--surface-hover)', color: 'var(--text-muted)',
                            }}>
                              {slot.group}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{slot.desc}</span>
                        </div>
                      </div>

                      <span style={{
                        padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                        background: hasMeds ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface-hover)',
                        color: hasMeds ? '#8b5cf6' : 'var(--text-dim)',
                      }}>
                        {slotMeds.length} active pill{slotMeds.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Slot Medications */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {!hasMeds ? (
                        <div style={{
                          padding: '16px', borderRadius: '12px', background: 'var(--surface-hover)',
                          color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', fontStyle: 'italic',
                        }}>
                          No active medication scheduled for this meal timing (or course completed).
                        </div>
                      ) : (
                        slotMeds.map(p => {
                          const key = `${p.id}_${slot.id}`;
                          const isTaken = Boolean(takenPills[key]);
                          const daysLeft = getDaysLeft(p.id, slot.id, p.duration);

                          return (
                            <div
                              key={p.id}
                              style={{
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: isTaken ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-hover)',
                                border: isTaken ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: '180px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <strong style={{
                                    fontSize: '0.94rem',
                                    color: isTaken ? '#10b981' : 'var(--heading-color)',
                                    textDecoration: isTaken ? 'line-through' : 'none',
                                  }}>
                                    {p.medication_name}
                                  </strong>
                                  {p.dosage && (
                                    <span style={{
                                      padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                                      background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6',
                                    }}>
                                      {p.dosage}
                                    </span>
                                  )}
                                  {/* Days Left Badge */}
                                  <span style={{
                                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                                    background: daysLeft <= 2 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                                    color: daysLeft <= 2 ? '#ef4444' : '#0ea5e9',
                                    border: daysLeft <= 2 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(14, 165, 233, 0.3)',
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  }}>
                                    <CalendarDays size={11} /> {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                  </span>
                                </div>

                                {p.instructions && (
                                  <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                    Instruction: {p.instructions}
                                  </p>
                                )}

                                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                  Dr. {p.doctor || 'Attending Physician'}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleTaken(p.id, slot.id, p.duration)}
                                style={{
                                  padding: '8px 14px', borderRadius: '8px',
                                  border: isTaken ? 'none' : '1px solid rgba(139, 92, 246, 0.3)',
                                  background: isTaken ? '#10b981' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                  color: '#fff',
                                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                                  transition: 'all 0.15s ease',
                                  boxShadow: isTaken ? 'none' : '0 2px 8px rgba(139, 92, 246, 0.25)',
                                }}
                              >
                                {isTaken ? (
                                  <>
                                    <CheckCircle2 size={14} /> Taken ({daysLeft} left)
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} /> Mark Taken
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })
                      )}
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
              placeholder="Search by medication name, dosage, or prescribing doctor…"
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
              {filtered.map((p, i) => {
                const timings = getPrescriptionTimings(p);
                const remainingDaysList = timings.map(t => getDaysLeft(p.id, t, p.duration));
                const minDaysLeft = remainingDaysList.length > 0 ? Math.min(...remainingDaysList) : (parseInt(p.duration, 10) || 5);
                const isCompleted = remainingDaysList.length > 0 && remainingDaysList.every(d => d <= 0);

                return (
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

                      {isCompleted ? (
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}>
                          <CheckCircle2 size={12} /> Course Completed
                        </span>
                      ) : (
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          background: minDaysLeft <= 2 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                          color: minDaysLeft <= 2 ? '#ef4444' : '#0ea5e9',
                          border: minDaysLeft <= 2 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(14, 165, 233, 0.25)',
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}>
                          <CalendarDays size={12} /> {minDaysLeft} Day{minDaysLeft !== 1 ? 's' : ''} Left
                        </span>
                      )}
                    </div>

                    {/* Prescribed Dosing Timings Badges */}
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        PRESCRIBED MEAL TIMINGS:
                      </span>
                      {timings.length === 0 ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>As directed by doctor</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {timings.map(t => {
                            const timingDaysLeft = getDaysLeft(p.id, t, p.duration);
                            return (
                              <span
                                key={t}
                                style={{
                                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                                  background: t.toLowerCase().includes('dinner')
                                    ? 'rgba(99, 102, 241, 0.12)'
                                    : t.toLowerCase().includes('lunch')
                                    ? 'rgba(14, 165, 233, 0.12)'
                                    : 'rgba(245, 158, 11, 0.12)',
                                  color: t.toLowerCase().includes('dinner')
                                    ? '#6366f1'
                                    : t.toLowerCase().includes('lunch')
                                    ? '#0ea5e9'
                                    : '#f59e0b',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                }}
                              >
                                {t} ({timingDaysLeft}d left)
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      {p.instructions && (
                        <p style={{
                          margin: '4px 0 0', padding: '8px 12px', borderRadius: '8px',
                          fontSize: '0.82rem', color: 'var(--text-muted)',
                          background: 'var(--surface-hover)',
                        }}>
                          <strong>Instructions:</strong> {p.instructions}
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
                        Dr. {p.doctor} {p.department && `• ${p.department}`}
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
                );
              })}
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