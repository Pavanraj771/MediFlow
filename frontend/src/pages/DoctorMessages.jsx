import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MessageSquare, Send, ArrowLeft, User, Stethoscope,
  Check, CheckCheck, RefreshCw, FileText, Sparkles, ExternalLink,
  Search, Clock, ShieldCheck, HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsService } from '../services/api';
import DoctorAvatarMenu from '../components/DoctorAvatarMenu';
import '../styles/PatientPortal.css';

const quickReplies = [
  'Continue current dosage as prescribed for the full course.',
  'Please monitor your blood pressure for 2 more days and log it in your tracker.',
  'Your lab test results look stable and within normal limits.',
  'If symptoms persist beyond 48 hours, please schedule an in-clinic consultation.',
  'Your prescription refill has been approved and sent to the pharmacy.',
  'Please ensure adequate hydration and take your medicine after meals.',
];

const DoctorMessages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const convList = await appointmentsService.getConversations();

      // Also fetch patients seen by doctor
      let myPatients = [];
      try {
        myPatients = await appointmentsService.getMyPatients();
      } catch {
        myPatients = [];
      }

      const combinedMap = new Map();

      // 1. Existing conversations
      convList.forEach((c) => {
        combinedMap.set(String(c.user_id), { ...c });
      });

      // 2. Patients from doctor's patient list
      myPatients.forEach((p) => {
        const pId = String(p.id);
        if (!combinedMap.has(pId)) {
          combinedMap.set(pId, {
            user_id: pId,
            full_name: p.full_name,
            email: p.email,
            role: 'PATIENT',
            blood_group: p.blood_group || null,
            unread_count: 0,
            last_message: 'Start follow-up message thread',
            last_message_at: null,
          });
        }
      });

      const combined = Array.from(combinedMap.values());
      // Sort: active messages first, then recent
      combined.sort((a, b) => {
        if (a.last_message_at && b.last_message_at) {
          return new Date(b.last_message_at) - new Date(a.last_message_at);
        }
        if (a.last_message_at) return -1;
        if (b.last_message_at) return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setConversations(combined);

      // Select patient from query params if specified
      if (patientIdParam) {
        const found = combined.find((c) => String(c.user_id) === String(patientIdParam));
        if (found) {
          setSelectedUser(found);
        } else {
          // fetch patient detail
          try {
            const pDetail = await appointmentsService.getMyPatientDetail(patientIdParam);
            const pInfo = pDetail?.patient || {};
            const newPatientEntry = {
              user_id: String(pInfo.id || patientIdParam),
              full_name: pInfo.full_name || 'Patient',
              email: pInfo.email || '',
              role: 'PATIENT',
              unread_count: 0,
              last_message: 'Start follow-up consultation thread',
              last_message_at: null,
            };
            setConversations((prev) => [newPatientEntry, ...prev.filter((x) => x.user_id !== newPatientEntry.user_id)]);
            setSelectedUser(newPatientEntry);
          } catch {
            const fallbackEntry = {
              user_id: String(patientIdParam),
              full_name: 'Patient',
              email: '',
              role: 'PATIENT',
              unread_count: 0,
              last_message: 'Start follow-up consultation thread',
              last_message_at: null,
            };
            setConversations((prev) => [fallbackEntry, ...prev]);
            setSelectedUser(fallbackEntry);
          }
        }
      } else if (!selectedUser && combined.length > 0) {
        setSelectedUser(combined[0]);
      }
    } catch (err) {
      console.error('Failed to load doctor conversations:', err);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [patientIdParam]);

  const loadMessages = async (userId, silent = false) => {
    if (!userId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const msgs = await appointmentsService.getMessages({ user_id: userId });
      setMessages(msgs);
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
      console.error('Failed to send:', err);
      alert('Failed to send reply. Please try again.');
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

  const filteredConversations = conversations.filter((c) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="patient-portal-page">
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/doctor"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '12px',
              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Workstation
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'grid', placeItems: 'center', color: '#10b981',
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--heading-color)' }}>
                Patient Care Messages
              </h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Review and respond to patient post-consultation inquiries
              </p>
            </div>
          </div>
        </div>
        <DoctorAvatarMenu />
      </div>

      {/* Main layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 350px) 1fr',
        gap: '20px',
        height: '660px',
      }}>
        {/* Left: Patient List */}
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
              Patient Inbox ({conversations.length})
            </span>
            <button
              onClick={() => loadConversations()}
              title="Refresh"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px' }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Search Patients Input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: '10px',
            background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
            marginBottom: '12px',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search patient by name or email..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-main)', fontSize: '0.82rem', width: '100%',
              }}
            />
            {patientSearch && (
              <button
                type="button"
                onClick={() => setPatientSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
            {loadingConversations ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <User size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No patient inquiries found</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
                  {patientSearch ? 'Try a different search term.' : 'Patients can reach out to you after an appointment or consultation.'}
                </p>
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
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'var(--surface-hover)',
                      border: isSelected
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.25)',
                      display: 'grid', placeItems: 'center', color: '#0ea5e9',
                      fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                    }}>
                      <User size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--heading-color)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {conv.full_name}
                        </strong>
                        {conv.unread_count > 0 && (
                          <span style={{
                            background: '#10b981', color: '#fff',
                            fontSize: '0.72rem', fontWeight: 800,
                            padding: '2px 7px', borderRadius: '20px',
                          }}>
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {conv.last_message || 'Consultation follow-up'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Messages Thread */}
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
              {/* Header */}
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
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'rgba(14, 165, 233, 0.12)',
                    display: 'grid', placeItems: 'center', color: '#0ea5e9',
                  }}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      {selectedUser.full_name}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {selectedUser.email || 'MediFlow Patient'}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/doctor/patients/${selectedUser.user_id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none',
                  }}
                  title="Open patient medical records and past visits"
                >
                  <FileText size={14} /> View Patient Chart <ExternalLink size={12} />
                </Link>
              </div>

              {/* Messages */}
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
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                    <MessageSquare size={36} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No messages yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
                      Send clinical instructions or follow-up reassurance to {selectedUser.full_name}.
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
                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                : 'var(--surface-hover)',
                              color: isMe ? '#ffffff' : 'var(--text-main)',
                              border: isMe ? 'none' : '1px solid var(--border-subtle)',
                              boxShadow: isMe ? '0 4px 14px rgba(16, 185, 129, 0.25)' : 'none',
                              fontSize: '0.9rem',
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {!isMe && (
                              <p style={{
                                margin: '0 0 4px', fontSize: '0.74rem',
                                color: '#0ea5e9', fontWeight: 800,
                              }}>
                                {selectedUser.full_name}
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
                                <CheckCheck size={13} color="#10b981" title="Seen by patient" />
                              ) : (
                                <Check size={13} title="Sent" />
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

              {/* Quick Clinical Replies */}
              <div style={{
                padding: '8px 16px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                background: 'var(--surface-hover)',
              }}>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewMessage(reply)}
                    style={{
                      background: 'var(--bg-glass-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#10b981';
                      e.currentTarget.style.borderColor = '#10b981';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    + {reply}
                  </button>
                ))}
              </div>

              {/* Composer */}
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
                  placeholder={`Reply to ${selectedUser.full_name}... (Press Enter to send)`}
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
                      ? 'linear-gradient(135deg, #10b981, #059669)'
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
              <p style={{ margin: 0, fontWeight: 600 }}>Select a patient from your inbox to review conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorMessages;
