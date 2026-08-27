import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import FloatingDictionary from './FloatingDictionary';
import './layout.css';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { viewMode, setViewMode, classicTheme, setClassicTheme } = useTheme();

  // Automatically close sidebar on route/navigation changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`app-layout ${viewMode === 'gamified' ? 'gamified-active' : ''}`}>

      {/* Mobile Top Header Bar */}
      <header className="mobile-header flex items-center justify-between">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-2">
          <img src="/ap2.png" alt="ChongZi Logo" className="w-7 h-7 object-contain rounded-md" />
          <span className="font-display font-extrabold text-base text-ink dark:text-on-dark tracking-tight">
            ChongZi
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Dictionary search */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('chongzi-open-dictionary'));
            }}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink dark:text-on-dark cursor-pointer transition-colors"
            aria-label="Tra từ điển"
          >
            <Search size={20} />
          </button>

          {/* Theme mode toggle */}
          <button
            onClick={() => {
              if (viewMode === 'gamified') {
                setViewMode('classic');
              }
              setClassicTheme(classicTheme === 'dark' ? 'light' : 'dark');
            }}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink dark:text-on-dark cursor-pointer transition-colors"
            aria-label="Đổi giao diện"
          >
            {viewMode === 'gamified' || classicTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Hamburger menu */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-ink dark:text-on-dark cursor-pointer transition-colors"
            aria-label="Mở Menu"
          >
            <Menu size={20} />
          </button>
        </div>
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
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main Scrollable Content Area */}
      <main className="app-content">
        <div className="p-4 md:p-8 pt-20 md:pt-8">
          <Outlet />
        </div>
      </main>

      {/* Globally Floating Dictionary Bubble */}
      <FloatingDictionary />
    </div>
  );
}
