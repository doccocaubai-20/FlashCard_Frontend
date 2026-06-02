import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      {/* Sidebar (Left) */}
      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      {/* Main Content Area (Right) */}
      <main className="app-content">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
