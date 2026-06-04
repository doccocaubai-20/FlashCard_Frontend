import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';
import { LayoutDashboard, BookOpen, PlusCircle, Settings, LogOut, Search, GraduationCap, PenTool } from 'lucide-react';

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'U';

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/decks', label: 'Bộ bài', icon: BookOpen },
    { to: '/study', label: 'Học tập', icon: GraduationCap },
    { to: '/flashcards/new', label: 'Thêm Thẻ mới', icon: PlusCircle },
    { to: '/dictionary', label: 'Tra từ điển', icon: Search },
    { to: '/write', label: 'Luyện viết', icon: PenTool },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="sidebar-container h-full flex flex-col justify-between py-6">
      
      {/* Brand Section */}
      <div>
        <div className="sidebar-brand flex items-center gap-3 px-6 pb-6 border-b border-hairline dark:border-divider-dark">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-sm">
            <BookOpen size={18} />
          </div>
          <span className="font-display font-extrabold text-lg text-ink dark:text-on-dark tracking-tight">
            ChongZi
          </span>
        </div>
 
        {/* Menu Navigation */}
        <nav className="sidebar-menu-list flex flex-col gap-1.5 px-4 pt-6">
          {menuItems.map(({ to, label, icon: Icon }) => (
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
        </nav>
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
