import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllDecks, createDeck, updateDeck, deleteDeck } from '../features/deck/deckSlice';
import { Plus, Edit3, Trash2, Folder, X, Star, Share2, Globe, Copy, Check, Download, Users, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { socialApi } from '../services/socialApi';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';

// ─── Tab toggle ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'personal', label: 'Bộ thẻ cá nhân' },
  { id: 'system', label: 'Bộ thẻ hệ thống' },
  { id: 'explore', label: 'Khám phá cộng đồng' },
];

// Curated premium preset colors for cards
const getDeckStyle = (deckId) => {
  const presets = [
    {
      bg: 'bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/10 dark:to-indigo-900/10 border-indigo-100 dark:border-indigo-900/30',
      iconBg: 'bg-indigo-500',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      barBg: 'bg-indigo-500'
    },
    {
      bg: 'bg-gradient-to-br from-rose-50/50 to-rose-100/30 dark:from-rose-950/10 dark:to-rose-900/10 border-rose-100 dark:border-rose-900/30',
      iconBg: 'bg-rose-500',
      iconColor: 'text-rose-600 dark:text-rose-400',
      barBg: 'bg-rose-500'
    },
    {
      bg: 'bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/10 dark:to-emerald-900/10 border-emerald-100 dark:border-emerald-900/30',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      barBg: 'bg-emerald-500'
    },
    {
      bg: 'bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/10 dark:to-purple-900/10 border-purple-100 dark:border-purple-900/30',
      iconBg: 'bg-purple-500',
      iconColor: 'text-purple-600 dark:text-purple-400',
      barBg: 'bg-purple-500'
    },
    {
      bg: 'bg-gradient-to-br from-teal-50/50 to-teal-100/30 dark:from-teal-950/10 dark:to-teal-900/10 border-teal-100 dark:border-teal-900/30',
      iconBg: 'bg-teal-500',
      iconColor: 'text-teal-600 dark:text-teal-400',
      barBg: 'bg-teal-500'
    },
    {
      bg: 'bg-gradient-to-br from-sky-50/50 to-sky-100/30 dark:from-sky-950/10 dark:to-sky-900/10 border-sky-100 dark:border-sky-900/30',
      iconBg: 'bg-sky-500',
      iconColor: 'text-sky-600 dark:text-sky-400',
      barBg: 'bg-sky-500'
    },
    {
      bg: 'bg-gradient-to-br from-cyan-50/50 to-cyan-100/30 dark:from-cyan-950/10 dark:to-cyan-900/10 border-cyan-100 dark:border-cyan-900/30',
      iconBg: 'bg-cyan-500',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      barBg: 'bg-cyan-500'
    },
  ];

  const idx = (Number(deckId) || 0) % presets.length;
  return presets[idx];
};

