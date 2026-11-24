import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/router';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import './lib/i18n';
import './styles/index.css';
import { SampleCirculationSeeder } from './services/circulation/SampleCirculationSeeder';

// Initialize realistic sample loans, overdue fines, and suspended accounts if not already seeded
if (!localStorage.getItem('libraryos_circulation_seeded_v1')) {
  SampleCirculationSeeder.seedAllRealisticData();
  localStorage.setItem('libraryos_circulation_seeded_v1', 'true');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          className: 'shadow-2xl rounded-2xl border-2 px-5 py-4 font-sans text-sm font-semibold tracking-wide backdrop-blur-md',
          style: {
            fontSize: '14px',
            borderRadius: '16px',
            padding: '14px 20px',
            boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);
