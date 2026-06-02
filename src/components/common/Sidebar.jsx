import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';
import { LayoutDashboard, BookOpen, PlusCircle, Settings, LogOut, Search } from 'lucide-react';

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
    { to: '/flashcards/new', label: 'Thêm Thẻ mới', icon: PlusCircle },
    { to: '/dictionary', label: 'Tra từ điển', icon: Search },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="sidebar-container h-full flex flex-col justify-between py-6">
      
      {/* Brand Section */}
      <div>
        <div className="sidebar-brand flex items-center gap-3 px-6 pb-6 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-200">
            <BookOpen size={18} />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
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
      <div className="sidebar-footer px-4 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
        <div className="flex items-center justify-between gap-3">
          
          {/* User Profile */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-bold flex items-center justify-center shadow-sm overflow-hidden border-2 border-white ring-1 ring-slate-200">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-sm font-bold text-slate-800 leading-none truncate">
                {user?.name || 'Học viên'}
              </span>
              <span className="text-[10px] font-semibold text-purple-600 mt-1 uppercase tracking-wider">
                {user?.role === 'ADMIN' ? 'Quản trị' : 'Học viên'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer border border-transparent hover:border-red-100"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
