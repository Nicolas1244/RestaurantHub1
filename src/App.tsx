import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AuthModal from './components/auth/AuthModal';
import PayrollPage from './pages/PayrollPage';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserSettingsPage from './components/settings/UserSettingsPage';
import EmployeePortal from './components/employee/EmployeePortal';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  // TEMPORARY: Bypass authentication checks
  const loading = false;
  const isEmployee = () => true;
  const isManager = () => true;
  const isAdmin = () => true;
  const { /* loading, isEmployee, isManager, isAdmin */ } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Navigate to="/" replace />} />
          
          {/* Protected routes for all authenticated users */}
          <Route>
            <Route path="/" element={<Layout />} />
            
            {/* Employee portal */}
            <Route path="/employee" element={
              <Layout>
                <EmployeePortal />
              </Layout>
            } />
            
            {/* User settings */}
            <Route path="/user-settings" element={
              <Layout>
                <UserSettingsPage />
              </Layout>
            } />
            
            {/* Redirect to dashboard by default */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <AuthModal />
      </Router>
      <Toaster position="top-right" />
    </>
  );
}

export default App;