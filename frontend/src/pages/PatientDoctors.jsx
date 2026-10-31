import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Stethoscope, Search, CalendarDays, DollarSign,
  Star, Filter, Users, AlertCircle, MessageSquare
} from 'lucide-react';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import DoctorReviewsListModal from '../components/DoctorReviewsListModal';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const DEPT_LABELS = {
  CARDIOLOGY: 'Cardiology', NEUROLOGY: 'Neurology',
  GENERAL_MEDICINE: 'General Medicine', ORTHOPEDICS: 'Orthopedics', PEDIATRICS: 'Pediatrics',
};

const DEPT_COLORS = {
  CARDIOLOGY: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  NEUROLOGY: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  GENERAL_MEDICINE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  ORTHOPEDICS: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  PEDIATRICS: { bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9' },
};

const DoctorCard = ({ doctor, onOpenReviews }) => {
  const dept = doctor.department;
  const dc = DEPT_COLORS[dept] || { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' };
  const initials = (doctor.user?.full_name || 'Dr').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avgRating = doctor.average_rating;
  const reviewCount = doctor.review_count || 0;

  return (
    <div style={{
      padding: '24px', borderRadius: '18px',
      background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', gap: '16px',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: '16px', flexShrink: 0,
          background: `linear-gradient(135deg, ${dc.color}, ${dc.color}aa)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '1.1rem',
          boxShadow: `0 0 20px ${dc.color}40`,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--heading-color)' }}>
            Dr. {doctor.user?.full_name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 10px', borderRadius: '999px', fontSize: '0.73rem', fontWeight: 700,
              background: dc.bg, color: dc.color,
            }}>
              {DEPT_LABELS[dept] || dept}
            </span>

            {/* Doctor Average Rating Badge */}
            <button
              type="button"
              onClick={() => onOpenReviews(doctor)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: avgRating ? 'rgba(245, 158, 11, 0.12)' : 'rgba(148, 163, 184, 0.1)',
                color: avgRating ? '#f59e0b' : 'var(--text-muted)',
                border: avgRating ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Click to view all patient reviews and ratings"
            >
              <Star size={11} fill={avgRating ? '#f59e0b' : 'transparent'} color={avgRating ? '#f59e0b' : 'currentColor'} />
              <span>{avgRating ? `${avgRating.toFixed(1)} ★ (${reviewCount})` : 'New'}</span>
            </button>
          </div>
        </div>
      </div>

      {doctor.bio && (
        <p style={{
          margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {doctor.bio}
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {doctor.years_experience > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <Star size={13} color="#f59e0b" /> {doctor.years_experience} yrs exp.
          </div>
        )}
        {doctor.consultation_fee > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <DollarSign size={13} color="#10b981" /> ₹{doctor.consultation_fee}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={() => onOpenReviews(doctor)}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '10px 12px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600,
            background: 'var(--bg-surface)', color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)', cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          title="Read all patient reviews for this doctor"
        >
          <MessageSquare size={14} color="#f59e0b" />
          <span>Reviews ({reviewCount})</span>
        </button>

        <Link
          to={`/patient/appointments?doctorId=${doctor.user?.id}&department=${doctor.department}&doctorName=${encodeURIComponent(doctor.user?.full_name || '')}`}
          style={{
            flex: 1.3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '10px 12px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
            background: dc.bg, color: dc.color,
            border: `1px solid ${dc.color}40`, textDecoration: 'none',
            transition: 'background 0.2s',
          }}
        >
          <CalendarDays size={14} /> Book
        </Link>
      </div>
    </div>
  );
};

const PatientDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [selectedDoctorForReviews, setSelectedDoctorForReviews] = useState(null);

  useEffect(() => {
    appointmentsService.getDoctors().then(setDoctors).catch(console.error).finally(() => setLoading(false));
  }, []);

  const depts = ['ALL', ...Object.keys(DEPT_LABELS)];
  const filtered = doctors.filter(d => {
    const matchDept = deptFilter === 'ALL' || d.department === deptFilter;
    const matchSearch = !search || d.user?.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/patient" className="patient-back-link"><ArrowLeft size={17} /> Back to dashboard</Link>
        <PatientAvatarMenu size={42} />
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>
          <Stethoscope size={24} />
        </div>
        <div>
          <p className="patient-eyebrow">FIND YOUR DOCTOR</p>
          <h1>Doctor Directory</h1>
          <p>Browse all available doctors by department and book an appointment.</p>
        </div>
      </header>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{
          flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 16px', height: '46px',
          background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: '12px',
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text" placeholder="Search doctor by name…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            style={{
              height: '46px', padding: '0 14px', borderRadius: '12px', fontSize: '0.87rem',
              background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)', outline: 'none', cursor: 'pointer',
            }}
          >
            {depts.map(d => <option key={d} value={d} style={{ background: 'var(--bg-secondary)' }}>{d === 'ALL' ? 'All Departments' : DEPT_LABELS[d]}</option>)}
          </select>
        </div>
      </div>

      {/* Count badge */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <Users size={14} /> {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Stethoscope size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>Loading doctors…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No doctors found. Try adjusting the search or filter.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
        {filtered.map(d => (
          <DoctorCard
            key={d.id}
            doctor={d}
            onOpenReviews={setSelectedDoctorForReviews}
          />
        ))}
      </div>

      {selectedDoctorForReviews && (
        <DoctorReviewsListModal
          doctor={selectedDoctorForReviews}
          onClose={() => setSelectedDoctorForReviews(null)}
        />
      )}
    </div>
  );
};

export default PatientDoctors;
