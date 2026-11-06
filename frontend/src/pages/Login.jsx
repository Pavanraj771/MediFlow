import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import {
  Activity,
  Shield,
  Stethoscope,
  User,
  Lock,
  AtSign,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Cpu,
  CalendarCheck,
  FileText,
  KeyRound,
  Mail,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export const Login = () => {
  const { login, googleLogin, authError, clearError } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Forgot Password State ──
  const [viewMode, setViewMode] = useState('LOGIN'); // 'LOGIN' | 'FORGOT_PASSWORD'
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestResetOTP = async (e) => {
    e?.preventDefault();
    const email = resetEmail.trim().toLowerCase();
    if (!email) {
      setResetError('Please enter your registered email address.');
      return;
    }
    setResetError('');
    setResetLoading(true);
    try {
      const res = await authService.requestPasswordResetOTP(email);
      if (res.dev_code) {
        setDevOtpNotice(res.dev_code);
      }
      setResetSuccessMsg(res.message || 'Verification code sent to your email.');
      setResetStep(2);
      setResendCooldown(30);
    } catch (err) {
      setResetError(err.response?.data?.detail || err.response?.data?.email?.[0] || 'Failed to send reset code. Please check your email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetOTP = async (e) => {
    e.preventDefault();
    const otp = resetOtp.trim();
    if (!otp || otp.length < 6) {
      setResetError('Please enter the 6-digit verification code.');
      return;
    }
    setResetError('');
    setResetLoading(true);
    try {
      await authService.verifyPasswordResetOTP(resetEmail.trim().toLowerCase(), otp);
      setResetStep(3);
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Incorrect or expired verification code.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }
    setResetError('');
    setResetLoading(true);
    try {
      await authService.confirmPasswordReset({
        email: resetEmail.trim().toLowerCase(),
        otp: resetOtp.trim(),
        new_password: newPassword,
      });
      setResetStep(4);
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    setViewMode('LOGIN');
    setResetStep(1);
    setResetError('');
    setDevOtpNotice('');
    if (resetEmail) {
      setUsername(resetEmail);
    }
  };

  const redirectUserByRole = (role) => {
    const origin = location.state?.from?.pathname;
    if (origin) {
      navigate(origin, { replace: true });
      return;
    }
    if (role === 'ADMIN') navigate('/admin', { replace: true });
    else if (role === 'DOCTOR') navigate('/doctor', { replace: true });
    else navigate('/patient', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    clearError();
    setIsSubmitting(true);
    try {
      const user = await login(username, password);
      redirectUserByRole(user.role);
    } catch {
      // Error is set in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential) => {
    clearError();
    const user = await googleLogin(credential);
    redirectUserByRole(user.role);
  }, [clearError, googleLogin, location.state, navigate, redirectUserByRole]);

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '1100px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        backgroundColor: 'var(--bg-glass-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Left Column: Platform Identity & Modules Showcase */}
        <div style={{
          padding: '48px',
          background: isDark
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(20, 30, 51, 0.8))'
            : 'linear-gradient(145deg, rgba(241, 245, 249, 0.95), rgba(226, 232, 240, 0.8))',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
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
              marginBottom: '24px'
            }}>
              <Shield size={14} />
              SECURE IDENTITY
            </div>

            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'var(--heading-color)',
              marginBottom: '16px',
              letterSpacing: '-1px'
            }}>
              Unified Healthcare <br />
              <span style={{
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Operating System
              </span>
            </h1>

            <p style={{
              color: 'var(--text-muted)',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '32px'
            }}>
              Enterprise-grade hospital portal unifying Clinicians, Patients, and Administration with cryptographic JWT tokens and zero-trust permission boundaries.
            </p>

            {/* Architecture Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ color: 'var(--color-doctor)' }}><CheckCircle2 size={18} /></div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--heading-color)' }}>
                    Zero-Trust RBAC Enforcement
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Stateless JWT claims (`sub`, `role`, `iat`, `exp`) with HMAC-SHA256
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ color: 'var(--color-primary)' }}><Cpu size={18} /></div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--heading-color)' }}>
                    Explainable AI CDSS Tier
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Mathematical SHAP attributions for clinical cardiovascular triage
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ color: 'var(--color-admin)' }}><Shield size={18} /></div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--heading-color)' }}>
                    HIPAA-Aligned Audit Trail
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Append-only forensic event logging for PHI operations
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '36px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: 'var(--text-dim)'
          }}>
            <span>MediFlow Core v1.0.0</span>
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
              API Server Online
            </span>
          </div>
        </div>

        {/* Right Column: Authentication Card & 1-Click Fast Login / Forgot Password */}
        <div style={{
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {viewMode === 'FORGOT_PASSWORD' ? (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              <div style={{ marginBottom: '24px' }}>
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', marginBottom: '14px'
                  }}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9',
                    display: 'grid', placeItems: 'center'
                  }}>
                    <KeyRound size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                      {resetStep === 1 && 'Reset Password'}
                      {resetStep === 2 && 'Enter Verification Code'}
                      {resetStep === 3 && 'Create New Password'}
                      {resetStep === 4 && 'Password Reset Complete'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0' }}>
                      {resetStep === 1 && 'Enter your registered email to receive an OTP code.'}
                      {resetStep === 2 && `6-digit verification code sent to ${resetEmail}`}
                      {resetStep === 3 && 'Choose a strong password (minimum 8 characters).'}
                      {resetStep === 4 && 'Your password has been successfully updated.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reset Error Message */}
              {resetError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 'var(--radius-md)',
                  color: '#ef4444', fontSize: '0.85rem', marginBottom: '18px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{resetError}</span>
                </div>
              )}

              {/* Reset Success Message */}
              {resetSuccessMsg && resetStep === 2 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)',
                  color: '#10b981', fontSize: '0.85rem', marginBottom: '18px'
                }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              {/* Dev OTP Box */}
              {devOtpNotice && resetStep === 2 && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#f59e0b', fontSize: '0.85rem', marginBottom: '18px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span>⚡ DEV MODE OTP: <strong>{devOtpNotice}</strong></span>
                  <button
                    type="button"
                    onClick={() => setResetOtp(devOtpNotice)}
                    style={{
                      background: '#f59e0b', color: '#fff', border: 'none',
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              {/* STEP 1: Enter Email */}
              {resetStep === 1 && (
                <form onSubmit={handleRequestResetOTP} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                      Registered Account Email
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. yourname@hospital.com"
                        style={{
                          width: '100%', padding: '12px 14px 12px 42px',
                          borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none',
                          background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{
                      padding: '14px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.95rem',
                      border: 'none', cursor: resetLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    {resetLoading ? 'Sending Verification Code...' : 'Send Verification Code'}
                    {!resetLoading && <ArrowRight size={18} />}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter OTP */}
              {resetStep === 2 && (
                <form onSubmit={handleVerifyResetOTP} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      style={{
                        width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                        fontSize: '1.4rem', letterSpacing: '0.3em', textAlign: 'center',
                        fontWeight: 800, outline: 'none', background: 'var(--surface-input)',
                        border: '1px solid var(--border-subtle)', color: 'var(--text-main)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <button
                      type="button"
                      onClick={() => { setResetStep(1); setResetError(''); setDevOtpNotice(''); }}
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestResetOTP}
                      disabled={resendCooldown > 0 || resetLoading}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: resendCooldown > 0 ? 'var(--text-dim)' : 'var(--color-primary)',
                        fontWeight: 600, cursor: resendCooldown > 0 ? 'default' : 'pointer'
                      }}
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || resetOtp.length < 6}
                    style={{
                      padding: '14px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.95rem',
                      border: 'none', cursor: resetLoading || resetOtp.length < 6 ? 'not-allowed' : 'pointer',
                      opacity: resetLoading || resetOtp.length < 6 ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    {resetLoading ? 'Verifying Code...' : 'Verify Code & Continue'}
                    {!resetLoading && <ArrowRight size={18} />}
                  </button>
                </form>
              )}

              {/* STEP 3: Enter New Password */}
              {resetStep === 3 && (
                <form onSubmit={handleConfirmResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                      New Password (minimum 8 characters)
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        style={{
                          width: '100%', padding: '12px 42px 12px 42px',
                          borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none',
                          background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '14px', background: 'transparent', border: 'none', color: 'var(--text-dim)', padding: 0, cursor: 'pointer' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        style={{
                          width: '100%', padding: '12px 14px 12px 42px',
                          borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none',
                          background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)'
                        }}
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 0' }}>Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || !newPassword || newPassword !== confirmPassword}
                    style={{
                      padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.95rem',
                      border: 'none', cursor: resetLoading || !newPassword || newPassword !== confirmPassword ? 'not-allowed' : 'pointer',
                      opacity: resetLoading || !newPassword || newPassword !== confirmPassword ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    {resetLoading ? 'Updating Password...' : 'Reset Password & Proceed'}
                  </button>
                </form>
              )}

              {/* STEP 4: Success */}
              {resetStep === 4 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                    display: 'grid', placeItems: 'center', margin: '0 auto 18px'
                  }}>
                    <CheckCircle size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                    Password Reset Successfully
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 24px', lineHeight: 1.5 }}>
                    Your MediFlow account password has been updated. You can now sign in using your new credentials.
                  </p>
                  <button
                    type="button"
                    onClick={handleSwitchToLogin}
                    style={{
                      width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.95rem',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    Proceed to Sign In <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--heading-color)', marginBottom: '8px' }}>
                  Access Clinical Cockpit
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Sign in with your MediFlow account.
                </p>
              </div>

              {/* Error Banner */}
              {authError && (
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
                  <span>{authError}</span>
                </div>
              )}

              {/* Standard Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '8px'
                  }}>
                    Username
                  </label>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <AtSign size={18} style={{
                      position: 'absolute',
                      left: '14px',
                      color: 'var(--text-dim)',
                      pointerEvents: 'none'
                    }} />
                    <input
                      type="text"
                      id="login-username"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username or email"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        background: 'var(--surface-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                    }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('FORGOT_PASSWORD');
                        setResetStep(1);
                        setResetError('');
                        setDevOtpNotice('');
                        if (username && username.includes('@')) {
                          setResetEmail(username);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--color-primary)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <Lock size={18} style={{
                      position: 'absolute',
                      left: '14px',
                      color: 'var(--text-dim)',
                      pointerEvents: 'none'
                    }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        background: 'var(--surface-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    marginTop: '10px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: '#fff',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-glow)',
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <span>Authenticating JWT...</span>
                  ) : (
                    <>
                      <span>Sign In & Verify RBAC</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0 16px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                <span style={{ height: '1px', flex: 1, background: 'var(--border-subtle)' }} />
                OR CONTINUE WITH
                <span style={{ height: '1px', flex: 1, background: 'var(--border-subtle)' }} />
              </div>
              <GoogleSignInButton onCredential={handleGoogleCredential} text="signin_with" />

              <div style={{
                marginTop: '24px',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                New to MediFlow?{' '}
                <Link to="/register" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  Create an Account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
