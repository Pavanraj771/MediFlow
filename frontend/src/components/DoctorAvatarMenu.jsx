import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Calendar, LogOut, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DoctorAvatarMenu = ({ size = 40, align = 'right' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const initials = (user?.full_name || user?.first_name || user?.email || 'Dr')
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
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
          border: '2px solid rgba(255, 255, 255, 0.6)',
        }}
        aria-label="Open doctor account menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{initials || <Stethoscope size={size * 0.5} />}</span>
      </button>

      {isOpen && (
        <div className="patient-avatar-menu__panel" role="menu">
          <div className="patient-avatar-menu__identity">
            <div
              className="patient-avatar-menu__identity-avatar"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              {initials || 'DR'}
            </div>
            <div className="patient-avatar-menu__identity-copy">
              <strong>Dr. {user?.full_name || user?.first_name || 'Doctor'}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <Link role="menuitem" to="/doctor" onClick={() => setIsOpen(false)}>
            <Activity size={17} color="#10b981" />
            <span>Clinical Workstation</span>
          </Link>
          <Link role="menuitem" to="/doctor" onClick={() => setIsOpen(false)}>
            <Calendar size={17} color="#10b981" />
            <span>Manage Schedule</span>
          </Link>
          <div
            style={{
              padding: '6px 10px',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={14} color="#10b981" /> Verified Physician Account
          </div>
          <button type="button" role="menuitem" onClick={handleSignOut}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorAvatarMenu;
