import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Radio, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';

export const HospitalBroadcastBanner = () => {
  const { isAuthenticated, user } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [broadcast, setBroadcast] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('mediflow_dismissed_broadcasts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Alert should NEVER appear in Admin portal or for Admin users
    if (!isAuthenticated || user?.role === 'ADMIN' || location.pathname.startsWith('/admin')) {
      return;
    }

    let isMounted = true;
    const fetchBroadcast = async () => {
      try {
        const data = await authService.getBroadcasts();
        if (isMounted && Array.isArray(data)) {
          const active = data.find((b) => b.is_active);
          setBroadcast(active || null);
        }
      } catch (err) {
        // Silently skip if user is offline or unauthorized
      }
    };

    fetchBroadcast();

    // Poll every 10 seconds for real-time delivery across Patient & Doctor portals
    const interval = setInterval(fetchBroadcast, 10000);
    const handleFocus = () => fetchBroadcast();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user?.role, location.pathname]);

  // NEVER render in Admin portal or for Admin users
  if (!isAuthenticated || user?.role === 'ADMIN' || location.pathname.startsWith('/admin')) {
    return null;
  }

  // Hide if no active broadcast or user dismissed this particular broadcast ID
  if (!broadcast || dismissedIds.includes(broadcast.id)) {
    return null;
  }

  const handleDismiss = () => {
    if (broadcast?.id) {
      const nextDismissed = [...dismissedIds, broadcast.id];
      setDismissedIds(nextDismissed);
      try {
        sessionStorage.setItem('mediflow_dismissed_broadcasts', JSON.stringify(nextDismissed));
      } catch {}
    }
  };

  const isEmergency = broadcast.alert_level === 'EMERGENCY';
  const isWarning = broadcast.alert_level === 'WARNING';

  // Theme-aware palette for high visual clarity in both light & dark mode
  const styleConfig = isDark
    ? {
        background: isEmergency
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : isWarning
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: isEmergency
          ? '1px solid rgba(239, 68, 68, 0.45)'
          : isWarning
          ? '1px solid rgba(245, 158, 11, 0.4)'
          : '1px solid rgba(14, 165, 233, 0.35)',
        iconBg: isEmergency ? '#ef4444' : isWarning ? '#f59e0b' : '#0ea5e9',
        iconColor: '#ffffff',
        titleColor: isEmergency ? '#fecaca' : isWarning ? '#fef3c7' : '#e0f2fe',
        badgeBg: isEmergency ? 'rgba(239, 68, 68, 0.25)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(14, 165, 233, 0.25)',
        badgeColor: isEmergency ? '#f87171' : isWarning ? '#fbbf24' : '#38bdf8',
        badgeBorder: isEmergency ? '1px solid rgba(239, 68, 68, 0.4)' : isWarning ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(14, 165, 233, 0.4)',
        messageColor: '#cbd5e1',
        closeColor: '#94a3b8',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
      }
    : {
        background: isEmergency
          ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
          : isWarning
          ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: isEmergency
          ? '1px solid #fca5a5'
          : isWarning
          ? '1px solid #fcd34d'
          : '1px solid #7dd3fc',
        iconBg: isEmergency ? '#dc2626' : isWarning ? '#d97706' : '#0284c7',
        iconColor: '#ffffff',
        titleColor: isEmergency ? '#991b1b' : isWarning ? '#92400e' : '#0369a1',
        badgeBg: isEmergency ? '#fee2e2' : isWarning ? '#fef3c7' : '#e0f2fe',
        badgeColor: isEmergency ? '#dc2626' : isWarning ? '#b45309' : '#0284c7',
        badgeBorder: isEmergency ? '1px solid #fca5a5' : isWarning ? '1px solid #fcd34d' : '1px solid #bae6fd',
        messageColor: '#334155',
        closeColor: '#64748b',
        boxShadow: isEmergency
          ? '0 4px 14px rgba(220, 38, 38, 0.12)'
          : isWarning
          ? '0 4px 14px rgba(217, 119, 6, 0.12)'
          : '0 4px 14px rgba(2, 132, 199, 0.12)',
      };

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
        background: styleConfig.background,
        border: styleConfig.border,
        boxShadow: styleConfig.boxShadow,
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          background: styleConfig.iconBg,
          color: styleConfig.iconColor,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}>
          {isEmergency ? <AlertTriangle size={18} /> : isWarning ? <AlertCircle size={18} /> : <Radio size={18} />}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <strong style={{ color: styleConfig.titleColor, fontSize: '0.92rem', fontWeight: 800 }}>
              {broadcast.title}
            </strong>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              background: styleConfig.badgeBg,
              color: styleConfig.badgeColor,
              border: styleConfig.badgeBorder,
              letterSpacing: '0.4px',
            }}>
              {broadcast.alert_level || 'NOTICE'}
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              color: isDark ? '#94a3b8' : '#64748b',
            }}>
              {broadcast.target_audience === 'ALL' ? 'Hospital-Wide Notice' : broadcast.target_audience === 'DOCTOR' ? 'Medical Staff Alert' : 'Patient Notice'}
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: styleConfig.messageColor, lineHeight: 1.45 }}>
            {broadcast.message}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: styleConfig.closeColor,
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '6px',
          transition: 'opacity 0.2s',
          flexShrink: 0,
        }}
        aria-label="Dismiss alert"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default HospitalBroadcastBanner;
