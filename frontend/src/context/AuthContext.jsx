import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mediflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('mediflow_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('mediflow_access_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate stored session with backend on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('mediflow_access_token');
      if (storedToken) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          localStorage.setItem('mediflow_user', JSON.stringify(profile));
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authService.login(username, password);
      localStorage.setItem('mediflow_access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('mediflow_refresh_token', data.refresh);
      }
      localStorage.setItem('mediflow_user', JSON.stringify(data.user));
      setToken(data.access);
      setUser(data.user);
      return data.user || data;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.username?.[0] ||
        'Authentication failed. Please verify credentials.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authService.register(userData);
      if (data.access) {
        localStorage.setItem('mediflow_access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('mediflow_refresh_token', data.refresh);
        }
        localStorage.setItem('mediflow_user', JSON.stringify(data.user));
        setToken(data.access);
        setUser(data.user);
      }
      return data.user || data;
    } catch (err) {
      let msg = 'Registration failed.';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          // Show just the first human-readable error message (without field prefix)
          const entries = Object.entries(errors);
          if (entries.length > 0) {
            const [, errVal] = entries[0];
            msg = Array.isArray(errVal) ? errVal[0] : String(errVal);
          }
        } else {
          msg = String(errors);
        }
      }
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authService.googleLogin(credential);
      localStorage.setItem('mediflow_access_token', data.access);
      localStorage.setItem('mediflow_refresh_token', data.refresh);
      localStorage.setItem('mediflow_user', JSON.stringify(data.user));
      setToken(data.access);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.detail || 'Google sign in failed. Please try again.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profile) => {
    const updatedUser = await authService.updateProfile(profile);
    localStorage.setItem('mediflow_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('mediflow_refresh_token');
    try {
      await authService.logout(refreshToken);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    authError,
    clearError,
    login,
    register,
    googleLogin,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
