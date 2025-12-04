import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { LivePredictions } from './pages/LivePredictions';
import { OrderHistory } from './pages/OrderHistory';
import { Trends } from './pages/Trends';
import { SettingsPage } from './pages/SettingsPage.tsx';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Render View Based on State
  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onViewAll={() => setCurrentView('trends')} />;
      case 'live': return <LivePredictions />;
      case 'history': return <OrderHistory />;
      case 'trends': return <Trends />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard onViewAll={() => setCurrentView('trends')} />;
    }
  };

  if (!isAuthenticated) {
    return currentView === 'login' ? (
      <LoginPage onLoginSuccess={() => {
        setCurrentView('dashboard');
      }} />
    ) : (
      <LandingPage onLogin={() => setCurrentView('login')} />
    );
  }

  return (
    <AppLayout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </AppLayout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

