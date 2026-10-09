import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientProfile from './pages/PatientProfile';
import PatientAppointments from './pages/PatientAppointments';

// Helper component to redirect authenticated users to their specific portal
const HomeRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        <p>Loading MediFlow Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  return <Navigate to="/patient" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: '104px' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Root redirect based on role */}
                <Route path="/" element={<HomeRedirect />} />

                {/* Public Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Role routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patient"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patient/profile"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <PatientProfile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patient/appointments"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <PatientAppointments />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
