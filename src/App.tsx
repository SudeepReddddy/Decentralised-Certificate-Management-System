import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GenerateCertificate from './pages/GenerateCertificate.tsx';
import VerifyCertificate from './pages/VerifyCertificate.tsx';
import CertificateList from './pages/CertificateList.tsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<GenerateCertificate />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/certificates" element={<CertificateList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;