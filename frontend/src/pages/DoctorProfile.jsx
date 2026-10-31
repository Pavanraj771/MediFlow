import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Save, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService, appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const DEPT_OPTIONS = [
  { value: 'CARDIOLOGY', label: 'Cardiology' },
  { value: 'NEUROLOGY', label: 'Neurology' },
  { value: 'GENERAL_MEDICINE', label: 'General Medicine' },
  { value: 'ORTHOPEDICS', label: 'Orthopedics' },
  { value: 'PEDIATRICS', label: 'Pediatrics' },
];

const inputStyle = {
  background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)', padding: '10px 14px', borderRadius: '10px',
  outline: 'none', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'flex', flexDirection: 'column', gap: '6px',
  fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)',
};

const DoctorProfile = () => {
  const { user, setUser } = useAuth();

  const [basicForm, setBasicForm] = useState({
    first_name: '', last_name: '', phone_number: '',
  });
  const [profileForm, setProfileForm] = useState({
    department: '', consultation_fee: '', bio: '', license_number: '', years_experience: '',
  });
  const [doctorRating, setDoctorRating] = useState(null);
  const [doctorReviewCount, setDoctorReviewCount] = useState(0);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setBasicForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
      });
    }
    appointmentsService.getDoctorProfile().then(prof => {
      setProfileForm({
        department: prof.department || '',
        consultation_fee: prof.consultation_fee || '',
        bio: prof.bio || '',
        license_number: prof.license_number || '',
        years_experience: prof.years_experience || '',
      });
      setDoctorRating(prof.average_rating ?? null);
      setDoctorReviewCount(prof.review_count || 0);
    }).catch(console.error).finally(() => setLoading(false));

    appointmentsService.getDoctorReviews()
      .then(res => setReviews(Array.isArray(res) ? res : res.results || []))
      .catch(console.error);
  }, [user]);

  const showSaved = (section) => {
    setSavedSection(section);
    setTimeout(() => setSavedSection(''), 2500);
  };

  const handleBasicSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const updated = await authService.updateProfile(basicForm);
      if (setUser) setUser(prev => ({ ...prev, ...updated }));
      showSaved('basic');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await appointmentsService.updateDoctorProfile(profileForm);
      showSaved('profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update doctor profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.full_name || user?.first_name || 'Dr').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (loading) return (
    <div className="patient-portal-page patient-profile-page">
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px' }}>Loading profile…</p>
    </div>
  );

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/doctor" className="patient-back-link"><ArrowLeft size={17} /> Back to dashboard</Link>
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <Stethoscope size={24} />
        </div>
        <div>
          <p className="patient-eyebrow" style={{ color: 'var(--color-doctor)' }}>CLINICAL WORKSTATION</p>
          <h1>My Profile</h1>
          <p>Update your personal details and professional information.</p>
        </div>
      </header>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.87rem',
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Avatar card */}
      <div className="patient-profile-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '18px', flexShrink: 0,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '1.4rem',
            boxShadow: '0 0 24px rgba(16,185,129,0.4)',
          }}>{initials}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Dr. {user?.full_name}</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{user?.email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {profileForm.department && (
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(16,185,129,0.12)', color: '#10b981',
                }}>
                  {DEPT_OPTIONS.find(d => d.value === profileForm.department)?.label || profileForm.department}
                </span>
              )}
              {doctorRating !== null && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                }}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  <span>{doctorRating > 0 ? `${doctorRating.toFixed(1)} ★ (${doctorReviewCount} reviews)` : 'No reviews yet'}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <form onSubmit={handleBasicSave} className="patient-profile-card" style={{ marginBottom: '20px' }}>
        <div className="patient-profile-card__title">
          <h2>Personal Information</h2>
          <p>Your name and contact details.</p>
        </div>
        <div className="patient-profile-grid" style={{ marginTop: '20px' }}>
          <label style={labelStyle}>
            First Name
            <input type="text" value={basicForm.first_name} onChange={e => setBasicForm(p => ({ ...p, first_name: e.target.value }))} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Last Name
            <input type="text" value={basicForm.last_name} onChange={e => setBasicForm(p => ({ ...p, last_name: e.target.value }))} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Phone Number
            <input type="tel" value={basicForm.phone_number} onChange={e => setBasicForm(p => ({ ...p, phone_number: e.target.value }))} style={inputStyle} placeholder="+91 98765 43210" />
          </label>
          <label style={labelStyle}>
            Email (read-only)
            <input type="email" value={user?.email || ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
          </label>
        </div>
        <div className="patient-profile-card__footer">
          <span />
          <button type="submit" disabled={saving} className="patient-primary-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {savedSection === 'basic' ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </form>

      {/* Professional info */}
      <form onSubmit={handleProfileSave} className="patient-profile-card">
        <div className="patient-profile-card__title">
          <h2>Professional Details</h2>
          <p>Clinical specialization and practice information.</p>
        </div>
        <div className="patient-profile-grid" style={{ marginTop: '20px' }}>
          <label style={labelStyle}>
            Department / Specialization
            <select value={profileForm.department} onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} style={{ ...inputStyle, height: '44px', cursor: 'pointer' }}>
              <option value="" style={{ background: 'var(--bg-secondary)' }}>Select department</option>
              {DEPT_OPTIONS.map(d => <option key={d.value} value={d.value} style={{ background: 'var(--bg-secondary)' }}>{d.label}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Consultation Fee (₹)
            <input type="number" min="0" step="50" value={profileForm.consultation_fee} onChange={e => setProfileForm(p => ({ ...p, consultation_fee: e.target.value }))} style={inputStyle} placeholder="e.g. 500" />
          </label>
          <label style={labelStyle}>
            License Number
            <input type="text" value={profileForm.license_number} onChange={e => setProfileForm(p => ({ ...p, license_number: e.target.value }))} style={inputStyle} placeholder="Medical license number" />
          </label>
          <label style={labelStyle}>
            Years of Experience
            <input type="number" min="0" value={profileForm.years_experience} onChange={e => setProfileForm(p => ({ ...p, years_experience: e.target.value }))} style={inputStyle} placeholder="e.g. 10" />
          </label>
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
            Professional Bio
            <textarea rows={4} value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} placeholder="Brief description of your specialization, approach, and experience…" />
          </label>
        </div>
        <div className="patient-profile-card__footer">
          <span />
          <button type="submit" disabled={saving} className="patient-primary-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {savedSection === 'profile' ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save Profile</>}
          </button>
        </div>
      </form>

      {/* Patient Reviews Card */}
      <div className="patient-profile-card" style={{ marginTop: '20px' }}>
        <div className="patient-profile-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>Patient Reviews & Ratings</h2>
            <p>Verified feedback submitted by patients after completed consultations.</p>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '999px',
            background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b', fontWeight: 700, fontSize: '0.88rem'
          }}>
            <Star size={15} fill="#f59e0b" color="#f59e0b" />
            <span>{doctorRating !== null ? `${doctorRating.toFixed(1)} / 5.0` : 'No ratings'}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ({doctorReviewCount || reviews.length} {((doctorReviewCount || reviews.length) === 1) ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
            <Star size={36} style={{ opacity: 0.25, margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No patient reviews yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  padding: '14px 18px', borderRadius: '12px',
                  background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {rev.patient_name || 'Verified Patient'}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= rev.rating ? '#f59e0b' : 'transparent'}
                        color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                      />
                    ))}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', marginLeft: '4px' }}>
                      {rev.rating}/5
                    </span>
                  </div>
                </div>
                {rev.comment && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                    "{rev.comment}"
                  </p>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
