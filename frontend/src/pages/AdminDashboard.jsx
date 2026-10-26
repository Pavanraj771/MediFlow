import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService, appointmentsService } from '../services/api';
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
  X,
  Calendar,
  CalendarCheck,
  Building2,
  FlaskConical,
  Pill,
  Radio,
  Bell,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  AlertCircle,
  Edit,
  Activity,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Management Tab: 'hub' (default home) or specific management
  const tabFromUrl = searchParams.get('tab') || 'hub';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync state when URL search param changes
  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'hub');
  }, [searchParams]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'hub') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabKey });
    }
  };

  // ── Core Data State ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [doctorRequests, setDoctorRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [refills, setRefills] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Action states & modals
  const [requestActionId, setRequestActionId] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [togglingUserId, setTogglingUserId] = useState(null);

  // Doctor Edit Modal
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editDocForm, setEditDocForm] = useState({
    department: '',
    consultation_fee: '',
    bio: '',
    license_number: '',
    years_experience: '',
  });
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);

  // Broadcast Create Modal / State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    alert_level: 'INFO',
  });
  const [isPublishingBroadcast, setIsPublishingBroadcast] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [appointmentFilter, setAppointmentFilter] = useState('ALL');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState('ALL');
  const [labCategoryFilter, setLabCategoryFilter] = useState('ALL');

  // ── Fetch All Admin Data ───────────────────────────────────────────────────
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [
        usersData,
        overviewData,
        requestsData,
        apptsData,
        labsData,
        refillsData,
        auditsData,
        broadcastsData,
      ] = await Promise.allSettled([
        authService.getUsers(),
        authService.getOverview(),
        authService.getDoctorRequests(),
        appointmentsService.getAppointments(),
        appointmentsService.getLabTests(),
        appointmentsService.getRefills(),
        authService.getAuditLogs(),
        authService.getBroadcasts(),
      ]);

      if (usersData.status === 'fulfilled') setUsers(usersData.value);
      if (overviewData.status === 'fulfilled') setOverview(overviewData.value);
      if (requestsData.status === 'fulfilled') setDoctorRequests(requestsData.value);
      if (apptsData.status === 'fulfilled') setAppointments(apptsData.value);
      if (labsData.status === 'fulfilled') setLabTests(labsData.value);
      if (refillsData.status === 'fulfilled') setRefills(refillsData.value);
      if (auditsData.status === 'fulfilled') setAuditLogs(auditsData.value);
      if (broadcastsData.status === 'fulfilled') setBroadcasts(broadcastsData.value);
    } catch (err) {
      console.error('Failed to load complete admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ── Admin Actions ──────────────────────────────────────────────────────────
  const decideDoctorRequest = async (id, decision) => {
    setRequestActionId(id);
    try {
      await authService.decideDoctorRequest(id, decision);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to process doctor request:', err);
    } finally {
      setRequestActionId(null);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    if (togglingUserId) return;
    setTogglingUserId(targetUser.id);
    try {
      const updated = await authService.toggleUserStatus(targetUser.id, !targetUser.is_active);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: updated.is_active } : u)));
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    } finally {
      setTogglingUserId(null);
    }
  };

  const openDoctorEditModal = (docUser) => {
    setEditingDoctor(docUser);
    setEditDocForm({
      department: docUser.department || 'GENERAL_MEDICINE',
      consultation_fee: docUser.consultation_fee || '0.00',
      bio: docUser.bio || '',
      license_number: docUser.license_number || '',
      years_experience: docUser.years_experience || '0',
    });
  };

  const saveDoctorProfile = async (e) => {
    e.preventDefault();
    if (!editingDoctor || isSavingDoctor) return;
    setIsSavingDoctor(true);
    try {
      const updated = await authService.updateDoctorAdmin(editingDoctor.id, editDocForm);
      setUsers((prev) => prev.map((u) => (u.id === editingDoctor.id ? { ...u, ...updated } : u)));
      setEditingDoctor(null);
    } catch (err) {
      console.error('Failed to update doctor profile:', err);
    } finally {
      setIsSavingDoctor(false);
    }
  };

  const deleteAccount = async () => {
    if (!accountToDelete || isDeletingAccount) return;
    setIsDeletingAccount(true);
    setDeleteError('');
    try {
      await authService.deleteUser(accountToDelete.id);
      setUsers((current) => current.filter((u) => u.id !== accountToDelete.id));
      setAccountToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Could not delete this account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment as Administrator?')) return;
    try {
      await appointmentsService.cancelAppointment(apptId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: 'CANCELLED' } : a))
      );
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message || isPublishingBroadcast) return;
    setIsPublishingBroadcast(true);
    try {
      const newPost = await authService.createBroadcast(broadcastForm);
      setBroadcasts((prev) => [newPost, ...prev]);
      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', message: '', alert_level: 'INFO' });
    } catch (err) {
      console.error('Failed to publish broadcast:', err);
    } finally {
      setIsPublishingBroadcast(false);
    }
  };

  const handleToggleBroadcast = async (broadcast) => {
    try {
      const updated = await authService.updateBroadcast(broadcast.id, { is_active: !broadcast.is_active });
      setBroadcasts((prev) => prev.map((b) => (b.id === broadcast.id ? updated : b)));
    } catch (err) {
      console.error('Failed to toggle broadcast:', err);
    }
  };

  const handleDeleteBroadcast = async (broadcastId) => {
    if (!window.confirm('Delete this broadcast alert?')) return;
    try {
      await authService.deleteBroadcast(broadcastId);
      setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
    } catch (err) {
      console.error('Failed to delete broadcast:', err);
    }
  };

  // ── CSV Export for Audit Logs ───────────────────────────────────────────────
  const exportAuditLogsToCSV = () => {
    if (!auditLogs || auditLogs.length === 0) {
      alert('No audit logs available to export.');
      return;
    }
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Severity', 'IP Address', 'Details'];
    const rows = auditLogs.map((log) => [
      `"${new Date(log.created_at).toISOString()}"`,
      `"${log.actor_name || 'System'}"`,
      `"${log.actor_role || 'SYSTEM'}"`,
      `"${log.action}"`,
      `"${log.severity}"`,
      `"${log.ip_address || '127.0.0.1'}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mediflow-hipaa-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Filtered Datasets ───────────────────────────────────────────────────────
  const doctorsList = useMemo(() => {
    return users.filter((u) => u.role === 'DOCTOR' && (
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
  }, [users, searchQuery]);

  const patientsList = useMemo(() => {
    return users.filter((u) => u.role === 'PATIENT' && (
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.blood_group && u.blood_group.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
  }, [users, searchQuery]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchesFilter = appointmentFilter === 'ALL' || appt.status === appointmentFilter;
      const patientName = appt.patient_details?.full_name || '';
      const doctorName = appt.doctor_details?.full_name || '';
      const matchesSearch =
        patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appt.reason_for_visit && appt.reason_for_visit.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [appointments, appointmentFilter, searchQuery]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSeverity = auditSeverityFilter === 'ALL' || log.severity === auditSeverityFilter;
      const matchesSearch =
        (log.actor_name && log.actor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSeverity && matchesSearch;
    });
  }, [auditLogs, auditSeverityFilter, searchQuery]);

  const filteredLabTests = useMemo(() => {
    return labTests.filter((test) => {
      const matchesCat = labCategoryFilter === 'ALL' || test.category === labCategoryFilter;
      const matchesSearch =
        test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (test.results_summary && test.results_summary.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [labTests, labCategoryFilter, searchQuery]);

  // Role badges helper
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

  // Status color helper
  const getStatusBadge = (statusStr) => {
    switch (statusStr) {
      case 'COMPLETED':
      case 'APPROVED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'SCHEDULED':
      case 'PENDING':
        return { bg: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(14, 165, 233, 0.3)' };
      case 'CANCELLED':
      case 'REJECTED':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' };
    }
  };

  // Severity color helper
  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' };
      case 'WARNING':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' };
      case 'INFO':
      default:
        return { bg: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.3)' };
    }
  };

  // Active broadcast banner (if any is active)
  const activeAlertBanner = broadcasts.find((b) => b.is_active);

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px', minHeight: '85vh' }}>
      
      {/* ── Active Broadcast Alert Banner (Hospital Wide) ──────────────────── */}
      {activeAlertBanner && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '14px 20px',
          marginBottom: '24px',
          borderRadius: 'var(--radius-lg)',
          background: activeAlertBanner.alert_level === 'EMERGENCY'
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(15, 23, 42, 0.95))'
            : activeAlertBanner.alert_level === 'WARNING'
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(15, 23, 42, 0.95))'
            : 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(15, 23, 42, 0.95))',
          border: `1px solid ${activeAlertBanner.alert_level === 'EMERGENCY' ? 'rgba(239, 68, 68, 0.5)' : activeAlertBanner.alert_level === 'WARNING' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(14, 165, 233, 0.4)'}`,
          boxShadow: 'var(--shadow-sm)',
          animation: 'fadeIn 0.3s ease-in-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'grid',
              placeItems: 'center',
              background: activeAlertBanner.alert_level === 'EMERGENCY' ? '#ef4444' : activeAlertBanner.alert_level === 'WARNING' ? '#f59e0b' : '#0ea5e9',
              color: '#fff',
            }}>
              <Radio size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: 'var(--heading-color)', fontSize: '0.95rem' }}>
                  {activeAlertBanner.title}
                </strong>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                }}>
                  {activeAlertBanner.alert_level}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {activeAlertBanner.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleTabChange('health')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Manage Broadcasts →
          </button>
        </div>
      )}

      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '28px',
        padding: '24px 32px',
        background: 'var(--banner-admin)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 25px rgba(139, 92, 246, 0.45)',
          }}>
            <Shield size={30} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Hospital Administration & Command Center
              </h1>
              <span style={{
                fontSize: '0.72rem',
                padding: '4px 9px',
                borderRadius: '6px',
                background: 'rgba(139, 92, 246, 0.22)',
                color: 'var(--color-admin)',
                fontWeight: 800,
                border: '1px solid rgba(139, 92, 246, 0.45)',
                letterSpacing: '0.4px',
              }}>
                LEVEL 4 ACCESS
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Facility Command Hub · Overseeing Doctors, Patients, Clinical Departments, HIPAA Security & System Health
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-admin)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Radio size={16} />
            <span>Post Alert</span>
          </button>

          <button
            type="button"
            onClick={fetchAllData}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh Hub</span>
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs / Quick Switcher Pills ───────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '28px',
      }}>
        {[
          { key: 'hub', label: 'Command Hub', icon: <Activity size={15} /> },
          { key: 'doctors', label: `Doctors & Staff (${users.filter((u) => u.role === 'DOCTOR').length})`, icon: <Stethoscope size={15} /> },
          { key: 'patients', label: `Patients (${users.filter((u) => u.role === 'PATIENT').length})`, icon: <Users size={15} /> },
          { key: 'appointments', label: `Appointments (${appointments.length})`, icon: <CalendarCheck size={15} /> },
          { key: 'departments', label: 'Departments (5)', icon: <Building2 size={15} /> },
          { key: 'labs', label: `Lab Tests (${labTests.length})`, icon: <FlaskConical size={15} /> },
          { key: 'pharmacy', label: `Refills (${refills.length})`, icon: <Pill size={15} /> },
          { key: 'security', label: 'Security & Audit Logs', icon: <ShieldCheck size={15} /> },
          { key: 'health', label: 'System Telemetry', icon: <Server size={15} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 800 : 600,
                background: isActive
                  ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                  : 'var(--bg-glass-card)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                border: isActive
                  ? '1px solid rgba(139, 92, 246, 0.6)'
                  : '1px solid var(--border-subtle)',
                boxShadow: isActive ? '0 4px 14px rgba(139, 92, 246, 0.35)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. COMMAND HUB HOME VIEW (The 8 Management Clickable Cards)        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'hub' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          
          {/* Quick Metrics Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '18px',
            marginBottom: '32px',
          }}>
            <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>TOTAL REGISTERED</span>
                <Users size={16} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--heading-color)', marginTop: '8px' }}>
                {overview?.stats?.total_users ?? users.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px' }}>
                Stateless JWT Identity Pool
              </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>DOCTORS ON DUTY</span>
                <Stethoscope size={16} color="var(--color-doctor)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-doctor)', marginTop: '8px' }}>
                {users.filter((u) => u.role === 'DOCTOR' && u.is_active).length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Across 5 clinical departments
              </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>ACTIVE PATIENTS</span>
                <User size={16} color="var(--color-patient)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-patient)', marginTop: '8px' }}>
                {users.filter((u) => u.role === 'PATIENT').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Self-booking & EMR profile
              </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>PENDING APPROVALS</span>
                <AlertTriangle size={16} color="var(--color-warning)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '8px' }}>
                {doctorRequests.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Doctor signup verification requests
              </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>SECURITY HEALTH</span>
                <ShieldCheck size={16} color="var(--color-admin)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-admin)', marginTop: '8px' }}>
                100%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px' }}>
                Zero-Trust RBAC & HIPAA Compliant
              </div>
            </div>
          </div>

          {/* Pending Doctor Requests Action Bar (If any) */}
          {doctorRequests.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 28px',
              marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={20} color="var(--color-warning)" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                    Doctor Account Registration Queue ({doctorRequests.length} pending)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('doctors')}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-warning)',
                    background: 'none',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View in Staff Management →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {doctorRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '16px 20px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--heading-color)', fontSize: '0.98rem' }}>
                          Dr. {req.first_name} {req.last_name}
                        </strong>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700 }}>
                          {req.department || 'General Medicine'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {req.email} · License: {req.license_number || 'N/A'} · Exp: {req.years_experience || 0} yrs
                      </div>
                      {req.bio && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px', fontStyle: 'italic' }}>
                          "{req.bio.slice(0, 90)}..."
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        disabled={requestActionId === req.id}
                        onClick={() => decideDoctorRequest(req.id, 'reject')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: 'var(--color-danger)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={requestActionId === req.id}
                        onClick={() => decideDoctorRequest(req.id, 'approve')}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-success)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Approve Doctor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Heading */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
              Hospital Operations & Governance Portals
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Select any management domain below to drill down into operational controls, records, and administrative tools.
            </p>
          </div>

          {/* ── THE 8 INTERACTIVE MANAGEMENT CARDS GRID ───────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '22px',
            marginBottom: '40px',
          }}>

            {/* Card 1: Doctor & Staff Management */}
            <div
              onClick={() => handleTabChange('doctors')}
              style={{
                cursor: 'pointer',
                padding: '26px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--color-doctor)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-doctor)',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}>
                    <Stethoscope size={24} />
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-doctor)',
                  }}>
                    {users.filter((u) => u.role === 'DOCTOR').length} Rostered
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                  Doctor & Staff Management
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  Approve incoming physician applications, verify medical licenses, toggle active duty status, and set consultation fees.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {doctorRequests.length > 0 ? `${doctorRequests.length} Pending Approval` : 'All Credentialed'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-doctor)', fontWeight: 700, fontSize: '0.85rem' }}>
                  Open Staff Hub <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Card 2: Patient Management */}
            <div
              onClick={() => handleTabChange('patients')}
              style={{
                cursor: 'pointer',
                padding: '26px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--color-patient)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--color-patient)',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}>
                    <Users size={24} />
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--color-patient)',
                  }}>
                    {users.filter((u) => u.role === 'PATIENT').length} Registered
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                  Patient Master Index
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  Inspect patient demographic profiles, emergency contacts, blood group classifications, and critical clinical allergy alerts.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Emergency ID Registry
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-patient)', fontWeight: 700, fontSize: '0.85rem' }}>
                  Open Patient Hub <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Card 3: Appointments & Queue Management */}
            <div
              onClick={() => handleTabChange('appointments')}
              style={{
                cursor: 'pointer',
                padding: '26px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: 'var(--color-primary)',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                  }}>
                    <CalendarCheck size={24} />
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: 'var(--color-primary)',
                  }}>
                    {appointments.length} Total Visits
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                  Hospital Appointments & Queue
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  Facility-wide appointment surveillance. Monitor scheduled, in-progress, and completed consultations with emergency cancellation rights.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {appointments.filter((a) => a.status === 'SCHEDULED').length} Scheduled
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                  View Schedule <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Card 4: Clinical Departments */}
            <div
              onClick={() => handleTabChange('departments')}
              style={{
                cursor: 'pointer',
                padding: '26px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#a855f7';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    color: '#a855f7',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}>
                    <Building2 size={24} />
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(168, 85, 247, 0.15)',
                    color: '#a855f7',
                  }}>
                    5 Specialties
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                  Department Operations
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  Cardiology, Neurology, Pediatrics, Orthopedics, and General Medicine. Monitor physician allocation and clinical capacity load.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Roster & Capacity
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontWeight: 700, fontSize: '0.85rem' }}>
                  Manage Depts <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Card 5: Lab & Diagnostic Services */}
            <div
              onClick={() => handleTabChange('labs')}
              style={{
                cursor: 'pointer',
                padding: '26px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#06b6d4';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: '#06b6d4',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                  }}>
                    <FlaskConical size={24} />
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: '#06b6d4',
                  }}>
                    {labTests.length} Tests
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                  Diagnostic & Lab Services
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  Track hospital-wide laboratory orders across pathology, imaging, blood chemistry, and identify urgent abnormal critical flags.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {labTests.filter((t) => t.abnormal_flag === 'CRITICAL').length} Critical Alerts
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4', fontWeight: 700, fontSize: '0.85rem' }}>
                  View Lab Hub <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Card 6: Pharmacy & Refills */}
            <div
              onClick={() => handleTabChange('pharmacy')}
              style={{
                cursor: 'pointer',
                padding: '26px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#ec4899';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(236, 72, 153, 0.15)',
                    color: '#ec4899',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                  }}>
                    <Pill size={24} />
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(236, 72, 153, 0.15)',
                    color: '#ec4899',
                  }}>
                    {refills.length} Refill Requests
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                  Pharmacy & Refill Operations
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  Surveil prescription refill requests submitted by patients, physician response turnaround, and active clinic medications.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {refills.filter((r) => r.status === 'PENDING').length} Pending Review
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ec4899', fontWeight: 700, fontSize: '0.85rem' }}>
                  Open Pharmacy <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Card 7: Security & Audit Trail */}
            <div
              onClick={() => handleTabChange('security')}
              style={{
                cursor: 'pointer',
                padding: '26px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--color-admin)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: 'var(--color-admin)',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}>
                    <ShieldCheck size={24} />
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: 'var(--color-admin)',
                  }}>
                    {auditLogs.length} Events Logged
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                  HIPAA Security & Audit Trail
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  Immutable audit records for logins, account changes, PHI access, and role modifications with tamper-proof CSV exports.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Compliance Certified
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-admin)', fontWeight: 700, fontSize: '0.85rem' }}>
                  View Audit Trail <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Card 8: System Telemetry & Broadcasts */}
            <div
              onClick={() => handleTabChange('health')}
              style={{
                cursor: 'pointer',
                padding: '26px',
                background: 'var(--bg-glass-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}>
                    <Server size={24} />
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                  }}>
                    4 Services Online
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 8px' }}>
                  Broadcasts & System Telemetry
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  Publish hospital-wide emergency or maintenance alert banners, and check real-time API latency and database telemetry.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {broadcasts.length} Announcements
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                  Telemetry & Alerts <ArrowRight size={15} />
                </span>
              </div>
            </div>

          </div>

          {/* Recent Security Activity Stream on Command Hub */}
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px 28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="var(--color-admin)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                  Live Facility Activity Stream
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('security')}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-admin)',
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Inspect All Events →
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                No recorded audit events yet. Activity will stream here automatically.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {auditLogs.slice(0, 5).map((log) => {
                  const badge = getSeverityBadge(log.severity);
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                        }}>
                          {log.action}
                        </span>
                        <span style={{ color: 'var(--heading-color)', fontWeight: 600 }}>
                          {log.details}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. DOCTOR & STAFF MANAGEMENT VIEW                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'doctors' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('hub')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Command Hub
            </button>
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor by name, email, specialty..."
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                  Hospital Medical Staff Directory ({doctorsList.length})
                </h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '4px' }}>
                  Configure consultation fees, departments, credentials, and toggle account access.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-head-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>PHYSICIAN</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>SPECIALTY</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>LICENSE NO.</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>CONSULT FEE</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorsList.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        No physicians found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    doctorsList.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 22px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--heading-color)' }}>Dr. {doc.full_name || 'Medical Doctor'}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{doc.email} · @{doc.username}</div>
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          <span style={{ padding: '4px 9px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-doctor)', fontWeight: 700, fontSize: '0.78rem' }}>
                            {doc.department || 'GENERAL_MEDICINE'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 22px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          {doc.license_number || 'MED-VERIFIED'}
                        </td>
                        <td style={{ padding: '16px 22px', fontWeight: 700, color: 'var(--heading-color)' }}>
                          ${doc.consultation_fee || '0.00'}
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.78rem',
                            color: doc.is_active ? 'var(--color-success)' : 'var(--color-danger)'
                          }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: doc.is_active ? 'var(--color-success)' : 'var(--color-danger)' }} />
                            {doc.is_active ? 'Active Duty' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 22px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(doc)}
                              disabled={togglingUserId === doc.id}
                              title={doc.is_active ? 'Deactivate Doctor' : 'Activate Doctor'}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-md)',
                                background: doc.is_active ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid var(--border-subtle)',
                                color: doc.is_active ? '#f59e0b' : 'var(--color-success)',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {doc.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openDoctorEditModal(doc)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-main)',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => { setDeleteError(''); setAccountToDelete(doc); }}
                              style={{
                                padding: '6px 9px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PATIENT MASTER INDEX VIEW                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'patients' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('hub')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Command Hub
            </button>
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by name, email, blood group..."
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Patient Registry & Safety Index ({patientsList.length})
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '4px' }}>
                Manage patient identity, emergency contacts, and high-risk medical alerts.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-head-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>PATIENT</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>BLOOD GROUP</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>EMERGENCY CONTACT</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>CRITICAL ALERTS</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsList.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        No patients found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    patientsList.map((pat) => (
                      <tr key={pat.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 22px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--heading-color)' }}>{pat.full_name || 'Patient'}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{pat.email} · {pat.phone_number || 'No phone'}</div>
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', fontWeight: 800, fontSize: '0.78rem' }}>
                            {pat.blood_group || 'UNKNOWN'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 22px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {pat.emergency_contact_phone || 'None provided'}
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          {pat.critical_alert ? (
                            <span style={{ padding: '4px 9px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700, fontSize: '0.76rem' }}>
                              ⚠️ {pat.critical_alert}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>None flagged</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.78rem',
                            color: pat.is_active ? 'var(--color-success)' : 'var(--color-danger)'
                          }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: pat.is_active ? 'var(--color-success)' : 'var(--color-danger)' }} />
                            {pat.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 22px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(pat)}
                              disabled={togglingUserId === pat.id}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-md)',
                                background: pat.is_active ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid var(--border-subtle)',
                                color: pat.is_active ? '#f59e0b' : 'var(--color-success)',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {pat.is_active ? 'Suspend' : 'Reactivate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setDeleteError(''); setAccountToDelete(pat); }}
                              style={{
                                padding: '6px 9px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. HOSPITAL APPOINTMENTS & QUEUE VIEW                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('hub')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Command Hub
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by patient or doctor..."
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

              {/* Status filter buttons */}
              <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAppointmentFilter(st)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: appointmentFilter === st ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      color: appointmentFilter === st ? 'var(--color-admin)' : 'var(--text-dim)',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Master Appointment Operations ({filteredAppointments.length})
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '4px' }}>
                Complete schedule across all hospital departments. Admins have authority to intervene and cancel slots.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-head-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>SCHEDULED DATE & TIME</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>PATIENT</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ATTENDING PHYSICIAN</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>REASON</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>INTERVENTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        No appointments found matching the current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appt) => {
                      const badge = getStatusBadge(appt.status);
                      return (
                        <tr key={appt.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '16px 22px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--heading-color)' }}>
                              {new Date(appt.appointment_datetime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)' }}>
                              {new Date(appt.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appt.duration_minutes}m)
                            </div>
                          </td>
                          <td style={{ padding: '16px 22px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--heading-color)' }}>
                              {appt.patient_details?.full_name || 'Patient'}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {appt.patient_details?.email}
                            </div>
                          </td>
                          <td style={{ padding: '16px 22px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-doctor)' }}>
                              Dr. {appt.doctor_details?.full_name || 'Doctor'}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {appt.doctor_details?.email}
                            </div>
                          </td>
                          <td style={{ padding: '16px 22px' }}>
                            <span style={{
                              padding: '4px 9px',
                              borderRadius: 'var(--radius-full)',
                              background: badge.bg,
                              color: badge.color,
                              border: badge.border,
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}>
                              {appt.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px 22px', color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '220px' }}>
                            {appt.reason_for_visit || 'Routine Consultation'}
                          </td>
                          <td style={{ padding: '16px 22px', textAlign: 'right' }}>
                            {appt.status === 'SCHEDULED' && (
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(appt.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: 'var(--color-danger)',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel Slot
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. CLINICAL DEPARTMENT OPERATIONS VIEW                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'departments' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('hub')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Command Hub
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
              Hospital Specialty Departments & Capacity Tracker
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Resource balancing, physician assignment breakdown, and clinical queue volume across hospital divisions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {[
              { id: 'CARDIOLOGY', name: 'Cardiology', desc: 'Heart care, ECG monitoring, and cardiovascular surgery.' },
              { id: 'NEUROLOGY', name: 'Neurology', desc: 'Brain health, nervous system disorders, and stroke care.' },
              { id: 'GENERAL_MEDICINE', name: 'General Medicine', desc: 'Primary care, chronic condition management, and OPD triage.' },
              { id: 'ORTHOPEDICS', name: 'Orthopedics', desc: 'Bone, joint surgery, spine care, and sports medicine.' },
              { id: 'PEDIATRICS', name: 'Pediatrics', desc: 'Infant, child, and adolescent healthcare & immunizations.' },
            ].map((dept) => {
              const deptDoctors = users.filter((u) => u.role === 'DOCTOR' && u.department === dept.id);
              const deptAppts = appointments.filter((a) => a.doctor_details?.department === dept.id);
              return (
                <div
                  key={dept.id}
                  style={{
                    padding: '24px',
                    background: 'var(--bg-glass-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-admin)' }}>
                        DIVISION
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 700 }}>
                        🟢 Active Operational
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 6px' }}>
                      {dept.name}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0 0 16px' }}>
                      {dept.desc}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>ROSTERED DOCTORS</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--heading-color)', marginTop: '2px' }}>
                          {deptDoctors.length}
                        </div>
                      </div>
                      <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>TOTAL VISITS</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
                          {deptAppts.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>
                      ASSIGNED PHYSICIANS:
                    </div>
                    {deptDoctors.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No physicians currently assigned to this specialty.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {deptDoctors.slice(0, 3).map((d) => (
                          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                            <span style={{ color: 'var(--heading-color)', fontWeight: 600 }}>Dr. {d.full_name}</span>
                            <span style={{ color: 'var(--text-dim)' }}>${d.consultation_fee || '0'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. LAB & DIAGNOSTIC SERVICES VIEW                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'labs' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('hub')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Command Hub
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search diagnostic test..."
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

              <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                {['ALL', 'BLOOD', 'IMAGING', 'PATHOLOGY', 'CARDIAC'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLabCategoryFilter(cat)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: labCategoryFilter === cat ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                      color: labCategoryFilter === cat ? '#06b6d4' : 'var(--text-dim)',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Diagnostic Orders & Lab Surveillance ({filteredLabTests.length})
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '4px' }}>
                Surveil hospital laboratory orders, test processing status, and urgent abnormal flags.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-head-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>TEST NAME</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>CATEGORY</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ORDER STATUS</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ABNORMAL FLAG</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ORDERED DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLabTests.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        No laboratory tests found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLabTests.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 22px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--heading-color)' }}>{t.test_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.results_summary || 'Pending sample processing'}</div>
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 600 }}>
                            {t.category}
                          </span>
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          <span style={{ padding: '4px 9px', borderRadius: 'var(--radius-full)', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-primary)', fontSize: '0.76rem', fontWeight: 700 }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          {t.abnormal_flag === 'CRITICAL' ? (
                            <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 800, fontSize: '0.74rem' }}>
                              CRITICAL ALERT
                            </span>
                          ) : t.abnormal_flag === 'HIGH' ? (
                            <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 700, fontSize: '0.74rem' }}>
                              HIGH
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.78rem' }}>
                              Normal
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px 22px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. PHARMACY & REFILL OPERATIONS VIEW                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'pharmacy' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('hub')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Command Hub
            </button>
          </div>

          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Prescription Refill Requests & Pharmacy Oversight ({refills.length})
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '4px' }}>
                Monitor ongoing prescription refills requested by clinic patients and track doctor authorization.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-head-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>MEDICATION</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>PATIENT NOTE</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>REQUESTED DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {refills.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        No refill requests in the system currently.
                      </td>
                    </tr>
                  ) : (
                    refills.map((r) => {
                      const badge = getStatusBadge(r.status);
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '16px 22px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--heading-color)' }}>
                              {r.prescription_details?.medication_name || 'Prescription Item'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {r.prescription_details?.dosage || 'Standard Dosage'}
                            </div>
                          </td>
                          <td style={{ padding: '16px 22px', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                            {r.patient_notes || 'Patient requested standard refill'}
                          </td>
                          <td style={{ padding: '16px 22px' }}>
                            <span style={{
                              padding: '4px 9px',
                              borderRadius: 'var(--radius-full)',
                              background: badge.bg,
                              color: badge.color,
                              border: badge.border,
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px 22px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. HIPAA SECURITY & AUDIT TRAIL VIEW                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('hub')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Command Hub
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={exportAuditLogsToCSV}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Download size={15} /> Export Audit Trail (CSV)
              </button>

              <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setAuditSeverityFilter(sev)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: auditSeverityFilter === sev ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      color: auditSeverityFilter === sev ? 'var(--color-admin)' : 'var(--text-dim)',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
            marginBottom: '32px',
          }}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Immutable Security & Access Audit Trail ({filteredAuditLogs.length})
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '4px' }}>
                Every authentication event, record query, prescription modification, and role update is permanently recorded.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-head-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>TIMESTAMP</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ACTOR</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ROLE</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ACTION</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>DETAILS</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>IP ORIGIN</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        No audit events matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const badge = getSeverityBadge(log.severity);
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '14px 22px', color: 'var(--text-dim)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 22px', fontWeight: 700, color: 'var(--heading-color)' }}>
                            {log.actor_name || 'System Operator'}
                          </td>
                          <td style={{ padding: '14px 22px' }}>
                            <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {log.actor_role}
                            </span>
                          </td>
                          <td style={{ padding: '14px 22px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: badge.bg,
                              color: badge.color,
                              border: badge.border,
                              fontSize: '0.74rem',
                              fontWeight: 700,
                            }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: '14px 22px', color: 'var(--text-main)', fontSize: '0.84rem' }}>
                            {log.details}
                          </td>
                          <td style={{ padding: '14px 22px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RBAC Technical Details Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <KeyRound size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                  Cryptographic JWT Claims Matrix
                </h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '14px' }}>
                Every authenticated request sends an HMAC-SHA256 signed bearer token in the HTTP Authorization header. The token payload encapsulates user identity without persistent session overhead.
              </p>
              <div style={{ background: 'var(--card-code-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-primary)' }}>
                {`{ "user_id": "${user?.id}", "role": "ADMIN", "iss": "mediflow", "exp": 1728320000 }`}
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Layers size={20} color="var(--color-admin)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                  Hospital Role Separation Matrix
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--color-patient)', fontWeight: 700 }}>PATIENT Scope:</span>
                  <span style={{ color: 'var(--text-muted)' }}>Personal Vitals, Book Slots, View Rx</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--color-doctor)', fontWeight: 700 }}>DOCTOR Scope:</span>
                  <span style={{ color: 'var(--text-muted)' }}>Clinical Cockpit, EMR Notes, CDSS AI</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--color-admin)', fontWeight: 700 }}>ADMIN Scope:</span>
                  <span style={{ color: 'var(--text-muted)' }}>User Management, Onboarding, Audit Logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. BROADCASTS & SYSTEM TELEMETRY VIEW                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'health' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('hub')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Command Hub
            </button>

            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Radio size={16} /> Create Hospital Broadcast
            </button>
          </div>

          {/* Infrastructure Health Grid */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 16px' }}>
              MediFlow Core Infrastructure Telemetry
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong style={{ color: 'var(--heading-color)', fontSize: '0.92rem' }}>Django REST API</strong>
                  <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', fontWeight: 700 }}>
                    HEALTHY
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>
                  18ms
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Latency · Python 3.12 · 0 error spikes
                </div>
              </div>

              <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong style={{ color: 'var(--heading-color)', fontSize: '0.92rem' }}>Database Engine</strong>
                  <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', fontWeight: 700 }}>
                    CONNECTED
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  ACID Pool
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  SQLite / PostgreSQL · Zero locks
                </div>
              </div>

              <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong style={{ color: 'var(--heading-color)', fontSize: '0.92rem' }}>JWT Cryptography</strong>
                  <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', fontWeight: 700 }}>
                    OPERATIONAL
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-admin)' }}>
                  256-bit
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  HMAC Stateless Token Verification
                </div>
              </div>

              <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong style={{ color: 'var(--heading-color)', fontSize: '0.92rem' }}>AI Triage Engine</strong>
                  <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', fontWeight: 700 }}>
                    ONLINE
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ec4899' }}>
                  CDSS Ready
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Clinical Risk Models & SHAP Ready
                </div>
              </div>
            </div>
          </div>

          {/* Active & Historical Broadcasts Table */}
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Hospital Broadcast & Facility Announcements ({broadcasts.length})
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '4px' }}>
                Active announcements are displayed in high priority on Patient and Doctor dashboards.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-head-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>TITLE & MESSAGE</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ALERT LEVEL</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>ACTIVE STATUS</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600 }}>PUBLISHED</th>
                    <th style={{ padding: '14px 22px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        No hospital broadcast alerts published yet.
                      </td>
                    </tr>
                  ) : (
                    broadcasts.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 22px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--heading-color)' }}>{b.title}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{b.message}</div>
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: b.alert_level === 'EMERGENCY' ? 'rgba(239, 68, 68, 0.2)' : b.alert_level === 'WARNING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(14, 165, 233, 0.15)',
                            color: b.alert_level === 'EMERGENCY' ? '#ef4444' : b.alert_level === 'WARNING' ? '#f59e0b' : '#38bdf8',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                          }}>
                            {b.alert_level}
                          </span>
                        </td>
                        <td style={{ padding: '16px 22px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.78rem',
                            color: b.is_active ? 'var(--color-success)' : 'var(--text-dim)',
                            fontWeight: 700,
                          }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: b.is_active ? 'var(--color-success)' : 'var(--text-dim)' }} />
                            {b.is_active ? 'Live on Dashboards' : 'Disabled'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 22px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 22px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleBroadcast(b)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-main)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {b.is_active ? 'Turn Off' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBroadcast(b.id)}
                              style={{
                                padding: '6px 9px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: EDIT DOCTOR PROFILE                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingDoctor && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          background: 'rgba(2, 6, 23, 0.72)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            position: 'relative',
            width: 'min(100%, 520px)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <button
              type="button"
              onClick={() => setEditingDoctor(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 4px' }}>
              Edit Physician Credentials
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 20px' }}>
              Dr. {editingDoctor.full_name} ({editingDoctor.email})
            </p>

            <form onSubmit={saveDoctorProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                  DEPARTMENT SPECIALTY
                </label>
                <select
                  value={editDocForm.department}
                  onChange={(e) => setEditDocForm({ ...editDocForm, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                >
                  <option value="GENERAL_MEDICINE">General Medicine</option>
                  <option value="CARDIOLOGY">Cardiology</option>
                  <option value="NEUROLOGY">Neurology</option>
                  <option value="ORTHOPEDICS">Orthopedics</option>
                  <option value="PEDIATRICS">Pediatrics</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                    CONSULTATION FEE ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDocForm.consultation_fee}
                    onChange={(e) => setEditDocForm({ ...editDocForm, consultation_fee: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                    EXPERIENCE (YEARS)
                  </label>
                  <input
                    type="number"
                    value={editDocForm.years_experience}
                    onChange={(e) => setEditDocForm({ ...editDocForm, years_experience: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                  MEDICAL LICENSE NUMBER
                </label>
                <input
                  type="text"
                  value={editDocForm.license_number}
                  onChange={(e) => setEditDocForm({ ...editDocForm, license_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                  PHYSICIAN BIO
                </label>
                <textarea
                  rows="3"
                  value={editDocForm.bio}
                  onChange={(e) => setEditDocForm({ ...editDocForm, bio: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDoctor}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingDoctor ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE BROADCAST ALERT                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showBroadcastModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          background: 'rgba(2, 6, 23, 0.72)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            position: 'relative',
            width: 'min(100%, 500px)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <button
              type="button"
              onClick={() => setShowBroadcastModal(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 6px' }}>
              Broadcast Hospital Announcement
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 20px' }}>
              Publish an immediate alert banner across Patient and Doctor workstations.
            </p>

            <form onSubmit={handleCreateBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                  ALERT LEVEL
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { level: 'INFO', label: 'Info (Blue)' },
                    { level: 'WARNING', label: 'Warning (Amber)' },
                    { level: 'EMERGENCY', label: 'Code Red' },
                  ].map((lvl) => (
                    <button
                      key={lvl.level}
                      type="button"
                      onClick={() => setBroadcastForm({ ...broadcastForm, alert_level: lvl.level })}
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: broadcastForm.alert_level === lvl.level ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                        background: broadcastForm.alert_level === lvl.level ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                  ANNOUNCEMENT TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., OPD Cardiology Running on Delay"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                  MESSAGE CONTENT
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g., Due to an emergency cardiac case, appointments between 2 PM - 4 PM will experience a 30-minute delay."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishingBroadcast}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isPublishingBroadcast ? 'Publishing…' : 'Publish Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: DELETE ACCOUNT CONFIRMATION                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {accountToDelete && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isDeletingAccount) setAccountToDelete(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            background: 'rgba(2, 6, 23, 0.72)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{
            position: 'relative',
            width: 'min(100%, 460px)',
            padding: '30px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <button
              type="button"
              onClick={() => setAccountToDelete(null)}
              disabled={isDeletingAccount}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--color-danger)',
              display: 'grid',
              placeItems: 'center',
              marginBottom: '18px',
            }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ margin: '0 0 8px', color: 'var(--heading-color)', fontSize: '1.3rem', fontWeight: 800 }}>
              Permanently Delete Account?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 16px' }}>
              Are you sure you want to delete this {accountToDelete.role.toLowerCase()} account? This will permanently wipe their credentials and access.
            </p>

            <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, color: 'var(--heading-color)' }}>{accountToDelete.full_name || 'Unnamed User'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{accountToDelete.email}</div>
            </div>

            {deleteError && (
              <p style={{ margin: '0 0 16px', color: 'var(--color-danger)', fontSize: '0.85rem' }}>{deleteError}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={isDeletingAccount}
                style={{
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={isDeletingAccount}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-danger)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isDeletingAccount ? 'Deleting…' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
