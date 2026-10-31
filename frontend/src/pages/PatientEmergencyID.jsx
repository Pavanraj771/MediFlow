import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldAlert, ArrowLeft, HeartPulse, User,
  Edit3, CheckCircle2, AlertTriangle, Droplet,
  Activity, Pill, X, Sparkles, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsService } from '../services/api';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import '../styles/PatientPortal.css';

const PatientEmergencyID = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state
  const [bloodGroup, setBloodGroup] = useState('UNKNOWN');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [criticalAlert, setCriticalAlert] = useState('');
  const [organDonor, setOrganDonor] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [prof, appts] = await Promise.all([
        appointmentsService.getPatientProfile().catch(() => null),
        appointmentsService.getAppointments().catch(() => []),
      ]);

      setProfile(prof);
      if (prof) {
        setBloodGroup(prof.blood_group || 'UNKNOWN');
        setEmergencyName(prof.emergency_contact_name || '');
        setEmergencyPhone(prof.emergency_contact_phone || '');
        setEmergencyRelation(prof.emergency_contact_relation || '');
        setAllergies(prof.allergies || '');
        setChronicConditions(prof.chronic_conditions || '');
        setCriticalAlert(prof.critical_alert || '');
        setOrganDonor(Boolean(prof.organ_donor));
      }

      // Extract unique active medications
      const meds = [];
      appts.forEach(a => {
        if (a.consultation?.prescriptions) {
          a.consultation.prescriptions.forEach(p => {
            if (!meds.some(m => m.medication_name === p.medication_name)) {
              meds.push(p);
            }
          });
        }
      });
      setPrescriptions(meds);
    } catch (err) {
      console.error('Failed to load emergency profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await appointmentsService.updatePatientProfile({
        blood_group: bloodGroup,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        emergency_contact_relation: emergencyRelation.trim(),
        allergies: allergies.trim(),
        chronic_conditions: chronicConditions.trim(),
        critical_alert: criticalAlert.trim(),
        organ_donor: organDonor,
      });
      setProfile(updated);
      setEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update emergency ID details.');
    } finally {
      setSaving(false);
    }
  };

  // Construct QR Payload text
  const qrPayload = JSON.stringify({
    mediflow_emergency_id: user?.id,
    patient_name: user?.full_name,
    blood_group: profile?.blood_group || 'Unknown',
    critical_alert: profile?.critical_alert || 'None',
    allergies: profile?.allergies || 'None',
    emergency_contact: `${profile?.emergency_contact_name || ''} (${profile?.emergency_contact_phone || ''})`,
  });

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
              <ShieldAlert size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                Emergency Medical ID & QR Pass
              </h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Rapid critical medical information for paramedics, ER clinicians, and emergency contacts
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setEditModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '12px',
              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)', cursor: 'pointer',
              fontSize: '0.86rem', fontWeight: 700,
            }}
          >
            <Edit3 size={15} /> Edit Emergency Info
          </button>
          <PatientAvatarMenu />
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 480px) 1fr',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Left Column: The Emergency Medical Card (Front & Back style) */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.85))',
          borderRadius: '24px',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 12px 32px rgba(239, 68, 68, 0.15)',
          padding: '24px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Card Top Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#ef4444', display: 'grid', placeItems: 'center', color: '#fff',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.6)',
              }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fca5a5' }}>
                  MEDIFLOW CLINICAL PASSPORT
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  EMERGENCY MEDICAL ID
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontSize: '0.74rem', color: '#86efac', fontWeight: 700 }}>ACTIVE ID</span>
            </div>
          </div>

          {/* Blood Group & Primary Name Block */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px', borderRadius: '16px',
            background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '16px',
          }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PATIENT NAME
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                {user?.full_name || 'Patient'}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                DOB: {profile?.date_of_birth || 'Not Specified'} • {profile?.gender || 'Gender N/A'}
              </span>
            </div>

            <div style={{ textAlign: 'center', padding: '6px 14px', borderRadius: '14px', background: '#ef4444', color: '#fff' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>BLOOD</span>
              <strong style={{ fontSize: '1.6rem', fontWeight: 900 }}>{profile?.blood_group || '—'}</strong>
            </div>
          </div>

          {/* Critical Alerts Banner if any */}
          {profile?.critical_alert && (
            <div style={{
              padding: '12px 14px', borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.6)',
              marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <AlertTriangle size={20} color="#fca5a5" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase' }}>
                  CRITICAL MEDICAL ALERT
                </span>
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                  {profile.critical_alert}
                </p>
              </div>
            </div>
          )}

          {/* Emergency Contact Box */}
          <div style={{
            padding: '14px', borderRadius: '14px',
            background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '14px',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PRIMARY EMERGENCY CONTACT
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  {profile?.emergency_contact_name || 'No contact configured'}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Relationship: {profile?.emergency_contact_relation || 'Family / Relative'}
                </span>
              </div>
              {profile?.emergency_contact_phone && (
                <a
                  href={`tel:${profile.emergency_contact_phone}`}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '8px 14px', borderRadius: '10px',
                    background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#86efac', textDecoration: 'none',
                    fontSize: '0.84rem', fontWeight: 800,
                  }}
                  title="Emergency phone number"
                >
                  {profile.emergency_contact_phone}
                </a>
              )}
            </div>
          </div>

          {/* Clinical Indicators Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>ALLERGIES</span>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5' }}>
                {profile?.allergies || 'No known allergies'}
              </p>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>CHRONIC CONDITIONS</span>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                {profile?.chronic_conditions || 'None reported'}
              </p>
            </div>
          </div>

          {/* Organ Donor & Verification Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '0.75rem', color: '#94a3b8', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <span>Organ Donor: <strong style={{ color: profile?.organ_donor ? '#22c55e' : '#94a3b8' }}>{profile?.organ_donor ? 'YES (Verified)' : 'NO'}</strong></span>
            <span>MediFlow ID #{user?.id?.slice(0, 8)}</span>
          </div>
        </div>

        {/* Right Column: Scannable QR Pass & Full Medical Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* QR Code Pass Card */}
          <div style={{
            background: 'var(--bg-glass-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '24px',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{
              background: '#fff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              display: 'grid',
              placeItems: 'center',
            }}>
              <QRCodeSVG
                value={qrPayload}
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '20px',
                background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9',
                fontSize: '0.76rem', fontWeight: 800, marginBottom: '8px',
              }}>
                <Sparkles size={13} /> RAPID SCANNABLE PASS
              </span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                Emergency QR Scanner
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Paramedics or emergency department staff can scan this secure QR code using any smartphone camera to instantly retrieve your critical allergies, blood group, and emergency contact details.
              </p>
            </div>
          </div>

          {/* Current Life-Sustaining Medications */}
          <div style={{
            background: 'var(--bg-glass-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'grid', placeItems: 'center' }}>
                <Pill size={16} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  Active Prescriptions & Regimen ({prescriptions.length})
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Crucial for ER contraindication checks</span>
              </div>
            </div>

            {prescriptions.length === 0 ? (
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface-hover)', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                No active medications recorded in your consultations.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {prescriptions.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px', borderRadius: '12px',
                      background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.88rem', color: 'var(--heading-color)' }}>
                      {p.medication_name}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.dosage} • {p.frequency}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Edit Emergency Info */}
      {editModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'grid', placeItems: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-glass-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            maxWidth: '540px',
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
                  <ShieldAlert size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  Update Emergency Medical Info
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Blood Group & Organ Donor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  >
                    <option value="UNKNOWN">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Organ Donor Status
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px', height: '42px',
                    padding: '0 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-main)',
                  }}>
                    <input
                      type="checkbox"
                      checked={organDonor}
                      onChange={(e) => setOrganDonor(e.target.checked)}
                    />
                    <span>Yes, Registered Organ Donor</span>
                  </label>
                </div>
              </div>

              {/* Critical Alert */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Critical Medical Alert (Emergency Highlights)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Severe Penicillin Anaphylaxis, Pacemaker implanted, Diabetic"
                  value={criticalAlert}
                  onChange={(e) => setCriticalAlert(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Emergency Contact Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Doe"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Emergency Relation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Relationship to Patient
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spouse, Parent, Sibling"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Allergies & Conditions */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Known Drug & Environmental Allergies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Chronic Medical Conditions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Type 1 Diabetes, Hypertension, Asthma"
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
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
                  onClick={() => setEditModalOpen(false)}
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
                  {saving ? 'Updating...' : 'Save Emergency ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientEmergencyID;
