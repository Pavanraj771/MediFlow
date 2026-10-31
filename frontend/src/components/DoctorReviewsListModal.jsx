import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquare, ThumbsUp, ShieldCheck, User } from 'lucide-react';
import { appointmentsService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const DoctorReviewsListModal = ({ doctor, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!doctor?.id) return;
      try {
        setLoading(true);
        const data = await appointmentsService.getDoctorReviews(doctor.id);
        const list = Array.isArray(data) ? data : data.results || [];
        setReviews(list);
      } catch (err) {
        console.error('Failed to load doctor reviews:', err);
        setError('Failed to load patient reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [doctor]);

  const avgRating = doctor?.average_rating || 0;
  const reviewCount = doctor?.review_count || reviews.length;

  return (
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
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
        {/* Header */}
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
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 700,
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            >
              {doctor?.user?.full_name || doctor?.full_name || 'Doctor'} Reviews
            </h3>
            <span style={{ fontSize: '0.82rem', color: isDark ? '#38bdf8' : '#0284c7' }}>
              {doctor?.department} • {doctor?.years_of_experience || 0}+ Years Experience
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* Aggregate Rating Banner */}
        <div
          style={{
            padding: '16px 24px',
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                lineHeight: 1,
                color: avgRating > 0 ? '#f59e0b' : isDark ? '#94a3b8' : '#64748b',
              }}
            >
              {avgRating > 0 ? avgRating.toFixed(1) : '–'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= Math.round(avgRating) ? '#f59e0b' : 'transparent'}
                  color={s <= Math.round(avgRating) ? '#f59e0b' : isDark ? '#475569' : '#cbd5e1'}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '3px' }}>
              out of 5
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
              Verified Patient Consultations
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>
              {reviewCount === 0
                ? 'No ratings yet. Be the first to share your experience after completing a consultation!'
                : `Based on ${reviewCount} patient review${reviewCount === 1 ? '' : 's'}. Ratings are collected only from completed appointments.`}
            </p>
          </div>
        </div>

        {/* Reviews List */}
        <div
          style={{
            padding: '16px 24px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>
              Loading patient reviews...
            </div>
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
          ) : reviews.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: isDark ? '#94a3b8' : '#64748b',
              }}
            >
              <MessageSquare size={36} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>No reviews yet</p>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Once patients finish appointments with this doctor, their reviews will appear here.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(2, 132, 199, 0.1)',
                          color: isDark ? '#38bdf8' : '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        <User size={14} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isDark ? '#f1f5f9' : '#1e293b',
                        }}
                      >
                        {rev.patient_name || 'Verified Patient'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            fill={s <= rev.rating ? '#f59e0b' : 'transparent'}
                            color={s <= rev.rating ? '#f59e0b' : isDark ? '#475569' : '#cbd5e1'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>

                  {rev.comment ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: isDark ? '#cbd5e1' : '#334155',
                        lineHeight: 1.45,
                      }}
                    >
                      "{rev.comment}"
                    </p>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontStyle: 'italic',
                        color: isDark ? '#94a3b8' : '#64748b',
                      }}
                    >
                      Rated {rev.rating} out of 5 stars (no comment provided)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorReviewsListModal;

