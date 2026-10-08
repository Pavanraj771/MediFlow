import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';
import {
  Shield,
  Users,
  Stethoscope,
  User,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  KeyRound,
  ShieldCheck,
  Server,
  Lock,
  Layers,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [doctorRequests, setDoctorRequests] = useState([]);
  const [requestActionId, setRequestActionId] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, overviewData, requestsData] = await Promise.all([
        authService.getUsers(),
        authService.getOverview(),
        authService.getDoctorRequests(),
      ]);
      setUsers(usersData);
      setOverview(overviewData);
      setDoctorRequests(requestsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const decideDoctorRequest = async (id, decision) => {
    setRequestActionId(id);
    try {
      await authService.decideDoctorRequest(id, decision);
      await fetchData();
    } catch (err) {
      console.error('Failed to process doctor request:', err);
    } finally {
      setRequestActionId(null);
    }
  };

  const deleteAccount = async () => {
    if (!accountToDelete || isDeletingAccount) return;
    setIsDeletingAccount(true);
    setDeleteError('');
    try {
      await authService.deleteUser(accountToDelete.id);
      setUsers((currentUsers) => currentUsers.filter((account) => account.id !== accountToDelete.id));
      setOverview((currentOverview) => {
        if (!currentOverview?.stats) return currentOverview;
        const roleCount = accountToDelete.role === 'PATIENT' ? 'patients' : 'doctors';
        return {
          ...currentOverview,
          stats: {
            ...currentOverview.stats,
            total_users: Math.max(0, currentOverview.stats.total_users - 1),
            [roleCount]: Math.max(0, currentOverview.stats[roleCount] - 1),
          },
        };
      });
      setAccountToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Could not delete this account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          bg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.1)',
          color: isDark ? '#a78bfa' : '#7c3aed',
          border: isDark ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(124, 58, 237, 0.3)',
          label: 'ADMINISTRATOR',
        };
      case 'DOCTOR':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)',
          color: isDark ? '#34d399' : '#059669',
          border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(5, 150, 105, 0.3)',
          label: 'DOCTOR',
        };
      case 'PATIENT':
      default:
        return {
          bg: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(2, 132, 199, 0.1)',
          color: isDark ? '#38bdf8' : '#0284c7',
          border: isDark ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(2, 132, 199, 0.3)',
          label: 'PATIENT',
        };
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '32px',
        padding: '24px 32px',
        background: 'var(--banner-admin)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
          }}>
            <Shield size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Administration & Security Portal
              </h1>
              <span style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(139, 92, 246, 0.2)',
                color: 'var(--color-admin)',
                fontWeight: 700,
                border: '1px solid rgba(139, 92, 246, 0.4)'
              }}>
                IDENTITY & ACCESS
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Logged in as <strong style={{ color: 'var(--heading-color)' }}>{user?.full_name}</strong> • Global Identity & Role-Based Access Control
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px 24px',
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Total Identities
            </span>
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
            {overview?.stats?.total_users ?? users.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={13} />
            Stateless JWT Authenticated
          </div>
        </div>

        <div style={{
          padding: '20px 24px',
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Doctor Accounts
            </span>
            <Stethoscope size={18} color="var(--color-doctor)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-doctor)' }}>
            {overview?.stats?.doctors ?? users.filter(u => u.role === 'DOCTOR').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Clinical & EMR Authorized
          </div>
        </div>

        <div style={{
          padding: '20px 24px',
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Patient Accounts
            </span>
            <User size={18} color="var(--color-patient)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-patient)' }}>
            {overview?.stats?.patients ?? users.filter(u => u.role === 'PATIENT').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Self-Service Booking Scope
          </div>
        </div>

        <div style={{
          padding: '20px 24px',
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              RBAC Guard State
            </span>
            <ShieldCheck size={18} color="var(--color-admin)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-admin)' }}>
            Zero-Trust
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', marginTop: '6px' }}>
            All Routes Protected
          </div>
        </div>
      </div>

      {doctorRequests.length > 0 && (
        <section style={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--heading-color)', margin: '0 0 16px' }}>Pending doctor account requests ({doctorRequests.length})</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {doctorRequests.map((request) => (
              <div key={request.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <strong style={{ color: 'var(--heading-color)' }}>{request.first_name} {request.last_name}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{request.email} · @{request.username} · {request.phone_number || 'No phone'}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Requested {new Date(request.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={requestActionId === request.id} onClick={() => decideDoctorRequest(request.id, 'approve')} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-success)', color: '#fff', fontWeight: 700 }}>Approve</button>
                  <button disabled={requestActionId === request.id} onClick={() => decideDoctorRequest(request.id, 'reject')} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-danger)', color: '#fff', fontWeight: 700 }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Card: User Directory & RBAC Matrix */}
      <div style={{
        background: 'var(--bg-glass-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        marginBottom: '32px'
      }}>
        {/* Table Controls */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--heading-color)', margin: 0 }}>
              Hospital Identity Directory
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
              Inspect authenticated user entities, UUID identifiers, and granted RBAC scopes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user or email..."
                style={{
                  width: '100%',
                  padding: '8px 14px 8px 36px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Role Filter Buttons */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              {['ALL', 'DOCTOR', 'PATIENT'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: roleFilter === role ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)') : 'transparent',
                    color: roleFilter === role ? 'var(--heading-color)' : 'var(--text-dim)',
                    cursor: 'pointer',
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--table-head-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '14px 24px', color: 'var(--text-dim)', fontWeight: 600 }}>USER & IDENTITY</th>
                <th style={{ padding: '14px 24px', color: 'var(--text-dim)', fontWeight: 600 }}>ASSIGNED ROLE</th>
                <th style={{ padding: '14px 24px', color: 'var(--text-dim)', fontWeight: 600 }}>SYSTEM UUID</th>
                <th style={{ padding: '14px 24px', color: 'var(--text-dim)', fontWeight: 600 }}>CONTACT</th>
                <th style={{ padding: '14px 24px', color: 'var(--text-dim)', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '14px 24px', color: 'var(--text-dim)', fontWeight: 600 }}>JOINED</th>
                <th style={{ padding: '14px 24px', color: 'var(--text-dim)', fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No users matching the current search and role criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--heading-color)' }}>{u.full_name || 'Anonymous User'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>

                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          letterSpacing: '0.4px',
                          display: 'inline-block'
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '16px 24px' }}>
                        <code style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          background: 'var(--card-code-bg)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: 'var(--text-main)'
                        }}>
                          {u.id.substring(0, 18)}...
                        </code>
                      </td>

                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                        {u.phone_number || '—'}
                      </td>

                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          color: u.is_active ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: u.is_active ? 'var(--color-success)' : 'var(--color-danger)'
                          }} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td style={{ padding: '16px 24px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Seed'}
                      </td>
                      <td style={{ padding: '12px 24px' }}>
                        {u.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => { setDeleteError(''); setAccountToDelete(u); }}
                            aria-label={`Delete ${u.role.toLowerCase()} account for ${u.full_name || u.email}`}
                            title="Delete account"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 10px',
                              color: 'var(--color-danger)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.22)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {accountToDelete && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeletingAccount) setAccountToDelete(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            background: 'rgba(2, 6, 23, 0.68)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            style={{
              position: 'relative',
              width: 'min(100%, 460px)',
              padding: '30px',
              background: 'var(--bg-glass-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <button
              type="button"
              onClick={() => setAccountToDelete(null)}
              disabled={isDeletingAccount}
              aria-label="Close confirmation"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'grid',
                placeItems: 'center',
                width: '34px',
                height: '34px',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
              }}
            >
              <X size={17} />
            </button>

            <div style={{
              display: 'grid',
              placeItems: 'center',
              width: '52px',
              height: '52px',
              marginBottom: '18px',
              color: 'var(--color-danger)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
            }}>
              <AlertTriangle size={24} />
            </div>

            <h2 id="delete-account-title" style={{ margin: '0 0 10px', color: 'var(--heading-color)', fontSize: '1.3rem', fontWeight: 800 }}>
              Delete this account?
            </h2>
            <p id="delete-account-description" style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Are you sure you want to delete this {accountToDelete.role.toLowerCase()} account? This will permanently remove it from the database.
            </p>

            <div style={{
              marginBottom: '22px',
              padding: '13px 15px',
              color: 'var(--heading-color)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontWeight: 700 }}>{accountToDelete.full_name || 'Unnamed account'}</div>
              <div style={{ marginTop: '3px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>{accountToDelete.email}</div>
            </div>

            {deleteError && (
              <p role="alert" style={{ margin: '0 0 16px', color: 'var(--color-danger)', fontSize: '0.85rem' }}>{deleteError}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={isDeletingAccount}
                style={{
                  padding: '10px 16px',
                  color: 'var(--text-main)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={isDeletingAccount}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  color: '#fff',
                  background: 'var(--color-danger)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
                  opacity: isDeletingAccount ? 0.7 : 1,
                }}
              >
                <Trash2 size={15} />
                {isDeletingAccount ? 'Deleting…' : 'Yes, delete account'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* RBAC Architecture Technical Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        <div style={{
          padding: '28px',
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <KeyRound size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading-color)', margin: 0 }}>
              Cryptographic JWT Claims
            </h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '16px' }}>
            Every authenticated request sends an HMAC-SHA256 signed bearer token in the HTTP Authorization header. The token payload encapsulates user identity without persistent session overhead.
          </p>
          <div style={{
            background: 'var(--card-code-bg)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--color-primary)',
            border: '1px solid var(--border-subtle)'
          }}>
            {`{ "user_id": "...", "role": "${user?.role}", "email": "${user?.email}", "exp": 1728320000 }`}
          </div>
        </div>

        <div style={{
          padding: '28px',
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Layers size={20} color="var(--color-admin)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading-color)', margin: 0 }}>
              Hospital Role Separation Matrix
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--color-patient)', fontWeight: 600 }}>PATIENT Scope:</span>
              <span style={{ color: 'var(--text-muted)' }}>Personal Vitals, Book Slots, View Rx</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--color-doctor)', fontWeight: 600 }}>DOCTOR Scope:</span>
              <span style={{ color: 'var(--text-muted)' }}>Clinical Cockpit, EMR Notes, CDSS AI</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--color-admin)', fontWeight: 600 }}>ADMIN Scope:</span>
              <span style={{ color: 'var(--text-muted)' }}>User Management, Onboarding, Audit Logs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
