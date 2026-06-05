import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, BookOpen, Layers, Activity, Calendar, Shield, Trash2, Plus, Sparkles } from 'lucide-react';

export default function AdminScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // System Deck creation state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [cmsMessage, setCmsMessage] = useState({ type: '', text: '' });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateSystemDeck = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      setCreating(true);
      setCmsMessage({ type: '', text: '' });
      await api.post('/api/decks', {
        title: title.trim(),
        description: description.trim(),
        isSystem: true
      });
      setCmsMessage({ type: 'success', text: 'Tạo bộ thẻ hệ thống mới thành công!' });
      setTitle('');
      setDescription('');
      fetchStats(); // Refresh lists
    } catch (err) {
      console.error(err);
      setCmsMessage({ type: 'error', text: err.response?.data?.message || 'Không thể tạo bộ thẻ.' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-mute gap-3 animate-pulse">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm font-medium">Đang tải dữ liệu Dashboard Admin...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-6 rounded-lg text-center max-w-xl mx-auto my-12">
        <Shield size={40} className="mx-auto text-red-500 mb-3" />
        <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Lỗi truy cập quản trị</h3>
        <p className="text-xs text-mute dark:text-on-dark-mute mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { overview, signupsTrend, users } = stats || {};

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline dark:border-divider-dark pb-6">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink dark:text-on-dark flex items-center gap-2">
            <Shield className="text-primary" />
            Bảng Quản Trị & Analytics
          </h1>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-1">
            Theo dõi sự tăng trưởng của hệ thống và quản trị kho từ vựng.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-mute tracking-widest block">Thành viên</span>
            <span className="text-2xl font-black text-ink dark:text-on-dark leading-none">{overview?.totalUsers}</span>
          </div>
        </div>

        {/* DAU Card */}
        <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-mute tracking-widest block">Hoạt động (DAU)</span>
            <span className="text-2xl font-black text-ink dark:text-on-dark leading-none">{overview?.dau}</span>
          </div>
        </div>

        {/* Decks Card */}
        <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-mute tracking-widest block">Bộ từ vựng</span>
            <span className="text-2xl font-black text-ink dark:text-on-dark leading-none">{overview?.totalDecks}</span>
          </div>
        </div>

        {/* Cards Card */}
        <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-mute tracking-widest block">Thẻ học</span>
            <span className="text-2xl font-black text-ink dark:text-on-dark leading-none">{overview?.totalFlashcards}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Signup trends chart */}
        <div className="lg:col-span-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-ink dark:text-on-dark text-sm mb-1">Đăng ký mới (7 ngày qua)</h3>
            <p className="text-[11px] text-mute">Số lượng tài khoản đăng ký mới theo ngày.</p>
          </div>
          
          {/* Simple Custom Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-hairline dark:border-divider-dark">
            {signupsTrend?.map((item, idx) => {
              const maxVal = Math.max(...signupsTrend.map(i => i.count), 1);
              const heightPct = (item.count / maxVal) * 80 + 10; // offset for minimum height visibility
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </div>
                  <div 
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-primary hover:bg-primary-deep rounded-t-md transition-all duration-500 shadow-sm cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-mute dark:text-on-dark-mute mt-1 rotate-0 shrink-0">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: CMS Create system deck */}
        <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-6 rounded-xl flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-ink dark:text-on-dark text-sm mb-1 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              Tạo bộ thẻ hệ thống
            </h3>
            <p className="text-[11px] text-mute">Thêm bộ thẻ mặc định của hệ thống để phân phối cho người dùng học.</p>
          </div>

          <form onSubmit={handleCreateSystemDeck} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Tên bộ từ vựng</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: HSK 4 Bài 1, Từ vựng đời sống..."
                className="w-full text-xs p-3 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Mô tả chi tiết</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả ngắn gọn về bộ từ vựng..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {cmsMessage.text && (
              <p className={`text-[11px] font-semibold ${cmsMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {cmsMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 bg-primary hover:bg-primary-deep disabled:bg-stone text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Plus size={14} />
              {creating ? 'Đang tạo bộ thẻ...' : 'Tạo bộ thẻ hệ thống'}
            </button>
          </form>
        </div>
      </div>

      {/* User list statistics */}
      <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl p-6">
        <div className="mb-4">
          <h3 className="font-bold text-ink dark:text-on-dark text-sm">Danh sách tài khoản (50 người mới nhất)</h3>
          <p className="text-[11px] text-mute">Chi tiết hoạt động học tập của các thành viên đăng ký.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline dark:border-divider-dark text-[10px] uppercase text-mute font-bold tracking-wider">
                <th className="pb-3 pl-2">Thành viên</th>
                <th className="pb-3">Vai trò</th>
                <th className="pb-3">Ngày đăng ký</th>
                <th className="pb-3">Số thẻ đã lưu</th>
                <th className="pb-3">Số lượt học bài</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline dark:divide-divider-dark text-xs text-body dark:text-on-dark-mute">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-surface-bone/20 dark:hover:bg-black/15 transition-colors">
                  <td className="py-3.5 pl-2">
                    <div className="font-bold text-ink dark:text-on-dark">{user.name}</div>
                    <div className="text-[10px] text-mute font-mono">{user.email}</div>
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.role === 'ADMIN' 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 text-mute font-mono text-[11px]">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3.5 font-bold font-mono">
                    {user.totalCardsLearned}
                  </td>
                  <td className="py-3.5 font-bold font-mono">
                    {user.totalStudies}
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 italic text-mute">
                    Chưa có người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
