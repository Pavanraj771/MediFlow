import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Mail, Pencil, Save, UserRound, X,
  Heart, Phone, AlertTriangle, MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import { appointmentsService } from '../services/api';
import '../styles/PatientPortal.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'];

const inputStyle = {
  background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)', padding: '10px 14px', borderRadius: '10px',
  outline: 'none', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box',
};

const PatientProfile = () => {
  const { user, updateProfile } = useAuth();

  const [basicForm, setBasicForm] = useState({
    first_name: '', last_name: '', username: '', phone_number: '',
  });
  const [extForm, setExtForm] = useState({
    blood_group: 'UNKNOWN', date_of_birth: '', gender: '',
    address: '', allergies: '', chronic_conditions: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExt, setIsEditingExt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [extMessage, setExtMessage] = useState('');
  const [extError, setExtError] = useState('');

  useEffect(() => {
    if (user) {
      setBasicForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        phone_number: user.phone_number || '',
      });
    }
    appointmentsService.getPatientProfile().then(prof => {
      setExtForm({
        blood_group: prof.blood_group || 'UNKNOWN',
        date_of_birth: prof.date_of_birth || '',
        gender: prof.gender || '',
        address: prof.address || '',
        allergies: prof.allergies || '',
        chronic_conditions: prof.chronic_conditions || '',
        emergency_contact_name: prof.emergency_contact_name || '',
        emergency_contact_phone: prof.emergency_contact_phone || '',
        emergency_contact_relation: prof.emergency_contact_relation || '',
      });
    }).catch(console.error);
  }, [user]);

  const handleBasicChange = (e) => {
    setBasicForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setMessage(''); setError('');
  };
  const handleExtChange = (e) => {
    setExtForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setExtMessage(''); setExtError('');
  };

  const handleCancel = () => {
    setBasicForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      username: user?.username || '',
      phone_number: user?.phone_number || '',
    });
    setIsEditing(false); setMessage(''); setError('');
  };

  const handleBasicSave = async (e) => {
    e.preventDefault();
    setIsSaving(true); setMessage(''); setError('');
    try {
      await updateProfile({
        first_name: basicForm.first_name.trim(),
        last_name: basicForm.last_name.trim(),
        username: basicForm.username.trim() || null,
        phone_number: basicForm.phone_number.trim(),
      });
      setMessage('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.detail || (typeof d === 'object' ? Object.values(d).flat()[0] : d) || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtSave = async (e) => {
    e.preventDefault();
    setIsSaving(true); setExtMessage(''); setExtError('');
    try {
      await appointmentsService.updatePatientProfile(extForm);
      setExtMessage('Health profile updated.');
      setIsEditingExt(false);
    } catch (err) {
      setExtError(err.response?.data?.detail || 'Failed to save health profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="patient-portal-page patient-profile-page">
      <div className="patient-profile-topbar">
        <Link to="/patient" className="patient-back-link"><ArrowLeft size={17} /> Back to dashboard</Link>
        <PatientAvatarMenu size={42} />
      </div>

      <header className="patient-profile-heading">
        <div className="patient-profile-heading__icon"><UserRound size={24} /></div>
        <div>
          <p className="patient-eyebrow">YOUR ACCOUNT</p>
          <h1>Personal Profile</h1>
          <p>Keep your contact and health details up to date for your care team.</p>
        </div>
      </header>

      {/* ── Basic Info ─────────────────────────────────── */}
      <div className="patient-profile-card" style={{ marginBottom: '20px' }}>
        <div className="patient-profile-card__title">
          <div>
            <h2>Profile details</h2>
            <p>Changes are saved securely to your MediFlow account.</p>
          </div>
          <span className="patient-profile-status"><CheckCircle2 size={15} /> Patient account</span>
        </div>

        <form id="patient-profile-form" onSubmit={handleBasicSave}>
          <div className="patient-profile-grid" style={{ marginTop: '20px' }}>
            <label className="patient-form-field">
              <span>First name</span>
              <input name="first_name" autoComplete="given-name" required disabled={!isEditing || isSaving} value={basicForm.first_name} onChange={handleBasicChange} />
            </label>
            <label className="patient-form-field">
              <span>Last name</span>
              <input name="last_name" autoComplete="family-name" required disabled={!isEditing || isSaving} value={basicForm.last_name} onChange={handleBasicChange} />
            </label>
            <label className="patient-form-field">
              <span>Username</span>
              <input name="username" autoComplete="username" disabled={!isEditing || isSaving} value={basicForm.username} onChange={handleBasicChange} placeholder="Add a username" />
            </label>
            <label className="patient-form-field">
              <span>Phone number</span>
              <input name="phone_number" type="tel" autoComplete="tel" disabled={!isEditing || isSaving} value={basicForm.phone_number} onChange={handleBasicChange} placeholder="Add a phone number" />
            </label>
            <div className="patient-form-field patient-form-field--readonly">
              <span>Email address</span>
              <div><Mail size={17} /> {user?.email}</div>
              <small>Email is used to sign in and cannot be changed here.</small>
            </div>
          </div>
          {message && <p className="patient-form-message patient-form-message--success">{message}</p>}
          {error && <p className="patient-form-message patient-form-message--error">{error}</p>}
        </form>

        <div className="patient-profile-card__footer">
          <span>Your account details are visible only to you and authorized care staff.</span>
          <div className="patient-profile-actions">
            {isEditing ? (
              <>
                <button type="button" className="patient-secondary-button" onClick={handleCancel} disabled={isSaving}><X size={16} /> Cancel</button>
                <button type="submit" form="patient-profile-form" className="patient-primary-button" disabled={isSaving}>
                  <Save size={16} /> {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </>
            ) : (
              <button type="button" className="patient-primary-button" onClick={() => { setIsEditing(true); setMessage(''); setError(''); }}>
                <Pencil size={16} /> Edit profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Health Profile ─────────────────────────────── */}
      <form onSubmit={handleExtSave} className="patient-profile-card">
        <div className="patient-profile-card__title">
          <div>
            <h2>Health Information</h2>
            <p>Medical details shared with your care team during consultations.</p>
          </div>
          {!isEditingExt && (
            <button type="button" className="patient-primary-button" onClick={() => setIsEditingExt(true)}>
              <Pencil size={15} /> Edit
            </button>
          )}
        </div>

        {/* Medical Info */}
        <div style={{ marginTop: '20px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Heart size={15} color="#ef4444" />
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>MEDICAL INFO</p>
        </div>
        <div className="patient-profile-grid" style={{ marginBottom: '20px' }}>
          <label className="patient-form-field">
            <span>Blood Group</span>
            <select name="blood_group" disabled={!isEditingExt} value={extForm.blood_group} onChange={handleExtChange}
              style={{ background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '10px 14px', borderRadius: '10px', outline: 'none', height: '44px', cursor: isEditingExt ? 'pointer' : 'default' }}>
              {BLOOD_GROUPS.map(g => <option key={g} value={g} style={{ background: 'var(--bg-secondary)' }}>{g === 'UNKNOWN' ? 'Unknown' : g}</option>)}
            </select>
          </label>
          <label className="patient-form-field">
            <span>Date of Birth</span>
            <input type="date" name="date_of_birth" disabled={!isEditingExt} value={extForm.date_of_birth} onChange={handleExtChange} />
          </label>
          <label className="patient-form-field">
            <span>Gender</span>
            <select name="gender" disabled={!isEditingExt} value={extForm.gender} onChange={handleExtChange}
              style={{ background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '10px 14px', borderRadius: '10px', outline: 'none', height: '44px', cursor: isEditingExt ? 'pointer' : 'default' }}>
              <option value="" style={{ background: 'var(--bg-secondary)' }}>Select gender</option>
              <option value="MALE" style={{ background: 'var(--bg-secondary)' }}>Male</option>
              <option value="FEMALE" style={{ background: 'var(--bg-secondary)' }}>Female</option>
              <option value="OTHER" style={{ background: 'var(--bg-secondary)' }}>Other</option>
            </select>
          </label>
          <label className="patient-form-field" style={{ gridColumn: '1 / -1' }}>
            <span>Allergies (comma-separated)</span>
            <input type="text" name="allergies" disabled={!isEditingExt} value={extForm.allergies} onChange={handleExtChange} placeholder="e.g. Penicillin, Peanuts, Dust" />
          </label>
          <label className="patient-form-field" style={{ gridColumn: '1 / -1' }}>
            <span>Known Chronic Conditions</span>
            <input type="text" name="chronic_conditions" disabled={!isEditingExt} value={extForm.chronic_conditions} onChange={handleExtChange} placeholder="e.g. Diabetes Type 2, Hypertension" />
          </label>
        </div>

        {/* Address */}
        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={15} color="var(--text-muted)" />
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>ADDRESS</p>
        </div>
        <div className="patient-profile-grid" style={{ marginBottom: '20px' }}>
          <label className="patient-form-field" style={{ gridColumn: '1 / -1' }}>
            <span>Full Address</span>
            <input type="text" name="address" disabled={!isEditingExt} value={extForm.address} onChange={handleExtChange} placeholder="Street, City, State, PIN" />
          </label>
        </div>

        {/* Emergency Contact */}
        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={15} color="#f59e0b" />
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>EMERGENCY CONTACT</p>
        </div>
        <div className="patient-profile-grid">
          <label className="patient-form-field">
            <span>Contact Name</span>
            <input type="text" name="emergency_contact_name" disabled={!isEditingExt} value={extForm.emergency_contact_name} onChange={handleExtChange} placeholder="Full name" />
          </label>
          <label className="patient-form-field">
            <span>Contact Phone</span>
            <input type="tel" name="emergency_contact_phone" disabled={!isEditingExt} value={extForm.emergency_contact_phone} onChange={handleExtChange} placeholder="+91 98765 43210" />
          </label>
          <label className="patient-form-field">
            <span>Relation</span>
            <input type="text" name="emergency_contact_relation" disabled={!isEditingExt} value={extForm.emergency_contact_relation} onChange={handleExtChange} placeholder="e.g. Spouse, Parent, Sibling" />
          </label>
        </div>

        {extMessage && <p className="patient-form-message patient-form-message--success" style={{ marginTop: '14px' }}>{extMessage}</p>}
        {extError && <p className="patient-form-message patient-form-message--error" style={{ marginTop: '14px' }}>{extError}</p>}

        {isEditingExt && (
          <div className="patient-profile-card__footer">
            <span />
            <div className="patient-profile-actions">
              <button type="button" className="patient-secondary-button" onClick={() => { setIsEditingExt(false); setExtMessage(''); setExtError(''); }} disabled={isSaving}><X size={15} /> Cancel</button>
              <button type="submit" className="patient-primary-button" disabled={isSaving}>
                <Save size={15} /> {isSaving ? 'Saving…' : 'Save health profile'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientProfile;
