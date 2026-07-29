import React from 'react';
import { GroupList } from './GroupList';

interface DashboardLayoutProps {
  adminEmail: string;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ adminEmail, onLogout }) => {
  return (
    <div>
      {/* Shell layout here */}
    </div>
  );
};
