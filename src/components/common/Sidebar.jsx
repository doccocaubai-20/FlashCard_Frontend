import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Settings,
  LogOut,
  GraduationCap,
  Library,
  ChevronDown,
  Gamepad2,
  Trophy,
  Shield,
  MessageSquare,
  ClipboardList,
  Sprout
} from 'lucide-react';

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'U';

  // Grouped menu items to optimize UX navigation flow
  const menuGroups = [
    {
      title: 'Tổng quan',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/decks', label: 'Bộ bài', icon: BookOpen },
        { to: '/garden', label: 'Vườn từ vựng', icon: Sprout },
        { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
      ]
    },
    {
      title: 'Học & Ôn luyện',
      items: [
        { to: '/study-hub', label: 'Khu học tập HSK', icon: GraduationCap },
        { to: '/game-arcade', label: 'Đấu trường game', icon: Gamepad2 },
        { to: '/hsk-exams', label: 'Luyện đề HSK', icon: ClipboardList },
        { to: '/chat', label: 'AI Chatbot', icon: MessageSquare },
      ]
    },
    {
      title: 'Tra cứu & Công cụ',
      items: [
        { to: '/reference-hub', label: 'Tra cứu & Thư viện', icon: Library },
      ]
    },
    {
      title: 'Hệ thống',
      items: [
        { to: '/settings', label: 'Cài đặt', icon: Settings },
      ]
    }
  ];

  if (user?.role === 'ADMIN') {
    menuGroups.push({
      title: 'Quản trị (Admin)',
      items: [
        { to: '/admin', label: 'Admin CMS', icon: Shield },
      ]
    });
  }

  // Load and persist sidebar collapse preference from localStorage
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('chongzi_sidebar_collapsed');
      return saved ? JSON.parse(saved) : {
        'Tổng quan': false,
        'Học & Ôn luyện': false,
        'Tra cứu & Công cụ': false,
        'Hệ thống': false
      };
    } catch {
      return {
        'Tổng quan': false,
        'Học & Ôn luyện': false,
        'Tra cứu & Công cụ': false,
        'Hệ thống': false
      };
    }
  });

  const toggleGroup = (title) => {
    setCollapsedGroups((prev) => {
      const updated = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem('chongzi_sidebar_collapsed', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  return (
    <div className="sidebar-container h-full flex flex-col justify-between py-6">

      <div>
        {/* Brand Section */}
        <div className="sidebar-brand flex items-center gap-3 px-5 pb-5 border-b border-hairline dark:border-divider-dark">
          <div className="h-12 w-12 rounded-lg overflow-hidden shadow-sm">
            <img src="/ap2.png" alt="ChongZi" className="h-full w-full object-cover" />
          </div>
          <div>
            <span className="font-display font-bold text-xl text-ink dark:text-on-dark tracking-tight">
              ChongZi
            </span>
            <span className="text-sm font-sans font-medium text-mute dark:text-on-dark-mute block leading-none tracking-widest uppercase">
              Tiếng Trung
            </span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-3 pt-4">
          <NavLink
            to="/flashcards/new"
            className={({ isActive }) =>
              `flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg font-bold text-xs transition-all group cursor-pointer ${isActive
                ? 'bg-primary/90 text-white scale-[0.98]'
                : 'bg-primary hover:bg-primary-deep text-white shadow-sm hover:shadow-md'
              }`
            }
          >
            <PlusCircle size={14} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Thêm Thẻ mới</span>
          </NavLink>
        </div>

        {/* Menu Navigation Grouped */}
        <div className="sidebar-menu-list flex flex-col gap-4 px-4 pt-4 overflow-y-auto max-h-[calc(100vh-210px)] select-none">
          {menuGroups.map((group, groupIdx) => {
            const isCollapsed = collapsedGroups[group.title];
            return (
              <div key={groupIdx} className="space-y-1">
                {/* Collapsible Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[9px] font-sans font-bold text-mute/60 dark:text-on-dark-mute/50 uppercase tracking-widest hover:text-primary dark:hover:text-primary transition-colors cursor-pointer text-left"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    size={10}
                    className={`transition-transform duration-200 shrink-0 ${isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                  />
                </button>

                {/* Group Nav Items with Collapse Animation */}
                <div
                  className={`flex flex-col gap-1 transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
                    }`}
                >
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                      }
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer px-3 py-3.5 border-t border-hairline dark:border-divider-dark">
        <div className="flex items-center justify-between gap-2">
          {/* User Profile */}
          <div
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex-1"
          >
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-primary-light dark:bg-primary/20 text-primary dark:text-on-dark border border-hairline dark:border-divider-dark font-bold text-sm flex items-center justify-center shadow-sm overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-sm font-semibold text-ink dark:text-on-dark leading-none truncate">
                {user?.name || 'Học viên'}
              </span>
              <span className="text-[10px] font-bold text-primary dark:text-primary mt-0.5 uppercase tracking-widest">
                {user?.role === 'ADMIN' ? 'Quản trị' : 'Học viên'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/8 dark:hover:bg-primary/15 transition-all cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
