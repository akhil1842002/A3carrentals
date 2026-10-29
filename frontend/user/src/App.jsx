import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SidebarLayout from './components/SidebarLayout';
import WhatsAppFloat from './components/WhatsAppFloat';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ConfirmPassword from './pages/ConfirmPassword';
import Dashboard from './pages/Dashboard';
import CarDetail from './pages/CarDetail';
import DriverPortal from './pages/DriverPortal';
import './index.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-spinner" style={{ paddingTop: '200px' }}><div className="spinner"></div></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-spinner" style={{ paddingTop: '200px' }}><div className="spinner"></div></div>;
  return !isAuthenticated ? children : <Navigate to="/dashboard?tab=overview" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard?tab=overview" replace /> : <Home />} />
      <Route path="/about" element={isAuthenticated ? <Navigate to="/dashboard?tab=overview" replace /> : <About />} />
      <Route path="/contact" element={isAuthenticated ? <Navigate to="/dashboard?tab=overview" replace /> : <Contact />} />
      <Route path="/tyres" element={<Navigate to="/dashboard?tab=overview" replace />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/confirm-password" element={<GuestRoute><ConfirmPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ConfirmPassword /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/driver" element={<Navigate to="/dashboard?tab=bookings" replace />} />
      <Route path="/car/:id" element={<CarDetail />} />
      <Route path="/cars/:id" element={<CarDetail />} />
      <Route path="/cars" element={<Navigate to="/dashboard?tab=cars" replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard?tab=overview" : "/"} replace />} />
    </Routes>
  );
}

function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/confirm-password', '/reset-password'].includes(location.pathname);

  useEffect(() => {
    try {
      localStorage.removeItem('cb_user_theme');
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
    } catch (e) {
      // safe fallback
    }
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // When Logged In: Render inside the premium Sidebar Layout (NO Navbar, NO Footer)
  if (isAuthenticated && !isAuthPage) {
    return (
      <SidebarLayout>
        <AppRoutes />
      </SidebarLayout>
    );
  }

  // When Not Logged In: Render Public Layout (with Landing Navbar and Footer)
  return (
    <>
      <Navbar />
      <main>
        <AppRoutes />
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <WhatsAppFloat />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Layout />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
