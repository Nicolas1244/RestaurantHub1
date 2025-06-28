import React from 'react';
import Layout from './components/layout/Layout';
import DashboardPage from './components/dashboard/DashboardPage';
import RestaurantsPage from './components/restaurants/RestaurantsPage';
import SchedulePage from './components/schedule/SchedulePage';
import StaffPage from './components/staff/StaffPage';
import SettingsPage from './components/settings/SettingsPage';
import PerformancePage from './components/performance/PerformancePage';
import TimeClockPage from './components/timeclock/TimeClockPage';
import AuthModal from './components/auth/AuthModal';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from './contexts/AppContext';

function App() {
  const { currentTab } = useAppContext();

  return (
    <>
      <Layout>
        {currentTab === 'dashboard' && <DashboardPage />}
        {currentTab === 'restaurants' && <RestaurantsPage />}
        {currentTab === 'schedule' && <SchedulePage />}
        {currentTab === 'staff' && <StaffPage />}
        {currentTab === 'settings' && <SettingsPage />}
        {currentTab === 'performance' && <PerformancePage />}
        {currentTab === 'timeclock' && <TimeClockPage />}
      </Layout>
      <AuthModal />
      <Toaster position="top-right" />
    </>
  );
}

export default App;