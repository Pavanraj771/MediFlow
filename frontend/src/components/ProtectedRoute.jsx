import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    const targetPath =
      user?.role === 'ADMIN' ? '/admin' :
      user?.role === 'DOCTOR' ? '/doctor' : '/patient';
    return <Navigate to={targetPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
