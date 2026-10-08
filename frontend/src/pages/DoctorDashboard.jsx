import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope,
  Activity,
  HeartPulse,
  BrainCircuit,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '32px',
        padding: '24px 32px',
        background: 'var(--banner-doctor)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
          }}>
            <Stethoscope size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Clinical Consultation Cockpit
              </h1>
              <span style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--color-doctor)',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.4)'
              }}>
                DOCTOR WORKSTATION
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Authenticated Physician: <strong style={{ color: 'var(--heading-color)' }}>{user?.full_name}</strong> • Department of Cardiology & Medicine
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--color-doctor)',
          fontSize: '0.82rem',
          fontWeight: 600,
        }}>
          <ShieldCheck size={16} />
          <span>RBAC Scope: CLINICAL_ACTIVE</span>
        </div>
      </div>

      {/* Clinician Identity & Scope Credentials Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Profile & Credentials */}
        <div style={{
          padding: '24px 28px',
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Award size={22} color="var(--color-doctor)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading-color)', margin: 0 }}>
              Physician Identification
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Physician Name:</span>
              <span style={{ color: 'var(--heading-color)', fontWeight: 600 }}>{user?.full_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Medical Email:</span>
              <span style={{ color: 'var(--color-primary)' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>System Identity UUID:</span>
              <code style={{ background: 'var(--card-code-bg)', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem' }}>
                {user?.id}
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Zero-Trust Role:</span>
              <span style={{ color: 'var(--color-doctor)', fontWeight: 700 }}>DOCTOR (Elevated Clinical Scope)</span>
            </div>
          </div>
        </div>

        {/* Granted Capabilities */}
        <div style={{
          padding: '24px 28px',
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ShieldCheck size={22} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading-color)', margin: 0 }}>
              Granted Clinical Privileges
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <CheckCircle2 size={16} color="var(--color-doctor)" />
              <span>Full EMR Write Authority (Consultation Notes & ICD-10 Diagnoses)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <CheckCircle2 size={16} color="var(--color-doctor)" />
              <span>Biometric Vitals Recording (BP, SpO2, Heart Rate, Glucose)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <CheckCircle2 size={16} color="var(--color-doctor)" />
              <span>AI Decision Support Triggering (Cardiovascular SHAP Inference)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <CheckCircle2 size={16} color="var(--color-doctor)" />
              <span>Digital Itemized Prescription (Rx) Issuance</span>
            </div>
          </div>
        </div>
      </div>

      {/* MediFlow 6-Module Clinical Roadmap for Doctors */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--heading-color)', marginBottom: '16px' }}>
          Clinical Workflow Modules
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            padding: '24px',
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  background: 'rgba(14, 165, 233, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(14, 165, 233, 0.3)'
                }}>
                </span>
                <Calendar size={18} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading-color)', marginBottom: '6px' }}>
                Doctor Scheduling & Shifts
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Configure recurring shift hours (e.g., 09:00–17:00), dynamic 30-min slot generation, and ACID-compliant booking locks.
              </p>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Module Foundation Ready</span>
            </div>
          </div>

          <div style={{
            padding: '24px',
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--color-doctor)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                </span>
                <FileSpreadsheet size={18} color="var(--color-doctor)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading-color)', marginBottom: '6px' }}>
                EMR & Vitals Recording
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Capture Chief Complaints, BP, SpO2, and Blood Glucose with longitudinal trend visualization and structured digital Rx.
              </p>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Module Foundation Ready</span>
            </div>
          </div>

          <div style={{
            padding: '24px',
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--color-admin)',
                  background: 'rgba(139, 92, 246, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                </span>
                <BrainCircuit size={18} color="var(--color-admin)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading-color)', marginBottom: '6px' }}>
                Explainable AI CDSS (SHAP)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Calibrated machine learning risk predictions demystified with mathematical Shapley feature attributions and interactive "What-If" simulations.
              </p>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Module Foundation Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
