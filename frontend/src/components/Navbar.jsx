import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PatientAvatarMenu from './PatientAvatarMenu';
import DoctorAvatarMenu from './DoctorAvatarMenu';
import {
  Activity,
  Shield,
  Stethoscope,
  User,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          bg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.1)',
          color: isDark ? '#a78bfa' : '#7c3aed',
          border: isDark ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(124, 58, 237, 0.3)',
          icon: <Shield size={14} />,
        };
      case 'DOCTOR':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)',
          color: isDark ? '#34d399' : '#059669',
          border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(5, 150, 105, 0.3)',
          icon: <Stethoscope size={14} />,
        };
      case 'PATIENT':
      default:
        return {
          bg: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(2, 132, 199, 0.1)',
          color: isDark ? '#38bdf8' : '#0284c7',
          border: isDark ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(2, 132, 199, 0.3)',
          icon: <User size={14} />,
        };
    }
  };

  const roleStyle = getRoleBadgeStyle(user?.role);

  return (
    <header style={{
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      width: 'calc(100% - 32px)',
      maxWidth: '1280px',
      backgroundColor: 'var(--bg-glass-card)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '50px',
      boxShadow: 'var(--shadow-md)',
      transition: 'all 0.25s ease',
    }}>
      <div style={{
        padding: '0 24px',
        height: '82px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand & Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)',
          }}>
            <Activity size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--heading-color)',
                letterSpacing: '-0.5px'
              }}>
                Medi<span style={{ color: 'var(--color-primary)' }}>Flow</span>
              </span>
              <span style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                SECURE ACCESS
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.2px' }}>
              Clinical Intelligence & Hospital OS
            </span>
          </div>
        </Link>

        {/* Right Section: Theme Toggle + Navigation & Persona Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: isDark ? '#f59e0b' : '#0284c7',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            title={isDark ? "Switch to Clinical Light Mode" : "Switch to Deep Dark Mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <>


              {/* User Persona Capsule */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: roleStyle.bg,
                  color: roleStyle.color,
                  border: roleStyle.border,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                }}>
                  {roleStyle.icon}
                  {user?.role}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--heading-color)' }}>
                    {user?.full_name || user?.email}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {user?.email}
                  </span>
                </div>
              </div>

              {user?.role === 'PATIENT' && <PatientAvatarMenu size={40} />}
              {user?.role === 'DOCTOR' && <DoctorAvatarMenu size={40} />}

              {/* Logout Button for roles without a dedicated avatar dropdown */}
              {user?.role !== 'PATIENT' && user?.role !== 'DOCTOR' && (
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.08)',
                    color: 'var(--color-danger)',
                    border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                  title="Log out of session"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                to="/login"
                style={{
                  padding: '8px 18px',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  padding: '8px 18px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                Register as Patient
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
