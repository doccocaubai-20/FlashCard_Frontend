import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, GraduationCap, Search, MoreHorizontal } from 'lucide-react';

export default function BottomTabBar({ onOpenMore }) {
  const location = useLocation();

  // Hide on active study session to prevent covering SRS rating buttons or swipe gestures
  const isStudySession =
    location.pathname.startsWith('/study/') ||
    (location.pathname === '/study' && new URLSearchParams(location.search).get('deckId')) ||
    (location.pathname.startsWith('/hsk-exams/') && location.pathname.includes('/play'));

  if (isStudySession) {
    return null;
  }

  const navItems = [
    {
      to: '/dashboard',
      label: 'Trang chủ',
      icon: LayoutDashboard,
      isActive: () => location.pathname === '/dashboard' || location.pathname === '/',
    },
    {
      to: '/decks',
      label: 'Bộ thẻ',
      icon: BookOpen,
      isActive: () => location.pathname.startsWith('/decks'),
    },
    {
      to: '/study',
      label: 'Luyện học',
      icon: GraduationCap,
      isActive: () => location.pathname === '/study' || location.pathname.startsWith('/study-hub'),
    },
    {
      to: '/dictionary',
      label: 'Từ điển',
      icon: Search,
      isActive: () => location.pathname.startsWith('/dictionary'),
    },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-all select-none"
    >
      <div className="flex items-center justify-around px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive();

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center flex-1 transition-colors cursor-pointer py-1 ${
                active
                  ? 'text-primary dark:text-teal-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`relative px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  active ? 'bg-primary/10 dark:bg-teal-400/15' : ''
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
              </div>
              <span className="text-[10px] font-sans mt-0.5 leading-none">
                {item.label}
              </span>
              {active ? (
                <span className="w-1 h-1 rounded-full bg-primary dark:bg-teal-400 mt-0.5" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-transparent mt-0.5" />
              )}
            </NavLink>
          );
        })}

        {/* 5th Tab: Thêm (Drawer toggle) */}
        <button
          type="button"
          onClick={onOpenMore}
          aria-label="Mở menu thêm"
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center flex-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer py-1"
        >
          <div className="relative px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center">
            <MoreHorizontal size={20} strokeWidth={1.8} />
          </div>
          <span className="text-[10px] font-sans font-medium mt-0.5 leading-none">
            Thêm
          </span>
          <span className="w-1 h-1 rounded-full bg-transparent mt-0.5" />
        </button>
      </div>
    </nav>
  );
}
