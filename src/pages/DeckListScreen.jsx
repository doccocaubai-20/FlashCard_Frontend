import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllDecks, createDeck, updateDeck, deleteDeck } from '../features/deck/deckSlice';
import { Plus, Edit3, Trash2, Folder, X, Star, Share2, Globe, Copy, Check, Download, Users, BookOpen } from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { socialApi } from '../services/socialApi';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

// ─── Tab toggle ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'mine',    label: 'Bộ thẻ của tôi' },
  { id: 'explore', label: '🌐 Khám phá cộng đồng' },
];

export default function DeckListScreen() {
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const decks = useSelector((state) => state.deck.decks);
  const isLoading = useSelector((state) => state.deck.isLoading);

  const [activeTab, setActiveTab] = useState('mine');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Sharing & Importing states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [shareCodeResult, setShareCodeResult] = useState('');
  const [shareDeckTitle, setShareDeckTitle] = useState('');

  // ── Explore tab state ──
  const [publicDecks, setPublicDecks] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState('');
  const [importingDeckId, setImportingDeckId] = useState(null); // share code being imported
  const [importedCodes, setImportedCodes] = useState(new Set()); // successfully imported

  useEffect(() => {
    favoriteWordsApi.getFavorites()
      .then(res => setFavoritesCount(res.data?.length || 0))
      .catch(err => console.error('Failed to load favorites count:', err));
  }, []);

  useEffect(() => {
    dispatch(fetchAllDecks());
  }, [dispatch]);

  // ─── Fetch public decks ───────────────────────────────────────────────────
  const fetchPublicDecks = useCallback(async () => {
    try {
      setExploreLoading(true);
      setExploreError('');
      const res = await socialApi.getPublicDecks(1, 40);
      setPublicDecks(res.data?.decks || res.data || []);
    } catch (err) {
      console.error('Failed to load public decks:', err);
      setExploreError(err.response?.data?.message || 'Không thể tải danh sách bộ thẻ cộng đồng.');
    } finally {
      setExploreLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchPublicDecks();
    }
  }, [activeTab, fetchPublicDecks]);

  // ─── Import from explore tab ──────────────────────────────────────────────
  const handleImportPublic = async (shareCode) => {
    if (!shareCode) return;
    try {
      setImportingDeckId(shareCode);
      await socialApi.importDeck(shareCode);
      setImportedCodes((prev) => new Set(prev).add(shareCode));
      dispatch(fetchAllDecks()); // refresh my decks
      showToast('Đã nhập bộ thẻ thành công!', 'success');
    } catch (err) {
      console.error('Failed to import deck:', err);
      showToast(err.response?.data?.message || 'Không thể nhập bộ thẻ này.', 'error');
    } finally {
      setImportingDeckId(null);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ title: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e, deck) => {
    e.stopPropagation();
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
        showToast('Đã tạo bộ bài mới thành công!', 'success');
      } else {
        await dispatch(updateDeck({ id: selectedDeck.id, data: formData })).unwrap();
        showToast('Đã lưu thay đổi bộ bài thành công!', 'success');
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save deck:', err);
      showToast('Không thể lưu bộ bài.', 'error');
    }
  };

  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ bài "${title || 'Chưa đặt tên'}" không?`)) {
      try {
        await dispatch(deleteDeck(id)).unwrap();
        showToast('Đã xóa bộ bài thành công!', 'success');
      } catch (err) {
        console.error('Failed to delete deck:', err);
        showToast('Không thể xóa bộ bài.', 'error');
      }
    }
  };

  const handleShare = async (e, deckId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/social/decks/${deckId}/share`);
      setShareCodeResult(res.data.shareCode);
      setShareDeckTitle(res.data.title);
      dispatch(fetchAllDecks());
      showToast('Bộ bài đã được chia sẻ công khai thành công!', 'success');
    } catch (err) {
      console.error('Failed to share deck:', err);
      showToast(err.response?.data?.message || 'Không thể chia sẻ bộ từ vựng.', 'error');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!shareCodeInput.trim()) return;

    try {
      setImporting(true);
      setImportError('');
      await api.post(`/api/social/decks/import/${shareCodeInput.trim()}`);
      setIsImportModalOpen(false);
      setShareCodeInput('');
      dispatch(fetchAllDecks());
    } catch (err) {
      console.error('Failed to import deck:', err);
      setImportError(err.response?.data?.message || 'Mã chia sẻ không đúng hoặc đã xảy ra lỗi.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-card dark:bg-surface-dark/50 p-6 rounded-md border border-hairline dark:border-divider-dark shadow-sm transition-colors text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display tracking-tight">Quản lý Bộ bài</h1>
          <p className="text-body dark:text-on-dark-mute text-sm mt-1">
            Tạo, sửa đổi và quản lý các bộ bài flashcard học tiếng Trung của bạn.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark font-bold px-4 py-3 rounded-full transition-all shadow-xs cursor-pointer bg-surface-card dark:bg-surface-dark"
          >
            <Globe size={16} />
            <span>Nhập bộ từ</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-deep text-white font-bold px-5 py-3 rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98]"
          >
            <Plus size={18} />
            Tạo bộ bài mới
          </button>
        </div>
      </div>

      {/* Tab Toggle */}
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

      {/* ════════════════════ TAB: MY DECKS ════════════════════ */}
      {activeTab === 'mine' && (
        <>
          {isLoading && decks.length === 0 ? (
            <div className="text-center py-12 text-mute dark:text-on-dark-mute">Đang tải danh sách bộ bài...</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Virtual Deck: Từ vựng yêu thích */}
              <div
                onClick={() => navigate('/decks/favorites')}
                className="group relative flex flex-col justify-between p-6 bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-500/10 dark:to-amber-500/20 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
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
                  className="group relative flex flex-col justify-between p-6 bg-surface-card dark:bg-surface-dark/60 rounded-xl border border-hairline dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-bone dark:bg-surface-dark text-ink dark:text-on-dark group-hover:bg-primary group-hover:text-white dark:group-hover:bg-primary dark:group-hover:text-white transition-colors duration-300">
                        <Folder size={20} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {deck.isSystem && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Hệ thống
                          </span>
                        )}
                        {deck.isPublic && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Đã chia sẻ
                          </span>
                        )}
                      </div>
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
                          onClick={(e) => handleShare(e, deck.id)}
                          className="p-2 text-mute dark:text-on-dark-mute hover:text-primary dark:hover:text-primary hover:bg-surface-bone dark:hover:bg-black rounded-full transition-colors cursor-pointer"
                          title="Chia sẻ bộ bài"
                        >
                          <Share2 size={16} />
                        </button>
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
        </>
      )}

      {/* ════════════════════ TAB: KHÁM PHÁ ════════════════════ */}
      {activeTab === 'explore' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink dark:text-on-dark">Bộ thẻ cộng đồng</h2>
              <p className="text-xs text-mute dark:text-on-dark-mute mt-0.5">Khám phá và nhập bộ thẻ từ cộng đồng người học.</p>
            </div>
            <button
              onClick={fetchPublicDecks}
              className="text-xs font-bold text-mute hover:text-primary border border-hairline dark:border-divider-dark px-3 py-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black/20 transition-colors cursor-pointer"
            >
              Làm mới
            </button>
          </div>

          {exploreLoading ? (
            <div className="text-center py-16 text-mute dark:text-on-dark-mute animate-pulse">
              <Globe size={32} className="mx-auto mb-3 animate-spin opacity-40" />
              <p className="text-sm">Đang tải bộ thẻ cộng đồng...</p>
            </div>
          ) : exploreError ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-500 font-semibold mb-3">{exploreError}</p>
              <button onClick={fetchPublicDecks} className="text-xs text-primary font-bold underline cursor-pointer">
                Thử lại
              </button>
            </div>
          ) : publicDecks.length === 0 ? (
            <div className="text-center py-16 text-mute">
              <Globe size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chưa có bộ thẻ công khai nào.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {publicDecks.map((deck) => {
                const shareCode = deck.shareCode;
                const alreadyImported = importedCodes.has(shareCode);
                const isImportingThis = importingDeckId === shareCode;

                return (
                  <div
                    key={deck.id}
                    className="flex flex-col justify-between p-5 bg-surface-card dark:bg-surface-dark/60 rounded-xl border border-hairline dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <BookOpen size={18} />
                        </div>
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-500/20 shrink-0">
                          Công khai
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-ink dark:text-on-dark font-display tracking-tight line-clamp-2">
                        {deck.title || deck.name || 'Bộ thẻ không tên'}
                      </h3>
                      {deck.description && (
                        <p className="text-xs text-body dark:text-on-dark-mute mt-1 line-clamp-2 leading-relaxed">
                          {deck.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-mute dark:text-on-dark-mute">
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {deck.owner?.name || deck.authorName || 'Ẩn danh'}
                        </span>
                        <span className="font-mono font-bold">{deck.cardCount ?? 0} thẻ</span>
                      </div>

                      <button
                        onClick={() => handleImportPublic(shareCode)}
                        disabled={isImportingThis || alreadyImported || !shareCode}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          alreadyImported
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 cursor-default'
                            : 'bg-primary hover:bg-primary-deep text-white shadow-xs disabled:opacity-60 disabled:cursor-not-allowed'
                        }`}
                      >
                        {alreadyImported ? (
                          <>
                            <Check size={13} /> Đã nhập về
                          </>
                        ) : isImportingThis ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            Đang nhập...
                          </>
                        ) : (
                          <>
                            <Download size={13} /> Nhập về
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-card dark:bg-surface-dark rounded-md shadow-sm max-w-sm w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
              <h3 className="text-base font-bold text-ink dark:text-on-dark font-display tracking-tight">
                Nhập bộ từ vựng chia sẻ
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImport} className="p-6 space-y-4">
              <p className="text-xs text-mute">Nhập mã chia sẻ (ví dụ: DEC-A7C8D2) để tải bộ từ vựng học tập công khai của người dùng khác.</p>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Mã chia sẻ DEC-XXXXXX..."
                  value={shareCodeInput}
                  onChange={(e) => setShareCodeInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-xs text-ink dark:text-on-dark font-mono font-bold"
                />
              </div>

              {importError && (
                <p className="text-[11px] font-semibold text-red-500">{importError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline dark:border-divider-dark">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 rounded-full bg-primary hover:bg-primary-deep text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
                >
                  {importing ? 'Đang nhập...' : 'Nhập bộ từ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Success Modal */}
      {shareCodeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-card dark:bg-surface-dark rounded-md shadow-sm max-w-sm w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
              <h3 className="text-base font-bold text-ink dark:text-on-dark font-display tracking-tight">
                Chia sẻ thành công!
              </h3>
              <button
                onClick={() => setShareCodeResult('')}
                className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <Globe size={40} className="text-green-500 mx-auto animate-pulse" />
              <p className="text-xs text-body dark:text-on-dark-mute">
                Bộ bài <strong>"{shareDeckTitle}"</strong> đã ở chế độ công khai.
              </p>
              <div className="bg-surface-bone dark:bg-black/30 p-4 rounded-lg border border-hairline dark:border-divider-dark flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-primary tracking-widest">{shareCodeResult}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareCodeResult);
                    showToast('Đã copy mã chia sẻ vào clipboard!', 'success');
                  }}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded text-mute hover:text-ink transition-colors cursor-pointer"
                  title="Copy mã chia sẻ"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-[10px] text-mute leading-relaxed">
                Gửi mã này cho bạn bè để họ có thể nhập vào và tự động tải toàn bộ thẻ flashcard của bạn để cùng ôn luyện.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
