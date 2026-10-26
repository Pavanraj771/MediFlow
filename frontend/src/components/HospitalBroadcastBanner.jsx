import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Radio, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export const HospitalBroadcastBanner = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [broadcast, setBroadcast] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    const fetchBroadcast = async () => {
      try {
        const data = await authService.getBroadcasts();
        if (isMounted && Array.isArray(data)) {
          const active = data.find((b) => b.is_active);
          if (active) setBroadcast(active);
        }
      } catch (err) {
        // Silently skip if user is offline
      }
    };
    fetchBroadcast();
    return () => { isMounted = false; };
  }, [isAuthenticated, location.pathname]);

  // Don't render on public auth pages or if not authenticated
  if (!isAuthenticated || !broadcast || dismissed) return null;
  // If we are already on admin health tab, skip to avoid redundancy
  if (location.pathname === '/admin' && location.search.includes('tab=health')) return null;

  const isEmergency = broadcast.alert_level === 'EMERGENCY';
  const isWarning = broadcast.alert_level === 'WARNING';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        padding: '12px 20px',
        marginBottom: '20px',
        borderRadius: 'var(--radius-lg)',
        background: isEmergency
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(15, 23, 42, 0.95))'
          : isWarning
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.95))'
          : 'linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(15, 23, 42, 0.95))',
        border: `1px solid ${isEmergency ? 'rgba(239, 68, 68, 0.5)' : isWarning ? 'rgba(245, 158, 11, 0.45)' : 'rgba(14, 165, 233, 0.35)'}`,
        boxShadow: 'var(--shadow-sm)',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'grid',
          placeItems: 'center',
          background: isEmergency ? '#ef4444' : isWarning ? '#f59e0b' : '#0ea5e9',
          color: '#ffffff',
          flexShrink: 0,
        }}>
          <Radio size={16} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--heading-color)', fontSize: '0.9rem' }}>
              {broadcast.title}
            </strong>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0, 0, 0, 0.35)',
              color: '#ffffff',
              letterSpacing: '0.3px',
            }}>
              FACILITY NOTICE
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {broadcast.message}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Dismiss alert"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default HospitalBroadcastBanner;
