import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HospitalBroadcastBanner from './components/HospitalBroadcastBanner';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin
import AdminDashboard from './pages/AdminDashboard';

// Doctor portal
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorConsultation from './pages/DoctorConsultation';
import DoctorPatients from './pages/DoctorPatients';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import DoctorProfile from './pages/DoctorProfile';
import DoctorMessages from './pages/DoctorMessages';

// Patient portal
import PatientDashboard from './pages/PatientDashboard';
import PatientProfile from './pages/PatientProfile';
import PatientAppointments from './pages/PatientAppointments';
import PatientHealthRecords from './pages/PatientHealthRecords';
import PatientPrescriptions from './pages/PatientPrescriptions';
import PatientDoctors from './pages/PatientDoctors';
import PatientMessages from './pages/PatientMessages';
import PatientLabReports from './pages/PatientLabReports';
import PatientVitalsTracker from './pages/PatientVitalsTracker';
import PatientEmergencyID from './pages/PatientEmergencyID';

// Redirect authenticated users to their portal
const HomeRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '70vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text-muted)',
      }}>
        <p>Loading MediFlow Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
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
              <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 24px' }}>
                <HospitalBroadcastBanner />
              </div>
              <Routes>
                {/* Root */}
                <Route path="/" element={<HomeRedirect />} />

                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Admin */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
                } />

                {/* ── Doctor Portal ───────────────────────────────── */}
                <Route path="/doctor" element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>
                } />
                <Route path="/doctor/appointments" element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorAppointments /></ProtectedRoute>
                } />
                <Route path="/doctor/appointments/:appointmentId/consult" element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorConsultation /></ProtectedRoute>
                } />
                <Route path="/doctor/patients" element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorPatients /></ProtectedRoute>
                } />
                <Route path="/doctor/patients/:patientId" element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorPatientDetail /></ProtectedRoute>
                } />
                <Route path="/doctor/profile" element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorProfile /></ProtectedRoute>
                } />
                <Route path="/doctor/messages" element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorMessages /></ProtectedRoute>
                } />

                {/* ── Patient Portal ──────────────────────────────── */}
                <Route path="/patient" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard /></ProtectedRoute>
                } />
                <Route path="/patient/profile" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientProfile /></ProtectedRoute>
                } />
                <Route path="/patient/appointments" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientAppointments /></ProtectedRoute>
                } />
                <Route path="/patient/messages" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientMessages /></ProtectedRoute>
                } />
                <Route path="/patient/lab-reports" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientLabReports /></ProtectedRoute>
                } />
                <Route path="/patient/vitals-tracker" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientVitalsTracker /></ProtectedRoute>
                } />
                <Route path="/patient/emergency-id" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientEmergencyID /></ProtectedRoute>
                } />
                <Route path="/patient/health-records" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientHealthRecords /></ProtectedRoute>
                } />
                <Route path="/patient/prescriptions" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientPrescriptions /></ProtectedRoute>
                } />
                <Route path="/patient/doctors" element={
                  <ProtectedRoute allowedRoles={['PATIENT']}><PatientDoctors /></ProtectedRoute>
                } />

                {/* Catch-all */}
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
