import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllDecks, createDeck, updateDeck, deleteDeck } from '../features/deck/deckSlice';
import { Plus, Edit3, Trash2, Folder, X, Star } from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';

export default function DeckListScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const decks = useSelector((state) => state.deck.decks);
  const isLoading = useSelector((state) => state.deck.isLoading);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    favoriteWordsApi.getFavorites()
      .then(res => setFavoritesCount(res.data?.length || 0))
      .catch(err => console.error('Failed to load favorites count:', err));
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-card dark:bg-surface-dark/50 p-6 rounded-md border border-hairline dark:border-divider-dark shadow-sm transition-colors">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display tracking-tight">Quản lý Bộ bài</h1>
          <p className="text-body dark:text-on-dark-mute text-sm mt-1">
            Tạo, sửa đổi và quản lý các bộ bài flashcard học tiếng Trung của bạn.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-deep text-white font-bold px-5 py-3 rounded-full transition-all shadow-sm hover:shadow-md self-start sm:self-center cursor-pointer active:scale-[0.98]"
        >
          <Plus size={18} />
          Tạo bộ bài mới
        </button>
      </div>

      {/* Grid List */}
      {isLoading && decks.length === 0 ? (
        <div className="text-center py-12 text-mute dark:text-on-dark-mute">Đang tải danh sách bộ bài...</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Virtual Deck: Từ vựng yêu thích */}
          <div
            onClick={() => navigate('/decks/favorites')}
            className="group relative flex flex-col justify-between p-6 bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-500/10 dark:to-amber-500/20 rounded-md border border-amber-500/30 hover:border-amber-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white group-hover:bg-amber-600 transition-colors duration-300">
                  <Star size={20} fill="currentColor" />
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Cá nhân
                </span>
              </div>
              <h3 className="text-lg font-bold text-ink dark:text-on-dark group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-display tracking-tight">
                Từ vựng yêu thích
              </h3>
              <p className="text-sm text-body dark:text-on-dark-mute mt-2 line-clamp-2 leading-relaxed">
                Lưu giữ các từ vựng bạn đã đánh dấu sao khi tra cứu từ điển hoặc trong các bài học.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-hairline dark:border-divider-dark mt-6 pt-4">
              <span className="text-xs font-semibold text-mute dark:text-on-dark-mute">
                {favoritesCount} từ vựng
              </span>
            </div>
          </div>

          {/* User's regular decks */}
          {decks.map((deck) => (
            <div
              key={deck.id}
              onClick={() => navigate(`/decks/${deck.id}`)}
              className="group relative flex flex-col justify-between p-6 bg-surface-card dark:bg-surface-dark/50 rounded-md border border-hairline dark:border-divider-dark hover:border-primary dark:hover:border-primary shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-bone dark:bg-surface-dark text-ink dark:text-on-dark group-hover:bg-primary group-hover:text-white dark:group-hover:bg-primary dark:group-hover:text-white transition-colors duration-300">
                    <Folder size={20} />
                  </div>
                  {deck.isSystem && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Hệ thống
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-primary transition-colors font-display tracking-tight">
                  {deck.title || deck.name || 'Bộ bài chưa đặt tên'}
                </h3>
                <p className="text-sm text-body dark:text-on-dark-mute mt-2 line-clamp-2 leading-relaxed">
                  {deck.description || 'Không có mô tả cho bộ bài này.'}
                </p>

                {/* studied progress bar */}
                {deck.cardCount > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute mb-1">
                      <span>Đã thuộc: {deck.studiedCount ?? 0}/{deck.cardCount} từ</span>
                      <span>{Math.round(((deck.studiedCount ?? 0) / deck.cardCount) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-bone dark:bg-black/30 rounded-full overflow-hidden border border-hairline dark:border-divider-dark">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300" 
                        style={{ width: `${Math.round(((deck.studiedCount ?? 0) / deck.cardCount) * 100)}%` }} 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-hairline dark:border-divider-dark mt-6 pt-4">
                <span className="text-xs font-semibold text-mute dark:text-on-dark-mute">
                  {deck.cardCount ?? 0} thẻ
                </span>
                
                {/* Actions */}
                {!deck.isSystem && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(e, deck)}
                      className="p-2 text-mute dark:text-on-dark-mute hover:text-primary dark:hover:text-primary hover:bg-surface-bone dark:hover:bg-black rounded-full transition-colors cursor-pointer"
                      title="Sửa tên bộ bài"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, deck.id, deck.title || deck.name)}
                      className="p-2 text-mute dark:text-on-dark-mute hover:text-primary dark:hover:text-primary hover:bg-surface-bone dark:hover:bg-black rounded-full transition-colors cursor-pointer"
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
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-card dark:bg-surface-dark rounded-md shadow-sm max-w-md w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
              <h3 className="text-lg font-bold text-ink dark:text-on-dark font-display tracking-tight">
                {modalMode === 'create' ? 'Tạo bộ bài mới' : 'Chỉnh sửa bộ bài'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                  Tên bộ bài <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Từ vựng HSK 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">Mô tả</label>
                <textarea
                  placeholder="Mô tả ngắn gọn về bộ bài..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline dark:border-divider-dark">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-full border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-sm font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-deep text-white text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
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
