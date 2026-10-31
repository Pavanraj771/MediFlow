import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { appointmentsService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const DoctorReviewModal = ({ appointment, existingReview, onClose, onSuccess }) => {
  const [aptData, setAptData] = useState(appointment || null);
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (appointment?.id && (!appointment.doctor_details || !appointment.review)) {
      appointmentsService.getAppointment(appointment.id)
        .then((data) => {
          setAptData(data);
          if (data.review) {
            setRating(data.review.rating || 5);
            setComment(data.review.comment || '');
          }
        })
        .catch(console.error);
    }
  }, [appointment]);

  const doctorName =
    aptData?.doctor_details?.full_name ||
    aptData?.doctor_name ||
    appointment?.doctor_details?.full_name ||
    appointment?.doctor_name ||
    'your Doctor';

  const doctorDepartment =
    aptData?.doctor_profile?.department ||
    aptData?.doctor_department ||
    appointment?.doctor_profile?.department ||
    appointment?.doctor_department ||
    'Specialist';

  const formatVisitDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const appointmentDate = formatVisitDate(aptData?.appointment_datetime || appointment?.appointment_datetime);

  const ratingDescriptions = {
    1: 'Poor experience',
    2: 'Needs improvement',
    3: 'Average care',
    4: 'Very good consultation',
    5: 'Excellent medical care',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const aptId = aptData?.id || appointment?.id;
      const payload = {
        appointment: aptId,
        appointment_id: aptId,
        rating: Number(rating),
        comment: comment.trim(),
      };
      await appointmentsService.submitDoctorReview(payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to submit review:', err);
      const data = err.response?.data;
      let errMsg = 'Failed to save your review. Please try again.';
      if (typeof data === 'string') errMsg = data;
      else if (data?.error) errMsg = data.error;
      else if (data?.detail) errMsg = data.detail;
      else if (data?.rating?.[0]) errMsg = data.rating[0];
      else if (data?.appointment?.[0]) errMsg = data.appointment[0];
      else if (data?.non_field_errors?.[0]) errMsg = data.non_field_errors[0];

      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

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
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderRadius: '20px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
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
                fontSize: '1.15rem',
                fontWeight: 700,
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            >
              {existingReview || aptData?.review ? 'Update Doctor Review' : 'Rate & Review Doctor'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
              Your feedback helps patients find compassionate care
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
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

        {/* Modal Content */}
        <div style={{ padding: '24px' }}>
          {/* Doctor Brief Info */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                {doctorName}
              </strong>
              <span style={{ fontSize: '0.8rem', color: isDark ? '#38bdf8' : '#0284c7' }}>
                {doctorDepartment}
              </span>
            </div>
            {appointmentDate && (
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  color: isDark ? '#cbd5e1' : '#475569',
                  textAlign: 'right',
                }}
              >
                {appointmentDate}
              </span>
            )}
          </div>

          {success ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px 10px',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={48} style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                Thank You for Your Feedback!
              </h4>
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                Your review has been successfully submitted and helps build doctor ratings.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Star Rating Section */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: isDark ? '#cbd5e1' : '#334155',
                    marginBottom: '10px',
                  }}
                >
                  Overall Consultation Rating
                </label>

                {/* Stars */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '6px',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                          transform: active ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        <Star
                          size={32}
                          fill={active ? '#f59e0b' : 'transparent'}
                          color={active ? '#f59e0b' : isDark ? '#64748b' : '#cbd5e1'}
                          strokeWidth={active ? 0 : 2}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label */}
                <span
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#f59e0b',
                  }}
                >
                  {ratingDescriptions[hoverRating || rating] || ''}
                </span>
              </div>

              {/* Feedback Comment */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="review-comment"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: isDark ? '#cbd5e1' : '#334155',
                    marginBottom: '8px',
                  }}
                >
                  Write Your Review (Optional)
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the doctor's communication, diagnosis explanation, and care experience?"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                    background: 'transparent',
                    color: isDark ? '#cbd5e1' : '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Star size={16} fill="#ffffff" />
                  {submitting ? 'Submitting...' : (existingReview || aptData?.review) ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorReviewModal;
