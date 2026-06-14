import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './layout.css';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { viewMode } = useTheme();

  // Automatically close sidebar on route/navigation changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`app-layout ${viewMode === 'gamified' ? 'gamified-active' : ''}`}>

      {/* Mobile Top Header Bar */}
      <header className="mobile-header">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink dark:text-on-dark cursor-pointer transition-colors"
          aria-label="Mở Menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-display font-extrabold text-lg text-ink dark:text-on-dark tracking-tight">
          ChongZi
        </span>
        <div className="w-9 h-9" /> {/* Visual spacing anchor */}
      </header>

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`app-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Mobile Close Icon inside Sidebar */}
        <div className="flex justify-end p-4 md:hidden border-b border-hairline dark:border-divider-dark bg-surface-bone/30 dark:bg-black/30">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-mute dark:text-on-dark-mute cursor-pointer transition-colors"
            aria-label="Đóng Menu"
          >
            <X size={20} />
          </button>
        </div>
        <Sidebar />
      </aside>

      {/* Main Scrollable Content Area */}
      <main className="app-content">
        <div className="p-4 md:p-8 pt-20 md:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
