import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Users, Search, CalendarCheck, FileHeart,
  ChevronRight, AlertCircle, Clock, FileText, CheckCircle2,
  CalendarDays, UserCheck
} from 'lucide-react';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const statusColors = {
  SCHEDULED: '#0ea5e9',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  NO_SHOW: '#f59e0b',
};

const DoctorPatients = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Initial filter from query params: ?filter=today or ?filter=visited or default 'all'
  const filterParam = searchParams.get('filter')?.toLowerCase();
  const [activeTab, setActiveTab] = useState(
    filterParam === 'today' ? 'today' : filterParam === 'visited' ? 'visited' : 'all'
  );

  useEffect(() => {
    if (filterParam === 'today' || filterParam === 'visited' || filterParam === 'all') {
      setActiveTab(filterParam);
    }
  }, [filterParam]);

  useEffect(() => {
    appointmentsService.getMyPatients()
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ filter: tab });
    }
  };

  const todayDateStr = new Date().toISOString().split('T')[0];

  const isPatientToday = (p) => {
    if (p.has_today_appointment) return true;
    if (p.last_appointment && p.last_appointment.startsWith(todayDateStr)) return true;
    return false;
  };

  const isPatientVisited = (p) => {
    return (p.visited_count > 0) || p.has_visited || p.last_status === 'COMPLETED';
  };

  const todayCount = patients.filter(isPatientToday).length;
  const visitedCount = patients.filter(isPatientVisited).length;
  const totalCount = patients.length;

  let filtered = patients;
  if (activeTab === 'today') {
    filtered = filtered.filter(isPatientToday);
  } else if (activeTab === 'visited') {
    filtered = filtered.filter(isPatientVisited);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone_number?.toLowerCase().includes(q)
    );
  }

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
          <p>All patients who have visited or booked appointments with you. Click on any patient to view their visited appointments and clinical notes.</p>
        </div>
      </header>

      {/* Interactive Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* All Patients */}
        <div
          onClick={() => handleTabChange('all')}
          style={{
            padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
            background: activeTab === 'all' ? 'rgba(16,185,129,0.08)' : 'var(--bg-glass-card)',
            border: activeTab === 'all' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: '10px',
            background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={20} color="#10b981" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>All Patients</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalCount}</p>
          </div>
        </div>

        {/* Today's Patients */}
        <div
          onClick={() => handleTabChange('today')}
          style={{
            padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
            background: activeTab === 'today' ? 'rgba(14,165,233,0.08)' : 'var(--bg-glass-card)',
            border: activeTab === 'today' ? '2px solid #0ea5e9' : '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: '10px',
            background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CalendarDays size={20} color="#0ea5e9" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Today's Patients</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9' }}>{todayCount}</p>
          </div>
        </div>

        {/* Visited Patients */}
        <div
          onClick={() => handleTabChange('visited')}
          style={{
            padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
            background: activeTab === 'visited' ? 'rgba(16,185,129,0.08)' : 'var(--bg-glass-card)',
            border: activeTab === 'visited' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: '10px',
            background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UserCheck size={20} color="#10b981" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Visited Patients</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{visitedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
        gap: '12px', marginBottom: '18px'
      }}>
        {/* Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            style={{
              padding: '6px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              border: activeTab === 'all' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              background: activeTab === 'all' ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: activeTab === 'all' ? '#10b981' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            All Patients ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('today')}
            style={{
              padding: '6px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              border: activeTab === 'today' ? '1px solid #0ea5e9' : '1px solid var(--border-subtle)',
              background: activeTab === 'today' ? 'rgba(14,165,233,0.15)' : 'transparent',
              color: activeTab === 'today' ? '#0ea5e9' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            Today's Patients ({todayCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('visited')}
            style={{
              padding: '6px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              border: activeTab === 'visited' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              background: activeTab === 'visited' ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: activeTab === 'visited' ? '#10b981' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            Visited Patients ({visitedCount})
          </button>
        </div>

        {/* Search Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 12px', height: '40px', minWidth: '260px',
          background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text" placeholder="Search patient by name, email, or phone…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading patients…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>
            {search
              ? 'No patients match your search.'
              : activeTab === 'today'
              ? "No patients scheduled for today."
              : activeTab === 'visited'
              ? 'No visited patients found yet.'
              : 'No patients yet. They appear here once appointments are booked or visited.'}
          </p>
        </div>
      )}

      {/* Patient Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(patient => {
          const hasToday = isPatientToday(patient);
          const visitedTotal = patient.visited_count !== undefined ? patient.visited_count : (patient.has_visited ? 1 : 0);

          return (
            <Link
              key={patient.id}
              to={`/doctor/patients/${patient.id}`}
              style={{
                textDecoration: 'none', color: 'inherit', display: 'block',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <div style={{
                padding: '18px 20px', borderRadius: '14px',
                background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '1.1rem',
                  }}>
                    {patient.full_name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--heading-color)' }}>
                        {patient.full_name}
                      </h3>
                      {patient.blood_group && (
                        <span style={{
                          padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                          background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)',
                        }}>
                          {patient.blood_group}
                        </span>
                      )}
                      {hasToday && (
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                          <CalendarDays size={11} /> Today's Appointment
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{patient.email}</p>
                    {patient.phone_number && (
                      <p style={{ margin: '1px 0 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>{patient.phone_number}</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <CalendarCheck size={13} color="#10b981" />
                      <strong>{visitedTotal}</strong> visited consultation{visitedTotal !== 1 ? 's' : ''}
                    </p>
                    {patient.last_appointment && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.77rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <Clock size={11} /> Last: {formatDate(patient.last_appointment)}
                      </p>
                    )}
                    {patient.last_status && (
                      <span style={{
                        display: 'inline-block', marginTop: '4px',
                        padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                        background: `${statusColors[patient.last_status] || '#10b981'}15`,
                        color: statusColors[patient.last_status] || '#10b981',
                      }}>
                        {patient.last_status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                      background: 'rgba(16,185,129,0.1)', color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.25)',
                    }}
                  >
                    <FileText size={14} /> View Appointments & Notes <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorPatients;