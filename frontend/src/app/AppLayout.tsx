import React from 'react';
import { ResponsiveContainer, DevScreenSwitcher } from '@/shared';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <ResponsiveContainer>
      {children}
      <DevScreenSwitcher />
    </ResponsiveContainer>
  );
};

export default AppLayout;

