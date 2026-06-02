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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Bộ bài</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tạo, sửa đổi và quản lý các bộ bài flashcard học tiếng Trung của bạn.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg self-start sm:self-center cursor-pointer"
        >
          <Plus size={18} />
          Tạo bộ bài mới
        </button>
      </div>

      {/* Grid List */}
      {isLoading && decks.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Đang tải danh sách bộ bài...</div>
      ) : decks.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div
              key={deck.id}
              onClick={() => navigate(`/decks/${deck.id}`)}
              className="group relative flex flex-col justify-between p-6 bg-white rounded-3xl border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                    <Folder size={20} />
                  </div>
                  {deck.isSystem && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Hệ thống
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                  {deck.title || deck.name || 'Bộ bài chưa đặt tên'}
                </h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                  {deck.description || 'Không có mô tả cho bộ bài này.'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 mt-6 pt-4">
                <span className="text-xs font-semibold text-slate-400">
                  {deck.cardCount ?? deck.flashcards?.length ?? 0} thẻ
                </span>
                
                {/* Actions */}
                {!deck.isSystem && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(e, deck)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Sửa tên bộ bài"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, deck.id, deck.title || deck.name)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          Chưa có bộ bài nào. Nhấp vào nút "Tạo bộ bài mới" ở trên để bắt đầu!
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === 'create' ? 'Tạo bộ bài mới' : 'Chỉnh sửa bộ bài'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tên bộ bài <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Từ vựng HSK 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                <textarea
                  placeholder="Mô tả ngắn gọn về bộ bài..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
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
