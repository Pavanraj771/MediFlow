import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Send, ShieldAlert, ArrowLeft, Stethoscope,
  Check, CheckCheck, Clock, User, Sparkles, RefreshCw, AlertCircle
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
];

const PatientMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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
      const appts = await appointmentsService.getAppointments();
      const doctorsFromAppts = [];
      const seen = new Set(convList.map(c => c.user_id));

      appts.forEach(apt => {
        const doc = apt.doctor_details;
        if (doc && !seen.has(String(doc.id))) {
          seen.add(String(doc.id));
          doctorsFromAppts.push({
            user_id: String(doc.id),
            full_name: doc.full_name,
            email: doc.email,
            role: 'DOCTOR',
            department: apt.doctor_profile?.department || 'Specialist',
            unread_count: 0,
            last_message: 'Start follow-up consultation chat',
            last_message_at: null,
            appointment_id: apt.id,
          });
        }
      });

      const combined = [...convList, ...doctorsFromAppts];
      setConversations(combined);

      // Auto-select first conversation if none selected
      if (!selectedUser && combined.length > 0) {
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
  }, []);

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
      }, 4000);
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
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
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
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="patient-portal-page">
      {/* Top bar navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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
          If you are experiencing chest pain, difficulty breathing, or severe sudden symptoms, please call <strong>911</strong> immediately or proceed to the nearest emergency department.
        </span>
      </div>

      {/* Chat workspace layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
        gap: '20px',
        height: '620px',
      }}>
        {/* Left Column: Conversations */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Care Team ({conversations.length})
            </span>
            <button
              onClick={() => loadConversations()}
              title="Refresh conversations"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'grid', placeItems: 'center', padding: '4px',
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingConversations ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Loading care team contacts...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <Stethoscope size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No conversations yet</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
                  Doctors will appear here after your first consultation or booking.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
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
                        ? '1px solid rgba(14, 165, 233, 0.35)'
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
                        {conv.department || 'Physician'}
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
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800,
                  }}>
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--heading-color)' }}>
                      Dr. {selectedUser.full_name}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                      ● Active Care Channel • {selectedUser.department || 'Consultant'}
                    </span>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)',
                }}>
                  Follow-up Active
                </span>
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
                  <div style={{ textAlign: 'center', margin: 'auto', maxWidth: '380px', color: 'var(--text-muted)' }}>
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
                      Have questions regarding your recent appointment, medication guidelines, or lab tests? Send a note directly to Dr. {selectedUser.full_name}.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = String(m.sender) === String(user?.id);
                    return (
                      <div
                        key={m.id}
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
                            color: isMe ? '#fff' : 'var(--text-main)',
                            border: isMe ? 'none' : '1px solid var(--border-subtle)',
                            boxShadow: isMe ? '0 4px 14px rgba(14, 165, 233, 0.25)' : 'none',
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
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
                              <CheckCheck size={13} color="#0ea5e9" title="Read" />
                            ) : (
                              <Check size={13} title="Sent" />
                            )
                          )}
                        </div>
                      </div>
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
                background: 'rgba(0,0,0,0.02)',
              }}>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewMessage(prompt)}
                    style={{
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
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
                  placeholder={`Send message to Dr. ${selectedUser.full_name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
                  <Send size={16} /> Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              <MessageSquare size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Select a clinician to begin messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientMessages;
