import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Sparkles,
  Calendar,
  CalendarX,
  Clock,
  Megaphone,
  CheckCheck,
  Check,
  X,
  ExternalLink,
  Info,
  Search,
  Filter
} from 'lucide-react';
import { appointmentsService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import DoctorReviewModal from './DoctorReviewModal';

export const PatientNotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalFilter, setModalFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'APPOINTMENTS' | 'BROADCASTS'
  const [modalSearch, setModalSearch] = useState('');
  const [reviewModalAppointment, setReviewModalAppointment] = useState(null);
  const dropdownRef = useRef(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getNotifications();
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
      const unread = list.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowAllModal(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await appointmentsService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await appointmentsService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleOpenReview = async (item) => {
    setIsOpen(false);
    setShowAllModal(false);
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    const aptId = item.related_id;
    if (aptId) {
      try {
        const apt = await appointmentsService.getAppointment(aptId);
        setReviewModalAppointment(apt);
      } catch {
        setReviewModalAppointment({ id: aptId });
      }
    } else {
      navigate('/patient/appointments');
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    setShowAllModal(false);
    if (
      item.notification_type === 'APPOINTMENT_SCHEDULED' ||
      item.notification_type === 'APPOINTMENT_CANCELLED' ||
      item.notification_type === 'APPOINTMENT_COMPLETED' ||
      item.notification_type === 'APPOINTMENT_REMINDER'
    ) {
      navigate('/patient/appointments');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'WELCOME':
        return {
          icon: <Sparkles size={16} />,
          bg: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)',
          color: isDark ? '#38bdf8' : '#0284c7',
        };
      case 'APPOINTMENT_SCHEDULED':
        return {
          icon: <Calendar size={16} />,
          bg: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.15)',
          color: isDark ? '#34d399' : '#059669',
        };
      case 'APPOINTMENT_CANCELLED':
        return {
          icon: <CalendarX size={16} />,
          bg: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(220, 38, 38, 0.15)',
          color: isDark ? '#f87171' : '#dc2626',
        };
      case 'APPOINTMENT_COMPLETED':
        return {
          icon: <Sparkles size={16} />,
          bg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.15)',
          color: isDark ? '#fbbf24' : '#d97706',
        };
      case 'APPOINTMENT_REMINDER':
        return {
          icon: <Clock size={16} />,
          bg: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(217, 119, 6, 0.15)',
          color: isDark ? '#fbbf24' : '#d97706',
        };
      case 'ADMIN_BROADCAST':
        return {
          icon: <Megaphone size={16} />,
          bg: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.15)',
          color: isDark ? '#c084fc' : '#7c3aed',
        };
      default:
        return {
          icon: <Info size={16} />,
          bg: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.15)',
          color: isDark ? '#94a3b8' : '#475569',
        };
    }
  };

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Filtered notifications for the "View All Notifications" modal
  const modalFilteredNotifications = notifications.filter((item) => {
    if (modalFilter === 'UNREAD' && item.is_read) return false;
    if (
      modalFilter === 'APPOINTMENTS' &&
      !['APPOINTMENT_SCHEDULED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_REMINDER'].includes(
        item.notification_type
      )
    )
      return false;
    if (modalFilter === 'BROADCASTS' && item.notification_type !== 'ADMIN_BROADCAST') return false;

    if (modalSearch) {
      const query = modalSearch.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(query);
      const matchMsg = item.message?.toLowerCase().includes(query);
      return matchTitle || matchMsg;
    }
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        aria-label="View notifications"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md, 10px)',
          background: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f8fafc',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
          color: isDark ? '#f1f5f9' : '#1e293b',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isDark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '999px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.7)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '520px',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderRadius: '16px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
            boxShadow: isDark
              ? '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.2)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            zIndex: 100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(2, 132, 199, 0.1)',
                    color: isDark ? '#38bdf8' : '#0284c7',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                }}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              maxHeight: '360px',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                <Bell size={32} style={{ opacity: 0.35, margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>No notifications yet</p>
                <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>We'll notify you of appointments & updates here</span>
              </div>
            ) : (
              notifications.slice(0, 10).map((item) => {
                const style = getNotificationIcon(item.notification_type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9',
                      background: item.is_read
                        ? 'transparent'
                        : isDark
                        ? 'rgba(14, 165, 233, 0.08)'
                        : 'rgba(2, 132, 199, 0.04)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = item.is_read
                        ? 'transparent'
                        : isDark
                        ? 'rgba(14, 165, 233, 0.08)'
                        : 'rgba(2, 132, 199, 0.04)';
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: style.bg,
                        color: style.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <strong
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: item.is_read ? 600 : 700,
                            color: isDark ? '#f1f5f9' : '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: isDark ? '#94a3b8' : '#64748b',
                            flexShrink: 0,
                          }}
                        >
                          {formatTimestamp(item.created_at)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: '3px 0 0',
                          fontSize: '0.78rem',
                          color: isDark ? '#cbd5e1' : '#475569',
                          lineHeight: '1.35',
                        }}
                      >
                        {item.message}
                      </p>

                      {item.notification_type === 'APPOINTMENT_COMPLETED' && (
                        <div style={{ marginTop: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReview(item);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                            }}
                          >
                            <Sparkles size={13} fill="#ffffff" />
                            <span>Rate & Review Doctor</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!item.is_read && (
                      <button
                        type="button"
                        title="Mark as read"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          cursor: 'pointer',
                          color: isDark ? '#38bdf8' : '#0284c7',
                          marginTop: '2px',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#0ea5e9',
                          }}
                        />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: View All Notifications Button */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f1f5f9',
              background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowAllModal(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: isDark ? '#38bdf8' : '#0284c7',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              <span>View All Notifications</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Full "View All Notifications" Modal */}
      {showAllModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAllModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '85vh',
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderRadius: '20px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
              boxShadow: isDark
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                >
                  All Notifications ({notifications.length})
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDark ? '#38bdf8' : '#0284c7',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div
              style={{
                padding: '14px 24px',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
              }}
            >
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'UNREAD', label: `Unread (${unreadCount})` },
                  { key: 'APPOINTMENTS', label: 'Appointments' },
                  { key: 'BROADCASTS', label: 'Announcements' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setModalFilter(f.key)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: modalFilter === f.key ? 700 : 500,
                      border:
                        modalFilter === f.key
                          ? '1px solid #0ea5e9'
                          : isDark
                          ? '1px solid rgba(255,255,255,0.1)'
                          : '1px solid #cbd5e1',
                      background:
                        modalFilter === f.key
                          ? 'rgba(14, 165, 233, 0.15)'
                          : isDark
                          ? 'rgba(30, 41, 59, 0.5)'
                          : '#f1f5f9',
                      color: modalFilter === f.key ? '#0ea5e9' : isDark ? '#cbd5e1' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  background: isDark ? '#1e293b' : '#f8fafc',
                  minWidth: '180px',
                }}
              >
                <Search size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.8rem',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            {/* Notifications Full List */}
            <div
              style={{
                padding: '16px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {modalFilteredNotifications.length === 0 ? (
                <div
                  style={{
                    padding: '50px 20px',
                    textAlign: 'center',
                    color: isDark ? '#94a3b8' : '#64748b',
                  }}
                >
                  <Bell size={36} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>No notifications found</p>
                  <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>
                    {modalSearch ? 'Try a different search term or filter' : 'No notifications match this category.'}
                  </span>
                </div>
              ) : (
                modalFilteredNotifications.map((item) => {
                  const style = getNotificationIcon(item.notification_type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        border: item.is_read
                          ? isDark
                            ? '1px solid rgba(255, 255, 255, 0.08)'
                            : '1px solid #e2e8f0'
                          : '1px solid rgba(14, 165, 233, 0.4)',
                        background: item.is_read
                          ? isDark
                            ? 'rgba(30, 41, 59, 0.35)'
                            : '#f8fafc'
                          : isDark
                          ? 'rgba(14, 165, 233, 0.12)'
                          : 'rgba(2, 132, 199, 0.06)',
                        transition: 'transform 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0ea5e9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = item.is_read
                          ? isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '1px solid #e2e8f0'
                          : 'rgba(14, 165, 233, 0.4)';
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: style.bg,
                          color: style.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {style.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          <strong
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: item.is_read ? 600 : 700,
                              color: isDark ? '#f8fafc' : '#0f172a',
                            }}
                          >
                            {item.title}
                          </strong>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: isDark ? '#94a3b8' : '#64748b',
                              flexShrink: 0,
                            }}
                          >
                            {formatTimestamp(item.created_at)}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.84rem',
                            color: isDark ? '#cbd5e1' : '#334155',
                            lineHeight: '1.45',
                          }}
                        >
                          {item.message}
                        </p>

                        {item.notification_type === 'APPOINTMENT_COMPLETED' && (
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReview(item);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                              }}
                            >
                              <Sparkles size={14} fill="#ffffff" />
                              <span>Rate & Review Doctor</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!item.is_read && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '6px',
                              cursor: 'pointer',
                              color: isDark ? '#38bdf8' : '#0284c7',
                            }}
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {reviewModalAppointment && (
        <DoctorReviewModal
          appointment={reviewModalAppointment}
          existingReview={reviewModalAppointment.review}
          onClose={() => setReviewModalAppointment(null)}
          onSuccess={() => {
            setReviewModalAppointment(null);
            fetchNotifications();
          }}
        />
      )}
    </div>
  );
};

export default PatientNotificationBell;
