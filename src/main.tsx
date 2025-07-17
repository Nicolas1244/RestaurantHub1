import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './contexts/AppContext'; 
import { AuthProvider } from './contexts/AuthContext';
import { autoSaveService } from './lib/autoSaveService';
import './i18n';
import './index.css';

// Initialize auto-save service globally
autoSaveService.initialize('fr');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </StrictMode>
);