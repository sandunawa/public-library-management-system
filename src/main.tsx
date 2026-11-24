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
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className:
            'rounded-xl border border-border bg-card text-card-foreground shadow-elevated px-4 py-3 font-sans text-sm font-medium',
          style: {
            fontSize: '14px',
            borderRadius: '12px',
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);
