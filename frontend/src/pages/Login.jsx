import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  FileText
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

        {/* Right Column: Authentication Card & 1-Click Fast Login */}
        <div style={{
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
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
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                }}>
                  Password
                </label>
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
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    background: 'transparent',
                    color: 'var(--text-dim)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
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
        </div>
      </div>
    </div>
  );
};

export default Login;
