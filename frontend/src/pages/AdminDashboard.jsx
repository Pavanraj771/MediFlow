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
  ToggleRight,
  Star,
  FileText,
  HeartPulse,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Plus
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Management Tab: 'hub' (default home), 'patients', 'doctors', 'appointments', 'alerts', etc.
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

  // ── Drill-Down Detail Modals State ──────────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetailTab, setPatientDetailTab] = useState('INFO'); // 'INFO' | 'APPOINTMENTS' | 'REVIEWS'
  const [patientReviews, setPatientReviews] = useState([]);
  const [loadingPatientReviews, setLoadingPatientReviews] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorDetailTab, setDoctorDetailTab] = useState('INFO'); // 'INFO' | 'APPOINTMENTS' | 'REVIEWS'
  const [doctorReviews, setDoctorReviews] = useState([]);
  const [loadingDoctorReviews, setLoadingDoctorReviews] = useState(false);

  const [inspectingAppointment, setInspectingAppointment] = useState(null);

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
    target_audience: 'ALL',
  });
  const [isPublishingBroadcast, setIsPublishingBroadcast] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BLOCKED'
  const [doctorStatusFilter, setDoctorStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BLOCKED'
  const [doctorDeptFilter, setDoctorDeptFilter] = useState('ALL');
  const [appointmentFilter, setAppointmentFilter] = useState('ALL');
  const [appointmentSearch, setAppointmentSearch] = useState('');

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

  // Fetch reviews given by a patient when patient modal reviews tab is opened
  const loadPatientReviews = async (patientId) => {
    if (!patientId) return;
    setLoadingPatientReviews(true);
    try {
      const data = await appointmentsService.getPatientReviews(patientId);
      const list = Array.isArray(data) ? data : data.results || [];
      setPatientReviews(list);
    } catch (err) {
      console.error('Failed to load patient reviews:', err);
      setPatientReviews([]);
    } finally {
      setLoadingPatientReviews(false);
    }
  };

  // Fetch reviews received by a doctor when doctor modal reviews tab is opened
  const loadDoctorReviews = async (doctorId) => {
    if (!doctorId) return;
    setLoadingDoctorReviews(true);
    try {
      const data = await appointmentsService.getDoctorReviews(doctorId);
      const list = Array.isArray(data) ? data : data.results || [];
      setDoctorReviews(list);
    } catch (err) {
      console.error('Failed to load doctor reviews:', err);
      setDoctorReviews([]);
    } finally {
      setLoadingDoctorReviews(false);
    }
  };

  const handleOpenPatient = (p) => {
    setSelectedPatient(p);
    setPatientDetailTab('INFO');
    loadPatientReviews(p.id);
  };

  const handleOpenDoctor = (d) => {
    setSelectedDoctor(d);
    setDoctorDetailTab('INFO');
    loadDoctorReviews(d.id);
  };

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
      if (selectedPatient?.id === targetUser.id) {
        setSelectedPatient((prev) => ({ ...prev, is_active: updated.is_active }));
      }
      if (selectedDoctor?.id === targetUser.id) {
        setSelectedDoctor((prev) => ({ ...prev, is_active: updated.is_active }));
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      alert('Could not update user status. Please try again.');
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
      if (selectedDoctor?.id === editingDoctor.id) {
        setSelectedDoctor((prev) => ({ ...prev, ...updated }));
      }
      setEditingDoctor(null);
    } catch (err) {
      console.error('Failed to update doctor profile:', err);
      alert('Failed to update doctor profile.');
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
      if (selectedPatient?.id === accountToDelete.id) setSelectedPatient(null);
      if (selectedDoctor?.id === accountToDelete.id) setSelectedDoctor(null);
      setAccountToDelete(null);
      await fetchAllData();
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Could not delete this account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    const reason = prompt('Enter administrative cancellation reason:') || 'Cancelled by Hospital Administration';
    if (!reason.trim()) return;
    try {
      await appointmentsService.cancelAppointment(apptId, reason);
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: 'CANCELLED', cancellation_reason: reason, cancelled_by_role: 'ADMIN' } : a))
      );
      if (inspectingAppointment?.id === apptId) {
        setInspectingAppointment((prev) => ({
          ...prev,
          status: 'CANCELLED',
          cancellation_reason: reason,
          cancelled_by_role: 'ADMIN',
        }));
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Failed to cancel appointment.');
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
      setBroadcastForm({ title: '', message: '', alert_level: 'INFO', target_audience: 'ALL' });
      alert('Broadcast alert successfully posted and dispatched to designated users!');
    } catch (err) {
      console.error('Failed to publish broadcast:', err);
      alert('Failed to publish broadcast alert.');
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

  // ── Filtered Datasets ───────────────────────────────────────────────────────
  const doctorsList = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== 'DOCTOR') return false;
      const matchesSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        doctorStatusFilter === 'ALL' ||
        (doctorStatusFilter === 'ACTIVE' && u.is_active) ||
        (doctorStatusFilter === 'BLOCKED' && !u.is_active);
      const matchesDept = doctorDeptFilter === 'ALL' || u.department === doctorDeptFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [users, searchQuery, doctorStatusFilter, doctorDeptFilter]);

  const patientsList = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== 'PATIENT') return false;
      const matchesSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone_number && u.phone_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.blood_group && u.blood_group.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        patientStatusFilter === 'ALL' ||
        (patientStatusFilter === 'ACTIVE' && u.is_active) ||
        (patientStatusFilter === 'BLOCKED' && !u.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, patientStatusFilter]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchesStatus = appointmentFilter === 'ALL' || appt.status === appointmentFilter;
      const patientName = appt.patient_details?.full_name || '';
      const doctorName = appt.doctor_details?.full_name || '';
      const q = appointmentSearch.toLowerCase();
      const matchesSearch =
        !q ||
        patientName.toLowerCase().includes(q) ||
        doctorName.toLowerCase().includes(q) ||
        (appt.reason_for_visit && appt.reason_for_visit.toLowerCase().includes(q)) ||
        (appt.id && appt.id.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [appointments, appointmentFilter, appointmentSearch]);

  // Status badge helper
  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', label: 'Completed' };
      case 'SCHEDULED':
        return { bg: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.3)', label: 'Scheduled' };
      case 'CANCELLED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', label: 'Cancelled' };
      case 'NO_SHOW':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', label: 'No-Show' };
      default:
        return { bg: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', label: statusVal };
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px', minHeight: '85vh' }}>

      {/* ── Navigation Tabs & Quick Action Controls ───────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '28px',
      }}>
        {/* Navigation Tabs / Quick Switcher Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          flex: 1,
          minWidth: '280px',
        }}>
          {[
            { key: 'hub', label: 'Admin Home', icon: <Activity size={15} /> },
            { key: 'patients', label: `Patient Management (${users.filter((u) => u.role === 'PATIENT').length})`, icon: <Users size={15} /> },
            { key: 'doctors', label: `Doctor Management (${users.filter((u) => u.role === 'DOCTOR').length})`, icon: <Stethoscope size={15} /> },
            { key: 'appointments', label: `Appointment Management (${appointments.length})`, icon: <CalendarCheck size={15} /> },
            { key: 'alerts', label: `Broadcast Alerts (${broadcasts.length})`, icon: <Radio size={15} /> },
            { key: 'security', label: 'Security & Audit Logs', icon: <ShieldCheck size={15} /> },
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
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
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

        {/* Action Controls: Post Alert & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
              transition: 'transform 0.15s ease',
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
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-main)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. ADMIN HOME VIEW (Core 3 Management Pillars + Post Alert)       */}
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
                <span>REGISTERED PATIENTS</span>
                <User size={16} color="var(--color-patient)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-patient)', marginTop: '8px' }}>
                {users.filter((u) => u.role === 'PATIENT').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {users.filter((u) => u.role === 'PATIENT' && u.is_active).length} Active · {users.filter((u) => u.role === 'PATIENT' && !u.is_active).length} Blocked
              </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>ACTIVE DOCTORS</span>
                <Stethoscope size={16} color="var(--color-doctor)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-doctor)', marginTop: '8px' }}>
                {users.filter((u) => u.role === 'DOCTOR').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Across all specialized departments
              </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>TOTAL APPOINTMENTS</span>
                <CalendarCheck size={16} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '8px' }}>
                {appointments.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {appointments.filter((a) => a.status === 'SCHEDULED').length} Scheduled · {appointments.filter((a) => a.status === 'COMPLETED').length} Visited
              </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>POSTED ALERTS</span>
                <Radio size={16} color="var(--color-admin)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-admin)', marginTop: '8px' }}>
                {broadcasts.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {broadcasts.filter((b) => b.is_active).length} currently active on portals
              </div>
            </div>
          </div>

          {/* Pending Doctor Applications Alert Banner (If any) */}
          {doctorRequests.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.85))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 28px',
              marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={20} color="var(--color-warning)" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                    Doctor Registration Requests ({doctorRequests.length} pending review)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('doctors')}
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--color-warning)',
                    background: 'none',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Manage in Doctor Portal →
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

          {/* ── THE 3 CORE MANAGEMENT PILLARS + POST ALERT OPTION ─────────── */}
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
              Hospital Governance Portals
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Select any core management domain to inspect comprehensive records, appointments, ratings, reviews, and security actions.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}>

            {/* 1. PATIENT MANAGEMENT CARD */}
            <div
              onClick={() => handleTabChange('patients')}
              style={{
                cursor: 'pointer',
                padding: '28px',
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
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(14, 165, 233, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: 'var(--color-patient)',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                  }}>
                    <Users size={26} />
                  </div>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: 'var(--color-patient)',
                  }}>
                    {users.filter((u) => u.role === 'PATIENT').length} Patients
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 10px' }}>
                  Patient Management
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                  View all patient profiles, medical ID details, emergency contacts, all booked appointments, doctor ratings & reviews, with 1-click account blocking or deletion.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Full EMR, History & Feedback
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-patient)', fontWeight: 800, fontSize: '0.88rem' }}>
                  Manage Patients <ArrowRight size={16} />
                </span>
              </div>
            </div>

            {/* 2. DOCTOR MANAGEMENT CARD */}
            <div
              onClick={() => handleTabChange('doctors')}
              style={{
                cursor: 'pointer',
                padding: '28px',
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
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-doctor)',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}>
                    <Stethoscope size={26} />
                  </div>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-doctor)',
                  }}>
                    {users.filter((u) => u.role === 'DOCTOR').length} Doctors
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 10px' }}>
                  Doctor Management
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                  Review physician credentials, department assignments, consultation fees, complete appointment history, patient ratings & reviews, and account block/delete permissions.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {doctorRequests.length > 0 ? `${doctorRequests.length} Pending Approval` : 'Credentials Verified'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-doctor)', fontWeight: 800, fontSize: '0.88rem' }}>
                  Manage Doctors <ArrowRight size={16} />
                </span>
              </div>
            </div>

            {/* 3. APPOINTMENT MANAGEMENT CARD */}
            <div
              onClick={() => handleTabChange('appointments')}
              style={{
                cursor: 'pointer',
                padding: '28px',
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
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}>
                    <CalendarCheck size={26} />
                  </div>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                  }}>
                    {appointments.length} Consultations
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 10px' }}>
                  Appointment Management
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                  Hospital-wide appointment dispatch, clinical consultation summaries, vitals, prescriptions, cancellations, and doctor-patient review ratings.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Scheduled, Visited & Cancelled
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 800, fontSize: '0.88rem' }}>
                  Manage Appointments <ArrowRight size={16} />
                </span>
              </div>
            </div>

          </div>

          {/* ── POST ALERT QUICK ACTION & RECENT ALERTS SECTION ───────────── */}
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '26px 28px',
            marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-admin)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Radio size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                    Hospital Broadcast Alerts & Notices
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Publish facility announcements targeted to Patient Portal, Doctor Portal, or Both simultaneously.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
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
                  <Plus size={15} /> Post New Alert
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('alerts')}
                  style={{
                    padding: '9px 14px',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View All Alerts ({broadcasts.length})
                </button>
              </div>
            </div>

            {/* List of active/recent alerts */}
            {broadcasts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No broadcast notices currently posted. Click "Post New Alert" to create one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {broadcasts.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border-subtle)',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800,
                        background: b.alert_level === 'EMERGENCY' ? 'rgba(239, 68, 68, 0.2)' : b.alert_level === 'WARNING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                        color: b.alert_level === 'EMERGENCY' ? '#ef4444' : b.alert_level === 'WARNING' ? '#f59e0b' : '#0ea5e9',
                      }}>
                        {b.alert_level}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--heading-color)' }}>{b.title}</strong>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                            background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-admin)'
                          }}>
                            Audience: {b.target_audience === 'ALL' ? 'Both Portals' : b.target_audience === 'PATIENT' ? 'Patients Only' : 'Doctors Only'}
                          </span>
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{b.message}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleBroadcast(b)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                          background: b.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: b.is_active ? '#10b981' : 'var(--text-muted)',
                          border: 'none',
                        }}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBroadcast(b.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}
                        title="Delete Alert"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PATIENT MANAGEMENT VIEW                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'patients' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-patient)',
                display: 'grid', placeItems: 'center',
              }}>
                <Users size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                  Patient Management
                </h2>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Total {patientsList.length} patients registered · Click any patient to inspect appointments and reviews.
                </p>
              </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '10px',
                background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
              }}>
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search name, email, blood group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text-main)', fontSize: '0.85rem', width: '220px',
                  }}
                />
              </div>

              {['ALL', 'ACTIVE', 'BLOCKED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPatientStatusFilter(st)}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: patientStatusFilter === st ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-glass-card)',
                    color: patientStatusFilter === st ? 'var(--color-patient)' : 'var(--text-muted)',
                    border: patientStatusFilter === st ? '1px solid var(--color-patient)' : '1px solid var(--border-subtle)',
                  }}
                >
                  {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Blocked'}
                </button>
              ))}
            </div>
          </div>

          {/* Patients List Grid / Table */}
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}>
            {patientsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Users size={36} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontWeight: 700 }}>No patients match the search criteria.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    <th style={{ padding: '14px 20px' }}>Patient Name</th>
                    <th style={{ padding: '14px 16px' }}>Contact Info</th>
                    <th style={{ padding: '14px 16px' }}>Blood Group</th>
                    <th style={{ padding: '14px 16px' }}>Appointments</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsList.map((p) => {
                    const aptCount = appointments.filter((a) => a.patient === p.id).length;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleOpenPatient(p)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '12px',
                              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                              display: 'grid', placeItems: 'center', color: '#fff',
                              fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                            }}>
                              {p.full_name ? p.full_name[0].toUpperCase() : 'P'}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: 'var(--heading-color)' }}>
                                {p.full_name || 'Patient'}
                              </strong>
                              {p.critical_alert && (
                                <span style={{
                                  display: 'inline-block', marginLeft: '8px', fontSize: '0.7rem', padding: '1px 6px',
                                  borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 800,
                                }}>
                                  Alert
                                </span>
                              )}
                              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Member since {new Date(p.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{p.email}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {p.phone_number || 'No phone'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800,
                            background: p.blood_group ? 'rgba(239, 68, 68, 0.12)' : 'var(--surface-hover)',
                            color: p.blood_group ? '#ef4444' : 'var(--text-muted)',
                            border: p.blood_group ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                          }}>
                            {p.blood_group || 'Unknown'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                            background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8',
                          }}>
                            {aptCount} booked
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 800,
                            background: p.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: p.is_active ? '#10b981' : '#ef4444',
                            border: p.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          }}>
                            {p.is_active ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenPatient(p)}
                              style={{
                                padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.3)',
                              }}
                            >
                              View Info
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(p)}
                              disabled={togglingUserId === p.id}
                              style={{
                                padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                background: p.is_active ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                color: p.is_active ? '#f59e0b' : '#10b981',
                                border: p.is_active ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              {p.is_active ? 'Block' : 'Unblock'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccountToDelete(p)}
                              style={{
                                padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                              }}
                              title="Delete Patient Account"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. DOCTOR MANAGEMENT VIEW                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'doctors' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-doctor)',
                display: 'grid', placeItems: 'center',
              }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                  Doctor & Staff Management
                </h2>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Total {doctorsList.length} doctors rostered · Click any doctor to view credentials, visits & patient reviews.
                </p>
              </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '10px',
                background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
              }}>
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search doctor or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text-main)', fontSize: '0.85rem', width: '220px',
                  }}
                />
              </div>

              {['ALL', 'ACTIVE', 'BLOCKED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDoctorStatusFilter(st)}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: doctorStatusFilter === st ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-glass-card)',
                    color: doctorStatusFilter === st ? 'var(--color-doctor)' : 'var(--text-muted)',
                    border: doctorStatusFilter === st ? '1px solid var(--color-doctor)' : '1px solid var(--border-subtle)',
                  }}
                >
                  {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Blocked'}
                </button>
              ))}
            </div>
          </div>

          {/* Doctors List Grid / Table */}
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}>
            {doctorsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Stethoscope size={36} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontWeight: 700 }}>No doctors match the search criteria.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    <th style={{ padding: '14px 20px' }}>Doctor Name</th>
                    <th style={{ padding: '14px 16px' }}>Department</th>
                    <th style={{ padding: '14px 16px' }}>Consultation Fee</th>
                    <th style={{ padding: '14px 16px' }}>Experience</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorsList.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => handleOpenDoctor(d)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'grid', placeItems: 'center', color: '#fff',
                            fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                          }}>
                            Dr
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--heading-color)' }}>
                              Dr. {d.full_name || 'Physician'}
                            </strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {d.email} · {d.phone_number || 'No phone'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 800,
                          background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                        }}>
                          {d.department ? d.department.replace('_', ' ') : 'General Medicine'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                        ₹{d.consultation_fee || '0'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {d.years_experience ? `${d.years_experience} yrs` : 'N/A'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 800,
                          background: d.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: d.is_active ? '#10b981' : '#ef4444',
                          border: d.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        }}>
                          {d.is_active ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDoctor(d)}
                            style={{
                              padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                              background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.3)',
                            }}
                          >
                            View Info
                          </button>
                          <button
                            type="button"
                            onClick={() => openDoctorEditModal(d)}
                            style={{
                              padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                              background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)',
                            }}
                            title="Edit Doctor Profile"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(d)}
                            disabled={togglingUserId === d.id}
                            style={{
                              padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                              background: d.is_active ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: d.is_active ? '#f59e0b' : '#10b981',
                              border: d.is_active ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            {d.is_active ? 'Block' : 'Unblock'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccountToDelete(d)}
                            style={{
                              padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                            title="Delete Doctor Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. APPOINTMENT MANAGEMENT VIEW                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
                display: 'grid', placeItems: 'center',
              }}>
                <CalendarCheck size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                  Appointment Management
                </h2>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Total {filteredAppointments.length} appointments displayed · Click any row to view complete consultation notes & prescriptions.
                </p>
              </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '10px',
                background: 'var(--bg-glass-card)', border: '1px solid var(--border-subtle)',
              }}>
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, reason..."
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text-main)', fontSize: '0.85rem', width: '220px',
                  }}
                />
              </div>

              {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAppointmentFilter(st)}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: appointmentFilter === st ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-glass-card)',
                    color: appointmentFilter === st ? '#818cf8' : 'var(--text-muted)',
                    border: appointmentFilter === st ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments Table */}
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}>
            {filteredAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <CalendarCheck size={36} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontWeight: 700 }}>No appointments match the search or filter criteria.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    <th style={{ padding: '14px 20px' }}>Date & Time</th>
                    <th style={{ padding: '14px 16px' }}>Patient</th>
                    <th style={{ padding: '14px 16px' }}>Doctor & Department</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px' }}>Visit Reason</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => {
                    const sb = getStatusBadge(apt.status);
                    return (
                      <tr
                        key={apt.id}
                        onClick={() => setInspectingAppointment(apt)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={15} color="var(--color-primary)" />
                            <strong style={{ fontSize: '0.88rem', color: 'var(--heading-color)' }}>
                              {formatDateTime(apt.appointment_datetime)}
                            </strong>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '23px' }}>
                            Duration: {apt.duration_minutes || 30} mins
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--heading-color)' }}>
                            {apt.patient_details?.full_name || 'Patient'}
                          </strong>
                          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {apt.patient_details?.email}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--heading-color)' }}>
                            Dr. {apt.doctor_details?.full_name || 'Doctor'}
                          </strong>
                          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                            {apt.doctor_profile?.department ? apt.doctor_profile.department.replace('_', ' ') : 'General Medicine'}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800,
                            background: sb.bg, color: sb.color, border: sb.border,
                          }}>
                            {sb.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px', maxWidth: '220px' }}>
                          <div style={{
                            fontSize: '0.82rem', color: 'var(--text-main)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {apt.reason_for_visit || 'General medical follow-up'}
                          </div>
                          {apt.status === 'CANCELLED' && apt.cancellation_reason && (
                            <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '3px' }}>
                              Reason: {apt.cancellation_reason}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setInspectingAppointment(apt)}
                              style={{
                                padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)',
                              }}
                            >
                              View Details
                            </button>
                            {apt.status === 'SCHEDULED' && (
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(apt.id)}
                                style={{
                                  padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                  background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. BROADCAST ALERTS MANAGEMENT VIEW                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-admin)',
                display: 'grid', placeItems: 'center',
              }}>
                <Radio size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                  Hospital Broadcast Notices
                </h2>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Manage notifications and banners displayed to patients, doctors, or both.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Radio size={16} /> Post New Alert
            </button>
          </div>

          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}>
            {broadcasts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Radio size={36} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontWeight: 700 }}>No broadcast alerts have been posted yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {broadcasts.map((b, idx) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px 24px',
                      borderBottom: idx < broadcasts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: b.alert_level === 'EMERGENCY' ? '#ef4444' : b.alert_level === 'WARNING' ? '#f59e0b' : '#0ea5e9',
                        color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: '2px',
                      }}>
                        <Radio size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '1rem', color: 'var(--heading-color)' }}>{b.title}</strong>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800,
                            background: b.alert_level === 'EMERGENCY' ? 'rgba(239, 68, 68, 0.2)' : b.alert_level === 'WARNING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                            color: b.alert_level === 'EMERGENCY' ? '#ef4444' : b.alert_level === 'WARNING' ? '#f59e0b' : '#0ea5e9',
                          }}>
                            {b.alert_level}
                          </span>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                            background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-admin)',
                          }}>
                            Audience: {b.target_audience === 'ALL' ? 'Both Portals' : b.target_audience === 'PATIENT' ? 'Patients Only' : 'Doctors Only'}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                          {b.message}
                        </p>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                          Posted by {b.created_by_name || 'Administrator'} · {new Date(b.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleBroadcast(b)}
                        style={{
                          padding: '7px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                          background: b.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: b.is_active ? '#10b981' : 'var(--text-muted)',
                          border: 'none',
                        }}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBroadcast(b.id)}
                        style={{
                          padding: '7px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. SECURITY & AUDIT LOGS VIEW                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                Immutable Audit Logs & HIPAA Trail
              </h2>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Cryptographic security event log tracking all administrative, clinical and access actions.
              </p>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
              ● 100% HIPAA Compliance Verified
            </span>
          </div>

          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--surface-hover)',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                }}>
                  <th style={{ padding: '14px 20px' }}>Timestamp</th>
                  <th style={{ padding: '14px 16px' }}>Actor</th>
                  <th style={{ padding: '14px 16px' }}>Action</th>
                  <th style={{ padding: '14px 16px' }}>Details</th>
                  <th style={{ padding: '14px 16px' }}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', fontWeight: 600 }}>
                      {log.actor_name || 'System'}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        {log.actor_role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700 }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {log.details}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800,
                        background: log.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : log.severity === 'WARNING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(14, 165, 233, 0.15)',
                        color: log.severity === 'CRITICAL' ? '#ef4444' : log.severity === 'WARNING' ? '#f59e0b' : '#0ea5e9',
                      }}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: PATIENT DETAILS & DRILL-DOWN MODAL                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedPatient && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPatient(null); }}
        >
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-hover)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  display: 'grid', placeItems: 'center', color: '#fff',
                  fontWeight: 800, fontSize: '1.2rem',
                }}>
                  {selectedPatient.full_name ? selectedPatient.full_name[0].toUpperCase() : 'P'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      {selectedPatient.full_name}
                    </h3>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800,
                      background: selectedPatient.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: selectedPatient.is_active ? '#10b981' : '#ef4444',
                    }}>
                      {selectedPatient.is_active ? 'Active Patient' : 'Blocked'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {selectedPatient.email} · Registered on {new Date(selectedPatient.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleToggleUserStatus(selectedPatient)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: selectedPatient.is_active ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: selectedPatient.is_active ? '#f59e0b' : '#10b981',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {selectedPatient.is_active ? 'Block Account' : 'Unblock Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setAccountToDelete(selectedPatient)}
                  style={{
                    padding: '7px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Sub-navigation Tabs */}
            <div style={{
              display: 'flex',
              padding: '10px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              gap: '10px',
              background: 'var(--bg-glass-card)',
            }}>
              {[
                { id: 'INFO', label: 'Patient Profile & Medical ID', icon: <User size={14} /> },
                {
                  id: 'APPOINTMENTS',
                  label: `Appointments (${appointments.filter((a) => a.patient === selectedPatient.id).length})`,
                  icon: <CalendarCheck size={14} />
                },
                {
                  id: 'REVIEWS',
                  label: `Ratings & Reviews Given (${patientReviews.length})`,
                  icon: <Star size={14} />
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPatientDetailTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    background: patientDetailTab === tab.id ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                    color: patientDetailTab === tab.id ? 'var(--color-patient)' : 'var(--text-muted)',
                    border: patientDetailTab === tab.id ? '1px solid var(--color-patient)' : '1px solid transparent',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content Scroll Area */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

              {/* 1. Patient Profile Info Tab */}
              {patientDetailTab === 'INFO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Medical Alerts (if any) */}
                  {selectedPatient.critical_alert && (
                    <div style={{
                      padding: '12px 18px', borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <ShieldAlert size={18} />
                      <span><strong>Critical Health Alert:</strong> {selectedPatient.critical_alert}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Blood Group</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                        {selectedPatient.blood_group || 'Unknown'}
                      </div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Date of Birth</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--heading-color)', marginTop: '4px' }}>
                        {selectedPatient.date_of_birth || 'Not Specified'}
                      </div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Gender</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--heading-color)', marginTop: '4px' }}>
                        {selectedPatient.gender || 'Not Specified'}
                      </div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Organ Donor</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: selectedPatient.organ_donor ? '#10b981' : 'var(--text-muted)', marginTop: '4px' }}>
                        {selectedPatient.organ_donor ? 'Registered Donor' : 'Not Registered'}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div style={{ padding: '18px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      Contact & Residential Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                      <div><strong style={{ color: 'var(--text-dim)' }}>Phone:</strong> {selectedPatient.phone_number || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--text-dim)' }}>Email:</strong> {selectedPatient.email}</div>
                      <div><strong style={{ color: 'var(--text-dim)' }}>Address:</strong> {selectedPatient.address || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Medical Conditions & Allergies */}
                  <div style={{ padding: '18px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      Clinical History & Allergies
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Known Allergies:</span>
                        <p style={{ margin: 0, color: 'var(--text-main)' }}>{selectedPatient.allergies || 'No allergies recorded.'}</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Chronic Conditions:</span>
                        <p style={{ margin: 0, color: 'var(--text-main)' }}>{selectedPatient.chronic_conditions || 'None reported.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div style={{ padding: '18px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      Emergency Contact Passport
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                      <div><strong style={{ color: 'var(--text-dim)' }}>Name:</strong> {selectedPatient.emergency_contact_name || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--text-dim)' }}>Relation:</strong> {selectedPatient.emergency_contact_relation || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--text-dim)' }}>Phone:</strong> {selectedPatient.emergency_contact_phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Patient Appointments Tab */}
              {patientDetailTab === 'APPOINTMENTS' && (
                <div>
                  {appointments.filter((a) => a.patient === selectedPatient.id).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <CalendarCheck size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No appointments booked by this patient.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {appointments.filter((a) => a.patient === selectedPatient.id).map((apt) => {
                        const sb = getStatusBadge(apt.status);
                        return (
                          <div
                            key={apt.id}
                            onClick={() => setInspectingAppointment(apt)}
                            style={{
                              padding: '16px 20px', borderRadius: '14px',
                              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              transition: 'transform 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong style={{ fontSize: '0.92rem', color: 'var(--heading-color)' }}>
                                  Dr. {apt.doctor_details?.full_name || 'Doctor'}
                                </strong>
                                <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                                  • {apt.doctor_profile?.department ? apt.doctor_profile.department.replace('_', ' ') : 'General Medicine'}
                                </span>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
                                  background: sb.bg, color: sb.color, border: sb.border,
                                }}>
                                  {sb.label}
                                </span>
                              </div>
                              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {formatDateTime(apt.appointment_datetime)} · {apt.reason_for_visit || 'Routine Consultation'}
                              </p>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              Inspect Details <ChevronRight size={14} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Patient Reviews Tab */}
              {patientDetailTab === 'REVIEWS' && (
                <div>
                  {loadingPatientReviews ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                      Loading patient reviews...
                    </div>
                  ) : patientReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <Star size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>This patient has not submitted any doctor reviews yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {patientReviews.map((rev) => (
                        <div
                          key={rev.id}
                          style={{
                            padding: '16px 20px', borderRadius: '14px',
                            background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: 'var(--heading-color)' }}>
                                Reviewed: Dr. {rev.doctor_name || 'Physician'}
                              </strong>
                              {rev.doctor_department && (
                                <span style={{ fontSize: '0.76rem', color: '#10b981', marginLeft: '8px', fontWeight: 600 }}>
                                  ({rev.doctor_department.replace('_', ' ')})
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={15}
                                  fill={star <= rev.rating ? '#f59e0b' : 'transparent'}
                                  color={star <= rev.rating ? '#f59e0b' : 'var(--text-dim)'}
                                />
                              ))}
                              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f59e0b', marginLeft: '6px' }}>
                                {rev.rating}/5
                              </span>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
                            "{rev.comment || 'No written commentary provided.'}"
                          </p>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                            Submitted on {new Date(rev.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: DOCTOR DETAILS & DRILL-DOWN MODAL                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedDoctor && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDoctor(null); }}
        >
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-hover)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'grid', placeItems: 'center', color: '#fff',
                  fontWeight: 800, fontSize: '1.2rem',
                }}>
                  Dr
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      Dr. {selectedDoctor.full_name}
                    </h3>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800,
                      background: selectedDoctor.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: selectedDoctor.is_active ? '#10b981' : '#ef4444',
                    }}>
                      {selectedDoctor.is_active ? 'Active Doctor' : 'Blocked'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                    {selectedDoctor.department ? selectedDoctor.department.replace('_', ' ') : 'General Medicine'} · {selectedDoctor.email}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => openDoctorEditModal(selectedDoctor)}
                  style={{
                    padding: '7px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleUserStatus(selectedDoctor)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: selectedDoctor.is_active ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: selectedDoctor.is_active ? '#f59e0b' : '#10b981',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {selectedDoctor.is_active ? 'Block Account' : 'Unblock Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setAccountToDelete(selectedDoctor)}
                  style={{
                    padding: '7px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Sub-navigation Tabs */}
            <div style={{
              display: 'flex',
              padding: '10px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              gap: '10px',
              background: 'var(--bg-glass-card)',
            }}>
              {[
                { id: 'INFO', label: 'Doctor Profile & Credentials', icon: <Stethoscope size={14} /> },
                {
                  id: 'APPOINTMENTS',
                  label: `Appointments (${appointments.filter((a) => a.doctor === selectedDoctor.id).length})`,
                  icon: <CalendarCheck size={14} />
                },
                {
                  id: 'REVIEWS',
                  label: `Ratings & Reviews (${doctorReviews.length})`,
                  icon: <Star size={14} />
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDoctorDetailTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    background: doctorDetailTab === tab.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: doctorDetailTab === tab.id ? 'var(--color-doctor)' : 'var(--text-muted)',
                    border: doctorDetailTab === tab.id ? '1px solid var(--color-doctor)' : '1px solid transparent',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content Scroll Area */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

              {/* 1. Doctor Profile Info Tab */}
              {doctorDetailTab === 'INFO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Department</span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-doctor)', marginTop: '4px' }}>
                        {selectedDoctor.department ? selectedDoctor.department.replace('_', ' ') : 'General Medicine'}
                      </div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Consultation Fee</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--heading-color)', marginTop: '4px' }}>
                        ₹{selectedDoctor.consultation_fee || '0.00'}
                      </div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>License Number</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--heading-color)', marginTop: '4px' }}>
                        {selectedDoctor.license_number || 'Verified'}
                      </div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Experience</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--heading-color)', marginTop: '4px' }}>
                        {selectedDoctor.years_experience ? `${selectedDoctor.years_experience} Years` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div style={{ padding: '18px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      Physician Bio & Background
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                      {selectedDoctor.bio || 'No professional bio entered yet.'}
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div style={{ padding: '18px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      Contact & System Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                      <div><strong style={{ color: 'var(--text-dim)' }}>Email:</strong> {selectedDoctor.email}</div>
                      <div><strong style={{ color: 'var(--text-dim)' }}>Phone:</strong> {selectedDoctor.phone_number || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--text-dim)' }}>User ID:</strong> {selectedDoctor.id}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Doctor Appointments Tab */}
              {doctorDetailTab === 'APPOINTMENTS' && (
                <div>
                  {appointments.filter((a) => a.doctor === selectedDoctor.id).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <CalendarCheck size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No appointments scheduled with this doctor.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {appointments.filter((a) => a.doctor === selectedDoctor.id).map((apt) => {
                        const sb = getStatusBadge(apt.status);
                        return (
                          <div
                            key={apt.id}
                            onClick={() => setInspectingAppointment(apt)}
                            style={{
                              padding: '16px 20px', borderRadius: '14px',
                              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              transition: 'transform 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-doctor)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong style={{ fontSize: '0.92rem', color: 'var(--heading-color)' }}>
                                  Patient: {apt.patient_details?.full_name || 'Patient'}
                                </strong>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
                                  background: sb.bg, color: sb.color, border: sb.border,
                                }}>
                                  {sb.label}
                                </span>
                              </div>
                              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {formatDateTime(apt.appointment_datetime)} · {apt.reason_for_visit || 'Routine Consultation'}
                              </p>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-doctor)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              Inspect Details <ChevronRight size={14} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Doctor Reviews Tab */}
              {doctorDetailTab === 'REVIEWS' && (
                <div>
                  {loadingDoctorReviews ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                      Loading doctor reviews...
                    </div>
                  ) : doctorReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <Star size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No patient reviews have been received by this doctor yet.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Overall Average Rating Summary Card */}
                      <div style={{
                        padding: '16px 20px', borderRadius: '14px', marginBottom: '16px',
                        background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            PHYSICIAN REPUTATION
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                            {(doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length).toFixed(1)} / 5.0
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Reviews:</span>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                            {doctorReviews.length} Verified
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {doctorReviews.map((rev) => (
                          <div
                            key={rev.id}
                            style={{
                              padding: '16px 20px', borderRadius: '14px',
                              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <strong style={{ fontSize: '0.92rem', color: 'var(--heading-color)' }}>
                                {rev.patient_name || 'Verified Patient'}
                              </strong>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={15}
                                    fill={star <= rev.rating ? '#f59e0b' : 'transparent'}
                                    color={star <= rev.rating ? '#f59e0b' : 'var(--text-dim)'}
                                  />
                                ))}
                                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f59e0b', marginLeft: '6px' }}>
                                  {rev.rating}/5
                                </span>
                              </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
                              "{rev.comment || 'No written commentary provided.'}"
                            </p>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                              Reviewed on {new Date(rev.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: APPOINTMENT DETAILS & CLINICAL NOTES MODAL                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {inspectingAppointment && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)', zIndex: 10001,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setInspectingAppointment(null); }}
        >
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-hover)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                    Appointment Details
                  </h3>
                  {(() => {
                    const sb = getStatusBadge(inspectingAppointment.status);
                    return (
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800,
                        background: sb.bg, color: sb.color, border: sb.border,
                      }}>
                        {sb.label}
                      </span>
                    );
                  })()}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ID: {inspectingAppointment.id}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {inspectingAppointment.status === 'SCHEDULED' && (
                  <button
                    type="button"
                    onClick={() => handleCancelAppointment(inspectingAppointment.id)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    Cancel Appointment
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectingAppointment(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scroll Area */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

              {/* Patient & Doctor Two Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Patient Summary Box */}
                <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-patient)', fontWeight: 800, textTransform: 'uppercase' }}>
                    PATIENT INFORMATION
                  </span>
                  <h4 style={{ margin: '6px 0 2px', fontSize: '1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                    {inspectingAppointment.patient_details?.full_name || 'Patient'}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                    <div><strong>Email:</strong> {inspectingAppointment.patient_details?.email}</div>
                    <div><strong>Phone:</strong> {inspectingAppointment.patient_details?.phone_number || 'N/A'}</div>
                    <div><strong>Blood Group:</strong> {inspectingAppointment.patient_details?.blood_group || 'Unknown'}</div>
                  </div>
                </div>

                {/* Doctor Summary Box */}
                <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-doctor)', fontWeight: 800, textTransform: 'uppercase' }}>
                    ASSIGNED PHYSICIAN
                  </span>
                  <h4 style={{ margin: '6px 0 2px', fontSize: '1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                    Dr. {inspectingAppointment.doctor_details?.full_name || 'Doctor'}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                    <div><strong>Specialty:</strong> {inspectingAppointment.doctor_profile?.department ? inspectingAppointment.doctor_profile.department.replace('_', ' ') : 'General Medicine'}</div>
                    <div><strong>Email:</strong> {inspectingAppointment.doctor_details?.email}</div>
                    <div><strong>Fee:</strong> ₹{inspectingAppointment.doctor_profile?.consultation_fee || '0'}</div>
                  </div>
                </div>
              </div>

              {/* Timing & Reason */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.86rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 700, display: 'block' }}>Date & Scheduled Time:</span>
                    <strong>{formatDateTime(inspectingAppointment.appointment_datetime)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 700, display: 'block' }}>Duration:</span>
                    <strong>{inspectingAppointment.duration_minutes || 30} Minutes</strong>
                  </div>
                </div>
                <div style={{ marginTop: '14px', fontSize: '0.86rem' }}>
                  <span style={{ color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Chief Complaint / Reason for Visit:</span>
                  <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {inspectingAppointment.reason_for_visit || 'General medical follow-up.'}
                  </p>
                </div>
              </div>

              {/* Cancellation Reason (If Cancelled) */}
              {inspectingAppointment.status === 'CANCELLED' && (
                <div style={{
                  padding: '16px', borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                }}>
                  <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                    Cancellation Record:
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    {inspectingAppointment.cancellation_reason || 'No specific reason entered.'}
                  </p>
                  <span style={{ fontSize: '0.74rem', marginTop: '6px', display: 'block', opacity: 0.85 }}>
                    Cancelled by role: {inspectingAppointment.cancelled_by_role || 'ADMIN'}
                  </span>
                </div>
              )}

              {/* Clinical Consultation Notes (If Completed) */}
              {inspectingAppointment.consultation && (
                <div style={{ padding: '18px', borderRadius: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} /> Clinical Consultation Notes
                  </h4>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-dim)' }}>Clinical Diagnosis:</strong>{' '}
                      {inspectingAppointment.consultation.diagnosis || 'None entered.'}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-dim)' }}>Doctor Examination Notes:</strong>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {inspectingAppointment.consultation.notes || 'None entered.'}
                      </p>
                    </div>
                  </div>

                  {/* Vitals */}
                  {inspectingAppointment.consultation.vitals && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>
                        Recorded Vital Signs
                      </span>
                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.82rem' }}>
                        {inspectingAppointment.consultation.vitals.blood_pressure_systolic && (
                          <div>BP: <strong>{inspectingAppointment.consultation.vitals.blood_pressure_systolic}/{inspectingAppointment.consultation.vitals.blood_pressure_diastolic} mmHg</strong></div>
                        )}
                        {inspectingAppointment.consultation.vitals.pulse_rate && (
                          <div>Pulse: <strong>{inspectingAppointment.consultation.vitals.pulse_rate} bpm</strong></div>
                        )}
                        {inspectingAppointment.consultation.vitals.temperature && (
                          <div>Temp: <strong>{inspectingAppointment.consultation.vitals.temperature} °F</strong></div>
                        )}
                        {inspectingAppointment.consultation.vitals.oxygen_saturation && (
                          <div>SpO2: <strong>{inspectingAppointment.consultation.vitals.oxygen_saturation}%</strong></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {inspectingAppointment.consultation.prescriptions?.length > 0 && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>
                        Prescribed Medications ({inspectingAppointment.consultation.prescriptions.length})
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        {inspectingAppointment.consultation.prescriptions.map((rx, rIdx) => (
                          <div key={rIdx} style={{ fontSize: '0.82rem', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-glass-card)' }}>
                            <strong>{rx.medication_name}</strong> · {rx.dosage} · {rx.frequency} · {rx.duration} days
                            {rx.instructions && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{rx.instructions}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Review & Rating for this Appointment */}
              {inspectingAppointment.review && (
                <div style={{
                  padding: '16px', borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#f59e0b' }}>Patient Rating & Review</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= inspectingAppointment.review.rating ? '#f59e0b' : 'transparent'}
                          color={s <= inspectingAppointment.review.rating ? '#f59e0b' : 'var(--text-dim)'}
                        />
                      ))}
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', marginLeft: '4px' }}>
                        {inspectingAppointment.review.rating}/5
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                    "{inspectingAppointment.review.comment || 'No written comments.'}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: POST BROADCAST ALERT MODAL                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showBroadcastModal && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)', zIndex: 10002,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !isPublishingBroadcast) setShowBroadcastModal(false); }}
        >
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '560px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface-hover)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio size={20} color="var(--color-admin)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  Post Hospital Alert & Notice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                disabled={isPublishingBroadcast}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Alert Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Facility Maintenance Notice, Flu Camp, Emergency Code"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Target Audience (Decide which portal will display this alert) *
                </label>
                <select
                  value={broadcastForm.target_audience}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, target_audience: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none',
                  }}
                >
                  <option value="ALL">Both Portals (All Patients & All Doctors)</option>
                  <option value="PATIENT">Patient Portal Only</option>
                  <option value="DOCTOR">Doctor Portal Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Severity Level *
                </label>
                <select
                  value={broadcastForm.alert_level}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, alert_level: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none',
                  }}
                >
                  <option value="INFO">General Notice (Blue Banner)</option>
                  <option value="WARNING">Advisory Warning (Amber Banner)</option>
                  <option value="EMERGENCY">Code Emergency (Red Banner)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Announcement Message Content *
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed notice message that will be broadcasted to designated portals..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none', resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  disabled={isPublishingBroadcast}
                  style={{
                    padding: '9px 18px', borderRadius: '10px', background: 'var(--surface-hover)',
                    border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishingBroadcast || !broadcastForm.title.trim() || !broadcastForm.message.trim()}
                  style={{
                    padding: '9px 22px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  {isPublishingBroadcast ? 'Publishing...' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: DELETE ACCOUNT CONFIRMATION MODAL                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {accountToDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)', zIndex: 10003,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !isDeletingAccount) setAccountToDelete(null); }}
        >
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '460px',
            padding: '26px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
              display: 'grid', placeItems: 'center', marginBottom: '16px',
            }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)' }}>
              Confirm Permanent Account Deletion
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{accountToDelete.full_name}</strong> ({accountToDelete.email})?
              This will remove all associated profiles and cannot be undone.
            </p>

            {deleteError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.82rem', marginBottom: '16px' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={isDeletingAccount}
                style={{
                  padding: '9px 16px', borderRadius: '10px', background: 'var(--surface-hover)',
                  border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={isDeletingAccount}
                style={{
                  padding: '9px 20px', borderRadius: '10px', background: '#ef4444',
                  border: 'none', color: '#fff', fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer',
                }}
              >
                {isDeletingAccount ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 6: EDIT DOCTOR PROFILE MODAL                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingDoctor && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)', zIndex: 10004,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !isSavingDoctor) setEditingDoctor(null); }}
        >
          <div style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '540px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface-hover)',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                  Edit Doctor Profile
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Dr. {editingDoctor.full_name} ({editingDoctor.email})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoctor(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveDoctorProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Department / Specialty *
                </label>
                <select
                  value={editDocForm.department}
                  onChange={(e) => setEditDocForm({ ...editDocForm, department: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none',
                  }}
                >
                  <option value="GENERAL_MEDICINE">General Medicine</option>
                  <option value="CARDIOLOGY">Cardiology</option>
                  <option value="NEUROLOGY">Neurology</option>
                  <option value="ORTHOPEDICS">Orthopedics</option>
                  <option value="PEDIATRICS">Pediatrics</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDocForm.consultation_fee}
                    onChange={(e) => setEditDocForm({ ...editDocForm, consultation_fee: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Years Experience
                  </label>
                  <input
                    type="number"
                    value={editDocForm.years_experience}
                    onChange={(e) => setEditDocForm({ ...editDocForm, years_experience: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                      color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Medical License Number
                </label>
                <input
                  type="text"
                  value={editDocForm.license_number}
                  onChange={(e) => setEditDocForm({ ...editDocForm, license_number: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Doctor Bio
                </label>
                <textarea
                  rows={3}
                  value={editDocForm.bio}
                  onChange={(e) => setEditDocForm({ ...editDocForm, bio: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-hover)',
                    color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none', resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  disabled={isSavingDoctor}
                  style={{
                    padding: '9px 16px', borderRadius: '10px', background: 'var(--surface-hover)',
                    border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDoctor}
                  style={{
                    padding: '9px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', color: '#fff', fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  {isSavingDoctor ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
