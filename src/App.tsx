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
  const { loading, isEmployee, isManager, isAdmin } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected routes for all authenticated users */}
          <Route element={<ProtectedRoute requiredRoles={['admin', 'manager', 'employee']} />}>
            <Route path="/" element={
              <Layout>
                {currentTab === 'dashboard' && <DashboardPage />}
                {currentTab === 'restaurants' && isManager() ? <RestaurantsPage /> : <Navigate to="/employee" />}
                {currentTab === 'schedule' && isManager() ? <SchedulePage /> : <Navigate to="/employee" />}
                {currentTab === 'staff' && isManager() ? <StaffPage /> : <Navigate to="/employee" />}
                {currentTab === 'settings' && <SettingsPage />}
                {currentTab === 'performance' && isManager() ? <PerformancePage /> : <Navigate to="/employee" />}
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