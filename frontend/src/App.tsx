import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/layout/Layout';
import type { NavPage } from './components/layout/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { PerformancePage } from './pages/PerformancePage';
import { QueuePage } from './pages/QueuePage';
import { AlertsPage } from './pages/AlertsPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const DashboardApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <LoadingSpinner message="Checking authentication session..." size={28} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage onNavigate={setCurrentPage} />;
      case 'transactions':
        return <TransactionsPage />;
      case 'performance':
        return <PerformancePage />;
      case 'queue':
        return <QueuePage />;
      case 'alerts':
        return <AlertsPage />;
      default:
        return <OverviewPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <DashboardProvider>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    </DashboardProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
};

export default App;
