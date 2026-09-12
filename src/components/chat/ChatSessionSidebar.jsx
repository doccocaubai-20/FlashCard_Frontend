import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { PERSONAS } from './ChatPersonaSelector';

export default function ChatSessionSidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
  isOpen,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Group sessions by Pinned, Today, Last 7 Days, Older
  const groupedSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = sessions.filter((s) =>
      !query || s.title?.toLowerCase().includes(query)
    );

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

    const pinned = [];
    const today = [];
    const last7Days = [];
    const older = [];

    filtered.forEach((s) => {
      if (s.pinned) {
        pinned.push(s);
        return;
      }
      const updatedTime = new Date(s.updatedAt || s.createdAt).getTime();
      if (updatedTime >= startOfToday) {
        today.push(s);
      } else if (updatedTime >= sevenDaysAgo) {
        last7Days.push(s);
      } else {
        older.push(s);
      }
    });

    return [
      { key: 'pinned', title: 'Đã ghim', items: pinned },
      { key: 'today', title: 'Hôm nay', items: today },
      { key: 'last7Days', title: '7 ngày qua', items: last7Days },
      { key: 'older', title: 'Cũ hơn', items: older },
    ].filter((g) => g.items.length > 0);
  }, [sessions, searchQuery]);

  const handleStartEdit = (session, e) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || '');
  };

  const handleSaveEdit = async (sessionId, e) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      await onUpdateSession(sessionId, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleTogglePin = async (session, e) => {
    e.stopPropagation();
    await onUpdateSession(session.id, { pinned: !session.pinned });
  };

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation();
    await onDeleteSession(sessionId);
    setDeleteConfirmId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-surface dark:bg-card-dark border-r border-hairline dark:border-white/10 flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: New Chat Button & Close on mobile */}
        <div className="p-3.5 border-b border-hairline dark:border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onCreateSession}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-deep shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Plus size={16} />
              <span>Cuộc trò chuyện mới</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 ml-2 rounded-xl text-mute hover:text-ink dark:hover:text-on-dark hover:bg-black/5 dark:hover:bg-white/5 md:hidden cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-mute" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chủ đề..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-bone/80 dark:bg-white/5 border border-hairline dark:border-white/10 text-xs text-ink dark:text-on-dark placeholder:text-mute focus:outline-hidden focus:border-primary/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-mute hover:text-ink cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4 custom-scrollbar">
          {groupedSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-mute space-y-1">
              <MessageSquare size={24} className="mx-auto text-mute/50 mb-2" />
              <p>{searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện nào'}</p>
              <p className="text-[11px] text-mute/70">Bấm nút trên để bắt đầu học nhé!</p>
            </div>
          ) : (
            groupedSessions.map((group) => (
              <div key={group.key} className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-mute px-2.5 py-1">
                  {group.title}
                </div>

                {group.items.map((s) => {
                  const isActive = activeSessionId === s.id;
                  const personaObj = PERSONAS.find((p) => p.id === s.persona) || PERSONAS[0];

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s.id);
                        onClose?.();
                      }}
                      className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-primary/10 dark:bg-teal-400/15 text-primary dark:text-teal-300 font-bold shadow-2xs border border-primary/20'
                          : 'text-ink/85 dark:text-on-dark/85 hover:bg-surface-bone dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Left info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare
                          size={15}
                          className={`shrink-0 ${isActive ? 'text-primary' : 'text-mute group-hover:text-primary'}`}
                        />

                        {editingId === s.id ? (
                          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(s.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              className="w-full px-2 py-0.5 text-xs rounded bg-surface dark:bg-card-dark border border-primary text-ink dark:text-on-dark focus:outline-hidden"
                            />
                            <button
                              onClick={(e) => handleSaveEdit(s.id, e)}
                              className="p-1 text-primary hover:bg-primary/10 rounded cursor-pointer"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                              }}
                              className="p-1 text-mute hover:bg-black/5 rounded cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <span className="truncate block">{s.title || 'Cuộc trò chuyện mới'}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-mute font-normal">
                              <span>{personaObj.name}</span>
                              {s.deck && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[90px]">{s.deck.title}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Action buttons on hover */}
                      {editingId !== s.id && (
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Pin button */}
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(s, e)}
                            className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer ${
                              s.pinned ? 'text-amber-500 opacity-100' : 'text-mute hover:text-amber-500'
                            }`}
                            title={s.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                          >
                            <Pin size={12} className={s.pinned ? 'fill-amber-500' : ''} />
                          </button>

                          {/* Edit title */}
                          <button
                            type="button"
                            onClick={(e) => handleStartEdit(s, e)}
                            className="p-1 rounded text-mute hover:text-primary hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                            title="Đổi tên chủ đề"
                          >
                            <Edit2 size={12} />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(s.id);
                            }}
                            className="p-1 rounded text-mute hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Xóa phiên này"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-surface dark:bg-card-dark border border-hairline dark:border-white/10 p-5 rounded-2xl max-w-xs w-full shadow-xl space-y-3">
              <h4 className="font-bold text-sm text-ink dark:text-on-dark">Xóa cuộc trò chuyện?</h4>
              <p className="text-xs text-mute leading-relaxed">
                Toàn bộ tin nhắn trong chủ đề này sẽ bị xóa và không thể khôi phục lại.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-bone dark:bg-white/5 text-mute hover:text-ink cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(deleteConfirmId, e)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
