import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  Users,
  Stethoscope,
  CalendarCheck,
  Building2,
  FileText,
  Radio,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminAvatarMenu = ({ size = 40, align = 'right' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const initials = (user?.full_name || user?.first_name || user?.email || 'AD')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className={`patient-avatar-menu patient-avatar-menu--${align}`} ref={menuRef}>
      <button
        type="button"
        className="patient-avatar-menu__trigger"
        style={{
          width: size,
          height: size,
          borderRadius: size > 48 ? 18 : 14,
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
          border: '2px solid rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.9rem',
        }}
        aria-label="Open admin control menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{initials || <Shield size={size * 0.5} />}</span>
      </button>

      {isOpen && (
        <div className="patient-avatar-menu__panel" role="menu" style={{ minWidth: '260px' }}>
          <div className="patient-avatar-menu__identity">
            <div
              className="patient-avatar-menu__identity-avatar"
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#8b5cf6',
                borderColor: 'rgba(139, 92, 246, 0.3)',
              }}
            >
              {initials || 'AD'}
            </div>
            <div className="patient-avatar-menu__identity-copy">
              <strong>{user?.full_name || 'Administrator'}</strong>
              <span>{user?.email}</span>
            </div>
          </div>

          <Link role="menuitem" to="/admin" onClick={() => setIsOpen(false)}>
            <Activity size={17} color="#8b5cf6" />
            <span>Command Center</span>
          </Link>

          <Link role="menuitem" to="/admin?tab=doctors" onClick={() => setIsOpen(false)}>
            <Stethoscope size={17} color="#8b5cf6" />
            <span>Doctor & Staff Hub</span>
          </Link>

          <Link role="menuitem" to="/admin?tab=patients" onClick={() => setIsOpen(false)}>
            <Users size={17} color="#8b5cf6" />
            <span>Patient Master Index</span>
          </Link>

          <Link role="menuitem" to="/admin?tab=appointments" onClick={() => setIsOpen(false)}>
            <CalendarCheck size={17} color="#8b5cf6" />
            <span>Hospital Appointments</span>
          </Link>

          <Link role="menuitem" to="/admin?tab=departments" onClick={() => setIsOpen(false)}>
            <Building2 size={17} color="#8b5cf6" />
            <span>Clinical Departments</span>
          </Link>

          <Link role="menuitem" to="/admin?tab=security" onClick={() => setIsOpen(false)}>
            <ShieldCheck size={17} color="#8b5cf6" />
            <span>HIPAA Audit Trail</span>
          </Link>

          <Link role="menuitem" to="/admin?tab=health" onClick={() => setIsOpen(false)}>
            <Radio size={17} color="#8b5cf6" />
            <span>Broadcasts & Telemetry</span>
          </Link>

          <div
            style={{
              padding: '8px 12px',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '4px',
            }}
          >
            <Shield size={13} color="#8b5cf6" />
            <span>Role: Hospital Administrator</span>
          </div>

          <button
            type="button"
            className="patient-avatar-menu__signout"
            role="menuitem"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAvatarMenu;
