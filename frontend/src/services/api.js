import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediflow_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('mediflow_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
          if (res.data.access) {
            localStorage.setItem('mediflow_access_token', res.data.access);
            if (res.data.refresh) localStorage.setItem('mediflow_refresh_token', res.data.refresh);
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('mediflow_access_token');
          localStorage.removeItem('mediflow_refresh_token');
          localStorage.removeItem('mediflow_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth Service ──────────────────────────────────────────────────────────────
export const authService = {
  sendEmailOTP: async (email) => (await api.post('/auth/email/send-otp/', { email })).data,
  verifyEmailOTP: async (email, otp) => (await api.post('/auth/email/verify-otp/', { email, otp })).data,
  login: async (username, password) => (await api.post('/auth/login/', { username, password })).data,
  googleLogin: async (credential) => (await api.post('/auth/google/', { credential })).data,
  register: async (userData) => (await api.post('/auth/register/', userData)).data,
  getProfile: async () => (await api.get('/auth/me/')).data,
  updateProfile: async (profile) => (await api.patch('/auth/me/', profile)).data,
  logout: async (refreshToken) => {
    try { await api.post('/auth/logout/', { refresh: refreshToken }); } catch {}
    finally {
      localStorage.removeItem('mediflow_access_token');
      localStorage.removeItem('mediflow_refresh_token');
      localStorage.removeItem('mediflow_user');
    }
  },
  getUsers: async (params = {}) => (await api.get('/auth/users/', { params })).data,
  deleteUser: async (id) => (await api.delete(`/auth/users/${id}/`)).data,
  toggleUserStatus: async (id, isActive) => (await api.patch(`/auth/users/${id}/status/`, { is_active: isActive })).data,
  updateDoctorAdmin: async (id, data) => (await api.patch(`/auth/doctors/${id}/`, data)).data,
  getDoctorRequests: async () => (await api.get('/auth/doctor-requests/')).data,
  decideDoctorRequest: async (id, decision) => (await api.post(`/auth/doctor-requests/${id}/decision/`, { decision })).data,
  getOverview: async () => (await api.get('/auth/overview/')).data,
  getAuditLogs: async (params = {}) => (await api.get('/auth/audit-logs/', { params })).data,
  getBroadcasts: async () => (await api.get('/auth/broadcasts/')).data,
  createBroadcast: async (data) => (await api.post('/auth/broadcasts/', data)).data,
  updateBroadcast: async (id, data) => (await api.patch(`/auth/broadcasts/${id}/`, data)).data,
  deleteBroadcast: async (id) => (await api.delete(`/auth/broadcasts/${id}/`)).data,
};

// ── Appointments Service ──────────────────────────────────────────────────────
export const appointmentsService = {
  // Doctors
  getDoctors: async (params = {}) => (await api.get('/appointments/doctors/', { params })).data,
  getDoctorSlots: async (doctorId, date) =>
    (await api.get(`/appointments/doctors/${doctorId}/slots/`, { params: { date } })).data,

  // Doctor profile (self)
  getDoctorProfile: async () => (await api.get('/appointments/doctors/me/')).data,
  updateDoctorProfile: async (data) => (await api.patch('/appointments/doctors/me/', data)).data,

  // Appointments (patient & doctor)
  bookAppointment: async (data) => (await api.post('/appointments/', data)).data,
  getAppointments: async (params = {}) => (await api.get('/appointments/', { params })).data,
  getAppointment: async (id) => (await api.get(`/appointments/${id}/`)).data,
  cancelAppointment: async (id, reason = '') => {
    try {
      return (await api.post(`/appointments/${id}/cancel/`, { reason })).data;
    } catch {
      return (await api.patch(`/appointments/${id}/`, { status: 'CANCELLED', cancellation_reason: reason })).data;
    }
  },
  updateAppointmentStatus: async (id, newStatus, reason = '') =>
    (await api.patch(`/appointments/${id}/update-status/`, { status: newStatus, reason })).data,

  // Consultation (doctor)
  getConsultation: async (appointmentId) =>
    (await api.get(`/appointments/${appointmentId}/consult/`)).data,
  saveConsultation: async (appointmentId, data) =>
    (await api.post(`/appointments/${appointmentId}/consult/`, data)).data,

  // Doctor schedule
  getSchedules: async () => (await api.get('/appointments/schedules/')).data,
  createSchedule: async (data) => (await api.post('/appointments/schedules/', data)).data,
  updateSchedule: async (id, data) => (await api.patch(`/appointments/schedules/${id}/`, data)).data,
  deleteSchedule: async (id) => (await api.delete(`/appointments/schedules/${id}/`)).data,

  // Doctor — patient list
  getMyPatients: async (params = {}) => (await api.get('/appointments/my-patients/', { params })).data,
  getMyPatientDetail: async (patientId) => (await api.get(`/appointments/my-patients/${patientId}/`)).data,
  getPatientConsultations: async (patientId) =>
    (await api.get(`/appointments/my-patients/${patientId}/consultations/`)).data,

  // Patient profile
  getPatientProfile: async () => (await api.get('/appointments/patient-profile/')).data,
  updatePatientProfile: async (data) => (await api.patch('/appointments/patient-profile/', data)).data,

  // ── Care Messages ───────────────────────────────────────────────────────────
  getConversations: async () => (await api.get('/appointments/messages/conversations/')).data,
  getMessages: async (params = {}) => (await api.get('/appointments/messages/', { params })).data,
  sendMessage: async (data) => (await api.post('/appointments/messages/', data)).data,
  markMessagesRead: async (sender_id) => (await api.post('/appointments/messages/mark-read/', { sender_id })).data,

  // ── Lab Tests ───────────────────────────────────────────────────────────────
  getLabTests: async (params = {}) => (await api.get('/appointments/lab-tests/', { params })).data,
  createLabTest: async (data) => (await api.post('/appointments/lab-tests/', data)).data,
  updateLabTest: async (id, data) => (await api.patch(`/appointments/lab-tests/${id}/`, data)).data,

  // ── Patient Vitals Logs (Home Tracking) ─────────────────────────────────────
  getVitalsLogs: async (params = {}) => (await api.get('/appointments/vitals-logs/', { params })).data,
  createVitalsLog: async (data) => (await api.post('/appointments/vitals-logs/', data)).data,
  deleteVitalsLog: async (id) => (await api.delete(`/appointments/vitals-logs/${id}/`)).data,

  // ── Prescription Refills ────────────────────────────────────────────────────
  getRefills: async () => (await api.get('/appointments/refills/')).data,
  requestRefill: async (data) => (await api.post('/appointments/refills/', data)).data,
  decideRefill: async (id, decision, doctorResponse = '') =>
    (await api.post(`/appointments/refills/${id}/decide/`, { decision, doctor_response: doctorResponse })).data,

  // ── Notifications ───────────────────────────────────────────────────────────
  getNotifications: async () => (await api.get('/appointments/notifications/')).data,
  getUnreadNotificationCount: async () => (await api.get('/appointments/notifications/unread-count/')).data,
  markNotificationRead: async (id) => (await api.post(`/appointments/notifications/${id}/mark-read/`)).data,
  markAllNotificationsRead: async () => (await api.post('/appointments/notifications/mark-all-read/')).data,

  // ── Doctor Reviews ──────────────────────────────────────────────────────────
  getDoctorReviews: async (doctorId) => (await api.get('/appointments/reviews/', { params: { doctor: doctorId } })).data,
  submitDoctorReview: async (data) => (await api.post('/appointments/reviews/', data)).data,
};

export default api;
