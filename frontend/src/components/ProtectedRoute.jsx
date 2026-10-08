import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(14, 165, 233, 0.2)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: '0.95rem' }}>Verifying Identity & RBAC Token...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{
        maxWidth: '560px',
        margin: '60px auto',
        padding: '32px',
        background: 'var(--bg-glass-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-danger)'
        }}>
          <ShieldAlert size={34} />
        </div>

        <h2 style={{ fontSize: '1.5rem', color: 'var(--heading-color)', marginBottom: '8px' }}>
          Access Restricted by RBAC Policy
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
          Your current role is <strong style={{ color: 'var(--heading-color)' }}>{user?.role}</strong> and does not have permission to open this area.
        </p>

        <div style={{
          padding: '14px',
          background: 'var(--card-code-bg)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          fontSize: '0.85rem',
          color: 'var(--text-dim)',
          textAlign: 'left',
          border: '1px solid var(--border-subtle)'
        }}>
          <div><strong>Required Role(s):</strong> {allowedRoles.join(', ')}</div>
          <div><strong>Authenticated Identity:</strong> {user?.email}</div>
          <div><strong>Claimed Scope:</strong> {user?.role}</div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link
            to={
              user?.role === 'ADMIN' ? '/admin' :
              user?.role === 'DOCTOR' ? '/doctor' : '/patient'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <ArrowLeft size={16} />
            Return to Authorized Portal
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
