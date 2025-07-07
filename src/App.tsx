import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './components/dashboard/DashboardPage';
import RestaurantsPage from './components/restaurants/RestaurantsPage';
import SchedulePage from './components/schedule/SchedulePage';
import StaffPage from './components/staff/StaffPage';
import SettingsPage from './components/settings/SettingsPage';
import TimeClockPage from './components/timeclock/TimeClockPage'; 
import AuthModal from './components/auth/AuthModal';
import PayrollPage from './pages/PayrollPage';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from './contexts/AppContext'; 
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserSettingsPage from './components/settings/UserSettingsPage';
import EmployeePortal from './components/employee/EmployeePortal';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  const { currentTab, setCurrentTab } = useAppContext();
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
            <Route path="/" element={
              <Layout>
                {currentTab === 'dashboard' && <DashboardPage />}
                {currentTab === 'restaurants' && <RestaurantsPage />}
                {currentTab === 'schedule' && <SchedulePage />}
                {currentTab === 'staff' && <StaffPage />}
                {currentTab === 'settings' && <SettingsPage />}
                {currentTab === 'performance' && <PerformancePage />}
                {currentTab === 'payroll' && <PayrollPage />}
                {currentTab === 'timeclock' && <TimeClockPage />}
              </Layout>
            } />
            
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