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
  Search, 
  GraduationCap, 
  PenTool, 
  Library, 
  Grid, 
  BookOpenText, 
  MessageSquare,
  ChevronDown,
  Gamepad2,
  Languages,
  Star,
  Mic,
  Puzzle,
  Zap,
  Trophy,
  Shield
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
        { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
      ]
    },
    {
      title: 'Học & Ôn luyện',
      items: [
        { to: '/study-hub', label: 'Khu học tập HSK', icon: GraduationCap },
        { to: '/game-arcade', label: 'Đấu trường game', icon: Gamepad2 },
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
        <div className="sidebar-brand flex items-center gap-3 px-6 pb-6 border-b border-hairline dark:border-divider-dark">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-sm">
            <BookOpen size={18} />
          </div>
          <span className="font-display font-extrabold text-lg text-ink dark:text-on-dark tracking-tight">
            ChongZi
          </span>
        </div>

        {/* Quick Action Button - Highlighted CTA */}
        <div className="px-4 pt-4">
          <NavLink
            to="/flashcards/new"
            className={({ isActive }) =>
              `flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-full font-bold text-xs transition-all shadow-xs group cursor-pointer ${
                isActive
                  ? 'bg-primary-deep text-white shadow-sm scale-[0.98]'
                  : 'bg-primary hover:bg-primary-deep text-white hover:scale-[1.01]'
              }`
            }
          >
            <PlusCircle size={15} className="group-hover:rotate-90 transition-transform duration-300" />
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
                  className="w-full flex items-center justify-between px-3 py-1 text-[9px] font-mono font-extrabold text-mute/70 dark:text-on-dark-mute/60 uppercase tracking-widest hover:text-primary dark:hover:text-primary transition-colors cursor-pointer text-left"
                >
                  <span>{group.title}</span>
                  <ChevronDown 
                    size={11} 
                    className={`transition-transform duration-200 shrink-0 text-mute/50 ${
                      isCollapsed ? '-rotate-90' : 'rotate-0'
                    }`} 
                  />
                </button>
                
                {/* Group Nav Items with Collapse Animation */}
                <div 
                  className={`flex flex-col gap-1 transition-all duration-300 overflow-hidden ${
                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
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
  
      {/* Footer / User Profile & Logout */}
      <div className="sidebar-footer px-4 py-4 border-t border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/30 rounded-none">
        <div className="flex items-center justify-between gap-3">
          
          {/* User Profile */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-surface-card dark:bg-surface-dark text-ink dark:text-on-dark border border-hairline dark:border-divider-dark font-bold flex items-center justify-center shadow-sm overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-sm font-bold text-ink dark:text-on-dark leading-none truncate">
                {user?.name || 'Học viên'}
              </span>
              <span className="text-[10px] font-mono font-semibold text-primary dark:text-primary mt-1 uppercase tracking-wider">
                {user?.role === 'ADMIN' ? 'Quản trị' : 'Học viên'}
              </span>
            </div>
          </div>
   
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-full text-mute hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all cursor-pointer border border-transparent"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
