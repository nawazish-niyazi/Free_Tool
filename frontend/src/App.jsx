import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ESignPage from './pages/ESignPage';
import PdfTools from './pages/PdfTools';
import ImageTools from './pages/ImageTools';
import WatermarkPage from './pages/WatermarkPage';
import RemoveWatermarkPage from './pages/RemoveWatermarkPage';
import InvoiceGenerator from './pages/InvoiceGenerator';
import BackgroundRemoval from './pages/BackgroundRemoval';
import LocalHelpPage from './pages/LocalHelpPage';

// Placeholders for now
// const PdfTools = () => <div className="p-10">PDF Tools Page (Coming Soon)</div>;
// const ImageTools = () => <div className="p-10">Image Tools Page (Coming Soon)</div>;

import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';

function AppContent() {
  const { showAuthModal, setShowAuthModal } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/esign" element={<ESignPage />} />
        <Route path="/pdf-tools" element={<PdfTools />} />
        <Route path="/image-tools" element={<ImageTools />} />
        <Route path="/watermark" element={<WatermarkPage />} />
        <Route path="/remove-watermark" element={<RemoveWatermarkPage />} />
        <Route path="/invoice-generator" element={<InvoiceGenerator />} />
        <Route path="/background-removal" element={<BackgroundRemoval />} />
        <Route path="/local-help" element={<LocalHelpPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;


