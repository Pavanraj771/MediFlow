import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MessageSquare, Send, ShieldAlert, ArrowLeft, Stethoscope,
  Check, CheckCheck, Clock, User, Sparkles, RefreshCw, AlertCircle,
  Search, Calendar, CalendarDays, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsService } from '../services/api';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import '../styles/PatientPortal.css';

const quickPrompts = [
  'Clarification on my prescription dosage',
  'Experiencing mild symptoms after medication',
  'When should I expect my lab test results?',
  'Feeling much better, thank you doctor!',
  'Can I resume normal physical exercise?',
  'Need advice on diet restrictions',
];

const PatientMessages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const doctorIdParam = searchParams.get('doctorId');
  const appointmentIdParam = searchParams.get('appointmentId');

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Load conversations & doctors list
  const loadConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const convList = await appointmentsService.getConversations();

      // Also get doctors from appointments so patient can start a chat with their doctor
      let appts = [];
      try {
        appts = await appointmentsService.getAppointments();
      } catch {
        appts = [];
      }

      // Also get registered doctors list if needed
      let allDocs = [];
      try {
        allDocs = await appointmentsService.getDoctors();
      } catch {
        allDocs = [];
      }

      const combinedMap = new Map();

      // 1. Existing conversations
      convList.forEach((c) => {
        combinedMap.set(String(c.user_id), { ...c });
      });

      // 2. Doctors from appointments
      appts.forEach((apt) => {
        const doc = apt.doctor_details;
        if (doc) {
          const docId = String(doc.id);
          if (!combinedMap.has(docId)) {
            combinedMap.set(docId, {
              user_id: docId,
              full_name: doc.full_name,
              email: doc.email,
              role: 'DOCTOR',
              department: apt.doctor_profile?.department || 'Specialist',
              unread_count: 0,
              last_message: 'Start follow-up consultation chat',
              last_message_at: null,
              appointment_id: apt.id,
            });
          } else {
            // attach appointment_id if not present
            const existing = combinedMap.get(docId);
            if (!existing.appointment_id) {
              existing.appointment_id = apt.id;
            }
          }
        }
      });

      // 3. Doctors from directory
      allDocs.forEach((d) => {
        const docUser = d.user;
        if (docUser) {
          const docId = String(docUser.id);
          if (!combinedMap.has(docId)) {
            combinedMap.set(docId, {
              user_id: docId,
              full_name: docUser.full_name,
              email: docUser.email,
              role: 'DOCTOR',
              department: d.department || 'Physician',
              unread_count: 0,
              last_message: 'Start consultation follow-up',
              last_message_at: null,
              appointment_id: null,
            });
          }
        }
      });

      const combined = Array.from(combinedMap.values());
      // Sort: conversations with messages first, then by last message time
      combined.sort((a, b) => {
        if (a.last_message_at && b.last_message_at) {
          return new Date(b.last_message_at) - new Date(a.last_message_at);
        }
        if (a.last_message_at) return -1;
        if (b.last_message_at) return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setConversations(combined);

      // Select matching doctor from URL param if available
      if (doctorIdParam) {
        const found = combined.find((c) => String(c.user_id) === String(doctorIdParam));
        if (found) {
          if (appointmentIdParam) found.appointment_id = appointmentIdParam;
          setSelectedUser(found);
        } else {
          // If not in combined list yet, try to find in allDocs or fallback
          const docObj = allDocs.find((d) => String(d.user?.id) === String(doctorIdParam) || String(d.id) === String(doctorIdParam));
          const newDocEntry = {
            user_id: String(docObj?.user?.id || doctorIdParam),
            full_name: docObj?.user?.full_name || 'Doctor',
            email: docObj?.user?.email || '',
            role: 'DOCTOR',
            department: docObj?.department || 'Consultant',
            unread_count: 0,
            last_message: 'Start follow-up consultation chat',
            last_message_at: null,
            appointment_id: appointmentIdParam || null,
          };
          setConversations((prev) => [newDocEntry, ...prev.filter((p) => p.user_id !== newDocEntry.user_id)]);
          setSelectedUser(newDocEntry);
        }
      } else if (!selectedUser && combined.length > 0) {
        setSelectedUser(combined[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Unable to load conversations at this time.');
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [doctorIdParam, appointmentIdParam]);

  // Poll for messages when selectedUser is set
  const loadMessages = async (userId, silent = false) => {
    if (!userId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const msgs = await appointmentsService.getMessages({ user_id: userId });
      setMessages(msgs);
      // Mark unread messages as read
      try {
        await appointmentsService.markMessagesRead(userId);
      } catch {}
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.user_id) {
      loadMessages(selectedUser.user_id);
      const interval = setInterval(() => {
        loadMessages(selectedUser.user_id, true);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [selectedUser?.user_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedUser?.user_id || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await appointmentsService.sendMessage({
        recipient: selectedUser.user_id,
        content: content,
        appointment: selectedUser.appointment_id || null,
      });
      await loadMessages(selectedUser.user_id, true);
      loadConversations(true);
    } catch (err) {
      console.error('Send message failed:', err);
      alert('Failed to send message. Please verify your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!doctorSearch.trim()) return true;
    const q = doctorSearch.toLowerCase();
    return (
      conv.full_name?.toLowerCase().includes(q) ||
      conv.department?.toLowerCase().includes(q) ||
      conv.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="patient-portal-page">
      {/* Top bar navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/patient"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '12px',
              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.3)',
              display: 'grid', placeItems: 'center', color: '#0ea5e9',
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                Care Messages & Follow-Up
              </h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Secure direct messaging with your MediFlow doctors
              </p>
            </div>
          </div>
        </div>
        <PatientAvatarMenu />
      </div>

      {/* Emergency Alert Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 18px', borderRadius: '14px',
        background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)',
        color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem',
      }}>
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <span>
          <strong>Emergency Safety Disclaimer:</strong> This portal is for non-urgent post-consultation inquiries only.
          If you are experiencing chest pain, difficulty breathing, or severe sudden symptoms, please call <strong>112 / 911</strong> immediately or proceed to the nearest emergency room.
        </span>
      </div>

      {/* Chat workspace layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 350px) 1fr',
        gap: '20px',
        height: '660px',
      }}>
        {/* Left Column: Conversations List */}
        <div style={{
          background: 'var(--bg-glass-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Care Team ({conversations.length})
            </span>
            <button
              onClick={() => loadConversations()}
              title="Refresh conversations"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'grid', placeItems: 'center', padding: '4px',
                borderRadius: '6px',
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Search Care Team Input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: '10px',
            background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
            marginBottom: '12px',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search doctor or specialty..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-main)', fontSize: '0.82rem', width: '100%',
              }}
            />
            {doctorSearch && (
              <button
                type="button"
                onClick={() => setDoctorSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
            {loadingConversations ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Loading care team contacts...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <Stethoscope size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No doctors found</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
                  {doctorSearch ? 'Try a different search term.' : 'Browse the Doctor Directory to connect with physicians.'}
                </p>
                {!doctorSearch && (
                  <Link
                    to="/patient/doctors"
                    style={{
                      display: 'inline-block', marginTop: '12px',
                      padding: '6px 14px', borderRadius: '8px',
                      background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9',
                      fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none',
                    }}
                  >
                    View Doctor Directory
                  </Link>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedUser?.user_id === conv.user_id;
                return (
                  <div
                    key={conv.user_id}
                    onClick={() => setSelectedUser(conv)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(14, 165, 233, 0.12)'
                        : 'var(--surface-hover)',
                      border: isSelected
                        ? '1px solid rgba(14, 165, 233, 0.4)'
                        : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'grid', placeItems: 'center', color: '#fff',
                      fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                    }}>
                      Dr
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--heading-color)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          Dr. {conv.full_name}
                        </strong>
                        {conv.unread_count > 0 && (
                          <span style={{
                            background: '#0ea5e9', color: '#fff',
                            fontSize: '0.72rem', fontWeight: 800,
                            padding: '2px 7px', borderRadius: '20px',
                          }}>
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                        {conv.department ? conv.department.replace('_', ' ') : 'Physician'}
                      </p>
                      <p style={{
                        margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {conv.last_message || 'Start messaging...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div style={{
          background: 'var(--bg-glass-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--surface-hover)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800,
                  }}>
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      Dr. {selectedUser.full_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                        ● Active Care Channel
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        • {selectedUser.department ? selectedUser.department.replace('_', ' ') : 'Consultant'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedUser.appointment_id && (
                    <Link
                      to="/patient/appointments"
                      style={{
                        fontSize: '0.78rem', padding: '5px 11px', borderRadius: '8px',
                        background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9',
                        border: '1px solid rgba(14, 165, 233, 0.25)', textDecoration: 'none',
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                      title="View linked appointment"
                    >
                      <CalendarDays size={13} /> Linked Appointment
                    </Link>
                  )}
                  <span style={{
                    fontSize: '0.78rem', padding: '5px 11px', borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontWeight: 700,
                  }}>
                    Follow-up Open
                  </span>
                </div>
              </div>

              {/* Messages scroll area */}
              <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                    Loading message history...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', maxWidth: '400px', color: 'var(--text-muted)' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9',
                      display: 'grid', placeItems: 'center', margin: '0 auto 14px',
                    }}>
                      <Sparkles size={28} />
                    </div>
                    <h4 style={{ margin: '0 0 6px', color: 'var(--heading-color)', fontSize: '1.05rem' }}>
                      Start your consultation follow-up
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.5 }}>
                      Have questions regarding your recent consultation, medication guidelines, or lab tests? Send a note directly to Dr. {selectedUser.full_name}.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = String(m.sender) === String(user?.id);
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const showDateSeparator = !prevMsg || new Date(m.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

                    return (
                      <React.Fragment key={m.id || idx}>
                        {showDateSeparator && (
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '12px 0 6px',
                          }}>
                            <span style={{
                              padding: '3px 12px', borderRadius: '12px',
                              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
                              fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)',
                            }}>
                              {formatDateLabel(m.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '75%',
                              padding: '12px 16px',
                              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              background: isMe
                                ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                                : 'var(--surface-hover)',
                              color: isMe ? '#ffffff' : 'var(--text-main)',
                              border: isMe ? 'none' : '1px solid var(--border-subtle)',
                              boxShadow: isMe ? '0 4px 14px rgba(14, 165, 233, 0.25)' : 'none',
                              fontSize: '0.9rem',
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {!isMe && (
                              <p style={{
                                margin: '0 0 4px', fontSize: '0.74rem',
                                color: '#10b981', fontWeight: 800,
                              }}>
                                Dr. {selectedUser.full_name}
                              </p>
                            )}
                            <div>{m.content}</div>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)',
                          }}>
                            <span>{formatTime(m.created_at)}</span>
                            {isMe && (
                              m.is_read ? (
                                <CheckCheck size={14} color="#0ea5e9" title="Read by Doctor" />
                              ) : (
                                <Check size={14} title="Delivered" />
                              )
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div style={{
                padding: '8px 16px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                background: 'var(--surface-hover)',
              }}>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewMessage(prompt)}
                    style={{
                      background: 'var(--bg-glass-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    + {prompt}
                  </button>
                ))}
              </div>

              {/* Composer Input Bar */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: '14px 18px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  background: 'var(--bg-glass-card)',
                }}
              >
                <input
                  type="text"
                  placeholder={`Send message to Dr. ${selectedUser.full_name}... (Press Enter to send)`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-hover)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: newMessage.trim()
                      ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                      : 'var(--surface-hover)',
                    color: newMessage.trim() ? '#fff' : 'var(--text-muted)',
                    cursor: newMessage.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Send size={16} /> {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              <MessageSquare size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Select a clinician from your care team to begin messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientMessages;
