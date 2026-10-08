import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediflow_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('mediflow_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          if (res.data.access) {
            localStorage.setItem('mediflow_access_token', res.data.access);
            if (res.data.refresh) {
              localStorage.setItem('mediflow_refresh_token', res.data.refresh);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        } catch {
          // Refresh failed - purge session
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

// Auth Service Endpoints
export const authService = {
  sendEmailOTP: async (email) => (await api.post('/auth/email/send-otp/', { email })).data,

  verifyEmailOTP: async (email, otp) => (await api.post('/auth/email/verify-otp/', { email, otp })).data,

  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },

  googleLogin: async (credential) => (await api.post('/auth/google/', { credential })).data,

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (profile) => (await api.patch('/auth/me/', profile)).data,

  logout: async (refreshToken) => {
    try {
      await api.post('/auth/logout/', { refresh: refreshToken });
    } catch {
      // Ignored if token invalid
    } finally {
      localStorage.removeItem('mediflow_access_token');
      localStorage.removeItem('mediflow_refresh_token');
      localStorage.removeItem('mediflow_user');
    }
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },

  deleteUser: async (id) => (await api.delete(`/auth/users/${id}/`)).data,

  getDoctorRequests: async () => (await api.get('/auth/doctor-requests/')).data,

  decideDoctorRequest: async (id, decision) => (await api.post(`/auth/doctor-requests/${id}/decision/`, { decision })).data,

  getOverview: async () => {
    const response = await api.get('/auth/overview/');
    return response.data;
  },
};

export default api;
