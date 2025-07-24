import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthNavbar from './components/AuthNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GenerateCertificate from './pages/GenerateCertificate.tsx';
import VerifyCertificate from './pages/VerifyCertificate.tsx';
import CertificateList from './pages/CertificateList.tsx';
import UniversityDashboard from './pages/university/UniversityDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import { authService } from './lib/auth';

function App() {
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated ? <AuthNavbar /> : <Navbar />}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isAuthenticated ? (
            user?.type === 'university' ? <UniversityDashboard /> : <StudentDashboard />
          ) : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          
          {/* Legacy Routes - Redirect to new structure */}
          <Route path="/generate" element={<GenerateCertificate />} />
          <Route path="/certificates" element={<CertificateList />} />
          
          {/* University Routes */}
          <Route path="/university/dashboard" element={
            <ProtectedRoute requiredRole="university">
              <UniversityDashboard />
            </ProtectedRoute>
          } />
          
          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;