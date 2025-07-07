import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import Success from './components/Success';
import Cancel from './components/Cancel';
import About from './components/About';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Blog from './components/Blog';
import Dashboard from './components/dashboard/Dashboard';
import DashboardAnalytics from './components/dashboard/DashboardAnalytics';
import DashboardAPI from './components/dashboard/DashboardAPI';
import DashboardBilling from './components/dashboard/DashboardBilling';
import DashboardSettings from './components/dashboard/DashboardSettings';
import DashboardAccount from './components/dashboard/DashboardAccount';
import AnimatedDashboardDemo from './components/AnimatedDashboardDemo';
import EmailVerification from './components/EmailVerification';
import SignIn from './components/SignIn';
import ResetPassword from './components/ResetPassword';
import AdminTools from './components/AdminTools';
import PasswordResetTest from './components/PasswordResetTest';
import AuthCallback from './components/AuthCallback';

const HomePage = () => (
  <>
    <Header />
    <Hero />
    <Features />
    <HowItWorks />
    <Pricing />
    <Footer />
  </>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/success" element={<Success />} />
            <Route path="/cancel" element={<Cancel />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/analytics" element={
              <ProtectedRoute>
                <DashboardAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/account" element={
              <ProtectedRoute>
                <DashboardAccount />
              </ProtectedRoute>
            } />
            <Route path="/demo" element={<AnimatedDashboardDemo />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admin" element={<AdminTools />} />
            <Route path="/password-reset-test" element={<PasswordResetTest />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;