export default function DeckListScreen() {
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const decks = useSelector((state) => state.deck.decks);
  const isLoading = useSelector((state) => state.deck.isLoading);

  const [activeTab, setActiveTab] = useState('personal');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

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

  // AI Generator States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiDeckTitle, setAiDeckTitle] = useState('Từ vựng trích xuất AI');
  const [generating, setGenerating] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [aiTab, setAiTab] = useState('text'); // 'text' | 'image'

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

  const personalDecks = decks.filter(d => !d.isSystem);

  // Automatically switch to 'system' tab for new users who have no custom decks
  useEffect(() => {
    if (!isLoading && decks.length > 0 && personalDecks.length === 0 && activeTab === 'personal') {
      setActiveTab('system');
    }
  }, [decks, isLoading, personalDecks.length, activeTab]);

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

  const handleDelete = (e, id, title) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Xóa bộ bài học',
      message: `Bạn có chắc chắn muốn xóa bộ bài "${title || 'Chưa đặt tên'}" không? Toàn bộ thẻ từ vựng bên trong sẽ bị mất.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await dispatch(deleteDeck(id)).unwrap();
          showToast('Đã xóa bộ bài thành công!', 'success');
        } catch (err) {
          console.error('Failed to delete deck:', err);
          showToast('Không thể xóa bộ bài.', 'error');
        }
      }
    });
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

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.Tesseract) {
      setOcrError('Không tìm thấy thư viện OCR. Vui lòng kiểm tra lại kết nối mạng!');
      return;
    }
    setOcrLoading(true);
    setOcrError('');
    setOcrProgress('Đang tải hình ảnh...');
    try {
      const { data: { text } } = await window.Tesseract.recognize(
        file,
        'chi_sim+eng+vie',
        {
          langPath: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0',
          logger: m => {
            const pct = Math.round(m.progress * 100);
            if (m.status === 'loading tesseract core') {
              setOcrProgress(`Đang nạp lõi OCR: ${pct}%`);
            } else if (m.status === 'loading language traineddata') {
              setOcrProgress(`Đang tải dữ liệu tiếng Trung: ${pct}%`);
            } else if (m.status === 'recognizing text') {
              setOcrProgress(`Đang nhận diện chữ Hán: ${pct}%`);
            } else {
              setOcrProgress(`${m.status}: ${pct}%`);
            }
          }
        }
      );
      if (text && text.trim()) {
        setAiText((prev) => (prev ? prev + '\n' + text : text));
        showToast('Nhận diện chữ Hán thành công!', 'success');
        setAiTab('text');
      } else {
        setOcrError('Không phát hiện được chữ Hán nào trong ảnh.');
      }
    } catch (err) {
      console.error('OCR error:', err);
      setOcrError('Lỗi nhận diện. Hãy thử lại với ảnh rõ hơn.');
    } finally {
      setOcrLoading(false);
      setOcrProgress('');
    }
  };

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiText.trim()) return;
    setGenerating(true);
    try {
      const res = await api.post('/api/decks/generate-from-text', {
        text: aiText,
        deckTitle: aiDeckTitle || 'Từ vựng trích xuất AI'
      });
      showToast(`Đã trích xuất và tạo thành công bộ thẻ với ${res.data.cardsCount} từ vựng!`, 'success');
      setIsAiModalOpen(false);
      setAiText('');
      setAiDeckTitle('Từ vựng trích xuất AI');
      dispatch(fetchAllDecks());
      if (res.data.deckId) {
        navigate(`/decks/${res.data.deckId}`);
      }
    } catch (err) {
      console.error('Failed to generate deck:', err);
      showToast(err.response?.data?.message || 'Không thể tạo bộ từ bằng AI.', 'error');
    } finally {
      setGenerating(false);
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
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto sm:justify-end">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark font-bold px-4 py-2.5 rounded-full transition-all shadow-xs cursor-pointer bg-surface-card dark:bg-surface-dark text-xs sm:text-sm shrink-0"
          >
            <Globe size={15} />
            <span>Bộ bài chia sẻ</span>
          </button>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] text-xs sm:text-sm shrink-0"
          >
            <Sparkles size={14} />
            <span>Tạo bằng AI</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-deep text-white font-bold px-4 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] text-xs sm:text-sm shrink-0"
          >
            <Plus size={16} />
            <span>Tạo bộ bài mới</span>
          </button>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex items-center gap-1 bg-surface-bone dark:bg-black/20 p-1 rounded-xl w-fit border border-hairline dark:border-divider-dark">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === tab.id
              ? 'bg-surface-card dark:bg-surface-dark text-primary shadow-xs border border-hairline dark:border-divider-dark'
              : 'text-mute dark:text-on-dark-mute hover:text-ink dark:hover:text-on-dark'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════ TAB: PERSONAL DECKS ════════════════════ */}
      {activeTab === 'personal' && (
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

              {personalDecks.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-hairline dark:border-divider-dark bg-surface-bone/30 dark:bg-surface-dark/10 p-8 text-center flex flex-col items-center justify-center min-h-[220px] space-y-3">
                  <div className="text-3xl animate-bounce">🗂️</div>
                  <h4 className="font-display font-extrabold text-sm text-ink dark:text-on-dark">Bạn chưa có bộ bài cá nhân nào</h4>
                  <p className="text-xs text-mute dark:text-on-dark-mute max-w-sm leading-relaxed font-sans">
                    Hãy bấm nút "Tạo bộ bài mới" hoặc "Tạo bằng AI" ở góc trên để tạo bộ từ vựng học tập của riêng mình nhé!
                  </p>
                </div>
              ) : (
                personalDecks.map((deck, index) => {
                  const style = getDeckStyle(index);
                  return (
                    <div
                      key={deck.id}
                      onClick={() => navigate(`/decks/${deck.id}`)}
                      className={`group relative flex flex-col justify-between p-6 ${style.bg} rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-black/35 ${style.iconColor} group-hover:${style.iconBg} group-hover:text-black transition-colors duration-300 shadow-xs`}>
                            <Folder size={20} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${deck.language === 'EN'
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              }`}>
                              {deck.language === 'EN' ? 'Tiếng Anh' : 'Tiếng Trung'}
                            </span>
                            {deck.isPublic && (
                              <span className="text-[9px] font-extrabold text-green-600 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Đã chia sẻ
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-primary transition-colors font-display tracking-tight">
                          {deck.title || deck.name || 'Bộ bài chưa đặt tên'}
                        </h3>
                        <p className="text-sm text-body dark:text-on-dark-mute mt-2 line-clamp-2 leading-relaxed font-semibold">
                          {deck.description || 'Không có mô tả cho bộ bài này.'}
                        </p>

                        {/* studied progress bar */}
                        {deck.cardCount > 0 && (
                          <div className="mt-4">
                            <div className="flex justify-between text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute mb-1">
                              <span>Đã thuộc: {deck.studiedCount ?? 0}/{deck.cardCount} từ</span>
                              <span>{Math.round(((deck.studiedCount ?? 0) / deck.cardCount) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/60 dark:bg-black/35 rounded-full overflow-hidden border border-hairline dark:border-divider-dark/40">
                              <div
                                className={`h-full ${style.barBg} rounded-full transition-all duration-300`}
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════ TAB: SYSTEM DECKS ════════════════════ */}
      {activeTab === 'system' && (
        <>
          {isLoading && decks.length === 0 ? (
            <div className="text-center py-12 text-mute dark:text-on-dark-mute">Đang tải danh sách bộ bài hệ thống...</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {decks.filter(d => d.isSystem).map((deck, index) => {
                const style = getDeckStyle(index);
                return (
                  <div
                    key={deck.id}
                    onClick={() => navigate(`/decks/${deck.id}`)}
                    className={`group relative flex flex-col justify-between p-6 ${style.bg} rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer animate-fade-in`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-black/35 ${style.iconColor} group-hover:${style.iconBg} group-hover:text-black transition-colors duration-300 shadow-xs`}>
                          <BookOpen size={20} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${deck.language === 'EN'
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            }`}>
                            {deck.language === 'EN' ? 'Tiếng Anh' : 'Tiếng Trung'}
                          </span>
                          <span className="text-[9px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Hệ thống
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-primary transition-colors font-display tracking-tight">
                        {deck.title || deck.name || 'Bộ bài hệ thống'}
                      </h3>
                      <p className="text-sm text-body dark:text-on-dark-mute mt-2 line-clamp-2 leading-relaxed font-semibold">
                        {deck.description || 'Không có mô tả cho bộ bài này.'}
                      </p>

                      {/* studied progress bar */}
                      {deck.cardCount > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute mb-1">
                            <span>Đã thuộc: {deck.studiedCount ?? 0}/{deck.cardCount} từ</span>
                            <span>{Math.round(((deck.studiedCount ?? 0) / deck.cardCount) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/60 dark:bg-black/35 rounded-full overflow-hidden border border-hairline dark:border-divider-dark/40">
                            <div
                              className={`h-full ${style.barBg} rounded-full transition-all duration-300`}
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
                    </div>
                  </div>
                );
              })}
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
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${alreadyImported
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

      {/* AI Flashcard Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-card dark:bg-surface-dark rounded-md shadow-sm max-w-lg w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
              <h3 className="text-base font-bold text-ink dark:text-on-dark font-display tracking-tight flex items-center gap-2">
                <Sparkles size={18} className="text-purple-500" />
                Tạo bộ thẻ tự động bằng AI
              </h3>
              <button
                onClick={() => {
                  if (generating || ocrLoading) return;
                  setIsAiModalOpen(false);
                }}
                className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              {/* Modal Tabs */}
              <div className="flex gap-2 p-1 bg-surface-bone dark:bg-black/20 rounded-lg w-fit border border-hairline dark:border-divider-dark">
                <button
                  type="button"
                  onClick={() => setAiTab('text')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${aiTab === 'text'
                    ? 'bg-surface-card dark:bg-surface-dark text-primary shadow-xs border border-hairline dark:border-divider-dark'
                    : 'text-mute dark:text-on-dark-mute hover:text-ink dark:hover:text-on-dark'
                    }`}
                >
                  Nhập văn bản
                </button>
                <button
                  type="button"
                  onClick={() => setAiTab('image')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${aiTab === 'image'
                    ? 'bg-surface-card dark:bg-surface-dark text-primary shadow-xs border border-hairline dark:border-divider-dark'
                    : 'text-mute dark:text-on-dark-mute hover:text-ink dark:hover:text-on-dark'
                    }`}
                >
                  Tải ảnh (OCR)
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Tên bộ bài mới</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Từ vựng bài khóa số 1, Từ vựng đọc báo..."
                  value={aiDeckTitle}
                  onChange={(e) => setAiDeckTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-xs text-ink dark:text-on-dark font-semibold"
                />
              </div>

              {aiTab === 'text' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Đoạn văn tiếng Trung</label>
                  <textarea
                    rows={6}
                    placeholder="Hãy dán hoặc nhập đoạn văn tiếng Trung của bạn tại đây..."
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-xs text-ink dark:text-on-dark leading-relaxed"
                  />
                  <p className="text-[10px] text-mute dark:text-on-dark-mute">Hệ thống AI sẽ phân tích và trích xuất tối đa 15 từ vựng hữu ích nhất kèm dịch nghĩa, phiên âm và ví dụ.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-hairline dark:border-divider-dark rounded-xl p-6 text-center bg-surface-bone/30 dark:bg-white/2">
                    <input
                      type="file"
                      id="ocr-file-upload"
                      accept="image/*"
                      onChange={handleOcrUpload}
                      className="hidden"
                      disabled={ocrLoading}
                    />
                    <label
                      htmlFor="ocr-file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Plus size={24} />
                      </div>
                      <span className="text-xs font-bold text-ink dark:text-on-dark">Chọn ảnh từ thiết bị</span>
                      <span className="text-[10px] text-mute dark:text-on-dark-mute">Hỗ trợ các định dạng PNG, JPG, JPEG chứa chữ Hán</span>
                    </label>
                  </div>

                  {ocrLoading && (
                    <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-xl text-purple-700 dark:text-purple-300">
                      <Loader2 size={16} className="animate-spin shrink-0" />
                      <span className="text-xs font-semibold">{ocrProgress}</span>
                    </div>
                  )}

                  {ocrError && (
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500 text-xs font-semibold">
                      {ocrError}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline dark:border-divider-dark">
                <button
                  type="button"
                  disabled={generating || ocrLoading}
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={generating || ocrLoading || !aiText.trim()}
                  onClick={handleAiGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang trích xuất...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Trích xuất với AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
