import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllDecks, createDeck, updateDeck, deleteDeck } from '../features/deck/deckSlice';
import { Plus, Edit3, Trash2, Folder, X } from 'lucide-react';

export default function DeckListScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const decks = useSelector((state) => state.deck.decks);
  const isLoading = useSelector((state) => state.deck.isLoading);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    dispatch(fetchAllDecks());
  }, [dispatch]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ title: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e, deck) => {
    e.stopPropagation(); // Prevent navigating to deck details
    setModalMode('edit');
    setSelectedDeck(deck);
    setFormData({ title: deck.title || deck.name || '', description: deck.description || '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDeck(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (modalMode === 'create') {
        await dispatch(createDeck(formData)).unwrap();
      } else {
        await dispatch(updateDeck({ id: selectedDeck.id, data: formData })).unwrap();
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save deck:', err);
    }
  };

  const handleDelete = async (e, id, title) => {
    e.stopPropagation(); // Prevent navigating to deck details
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ bài "${title || 'Chưa đặt tên'}" không?`)) {
      try {
        await dispatch(deleteDeck(id)).unwrap();
      } catch (err) {
        console.error('Failed to delete deck:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản lý Bộ bài</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tạo, sửa đổi và quản lý các bộ bài flashcard học tiếng Trung của bạn.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg self-start sm:self-center cursor-pointer active:scale-[0.98]"
        >
          <Plus size={18} />
          Tạo bộ bài mới
        </button>
      </div>

      {/* Grid List */}
      {isLoading && decks.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Đang tải danh sách bộ bài...</div>
      ) : decks.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div
              key={deck.id}
              onClick={() => navigate(`/decks/${deck.id}`)}
              className="group relative flex flex-col justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-colors duration-300">
                    <Folder size={20} />
                  </div>
                  {deck.isSystem && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:text-indigo-450 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Hệ thống
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {deck.title || deck.name || 'Bộ bài chưa đặt tên'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {deck.description || 'Không có mô tả cho bộ bài này.'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-6 pt-4">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {deck.cardCount ?? 0} thẻ
                </span>
                
                {/* Actions */}
                {!deck.isSystem && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(e, deck)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Sửa tên bộ bài"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, deck.id, deck.title || deck.name)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Xóa bộ bài"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
          Chưa có bộ bài nào. Nhấp vào nút "Tạo bộ bài mới" ở trên để bắt đầu!
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {modalMode === 'create' ? 'Tạo bộ bài mới' : 'Chỉnh sửa bộ bài'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên bộ bài <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Từ vựng HSK 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả</label>
                <textarea
                  placeholder="Mô tả ngắn gọn về bộ bài..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 resize-none focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
