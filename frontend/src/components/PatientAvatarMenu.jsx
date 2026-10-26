import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, CircleUserRound, LogOut, UserRound,
  MessageSquare, FlaskConical, HeartPulse, ShieldAlert, Pill
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PatientAvatarMenu = ({ size = 44, align = 'right' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const initials = (user?.full_name || user?.email || 'P')
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
        style={{ width: size, height: size, borderRadius: size > 48 ? 18 : 14 }}
        aria-label="Open patient account menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{initials || <UserRound size={size * 0.5} />}</span>
      </button>

      {isOpen && (
        <div className="patient-avatar-menu__panel" role="menu">
          <div className="patient-avatar-menu__identity">
            <div className="patient-avatar-menu__identity-avatar">{initials || 'P'}</div>
            <div className="patient-avatar-menu__identity-copy">
              <strong>{user?.full_name || 'Patient account'}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <Link role="menuitem" to="/patient" onClick={() => setIsOpen(false)}>
            <Activity size={17} />
            <span>Dashboard</span>
          </Link>
          <Link role="menuitem" to="/patient/messages" onClick={() => setIsOpen(false)}>
            <MessageSquare size={17} />
            <span>Care Messages</span>
          </Link>
          <Link role="menuitem" to="/patient/lab-reports" onClick={() => setIsOpen(false)}>
            <FlaskConical size={17} />
            <span>Lab & Diagnostics</span>
          </Link>
          <Link role="menuitem" to="/patient/vitals-tracker" onClick={() => setIsOpen(false)}>
            <HeartPulse size={17} />
            <span>Vitals & Health Tracker</span>
          </Link>
          <Link role="menuitem" to="/patient/emergency-id" onClick={() => setIsOpen(false)}>
            <ShieldAlert size={17} />
            <span>Emergency Medical ID</span>
          </Link>
          <Link role="menuitem" to="/patient/prescriptions" onClick={() => setIsOpen(false)}>
            <Pill size={17} />
            <span>Prescriptions & Routine</span>
          </Link>
          <Link role="menuitem" to="/patient/appointments" onClick={() => setIsOpen(false)}>
            <CircleUserRound size={17} />
            <span>My Appointments</span>
          </Link>
          <Link role="menuitem" to="/patient/health-records" onClick={() => setIsOpen(false)}>
            <Activity size={17} />
            <span>Clinical Records</span>
          </Link>
          <Link role="menuitem" to="/patient/doctors" onClick={() => setIsOpen(false)}>
            <UserRound size={17} />
            <span>Doctor Directory</span>
          </Link>
          <Link role="menuitem" to="/patient/profile" onClick={() => setIsOpen(false)}>
            <CircleUserRound size={17} />
            <span>My Profile</span>
          </Link>
          <button type="button" role="menuitem" onClick={handleSignOut}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientAvatarMenu;
