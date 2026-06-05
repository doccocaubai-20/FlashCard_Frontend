import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Users, BookOpen, Layers, Activity, Shield, Trash2, Plus,
  Sparkles, Globe, Lock, Server, Filter, X, ChevronDown,
  RefreshCw, UserCog,
} from 'lucide-react';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Tổng quan' },
  { id: 'users',     label: 'Người dùng' },
  { id: 'decks',     label: 'Bộ thẻ (Deck)' },
];

// ─── Deck type badge helper ───────────────────────────────────────────────────
function DeckTypeBadge({ deck }) {
  if (deck.isSystem) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Server size={10} /> Hệ thống
      </span>
    );
  }
  if (deck.isPublic) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
        <Globe size={10} /> Công khai
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200/60 dark:bg-white/10 text-mute border border-hairline dark:border-divider-dark">
      <Lock size={10} /> Cá nhân
    </span>
  );
}

// ─── Create System Deck Modal ─────────────────────────────────────────────────
function CreateDeckModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setCreating(true);
      setError('');
      await api.post('/api/decks', { title: title.trim(), description: description.trim(), isSystem: true });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo bộ thẻ.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-card dark:bg-surface-dark rounded-xl shadow-xl max-w-md w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
          <h3 className="text-base font-bold text-ink dark:text-on-dark font-display flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Tạo bộ thẻ hệ thống
          </h3>
          <button onClick={onClose} className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Tên bộ từ vựng <span className="text-primary">*</span></label>
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
          {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-hairline dark:border-divider-dark">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-full border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-xs font-bold transition-colors cursor-pointer">
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 bg-primary hover:bg-primary-deep disabled:bg-stone text-white font-bold text-xs rounded-full flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Plus size={14} />
              {creating ? 'Đang tạo...' : 'Tạo bộ thẻ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main AdminScreen ─────────────────────────────────────────────────────────
export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState('overview');

  // ── Overview data ──
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Decks tab state ──
  const [adminDecks, setAdminDecks] = useState([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [decksError, setDecksError] = useState('');
  const [deckFilter, setDeckFilter] = useState('all'); // all | system | public | private
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);

  // ── Users tab state ──
  const [roleChanging, setRoleChanging] = useState({}); // { [userId]: true/false }

  // ─── Fetch overview stats ─────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Fetch admin decks ────────────────────────────────────────────────────
  const fetchAdminDecks = useCallback(async () => {
    try {
      setDecksLoading(true);
      setDecksError('');
      const res = await api.get('/api/admin/decks');
      setAdminDecks(res.data || []);
    } catch (err) {
      console.error(err);
      setDecksError(err.response?.data?.message || 'Không thể tải danh sách bộ thẻ.');
    } finally {
      setDecksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'decks') {
      fetchAdminDecks();
    }
  }, [activeTab, fetchAdminDecks]);

  // ─── Role toggle ──────────────────────────────────────────────────────────
  const handleToggleRole = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Đổi vai trò của "${user.name}" thành ${newRole}?`)) return;
    try {
      setRoleChanging((prev) => ({ ...prev, [user.id]: true }));
      await api.patch(`/api/admin/users/${user.id}/role`, { role: newRole });
      await fetchStats(); // refresh user list inside stats
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể đổi vai trò người dùng.');
    } finally {
      setRoleChanging((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // ─── Delete deck ──────────────────────────────────────────────────────────
  const handleDeleteDeck = async (deck) => {
    if (!window.confirm(`Xóa bộ thẻ "${deck.title || deck.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/api/admin/decks/${deck.id}`);
      setAdminDecks((prev) => prev.filter((d) => d.id !== deck.id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể xóa bộ thẻ.');
    }
  };

  // ─── Filter decks ─────────────────────────────────────────────────────────
  const filteredDecks = adminDecks.filter((d) => {
    if (deckFilter === 'system') return d.isSystem;
    if (deckFilter === 'public') return !d.isSystem && d.isPublic;
    if (deckFilter === 'private') return !d.isSystem && !d.isPublic;
    return true;
  });

  // ─── Loading / Error states ───────────────────────────────────────────────
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline dark:border-divider-dark pb-6">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink dark:text-on-dark flex items-center gap-2">
            <Shield className="text-primary" />
            Bảng Quản Trị &amp; Analytics
          </h1>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-1">
            Theo dõi sự tăng trưởng của hệ thống và quản trị kho từ vựng.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-surface-bone dark:bg-black/20 p-1 rounded-xl w-fit border border-hairline dark:border-divider-dark">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-surface-card dark:bg-surface-dark text-primary shadow-xs border border-hairline dark:border-divider-dark'
                : 'text-mute dark:text-on-dark-mute hover:text-ink dark:hover:text-on-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════ TAB: TỔNG QUAN ════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Users size={22} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-mute tracking-widest block">Thành viên</span>
                <span className="text-2xl font-black text-ink dark:text-on-dark leading-none">{overview?.totalUsers}</span>
              </div>
            </div>

            <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg">
                <Activity size={22} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-mute tracking-widest block">Hoạt động (DAU)</span>
                <span className="text-2xl font-black text-ink dark:text-on-dark leading-none">{overview?.dau}</span>
              </div>
            </div>

            <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <BookOpen size={22} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-mute tracking-widest block">Bộ từ vựng</span>
                <span className="text-2xl font-black text-ink dark:text-on-dark leading-none">{overview?.totalDecks}</span>
              </div>
            </div>

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
            {/* Signup trends chart */}
            <div className="lg:col-span-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-6 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-ink dark:text-on-dark text-sm mb-1">Đăng ký mới (7 ngày qua)</h3>
                <p className="text-[11px] text-mute">Số lượng tài khoản đăng ký mới theo ngày.</p>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-hairline dark:border-divider-dark">
                {signupsTrend?.map((item, idx) => {
                  const maxVal = Math.max(...signupsTrend.map((i) => i.count), 1);
                  const heightPct = (item.count / maxVal) * 80 + 10;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-mono font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.count}
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-primary hover:bg-primary-deep rounded-t-md transition-all duration-500 shadow-sm cursor-pointer"
                      />
                      <span className="text-[9px] font-mono text-mute dark:text-on-dark-mute mt-1 shrink-0">
                        {item.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick create system deck */}
            <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-6 rounded-xl flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-ink dark:text-on-dark text-sm mb-1 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" />
                  Tạo nhanh bộ thẻ hệ thống
                </h3>
                <p className="text-[11px] text-mute">Thêm bộ thẻ mặc định của hệ thống để phân phối cho người dùng học.</p>
              </div>
              <button
                onClick={() => { setActiveTab('decks'); setTimeout(() => setIsCreateDeckModalOpen(true), 100); }}
                className="w-full py-2.5 bg-primary hover:bg-primary-deep text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus size={14} />
                Mở tab Bộ thẻ để tạo
              </button>
              <button
                onClick={() => setActiveTab('decks')}
                className="w-full py-2 border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-surface-bone dark:hover:bg-black/20 transition-colors"
              >
                Xem tất cả bộ thẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB: NGƯỜI DÙNG ════════════════════ */}
      {activeTab === 'users' && (
        <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink dark:text-on-dark text-sm">Danh sách tài khoản (50 người mới nhất)</h3>
              <p className="text-[11px] text-mute">Chi tiết hoạt động học tập của các thành viên đăng ký.</p>
            </div>
            <button
              onClick={fetchStats}
              className="flex items-center gap-1.5 text-xs font-bold text-mute hover:text-primary border border-hairline dark:border-divider-dark px-3 py-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black/20 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Làm mới
            </button>
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
                  <th className="pb-3 pr-2">Hành động</th>
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
                    <td className="py-3.5 font-bold font-mono">{user.totalCardsLearned}</td>
                    <td className="py-3.5 font-bold font-mono">{user.totalStudies}</td>
                    <td className="py-3.5 pr-2">
                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={!!roleChanging[user.id]}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-hairline dark:border-divider-dark text-[10px] font-bold text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black/30 hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <UserCog size={12} />
                        {roleChanging[user.id] ? 'Đang đổi...' : 'Đổi role'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 italic text-mute">
                      Chưa có người dùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB: BỘ THẺ ════════════════════ */}
      {activeTab === 'decks' && (
        <div className="space-y-4">
          {/* Deck tab toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'all',     label: 'Tất cả' },
                { key: 'system',  label: 'Hệ thống' },
                { key: 'public',  label: 'Công khai' },
                { key: 'private', label: 'Cá nhân' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDeckFilter(f.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                    deckFilter === f.key
                      ? 'bg-primary text-white border-transparent shadow-xs'
                      : 'bg-surface-card dark:bg-surface-dark text-mute dark:text-on-dark-mute border-hairline dark:border-divider-dark hover:text-ink dark:hover:text-on-dark'
                  }`}
                >
                  <Filter size={10} /> {f.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAdminDecks}
                className="flex items-center gap-1.5 text-xs font-bold text-mute hover:text-primary border border-hairline dark:border-divider-dark px-3 py-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black/20 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} /> Làm mới
              </button>
              <button
                onClick={() => setIsCreateDeckModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-deep text-white text-xs font-bold rounded-full shadow-xs cursor-pointer transition-colors"
              >
                <Plus size={14} /> Tạo Deck hệ thống
              </button>
            </div>
          </div>

          {/* Decks table */}
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl overflow-hidden">
            {decksLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-mute animate-pulse">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="text-sm">Đang tải danh sách bộ thẻ...</span>
              </div>
            ) : decksError ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-500 font-semibold mb-3">{decksError}</p>
                <button onClick={fetchAdminDecks} className="text-xs text-primary font-bold underline cursor-pointer">
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-hairline dark:border-divider-dark text-[10px] uppercase text-mute font-bold tracking-wider bg-surface-bone/30 dark:bg-black/10">
                      <th className="pb-3 pt-3 pl-4">Tên Deck</th>
                      <th className="pb-3 pt-3">Loại</th>
                      <th className="pb-3 pt-3">Số thẻ</th>
                      <th className="pb-3 pt-3">Chủ sở hữu</th>
                      <th className="pb-3 pt-3">Ngày tạo</th>
                      <th className="pb-3 pt-3 pr-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline dark:divide-divider-dark text-xs text-body dark:text-on-dark-mute">
                    {filteredDecks.map((deck) => (
                      <tr key={deck.id} className="hover:bg-surface-bone/20 dark:hover:bg-black/15 transition-colors">
                        <td className="py-3.5 pl-4">
                          <div className="font-bold text-ink dark:text-on-dark">{deck.title || deck.name || '—'}</div>
                          {deck.description && (
                            <div className="text-[10px] text-mute mt-0.5 max-w-xs truncate">{deck.description}</div>
                          )}
                        </td>
                        <td className="py-3.5">
                          <DeckTypeBadge deck={deck} />
                        </td>
                        <td className="py-3.5 font-mono font-bold">{deck.cardCount ?? 0}</td>
                        <td className="py-3.5">
                          {deck.owner ? (
                            <div>
                              <div className="font-semibold text-ink dark:text-on-dark">{deck.owner.name}</div>
                              <div className="text-[10px] text-mute font-mono">{deck.owner.email}</div>
                            </div>
                          ) : (
                            <span className="text-mute italic">Hệ thống</span>
                          )}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-mute">
                          {new Date(deck.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <button
                            onClick={() => handleDeleteDeck(deck)}
                            className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-full border border-red-500/30 text-[10px] font-bold text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} /> Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDecks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 italic text-mute">
                          Không có bộ thẻ nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Deck Modal */}
      {isCreateDeckModalOpen && (
        <CreateDeckModal
          onClose={() => setIsCreateDeckModalOpen(false)}
          onSuccess={() => {
            setIsCreateDeckModalOpen(false);
            fetchAdminDecks();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
