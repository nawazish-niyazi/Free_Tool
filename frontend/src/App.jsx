import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ESignPage from './pages/ESignPage';
import PdfTools from './pages/PdfTools';
import ImageTools from './pages/ImageTools';
import WatermarkPage from './pages/WatermarkPage';
import RemoveWatermarkPage from './pages/RemoveWatermarkPage';
import InvoiceGenerator from './pages/InvoiceGenerator';
import BackgroundRemoval from './pages/BackgroundRemoval';
import LocalHelpPage from './pages/LocalHelpPage';
import QrGenerator from './pages/QrGenerator';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import WorkerSignup from './pages/WorkerSignup';
import RewardsReferralPage from './pages/RewardsReferralPage';

// Placeholders for now
// const PdfTools = () => <div className="p-10">PDF Tools Page (Coming Soon)</div>;
// const ImageTools = () => <div className="p-10">Image Tools Page (Coming Soon)</div>;

import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import AuthModal from './components/AuthModal';

const ProtectedAdminRoute = ({ children }) => {
  const { isAdminLoggedIn, adminLoading } = useAdmin();
  if (adminLoading) return null;
  if (!isAdminLoggedIn) return <AdminLogin />;
  return children;
};

function AppContent() {
  const { showAuthModal, setShowAuthModal } = useAuth();
  const { pathname } = useLocation();

  // Automatically scroll to top when the route path changes
  useEffect(() => {
    // Prevent browser from restoring scroll position
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Immediate scroll (fixes desktop and most mobile)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    // Fallback for some mobile browsers (safari/chrome mobile sometimes needs a tick)
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

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
        <Route path="/qr-generator" element={<QrGenerator />} />
        <Route path="/q/:shortId" element={<LandingPage />} />
        <Route path="/worker-signup" element={<WorkerSignup />} />
        <Route path="/rewards-referral" element={<RewardsReferralPage />} />

        {/* Admin Routes */}
        <Route path="/management/login" element={<AdminLogin />} />
        <Route
          path="/management/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AdminProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AdminProvider>
    </Router>
  );
}

export default App;


