import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import {
  Shield,
  User,
  Mail,
  Lock,
  Phone,
  AtSign,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  UserCheck
} from 'lucide-react';

export const Register = () => {
  const { register, googleLogin, authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    role: 'PATIENT',
  });

  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleChange = (e) => {
    if (e.target.name === 'email') {
      setEmailVerified(false);
      setOtpSent(false);
      setOtp('');
      setSuccessMessage('');
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendOtp = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Enter a valid email address first.');
      return;
    }
    setLocalError('');
    setSuccessMessage('');
    setIsSendingOtp(true);
    try {
      const result = await authService.sendEmailOTP(email);
      setOtpSent(true);
      setSuccessMessage(result.message);
    } catch (err) {
      setLocalError(err.response?.data?.detail || err.response?.data?.email?.[0] || 'Could not send the OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setLocalError('Enter the six-digit OTP from your email.');
      return;
    }
    setLocalError('');
    setIsVerifyingOtp(true);
    try {
      const result = await authService.verifyEmailOTP(formData.email.trim().toLowerCase(), otp.trim());
      setEmailVerified(true);
      setSuccessMessage(result.message);
    } catch (err) {
      setLocalError(err.response?.data?.detail || 'OTP verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const ADMIN_RESERVED_USERNAME = 'MediFlowAdmin';
  const ADMIN_RESERVED_PASSWORD = 'MediFlowAdmin@2751';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!formData.username.trim()) {
      setLocalError('Username is required.');
      return;
    }

    if (!emailVerified) {
      setLocalError('Verify your email address before creating an account.');
      return;
    }

    // Block reserved administrator credentials
    if (formData.username.trim() === ADMIN_RESERVED_USERNAME) {
      setLocalError(
        'The username "MediFlowAdmin" is reserved for system administration. Please choose a different username.'
      );
      return;
    }

    if (formData.password === ADMIN_RESERVED_PASSWORD) {
      setLocalError(
        'This password is reserved for system administration. Please choose a different password.'
      );
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        username: formData.username.trim(),
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        role: formData.role,
      });
      if (formData.role === 'DOCTOR') {
        setSuccessMessage(user?.message || 'Doctor account request sent. You can sign in after an administrator approves it.');
      } else {
        navigate('/patient', { replace: true });
      }
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential) => {
    setLocalError('');
    setSuccessMessage('');
    clearError();
    const user = await googleLogin(credential);
    if (user.role === 'ADMIN') navigate('/admin', { replace: true });
    else if (user.role === 'DOCTOR') navigate('/doctor', { replace: true });
    else navigate('/patient', { replace: true });
  }, [clearError, googleLogin, navigate]);

  const displayError = localError || authError;

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    outline: 'none',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    color: 'var(--text-main)',
    boxSizing: 'border-box',
  };

  const inputWithIconStyle = {
    ...inputStyle,
    paddingLeft: '38px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    marginBottom: '6px',
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'var(--bg-glass-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: '40px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(14, 165, 233, 0.12)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            color: 'var(--color-primary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '16px'
          }}>
            <User size={14} />
            MEDIFLOW REGISTRATION
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--heading-color)', marginBottom: '8px' }}>
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Create a patient account or request doctor account access.
          </p>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
            I am registering as a...
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Patient Role */}
            <button
              type="button"
              id="role-patient"
              onClick={() => handleRoleSelect('PATIENT')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 12px',
                borderRadius: 'var(--radius-lg)',
                border: formData.role === 'PATIENT'
                  ? '2px solid var(--color-primary)'
                  : '2px solid var(--border-subtle)',
                background: formData.role === 'PATIENT'
                  ? 'rgba(14, 165, 233, 0.1)'
                  : 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: formData.role === 'PATIENT' ? 'var(--color-primary)' : 'var(--text-muted)',
                position: 'relative',
              }}
            >
              {formData.role === 'PATIENT' && (
                <CheckCircle2 size={16} style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--color-primary)' }} />
              )}
              <User size={28} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Patient</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>Book appointments & view records</div>
              </div>
            </button>

            {/* Doctor Role */}
            <button
              type="button"
              id="role-doctor"
              onClick={() => handleRoleSelect('DOCTOR')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 12px',
                borderRadius: 'var(--radius-lg)',
                border: formData.role === 'DOCTOR'
                  ? '2px solid var(--color-doctor)'
                  : '2px solid var(--border-subtle)',
                background: formData.role === 'DOCTOR'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: formData.role === 'DOCTOR' ? 'var(--color-doctor)' : 'var(--text-muted)',
                position: 'relative',
              }}
            >
              {formData.role === 'DOCTOR' && (
                <CheckCircle2 size={16} style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--color-doctor)' }} />
              )}
              <Stethoscope size={28} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Doctor</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>Manage patients & consultations</div>
              </div>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
            marginBottom: '20px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{displayError}</span>
          </div>
        )}

        {successMessage && (
          <div role="status" style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: 'var(--color-success)' }}>
            {successMessage}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Username */}
          <div>
            <label style={labelStyle} htmlFor="reg-username">Username</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <AtSign size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
              <input
                id="reg-username"
                type="text"
                name="username"
                required
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. jane.doe or dr.smith"
                style={inputWithIconStyle}
              />
            </div>
          </div>

          {/* Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle} htmlFor="reg-first-name">First Name</label>
              <input
                id="reg-first-name"
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Jane"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="reg-last-name">Last Name</label>
              <input
                id="reg-last-name"
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle} htmlFor="reg-email">Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
              <input
                id="reg-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane.doe@example.com"
                style={inputWithIconStyle}
              />
            </div>
            {!emailVerified && (
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <button type="button" onClick={handleSendOtp} disabled={isSendingOtp || !formData.email.trim()} style={{ padding: '9px 13px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, opacity: isSendingOtp ? 0.65 : 1 }}>
                  {isSendingOtp ? 'Sending…' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
                {otpSent && <>
                  <input aria-label="Email OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit OTP" style={{ ...inputStyle, width: '130px' }} />
                  <button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp || otp.length !== 6} style={{ padding: '9px 13px', borderRadius: 'var(--radius-md)', background: 'var(--color-success)', color: '#fff', fontWeight: 700, opacity: isVerifyingOtp ? 0.65 : 1 }}>
                    {isVerifyingOtp ? 'Verifying…' : 'Verify OTP'}
                  </button>
                </>}
              </div>
            )}
            {emailVerified && <div role="status" style={{ marginTop: '8px', color: 'var(--color-success)', fontSize: '0.82rem', fontWeight: 600 }}>Email verified</div>}
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle} htmlFor="reg-phone">Phone Number <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
              <input
                id="reg-phone"
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                style={inputWithIconStyle}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle} htmlFor="reg-password">Password <span style={{ fontWeight: 400, opacity: 0.6 }}>(min 6)</span></label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={inputWithIconStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="reg-confirm-password">Confirm Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                <input
                  id="reg-confirm-password"
                  type="password"
                  name="confirm_password"
                  required
                  autoComplete="new-password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={inputWithIconStyle}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            id="register-submit"
            disabled={isSubmitting}
            style={{
              marginTop: '12px',
              padding: '14px',
              background: formData.role === 'DOCTOR'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isSubmitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                {formData.role === 'DOCTOR' ? <Stethoscope size={18} /> : <UserCheck size={18} />}
                <span>{formData.role === 'DOCTOR' ? 'Send Account Request' : 'Register as Patient & Sign In'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
            <span style={{ height: '1px', flex: 1, background: 'var(--border-subtle)' }} />
            OR CONTINUE WITH
            <span style={{ height: '1px', flex: 1, background: 'var(--border-subtle)' }} />
          </div>
          {formData.role === 'PATIENT' ? (
            <GoogleSignInButton onCredential={handleGoogleCredential} text="signup_with" />
          ) : (
            <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              Google registration is available for patient accounts. Use the form above to request doctor access.
            </p>
          )}
        </div>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
