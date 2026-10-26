import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Search, CalendarCheck, FileHeart,
  ChevronRight, AlertCircle, Clock,
} from 'lucide-react';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const statusColors = {
  SCHEDULED: '#0ea5e9', COMPLETED: '#10b981', CANCELLED: '#ef4444', NO_SHOW: '#f59e0b',
};

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    appointmentsService.getMyPatients().then(setPatients).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso) => new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/doctor" className="patient-back-link"><ArrowLeft size={17} /> Back to dashboard</Link>
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <Users size={24} />
        </div>
        <div>
          <p className="patient-eyebrow" style={{ color: 'var(--color-doctor)' }}>CLINICAL WORKSTATION</p>
          <h1>My Patients</h1>
          <p>All patients you have seen or have upcoming appointments with.</p>
        </div>
      </header>

      {/* Stats */}
      <div style={{
        padding: '16px 22px', borderRadius: '14px', marginBottom: '24px',
        background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={18} color="#10b981" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Patients</p>
          <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{patients.length}</p>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 14px', height: '44px',
        background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
        borderRadius: '10px', marginBottom: '18px',
      }}>
        <Search size={15} color="var(--text-muted)" />
        <input
          type="text" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.88rem' }}
        />
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading patients…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>{search ? 'No patients match your search.' : 'No patients yet. They appear here after appointments are booked.'}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(patient => (
          <div key={patient.id} style={{
            padding: '18px 20px', borderRadius: '14px',
            background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Avatar */}
              <div style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '1.1rem',
              }}>
                {patient.full_name[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--heading-color)' }}>
                  {patient.full_name}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{patient.email}</p>
                {patient.phone_number && (
                  <p style={{ margin: '1px 0 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>{patient.phone_number}</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarCheck size={12} /> {patient.appointment_count} visit{patient.appointment_count !== 1 ? 's' : ''}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.77rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> Last: {formatDate(patient.last_appointment)}
                </p>
                <span style={{
                  display: 'inline-block', marginTop: '4px',
                  padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                  background: `${statusColors[patient.last_status]}15`,
                  color: statusColors[patient.last_status],
                }}>
                  {patient.last_status?.replace('_', ' ')}
                </span>
              </div>

              <Link
                to={`/doctor/patients/${patient.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                  background: 'rgba(16,185,129,0.1)', color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.25)', textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
              >
                <FileHeart size={14} /> View Records <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorPatients;
