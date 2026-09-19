import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import HospitalPortal from './pages/HospitalPortal.jsx';
import InsurerPortal from './pages/InsurerPortal.jsx';
import EmergencyView from './pages/EmergencyView.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Login />} />
      <Route path="/emergency/:healthId" element={<EmergencyView />} />
      <Route path="/emergency-lookup" element={<EmergencyView />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <PatientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/hospital" element={
        <ProtectedRoute allowedRoles={['hospital']}>
          <HospitalPortal />
        </ProtectedRoute>
      } />
      <Route path="/insurer" element={
        <ProtectedRoute allowedRoles={['insurer']}>
          <InsurerPortal />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={
        user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function getDefaultRoute(role) {
  switch (role) {
    case 'patient': return '/dashboard';
    case 'hospital': return '/hospital';
    case 'insurer': return '/insurer';
    default: return '/dashboard';
  }
}

function TopTelemetryBar() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="top-telemetry-bar">
      <div className="telemetry-cluster">
        <div className="telemetry-chip">
          <span>SYS_CORE:</span>
          <span className="val cyan">ONLINE</span>
        </div>
        <div className="telemetry-chip">
          <span>SECURITY:</span>
          <span className="val">SHA-256 E2EE</span>
        </div>
        <div className="telemetry-chip">
          <span>CONSENT_LEDGER:</span>
          <span className="val cyan">SYNCED</span>
        </div>
      </div>

      <div className="telemetry-cluster">
        <div className="telemetry-chip">
          <span>LOCAL_TIME:</span>
          <span className="val cyan mono-num">{time}</span>
        </div>
        <div className="telemetry-chip">
          <span className="status-dot-pulse"></span>
          <span className="val">TELEMETRY_STREAM</span>
        </div>
      </div>
    </header>
  );
}

function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      {user && <Navbar />}
      <div className="main-content">
        <TopTelemetryBar />
        <div className="main-panel">
          <AppRoutes />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
