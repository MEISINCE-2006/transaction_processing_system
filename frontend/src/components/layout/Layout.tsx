import React, { useState } from 'react';
import { Sidebar, type NavPage } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Header
          currentPage={currentPage}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
};
