import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDeckDetails, fetchFlashcardsByDeck, importFlashcards, deleteFlashcard, clearCurrentDeck, updateFlashcard } from '../features/deck/deckSlice';
import { Upload, Star, X, Trash2, Volume2, Copy, Check, Pencil, Plus, Search, Play, Gamepad2, CheckSquare, FileText, Sparkles, HelpCircle } from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { deckApi } from '../services/deckApi';
import { speakChinese } from '../utils/tts';
import { useToast } from '../context/ToastContext';
import HoverableText from '../components/common/HoverableText';
import AiParagraphModal from '../components/common/AiParagraphModal';
import ConfirmModal from '../components/common/ConfirmModal';

const TOPICS = {
  1: { name: 'Cơ thể & Sinh học', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/5 dark:border-emerald-500/10' },
  2: { name: 'Sức khỏe & Y tế', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20 dark:bg-teal-500/5 dark:border-teal-500/10' },
  3: { name: 'Tâm lý & Nhận thức', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20 dark:bg-sky-500/5 dark:border-sky-500/10' },
  4: { name: 'Thời trang & Chăm sóc', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-500/5 dark:border-indigo-500/10' },
  5: { name: 'Gia đình & Vòng đời', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/5 dark:border-rose-500/10' },
  6: { name: 'Giao tiếp & Tương tác', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20 dark:bg-violet-500/5 dark:border-violet-500/10' },
  7: { name: 'Giáo dục & Học thuật', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/5 dark:border-purple-500/10' },
  8: { name: 'Tôn giáo & Triết học', color: 'bg-amber-700/10 text-amber-700 border-amber-700/20 dark:bg-amber-700/5 dark:border-amber-700/10' },
  9: { name: 'Địa lý & Cảnh quan', color: 'bg-green-600/10 text-green-600 border-green-600/20 dark:bg-green-600/5 dark:border-green-600/10' },
  10: { name: 'Khí hậu & Thời tiết', color: 'bg-blue-400/10 text-blue-500 border-blue-400/20 dark:bg-blue-400/5 dark:border-blue-400/10' },
  11: { name: 'Hệ sinh thái Động - Thực vật', color: 'bg-lime-600/10 text-lime-600 border-lime-600/20 dark:bg-lime-600/5 dark:border-lime-600/10' },
  12: { name: 'Vũ trụ & Thiên văn', color: 'bg-fuchsia-600/10 text-fuchsia-600 border-fuchsia-600/20 dark:bg-fuchsia-600/5 dark:border-fuchsia-600/10' },
  13: { name: 'Thương mại & Tài chính', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/5 dark:border-amber-500/10' },
  14: { name: 'Nghề nghiệp & Việc làm', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 dark:bg-orange-500/5 dark:border-orange-500/10' },
  15: { name: 'Chính trị & Pháp luật', color: 'bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-600/5 dark:border-blue-600/10' },
  16: { name: 'Quân sự & Quốc phòng', color: 'bg-red-600/10 text-red-600 border-red-600/20 dark:bg-red-600/5 dark:border-red-600/10' },
  17: { name: 'Nghệ thuật & Biểu diễn', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20 dark:bg-pink-500/5 dark:border-pink-500/10' },
  18: { name: 'Ẩm thực & Đồ uống', color: 'bg-yellow-600/10 text-yellow-600 border-yellow-600/20 dark:bg-yellow-600/5 dark:border-yellow-600/10' },
  19: { name: 'Thể thao & Trò chơi', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 dark:bg-cyan-500/5 dark:border-cyan-500/10' },
  20: { name: 'Du lịch & Khách sạn', color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20 dark:bg-emerald-600/5 dark:border-emerald-600/10' },
  21: { name: 'Khoa học tự nhiên & Đo lường', color: 'bg-stone-500/10 text-stone-500 border-stone-500/20 dark:bg-stone-500/5 dark:border-stone-500/10' },
  22: { name: 'Công nghệ thông tin & Viễn thông', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/10' },
  23: { name: 'Kỹ thuật & Sản xuất', color: 'bg-slate-600/10 text-slate-600 border-slate-600/20 dark:bg-slate-600/5 dark:border-slate-600/10' },
  24: { name: 'Giao thông & Hạ tầng', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 dark:bg-zinc-500/5 dark:border-zinc-500/10' },
};

const removeDiacritics = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
};

export default function DeckDetailScreen() {
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const currentDeck = useSelector((state) => state.deck.currentDeck);
  const flashcards = useSelector((state) => state.deck.flashcards);
  const totalCount = useSelector((state) => state.deck.totalCount);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [virtualDeck, setVirtualDeck] = useState(null);
  const [virtualCards, setVirtualCards] = useState([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAiParagraphModalOpen, setIsAiParagraphModalOpen] = useState(false);
  const [savedParagraphs, setSavedParagraphs] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [editFormData, setEditFormData] = useState({
    hanzi: '',
    pinyin: '',
    meaning: '',
    exampleHanzi: '',
    examplePinyin: '',
    exampleMeaning: '',
  });
  const isVirtual = id === 'favorites';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const getCardDetails = (card) => {
    const word = card.hanzi || card.front || '';
    let pinyin = card.pinyin || '';
    let meaning = card.meaning || '';
    let sinoVietnamese = card.sinoVietnamese || card.sv || '';

    // If pinyin/meaning are missing but back has '|', split it
    if ((!pinyin || !meaning) && card.back && card.back.includes('|')) {
      const parts = card.back.split('|');
      pinyin = pinyin || parts[0].trim();
      meaning = meaning || parts.slice(1).join('|').trim();
    } else if (!meaning && card.back) {
      meaning = card.back;
    }

    return {
      word,
      pinyin,
      meaning,
      sinoVietnamese,
      exampleHanzi: card.exampleHanzi,
      exampleMeaning: card.exampleMeaning,
      topicId: card.topicId
    };
  };

  const fetchParagraphs = () => {
    if (!isVirtual && id) {
      deckApi.getSavedParagraphs(id)
        .then((res) => {
          setSavedParagraphs(res.data || []);
        })
        .catch((err) => console.error('Failed to fetch saved paragraphs:', err));
    }
  };

  // Search debouncing effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    setSavedParagraphs([]);
    setSelectedTopicId(null);
    setSearchQuery('');

    if (isVirtual) {
      setVirtualDeck({
        title: 'Từ vựng yêu thích',
        description: 'Tập hợp tất cả các từ vựng bạn đã đánh dấu sao khi tra cứu từ điển hoặc trong khi học.',
        createdAt: new Date().toISOString(),
      });
      favoriteWordsApi.getFavorites()
        .then((res) => {
          const cards = (res.data || []).map((f) => ({
            id: f.id,
            front: f.hanzi,
            back: f.pinyin && f.vi ? `${f.pinyin} | ${f.vi}` : (f.vi || f.pinyin || ''),
          }));
          setVirtualCards(cards);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load virtual favorites deck:', err);
          setLoading(false);
        });
    } else if (id) {
      dispatch(clearCurrentDeck());

      const fetchDeckPromise = dispatch(fetchDeckDetails(id)).unwrap();
      const fetchParagraphsPromise = deckApi.getSavedParagraphs(id)
        .then((res) => {
          setSavedParagraphs(res.data || []);
        })
        .catch((err) => console.error('Failed to fetch saved paragraphs:', err));

      Promise.all([fetchDeckPromise, fetchParagraphsPromise])
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load deck data:', err);
          setLoading(false);
        });
    }
  }, [dispatch, id, isVirtual]);

  // Reset offset to 0 when search queries or topics change
  useEffect(() => {
    setOffset(0);
  }, [selectedTopicId, debouncedSearch]);

  // Load flashcards when deck, filters or offset changes
  useEffect(() => {
    if (isVirtual) return;
    if (!id) return;

    setCardsLoading(true);

    dispatch(fetchFlashcardsByDeck({
      deckId: id,
      limit: LIMIT,
      offset: offset,
      topicId: selectedTopicId || undefined,
      search: debouncedSearch || undefined,
    }))
      .unwrap()
      .then(() => setCardsLoading(false))
      .catch((err) => {
        console.error(err);
        setCardsLoading(false);
      });
  }, [dispatch, id, isVirtual, selectedTopicId, debouncedSearch, offset]);

  // Keep pageInput synchronized with current page number
  const [pageInput, setPageInput] = useState('1');
  useEffect(() => {
    const pageNum = Math.floor(offset / LIMIT) + 1;
    setPageInput(pageNum.toString());
  }, [offset]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!Array.isArray(json)) {
          showToast('Tệp tin JSON phải là một mảng các thẻ bài.', 'error');
          return;
        }

        const formattedData = json.map((item) => ({
          deckId: id,
          hanzi: item["Tiếng Trung"] || item.hanzi || item.front || '',
          pinyin: item["Pinyin"] || item.pinyin || '',
          meaning: item["Từ loại"]
            ? `(${item["Từ loại"]}) ${item["Dịch nghĩa"] || item.meaning || ''}`
            : (item["Dịch nghĩa"] || item.meaning || item.back || ''),
          exampleHanzi: item.exampleHanzi || null,
          examplePinyin: item.examplePinyin || null,
          exampleMeaning: item.exampleMeaning || null,
        }));

        await dispatch(importFlashcards(formattedData)).unwrap();
        showToast('Nhập dữ liệu từ file JSON thành công!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Lỗi: Không thể phân tích tệp tin JSON hoặc định dạng không hợp lệ.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };


  const user = useSelector((state) => state.auth.user);
  const displayDeck = isVirtual ? virtualDeck : currentDeck;
  const displayCards = isVirtual ? virtualCards : flashcards;

  const availableTopics = isVirtual
    ? [
      ...new Set(
        (virtualCards || [])
          .map((card) => getCardDetails(card).topicId)
          .filter((topicId) => !!topicId && TOPICS[topicId])
      )
    ].sort((a, b) => a - b)
    : (displayDeck?.topicIds || []);

  const totalPages = Math.ceil((isVirtual ? virtualCards.length : totalCount) / LIMIT) || 1;

  const canDelete = isVirtual || (displayDeck && (!displayDeck.isSystem || user?.role === 'ADMIN'));

  const handleDeleteCard = (cardId, front) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa thẻ từ vựng',
      message: `Bạn có chắc chắn muốn xóa thẻ "${front}" này khỏi bộ bài không?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          if (isVirtual) {
            await favoriteWordsApi.deleteFavorite(cardId);
            setVirtualCards((prev) => prev.filter((c) => c.id !== cardId));
            showToast('Đã xóa thẻ khỏi mục yêu thích.', 'success');
          } else {
            await dispatch(deleteFlashcard(cardId)).unwrap();
            showToast('Xóa thẻ bài thành công.', 'success');
          }
        } catch (err) {
          console.error(err);
          showToast('Có lỗi xảy ra khi xóa thẻ bài.', 'error');
        }
      }
    });
  };

  const canEdit = !isVirtual && (displayDeck && (!displayDeck.isSystem || user?.role === 'ADMIN'));

  const handleStartEdit = (card) => {
    setEditingCard(card);
    setEditFormData({
      hanzi: card.hanzi || card.front || '',
      pinyin: card.pinyin || '',
      meaning: card.meaning || '',
      exampleHanzi: card.exampleHanzi || '',
      examplePinyin: card.examplePinyin || '',
      exampleMeaning: card.exampleMeaning || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.hanzi.trim()) {
      showToast('Hán tự không được để trống.', 'error');
      return;
    }
    try {
      await dispatch(updateFlashcard({
        id: editingCard.id,
        data: {
          hanzi: editFormData.hanzi.trim(),
          pinyin: editFormData.pinyin.trim(),
          meaning: editFormData.meaning.trim(),
          exampleHanzi: editFormData.exampleHanzi.trim() || null,
          examplePinyin: editFormData.examplePinyin.trim() || null,
          exampleMeaning: editFormData.exampleMeaning.trim() || null,
        }
      })).unwrap();
      showToast('Cập nhật thẻ bài thành công!', 'success');
      setEditingCard(null);
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi cập nhật thẻ bài.', 'error');
    }
  };

  const handleDeleteParagraph = (paragraphId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa đoạn văn ôn tập',
      message: 'Bạn có chắc chắn muốn xóa đoạn văn đã lưu này không?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deckApi.deleteParagraph(id, paragraphId);
          setSavedParagraphs((prev) => prev.filter((p) => p.id !== paragraphId));
          showToast('Xóa đoạn văn đã lưu thành công.', 'success');
        } catch (err) {
          console.error(err);
          showToast('Có lỗi xảy ra khi xóa đoạn văn.', 'error');
        }
      }
    });
  };

  if (!displayDeck && loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/50 p-6 shadow-sm">
          <div className="h-7 bg-surface-bone dark:bg-surface-dark/70 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-surface-bone dark:bg-surface-dark/70 rounded w-2/3 mb-6"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-surface-bone dark:bg-surface-dark/70 rounded-full w-28"></div>
            <div className="h-10 bg-surface-bone dark:bg-surface-dark/70 rounded-full w-28"></div>
            <div className="h-10 bg-surface-bone dark:bg-surface-dark/70 rounded-full w-28"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-6 shadow-sm transition-colors">
        <div className="mb-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display tracking-tight flex items-center gap-2">
              {isVirtual && <Star className="text-amber-500 fill-amber-500 shrink-0" size={24} />}
              {displayDeck?.title || displayDeck?.name || 'Chi tiết bộ bài'}
            </h1>
            <p className="mt-2 text-sm text-body dark:text-on-dark-mute">{displayDeck?.description || 'Xem lại các thẻ bài và nhập thêm nếu cần thiết.'}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs font-semibold text-mute dark:text-on-dark-mute">
              <div className="flex items-center gap-1.5 bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5 rounded-full px-3 py-1.5 shadow-xs">
                <span className="text-body dark:text-on-dark/60 font-medium">Số lượng:</span>
                <span className="font-extrabold text-ink dark:text-on-dark min-w-[40px] inline-flex items-center justify-center">
                  {loading ? (
                    <span className="inline-block bg-surface-bone dark:bg-surface-dark/60 h-3.5 w-10 rounded animate-pulse"></span>
                  ) : (
                    `${isVirtual ? virtualCards.length : totalCount} thẻ`
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5 rounded-full px-3 py-1.5 shadow-xs">
                <span className="text-body dark:text-on-dark/60 font-medium">Ngày tạo:</span>
                <span className="font-extrabold text-ink dark:text-on-dark">{displayDeck?.createdAt ? new Date(displayDeck.createdAt).toLocaleDateString() : '---'}</span>
              </div>
              {displayDeck?.language && (
                <div className="flex items-center gap-1.5 bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5 rounded-full px-3 py-1.5 shadow-xs">
                  <span className="text-body dark:text-on-dark/60 font-medium">Ngôn ngữ:</span>
                  <span className="font-extrabold text-ink dark:text-on-dark">{displayDeck.language === 'EN' ? 'Tiếng Anh' : 'Tiếng Trung'}</span>
                </div>
              )}
            </div>
          </div>
          {/* Action Buttons Panel */}
          <div className="mt-6 w-full lg:mt-0 lg:w-[360px] lg:shrink-0 bg-surface-bone/20 dark:bg-zinc-900/10 lg:bg-surface-bone/45 lg:dark:bg-zinc-900/25 border border-hairline dark:border-divider-dark/50 rounded-2xl p-4 lg:p-5 flex flex-col gap-4 shadow-xs">
            {/* Primary Study Action */}
            <button
              type="button"
              onClick={() => navigate(`/study?deckId=${id}${selectedTopicId ? `&topicId=${selectedTopicId}` : ''}`)}
              className="w-full rounded-xl bg-primary hover:bg-primary-deep text-white py-3.5 text-sm font-extrabold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={16} className="fill-white" />
              <span>Học ngay</span>
            </button>

            {/* Study & Game Modes Grid (2 columns on all viewports for tight grid alignment) */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {!isVirtual && (
                <button
                  type="button"
                  onClick={() => navigate(`/decks/${id}/game`)}
                  className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-3 py-2.5 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs hover:border-primary/50"
                >
                  <Gamepad2 size={13} className="text-primary" />
                  <span>Chơi Game</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(`/decks/${id}/quiz`)}
                className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-3 py-2.5 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs hover:border-primary/50"
              >
                <CheckSquare size={13} className="text-primary" />
                <span>Trắc nghiệm</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/decks/${id}/dictation`)}
                className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-3 py-2.5 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs hover:border-primary/50"
              >
                <FileText size={13} className="text-primary" />
                <span>Nghe viết</span>
              </button>
              {!isVirtual && (
                <button
                  type="button"
                  onClick={() => setIsAiParagraphModalOpen(true)}
                  className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-3 py-2.5 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs hover:border-primary/50"
                >
                  <Sparkles size={13} className="text-primary" />
                  <span>Đoạn văn AI</span>
                </button>
              )}
            </div>

            {/* Utilities Row (File Imports, Manual Card Creation) */}
            {!isVirtual && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-hairline dark:border-divider-dark/30 pt-4 w-full">
                <button
                  type="button"
                  onClick={() => navigate(`/flashcards/new?deckId=${id}`)}
                  className="flex-1 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-3 py-2 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs hover:border-primary/50"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Thêm thẻ</span>
                </button>
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-3 py-2 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs hover:border-primary/50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nhập JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHelpModalOpen(true)}
                    className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-mute hover:text-ink dark:hover:text-on-dark w-8 h-8 flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                    title="Hướng dẫn cấu trúc file JSON"
                  >
                    <HelpCircle size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/30 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-ink dark:text-on-dark font-display tracking-tight shrink-0">Danh sách thẻ bài</h2>

              <div className="relative flex-1 max-w-md w-full sm:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mute dark:text-on-dark-mute w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thẻ từ vựng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-10 py-1.5 bg-surface-bone dark:bg-white/5 border border-hairline dark:border-divider-dark/50 rounded-full text-xs text-ink dark:text-on-dark focus:outline-none focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-mute"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink dark:hover:text-on-dark cursor-pointer bg-transparent border-none p-0.5 flex items-center justify-center"
                    title="Xóa tìm kiếm"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {availableTopics.length > 0 && (
              <div className="mt-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-thin select-none border-b border-hairline dark:border-divider-dark/30">
                <span className="text-xs font-extrabold text-mute shrink-0 mr-1">Chủ đề:</span>
                <button
                  type="button"
                  onClick={() => setSelectedTopicId(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border active:scale-95 shrink-0 ${selectedTopicId === null
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-mute border-hairline hover:border-primary/20'
                    }`}
                >
                  Tất cả ({isVirtual ? virtualCards.length : (displayDeck?.cardsCount || 0)})
                </button>
                {availableTopics.map((topicId) => {
                  const topic = TOPICS[topicId];
                  const displayLabel = isVirtual
                    ? `${topic.name} (${virtualCards.filter(c => Number(getCardDetails(c).topicId) === Number(topicId)).length})`
                    : `${topic.name} (${displayDeck?.topicCounts?.[topicId] || 0})`;
                  return (
                    <button
                      key={topicId}
                      type="button"
                      onClick={() => setSelectedTopicId(topicId)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border active:scale-95 shrink-0 ${selectedTopicId === topicId
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-mute border-hairline hover:border-primary/20'
                        }`}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pr-2 max-h-[650px] overflow-y-auto pt-1">
              {cardsLoading && offset === 0 ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-bone/30 dark:bg-surface-dark/10 border border-hairline dark:border-divider-dark/50 p-4 rounded-xl flex gap-3 shadow-xs justify-between items-start animate-pulse"
                  >
                    <div className="flex gap-3 min-w-0 w-full">
                      <div className="h-8 w-8 rounded-full bg-surface-bone dark:bg-surface-dark/60 shrink-0" />
                      <div className="space-y-3 min-w-0 w-full flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <div className="h-5 bg-surface-bone dark:bg-surface-dark/60 rounded w-1/4" />
                          <div className="h-4 bg-surface-bone dark:bg-surface-dark/60 rounded w-1/5" />
                        </div>
                        <div className="h-4 bg-surface-bone dark:bg-surface-dark/60 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))
              ) : displayCards?.length > 0 ? (
                (() => {
                  const filteredCards = isVirtual
                    ? displayCards.filter(card => {
                      const { word, pinyin, meaning, sinoVietnamese, topicId } = getCardDetails(card);

                      if (selectedTopicId !== null && Number(topicId) !== Number(selectedTopicId)) {
                        return false;
                      }

                      const q = removeDiacritics(searchQuery).trim();
                      if (!q) return true;

                      const cleanWord = removeDiacritics(word);
                      const cleanPinyin = removeDiacritics(pinyin);
                      const cleanMeaning = removeDiacritics(meaning);
                      const cleanSino = removeDiacritics(sinoVietnamese);

                      return (
                        cleanWord.includes(q) ||
                        cleanPinyin.includes(q) ||
                        cleanMeaning.includes(q) ||
                        cleanSino.includes(q)
                      );
                    })
                    : displayCards;

                  if (filteredCards.length === 0) {
                    const topicText = selectedTopicId ? `trong chủ đề "${TOPICS[selectedTopicId]?.name}" ` : '';
                    return (
                      <div className="rounded-md border border-dashed border-hairline dark:border-divider-dark bg-surface-bone/30 dark:bg-surface-dark/20 p-5 text-sm text-mute dark:text-on-dark-mute text-center col-span-full py-8">
                        {searchQuery
                          ? `Không tìm thấy thẻ từ vựng nào ${topicText}khớp với từ khóa "${searchQuery}".`
                          : `Không có thẻ từ vựng nào ${topicText}trong bộ bài này.`
                        }
                      </div>
                    );
                  }

                  return filteredCards.map((card) => {
                    const { word, pinyin, meaning, sinoVietnamese, exampleHanzi, exampleMeaning, topicId } = getCardDetails(card);
                    const isEnglish = displayDeck?.language === 'EN';

                    return (
                      <div
                        key={card.id || card.front}
                        className="bg-surface-bone/50 dark:bg-surface-dark/20 border border-hairline dark:border-divider-dark p-4 rounded-xl flex gap-3 shadow-xs justify-between group hover:border-primary/30 transition-colors relative"
                      >
                        <div className="flex gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => speakChinese(word, isEnglish ? 'en-US' : 'zh-CN')}
                            className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 shrink-0 cursor-pointer"
                            title="Nghe phát âm"
                          >
                            <Volume2 size={13} />
                          </button>

                          <div className="space-y-2 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="font-display font-extrabold text-lg text-ink dark:text-on-dark leading-tight">
                                <HoverableText text={word} />
                              </span>
                              {pinyin && (
                                <span className="text-sm font-mono font-bold text-primary">{pinyin}</span>
                              )}
                              {!isEnglish && sinoVietnamese && (
                                <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider select-none" title="Hán Việt">
                                  {sinoVietnamese}
                                </span>
                              )}
                              {topicId && TOPICS[topicId] && (
                                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${TOPICS[topicId].color}`} title="Chủ đề từ vựng">
                                  🏷️ {TOPICS[topicId].name}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed">
                              {meaning}
                            </p>

                            {exampleHanzi && (
                              <p className="text-[10.5px] leading-relaxed text-mute dark:text-on-dark-mute border-l-2 border-primary/20 pl-2 mt-1">
                                <span className="text-ink dark:text-on-dark font-medium">{exampleHanzi}</span>
                                {exampleMeaning && <span className="text-mute block sm:inline sm:ml-1">— {exampleMeaning}</span>}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(card)}
                              className="p-1 rounded-full hover:bg-primary/10 text-mute hover:text-primary transition-colors cursor-pointer"
                              title="Sửa thẻ này"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.id, word)}
                              className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-mute hover:text-red-500 transition-colors cursor-pointer"
                              title="Xóa thẻ này"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="rounded-md border border-dashed border-hairline dark:border-divider-dark bg-surface-bone/30 dark:bg-surface-dark/20 p-5 text-sm text-mute dark:text-on-dark-mute text-center col-span-full">
                  Bộ bài này chưa có thẻ nào.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!isVirtual && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4 pb-6 select-none">
                {/* Prev Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (offset > 0) {
                      const nextOffset = offset - LIMIT;
                      setOffset(nextOffset);
                      const listEl = document.querySelector('.max-h-\\[650px\\]');
                      if (listEl) listEl.scrollTop = 0;
                    }
                  }}
                  disabled={offset === 0 || cardsLoading}
                  className="px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-mute hover:text-ink dark:hover:text-on-dark text-[11px] sm:text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                >
                  &larr; <span className="hidden sm:inline">Trang</span> trước
                </button>

                {/* Page Number Manual Input */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-mute shrink-0">
                  <span className="hidden sm:inline">Trang</span>
                  <input
                    type="text"
                    value={pageInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setPageInput(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    onBlur={() => {
                      let val = parseInt(pageInput, 10);
                      if (isNaN(val) || val < 1) {
                        val = 1;
                      } else if (val > totalPages) {
                        val = totalPages;
                      }
                      setPageInput(val.toString());
                      setOffset((val - 1) * LIMIT);
                      const listEl = document.querySelector('.max-h-\\[650px\\]');
                      if (listEl) listEl.scrollTop = 0;
                    }}
                    className="w-10 sm:w-12 px-1.5 py-0.5 sm:py-1 text-center border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark text-ink dark:text-on-dark rounded font-mono font-bold text-[11px] sm:text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                  <span>/ {totalPages}</span>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (offset + LIMIT < totalCount) {
                      const nextOffset = offset + LIMIT;
                      setOffset(nextOffset);
                      const listEl = document.querySelector('.max-h-\\[650px\\]');
                      if (listEl) listEl.scrollTop = 0;
                    }
                  }}
                  disabled={offset + LIMIT >= totalCount || cardsLoading}
                  className="px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-mute hover:text-ink dark:hover:text-on-dark text-[11px] sm:text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                >
                  Trang sau &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isVirtual && savedParagraphs.length > 0 && (
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/50 p-6 shadow-sm mt-6">
          <h3 className="text-lg font-bold text-ink dark:text-on-dark font-display flex items-center gap-2">
            📚 Đoạn văn ôn tập đã lưu ({savedParagraphs.length})
          </h3>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-1 mb-5">
            Danh sách các đoạn văn do AI viết từ từ vựng trong bộ bài được bạn chọn lưu trữ lại.
          </p>

          <div className="space-y-6">
            {savedParagraphs.map((paragraph) => (
              <SavedParagraphCard
                key={paragraph.id}
                paragraph={paragraph}
                onDelete={handleDeleteParagraph}
              />
            ))}
          </div>
        </div>
      )}

      {isHelpModalOpen && (
        <JsonFormatHelpModal onClose={() => setIsHelpModalOpen(false)} />
      )}
      {isAiParagraphModalOpen && (
        <AiParagraphModal
          deckId={id}
          flashcards={displayCards}
          onClose={() => setIsAiParagraphModalOpen(false)}
          onSaveSuccess={fetchParagraphs}
        />
      )}
      {editingCard && (
        <EditFlashcardModal
          card={editingCard}
          formData={editFormData}
          setFormData={setEditFormData}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveEdit}
        />
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

// ─── Edit Flashcard Modal ───────────────────────────────────────────────────
function EditFlashcardModal({ card, formData, setFormData, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-card dark:bg-surface-dark rounded-xl shadow-xl max-w-xl w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
          <h3 className="text-base font-bold text-ink dark:text-on-dark font-display">
            Chỉnh sửa thẻ bài
          </h3>
          <button onClick={onClose} className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer bg-transparent border-none">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm text-body dark:text-on-dark-mute leading-relaxed font-sans">

            {/* Row 1: Hanzi & Pinyin */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                  Hán tự (Hanzi) <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.hanzi}
                  onChange={(e) => setFormData({ ...formData, hanzi: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                  Phiên âm (Pinyin)
                </label>
                <input
                  type="text"
                  value={formData.pinyin}
                  onChange={(e) => setFormData({ ...formData, pinyin: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                />
              </div>
            </div>

            {/* Meaning */}
            <div>
              <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                Ý nghĩa <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.meaning}
                onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
              />
            </div>

            <hr className="border-hairline dark:border-divider-dark" />

            {/* Example Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">
                Ví dụ minh họa (Tùy chọn)
              </h4>

              <div>
                <label className="block text-xs font-semibold text-mute mb-1">
                  Hán tự ví dụ
                </label>
                <input
                  type="text"
                  value={formData.exampleHanzi}
                  onChange={(e) => setFormData({ ...formData, exampleHanzi: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-mute mb-1">
                    Phiên âm ví dụ
                  </label>
                  <input
                    type="text"
                    value={formData.examplePinyin}
                    onChange={(e) => setFormData({ ...formData, examplePinyin: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-mute mb-1">
                    Nghĩa ví dụ
                  </label>
                  <input
                    type="text"
                    value={formData.exampleMeaning}
                    onChange={(e) => setFormData({ ...formData, exampleMeaning: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="px-6 py-4 border-t border-hairline dark:border-divider-dark flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black rounded-full font-bold text-xs cursor-pointer transition-colors bg-transparent"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-deep text-white font-bold text-xs rounded-full cursor-pointer transition-colors shadow-xs"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Help Modal ──────────────────────────────────────────────────────────────
function JsonFormatHelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-card dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
          <h3 className="text-base font-bold text-ink dark:text-on-dark font-display flex items-center gap-2">
            Hướng dẫn định dạng file JSON
          </h3>
          <button onClick={onClose} className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-body dark:text-on-dark-mute leading-relaxed font-sans">
          <p>
            Hệ thống hỗ trợ nhập bộ thẻ hàng loạt từ tệp tin <strong>.json</strong>. Tệp tin phải chứa một mảng các đối tượng thẻ bài. Bạn có thể sử dụng một trong hai định dạng dưới đây:
          </p>

          <div className="space-y-2">
            <div className="font-bold text-ink dark:text-on-dark">Định dạng 1 (Cơ bản - Tiếng Anh):</div>
            <pre className="bg-surface-bone dark:bg-black/30 p-3 rounded-lg overflow-x-auto font-mono text-[11px] text-primary">
              {`[
  {
    "hanzi": "你",
    "pinyin": "nǐ",
    "meaning": "bạn, anh, chị (ngôi thứ hai số ít)",
    "exampleHanzi": "你好",
    "examplePinyin": "nǐ hǎo",
    "exampleMeaning": "Chào bạn"
  }
]`}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-ink dark:text-on-dark">Định dạng 2 (Nâng cao - Tiếng Việt):</div>
            <pre className="bg-surface-bone dark:bg-black/30 p-3 rounded-lg overflow-x-auto font-mono text-[11px] text-primary">
              {`[
  {
    "Tiếng Trung": "你",
    "Pinyin": "nǐ",
    "Từ loại": "Đại từ",
    "Dịch nghĩa": "Bạn, anh, chị",
    "exampleHanzi": "你好",
    "examplePinyin": "nǐ hǎo",
    "exampleMeaning": "Chào bạn"
  }
]`}
            </pre>
          </div>

          <div className="border-t border-hairline dark:border-divider-dark pt-3">
            <h4 className="font-bold text-ink dark:text-on-dark mb-1">Mô tả các trường thông tin:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>hanzi</strong> hoặc <strong>Tiếng Trung</strong> (Bắt buộc): Từ vựng hoặc câu tiếng Hán.</li>
              <li><strong>pinyin</strong> hoặc <strong>Pinyin</strong> (Tùy chọn): Phiên âm Pinyin tương ứng.</li>
              <li><strong>meaning</strong> / <strong>Dịch nghĩa</strong> / <strong>Từ loại</strong> (Tùy chọn): Định nghĩa tiếng Việt của từ. Nếu có cả <i>Từ loại</i> và <i>Dịch nghĩa</i>, chúng sẽ tự động được ghép lại dưới dạng <code>(Từ loại) Dịch nghĩa</code>.</li>
              <li>Các trường ví dụ (Tùy chọn): <strong>exampleHanzi</strong> (Câu ví dụ tiếng Hán), <strong>examplePinyin</strong> (Phiên âm ví dụ), <strong>exampleMeaning</strong> (Dịch nghĩa ví dụ).</li>
            </ul>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-hairline dark:border-divider-dark flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-primary hover:bg-primary-deep text-white font-bold text-xs rounded-full cursor-pointer transition-colors shadow-xs">
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Saved Paragraph Card Component ──────────────────────────────────────────
function SavedParagraphCard({ paragraph, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();
    speakChinese(paragraph.hanzi);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(paragraph.hanzi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(paragraph.id);
  };

  return (
    <div className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone/30 dark:bg-black/10 p-5 space-y-4 hover:shadow-md transition-all relative">
      <div className="flex items-start justify-between gap-4">
        <div className="pr-24 space-y-1">
          <div className="text-[10px] font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
            Từ vựng ôn tập: {paragraph.words.join(', ')}
          </div>
          <div className="text-xl font-extrabold text-ink dark:text-on-dark font-display leading-loose">
            <HoverableText text={paragraph.hanzi} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSpeak}
            className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark hover:text-primary transition cursor-pointer active:scale-95 shadow-xs"
            title="Nghe đọc"
          >
            <Volume2 size={14} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark hover:text-primary transition cursor-pointer active:scale-95 shadow-xs"
            title="Sao chép"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-red-50 dark:hover:bg-red-950/20 text-mute hover:text-red-500 transition cursor-pointer active:scale-95 shadow-xs"
            title="Xóa đoạn văn"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="border-t border-hairline dark:border-divider-dark/50 pt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          {expanded ? '🔼 Thu gọn phiên âm & dịch nghĩa' : '🔽 Xem phiên âm & dịch nghĩa'}
        </button>

        {expanded && (
          <div className="grid gap-4 md:grid-cols-2 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-4 rounded-lg bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark/50">
              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">
                Phiên âm Pinyin
              </div>
              <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium">
                {paragraph.pinyin}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark/50">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">
                Dịch nghĩa Tiếng Việt
              </div>
              <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium">
                {paragraph.meaning}
              </p>
            </div>

            {paragraph.wordUsage && (
              <div className="md:col-span-2 mt-2 space-y-2">
                <div className="text-[10px] font-bold text-ink dark:text-on-dark uppercase tracking-wider">
                  Giải nghĩa từ vựng trong văn cảnh
                </div>
                <div className="border border-hairline dark:border-divider-dark rounded-lg overflow-hidden divide-y divide-hairline dark:divide-divider-dark bg-surface-card dark:bg-surface-dark/25">
                  {(Array.isArray(paragraph.wordUsage) ? paragraph.wordUsage : []).map((item, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-start gap-2 hover:bg-surface-bone/10 transition-colors">
                      <div className="sm:w-1/4 shrink-0">
                        <span className="text-xs font-bold text-ink dark:text-on-dark">{item.word}</span>
                        <span className="block text-[10px] text-mute dark:text-on-dark-mute font-medium">{item.pinyin} - {item.meaning}</span>
                      </div>
                      <div className="text-xs text-body dark:text-on-dark-mute font-medium leading-relaxed">
                        {item.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
