import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, Save, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import '../styles/PatientPortal.css';

const PatientProfile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    phone_number: user?.phone_number || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      username: user?.username || '',
      phone_number: user?.phone_number || '',
    });
  }, [user]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        phone_number: form.phone_number.trim(),
      });
      setMessage('Your profile has been updated.');
    } catch (saveError) {
      const responseData = saveError.response?.data;
      const fieldError = responseData && Object.values(responseData).flat().find((value) => typeof value === 'string');
      setError(fieldError || responseData?.detail || 'We could not save your changes. Please try again.');
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
          <h1>Personal profile</h1>
          <p>Keep your contact details up to date for your care team.</p>
        </div>
      </header>

      <form className="patient-profile-card" onSubmit={handleSubmit}>
        <div className="patient-profile-card__title">
          <div>
            <h2>Profile details</h2>
            <p>Changes are saved securely to your MediFlow account.</p>
          </div>
          <span className="patient-profile-status"><CheckCircle2 size={15} /> Patient account</span>
        </div>

        <div className="patient-profile-grid">
          <label className="patient-form-field">
            <span>First name</span>
            <input name="first_name" autoComplete="given-name" required value={form.first_name} onChange={handleChange} />
          </label>
          <label className="patient-form-field">
            <span>Last name</span>
            <input name="last_name" autoComplete="family-name" required value={form.last_name} onChange={handleChange} />
          </label>
          <label className="patient-form-field">
            <span>Username</span>
            <input name="username" autoComplete="username" value={form.username} onChange={handleChange} />
          </label>
          <label className="patient-form-field">
            <span>Phone number</span>
            <input name="phone_number" type="tel" autoComplete="tel" value={form.phone_number} onChange={handleChange} placeholder="Add a phone number" />
          </label>
          <div className="patient-form-field patient-form-field--readonly">
            <span>Email address</span>
            <div><Mail size={17} /> {user?.email}</div>
            <small>Email is used to sign in and cannot be changed here.</small>
          </div>
        </div>

        {message && <p className="patient-form-message patient-form-message--success" role="status">{message}</p>}
        {error && <p className="patient-form-message patient-form-message--error" role="alert">{error}</p>}

        <div className="patient-profile-card__footer">
          <span>Your account details are visible only to you and authorized care staff.</span>
          <button type="submit" className="patient-primary-button" disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfile;
