import React, { useEffect } from 'react';
import { useNavigation } from '@/shared';
import { useAuth } from '@/features/auth';
import { AppProviders } from './app.providers';
import { AppLayout } from './AppLayout';
import { AppRoutes, PUBLIC_INTRO_SCREENS } from './app.routes';
import './App.css';

const AppContent: React.FC = () => {
  const { currentScreen, resetTo } = useNavigation();
  const { authStatus } = useAuth();

  useEffect(() => {
    if (
      authStatus === 'authenticated' &&
      PUBLIC_INTRO_SCREENS.includes(currentScreen)
    ) {
      resetTo('home-rooms');
    }
  }, [authStatus, currentScreen, resetTo]);

  return (
    <AppLayout>
      <AppRoutes currentScreen={currentScreen} authStatus={authStatus} />
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;

