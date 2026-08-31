import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAllDecks, createFlashcard, createDeck, importFlashcards, fetchFlashcardsByDeck } from '../features/deck/deckSlice';
import { PlusCircle, ArrowLeft, Sparkles, CheckSquare, Square, Save, Loader2 } from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';
import HandwritingCanvas from '../components/common/HandwritingCanvas';
import { aiFlashcardApi } from '../services/aiFlashcardApi';
import { useToast } from '../context/ToastContext';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'manual', label: '✍️ Tạo thủ công' },
  { id: 'ai', label: '✨ Tạo bằng AI' },
];

// ─── HSK Level options ────────────────────────────────────────────────────────
const HSK_LEVELS = [
  { value: null, label: 'Không giới hạn' },
  { value: 1, label: 'HSK 1' },
  { value: 2, label: 'HSK 2' },
  { value: 3, label: 'HSK 3' },
  { value: 4, label: 'HSK 4' },
  { value: 5, label: 'HSK 5' },
  { value: 6, label: 'HSK 6' },
];

const COUNT_OPTIONS = [5, 10, 15, 20, 30];

export default function CreateFlashcardScreen() {
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryDeckId = searchParams.get('deckId') || '';

  const decks = useSelector((state) => state.deck.decks);
  const isLoading = useSelector((state) => state.deck.isLoading);

  const { lookupMultiple, loading: isDictLoading } = useDictionary();

  const [activeTab, setActiveTab] = useState('manual');

  // ── Manual tab state ──
  const [formData, setFormData] = useState({
    deckId: queryDeckId,
    hanzi: '',
    pinyin: '',
    meaning: '',
    radicals: '',
    exampleHanzi: '',
    examplePinyin: '',
    exampleMeaning: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  const [lastEditedField, setLastEditedField] = useState(null);
  const [suggestions, setSuggestions] = useState({
    field: null,
    list: []
  });

  const [showHandwriting, setShowHandwriting] = useState(false);

  // ── AI tab state ──
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [aiHskLevel, setAiHskLevel] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiCards, setAiCards] = useState([]); // generated cards
  const [selectedCards, setSelectedCards] = useState(new Set()); // indices
  const [aiSaveDeckId, setAiSaveDeckId] = useState(queryDeckId);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaveMsg, setAiSaveMsg] = useState({ type: '', text: '' });

  // ── Inline Deck Creation State ──
  const [showNewDeckInput, setShowNewDeckInput] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  const handleCreateNewDeck = async () => {
    if (!newDeckTitle.trim()) return;
    try {
      setIsCreatingDeck(true);
      const newDeck = await dispatch(createDeck({ title: newDeckTitle.trim(), description: 'Bộ bài học mới' })).unwrap();
      setFormData((prev) => ({ ...prev, deckId: String(newDeck.id) }));
      setAiSaveDeckId(String(newDeck.id));
      setShowNewDeckInput(false);
      setNewDeckTitle('');
      showToast('Đã tạo bộ bài mới thành công!', 'success');
    } catch (err) {
      console.error('Failed to create new deck:', err);
      showToast('Không thể tạo bộ bài mới. Vui lòng thử lại.', 'error');
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const [existingWords, setExistingWords] = useState([]);

  useEffect(() => {
    if (aiSaveDeckId) {
      dispatch(fetchFlashcardsByDeck(Number(aiSaveDeckId)))
        .unwrap()
        .then((cards) => {
          const words = cards.map(c => c.hanzi || c.character || '');
          setExistingWords(words);
        })
        .catch(err => console.error('Failed to fetch existing cards:', err));
    } else {
      setExistingWords([]);
    }
  }, [aiSaveDeckId, dispatch]);

  // Relevance sorting helper to penalize variants and boost common words
  const getSortScore = (item) => {
    if (!item) return 0;
    const vi = (item.vi || '').toLowerCase();
    let score = 0;

    // 1. Common Word Boost
    if (item.hsk) {
      score += (10 - item.hsk) * 200; // HSK 1 gets +1800
    }
    if (item.b) {
      score += item.b * 10;
    }
    if (item.bwr) {
      score -= item.bwr * 0.1;
    }

    // 2. Archaic/Rare Variant Penalty
    const isVariant =
      vi.includes('biến thể cổ của') ||
      vi.includes('biến thể của') ||
      vi.includes('biến thể cũ của') ||
      vi.includes('chữ cổ') ||
      vi.includes('địa phương');
    if (isVariant) {
      score -= 8000;
    }
    return score;
  };

  // Handle dictionary search — only fills in fields that are CURRENTLY EMPTY
  // so it never overwrites data the user has already typed manually.
  const handleLookup = async (field, value) => {
    if (!value || field === 'meaning') return; // Skip lookup for the meaning field
    const candidates = await lookupMultiple(field, value);
    if (candidates && candidates.length > 0) {
      const sorted = [...candidates].sort((a, b) => getSortScore(b) - getSortScore(a));
      const result = sorted[0];
      setFormData((prev) => {
        const updated = { ...prev };
        // Only auto-fill a field if it is currently empty (don't overwrite manual input)
        if (field !== 'hanzi' && !prev.hanzi.trim()) {
          updated.hanzi = result.s || '';
        }
        if (field !== 'pinyin' && !prev.pinyin.trim()) {
          updated.pinyin = result.p || '';
        }
        if (field !== 'meaning' && !prev.meaning.trim()) {
          updated.meaning = result.vi || '';
        }
        return updated;
      });
    }
  };

  // Trigger lookup on blur only when the blurred field has a value.
  // Clean up the suggestion dropdown after a short delay.
  const handleBlur = (field) => {
    if (field !== 'meaning' && formData[field]?.trim()) {
      handleLookup(field, formData[field]);
    }
    setTimeout(() => {
      setSuggestions((prev) => {
        if (prev.field === field) {
          return { field: null, list: [] };
        }
        return prev;
      });
    }, 250);
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (item) => {
    setFormData((prev) => ({
      ...prev,
      hanzi: item.s || prev.hanzi,
      pinyin: item.p || prev.pinyin,
      meaning: item.vi || prev.meaning,
    }));
    setSuggestions({ field: null, list: [] });
    setLastEditedField(null);
  };

  // Query autocomplete suggestions as user types.
  // We intentionally only depend on the current field's value (via lastEditedField),
  // not ALL form fields — to avoid re-triggering when other fields are auto-filled.
  // We also skip dictionary suggestion logic for the 'meaning' field to prevent unwanted dropdowns.
  const lastEditedValue = lastEditedField ? formData[lastEditedField] : null;
  useEffect(() => {
    if (!lastEditedField || lastEditedField === 'meaning' || !lastEditedValue || lastEditedValue.trim().length < 1) {
      setSuggestions({ field: null, list: [] });
      return;
    }

    const handler = setTimeout(async () => {
      const candidates = await lookupMultiple(lastEditedField, lastEditedValue);
      const sorted = [...candidates].sort((a, b) => getSortScore(b) - getSortScore(a));
      setSuggestions({
        field: lastEditedField,
        list: sorted
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [lastEditedValue, lastEditedField, lookupMultiple]);

  useEffect(() => {
    dispatch(fetchAllDecks());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.deckId) {
      setErrorMsg('Vui lòng chọn một bộ bài!');
      return;
    }

    try {
      const payload = {
        deckId: Number(formData.deckId),
        hanzi: formData.hanzi,
        pinyin: formData.pinyin,
        meaning: formData.meaning,
        radicals: formData.radicals || undefined,
        exampleHanzi: formData.exampleHanzi || undefined,
        examplePinyin: formData.examplePinyin || undefined,
        exampleMeaning: formData.exampleMeaning || undefined,
      };

      await dispatch(createFlashcard(payload)).unwrap();

      // Auto-redirect to the deck detail screen
      navigate(`/decks/${formData.deckId}`);
    } catch (err) {
      console.error(err);
      if (err && (err.statusCode === 409 || err.error === 'Conflict' || err.message === 'Flashcard already exists')) {
        setErrorMsg('Thẻ bài này đã tồn tại trong bộ bài này!');
      } else {
        setErrorMsg(err?.message || 'Tạo thẻ mới thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    }
  };

  // ─── AI generation ────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    try {
      setAiGenerating(true);
      setAiError('');
      setAiCards([]);
      setSelectedCards(new Set());
      setAiSaveMsg({ type: '', text: '' });
      const res = await aiFlashcardApi.generate(aiTopic.trim(), aiCount, aiHskLevel, existingWords);
      const cards = res.data?.cards || res.data || [];
      setAiCards(cards);
      // Select all by default
      setSelectedCards(new Set(cards.map((_, i) => i)));
    } catch (err) {
      console.error(err);
      setAiError(err.response?.data?.message || 'Không thể tạo flashcard bằng AI. Vui lòng thử lại.');
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleCardSelection = (idx) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCards.size === aiCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(aiCards.map((_, i) => i)));
    }
  };

  const handleAiSave = async () => {
    if (!aiSaveDeckId) {
      setAiSaveMsg({ type: 'error', text: 'Vui lòng chọn bộ bài để lưu thẻ!' });
      return;
    }
    if (selectedCards.size === 0) {
      setAiSaveMsg({ type: 'error', text: 'Vui lòng chọn ít nhất một thẻ!' });
      return;
    }

    try {
      setAiSaving(true);
      setAiSaveMsg({ type: '', text: '' });
      const cardsToSave = aiCards
        .filter((_, i) => selectedCards.has(i))
        .map((card) => ({
          deckId: Number(aiSaveDeckId),
          hanzi: card.hanzi || card.chinese || card.word || '',
          pinyin: card.pinyin || '',
          meaning: card.meaning || card.vietnamese || card.definition || '',
          exampleHanzi: card.exampleHanzi || card.example || undefined,
          examplePinyin: card.examplePinyin || undefined,
          exampleMeaning: card.exampleMeaning || undefined,
        }));

      await dispatch(importFlashcards(cardsToSave)).unwrap();

      setAiSaveMsg({ type: 'success', text: `Đã lưu ${cardsToSave.length} thẻ thành công!` });
      // Optionally redirect
      setTimeout(() => navigate(`/decks/${aiSaveDeckId}`), 1000);
    } catch (err) {
      console.error(err);
      setAiSaveMsg({ type: 'error', text: 'Lưu thẻ thất bại. Vui lòng thử lại.' });
    } finally {
      setAiSaving(false);
    }
  };

  return (
    <div className={`mx-auto space-y-6 transition-all duration-300 ${showHandwriting && activeTab === 'manual' ? 'max-w-5xl' : 'max-w-2xl'}`}>

      {/* Back button and Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PlusCircle size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display tracking-tight">Thêm thẻ mới</h1>
            <p className="text-mute dark:text-on-dark-mute text-sm mt-0.5">Tạo thêm thẻ từ vựng vào bộ bài của bạn.</p>
          </div>
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

      {/* ════════════════════ TAB: MANUAL ════════════════════ */}
      {activeTab === 'manual' && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-card dark:bg-surface-dark/50 p-6 rounded-md border border-hairline dark:border-divider-dark shadow-sm transition-colors"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Form Fields Column */}
            <div className="flex-1 space-y-6">

              {/* Deck Dropdown Selector */}
              <div>
                <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                  Chọn bộ bài <span className="text-primary">*</span>
                </label>
                <select
                  required
                  value={formData.deckId}
                  onChange={(e) => setFormData({ ...formData, deckId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark cursor-pointer"
                >
                  <option value="" className="dark:bg-surface-dark">-- Chọn bộ bài để lưu thẻ --</option>
                  {decks.filter(d => !d.isSystem).map((deck) => (
                    <option key={deck.id} value={deck.id} className="dark:bg-surface-dark">
                      {deck.title || deck.name}
                    </option>
                  ))}
                </select>

                {/* Inline Deck Creation */}
                {showNewDeckInput ? (
                  <div className="flex gap-2 items-center mt-2">
                    <input
                      type="text"
                      placeholder="Tên bộ bài mới..."
                      value={newDeckTitle}
                      onChange={(e) => setNewDeckTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateNewDeck(); } }}
                      className="flex-1 px-4 py-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewDeck}
                      disabled={isCreatingDeck || !newDeckTitle.trim()}
                      className="px-4 py-2 bg-primary hover:bg-primary-deep text-white text-xs font-bold rounded-full transition-colors disabled:bg-stone cursor-pointer"
                    >
                      {isCreatingDeck ? 'Đang tạo...' : 'Lưu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewDeckInput(false); setNewDeckTitle(''); }}
                      className="px-4 py-2 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-xs font-bold rounded-full transition-colors cursor-pointer bg-transparent"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="mt-1.5 pl-2">
                    <button
                      type="button"
                      onClick={() => setShowNewDeckInput(true)}
                      className="text-xs font-semibold text-primary dark:text-link hover:underline bg-transparent border-none p-0 cursor-pointer flex items-center gap-1"
                    >
                      ➕ Tạo bộ bài cá nhân mới
                    </button>
                  </div>
                )}
              </div>

              {/* Vocabulary Fields */}
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Hán tự (Hanzi) <span className="text-primary">*</span></span>
                    <div className="flex items-center gap-1.5">
                      {isDictLoading && (
                        <span className="text-[10px] text-mute dark:text-on-dark-mute font-normal animate-pulse">
                          Đang tra...
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowHandwriting(!showHandwriting)}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 cursor-pointer ${showHandwriting
                          ? 'bg-primary border-transparent text-white'
                          : 'bg-primary dark:bg-black/30 border-hairline dark:border-divider-dark text-white hover:text-ink dark:hover:text-on-dark'
                          }`}
                      >
                        {showHandwriting ? 'Đóng viết' : 'Viết tay'}
                      </button>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 你"
                      value={formData.hanzi}
                      onChange={(e) => {
                        setFormData({ ...formData, hanzi: e.target.value });
                        setLastEditedField('hanzi');
                      }}
                      onBlur={() => handleBlur('hanzi')}
                      className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                    />
                    {suggestions.field === 'hanzi' && suggestions.list.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md shadow-sm max-h-60 overflow-y-auto divide-y divide-hairline dark:divide-divider-dark">
                        {suggestions.list.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => handleSelectSuggestion(item)}
                            className="w-full text-left px-4 py-2 hover:bg-surface-bone dark:hover:bg-black flex flex-col gap-0.5 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-ink dark:text-on-dark font-display text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                              <span className="text-xs text-primary dark:text-link font-bold">{item.p}</span>
                            </div>
                            <span className="text-xs text-body dark:text-on-dark-mute truncate">{item.vi}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                    Phiên âm (Pinyin) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: nǐ"
                      value={formData.pinyin}
                      onChange={(e) => {
                        setFormData({ ...formData, pinyin: e.target.value });
                        setLastEditedField('pinyin');
                      }}
                      onBlur={() => handleBlur('pinyin')}
                      className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                    />
                    {suggestions.field === 'pinyin' && suggestions.list.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md shadow-sm max-h-60 overflow-y-auto divide-y divide-hairline dark:divide-divider-dark">
                        {suggestions.list.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => handleSelectSuggestion(item)}
                            className="w-full text-left px-4 py-2 hover:bg-surface-bone dark:hover:bg-black flex flex-col gap-0.5 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-ink dark:text-on-dark font-display text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                              <span className="text-xs text-primary dark:text-link font-bold">{item.p}</span>
                            </div>
                            <span className="text-xs text-body dark:text-on-dark-mute truncate">{item.vi}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                    Ý nghĩa <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: bạn, anh, chị"
                      value={formData.meaning}
                      onChange={(e) => {
                        setFormData({ ...formData, meaning: e.target.value });
                        setLastEditedField('meaning');
                      }}
                      onBlur={() => handleBlur('meaning')}
                      className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                    />
                    {suggestions.field === 'meaning' && suggestions.list.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md shadow-sm max-h-60 overflow-y-auto divide-y divide-hairline dark:divide-divider-dark">
                        {suggestions.list.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => handleSelectSuggestion(item)}
                            className="w-full text-left px-4 py-2 hover:bg-surface-bone dark:hover:bg-black flex flex-col gap-0.5 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-ink dark:text-on-dark font-display text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                              <span className="text-xs text-primary dark:text-link font-bold">{item.p}</span>
                            </div>
                            <span className="text-xs text-body dark:text-on-dark-mute truncate">{item.vi}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">Bộ thủ (Radicals)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 亻(nhân)"
                    value={formData.radicals}
                    onChange={(e) => setFormData({ ...formData, radicals: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                  />
                </div>
              </div>

              {/* Example Block */}
              <div className="border-t border-hairline dark:border-divider-dark pt-6 space-y-4">
                <h4 className="text-sm font-bold text-ink dark:text-on-dark uppercase tracking-wider">Ví dụ minh họa (Tùy chọn)</h4>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wide mb-1">Hán tự ví dụ</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 你好"
                      value={formData.exampleHanzi}
                      onChange={(e) => setFormData({ ...formData, exampleHanzi: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wide mb-1">Pinyin ví dụ</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: nǐ hǎo"
                      value={formData.examplePinyin}
                      onChange={(e) => setFormData({ ...formData, examplePinyin: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wide mb-1">Nghĩa ví dụ</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Xin chào"
                      value={formData.exampleMeaning}
                      onChange={(e) => setFormData({ ...formData, exampleMeaning: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-hairline dark:border-divider-dark">
                <span className="text-xs font-semibold text-primary">{errorMsg}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-4 py-2.5 rounded-full border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-sm font-bold transition-colors cursor-pointer bg-transparent"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-deep disabled:bg-stone dark:disabled:bg-surface-dark text-white text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    {isLoading ? 'Đang tạo...' : 'Tạo thẻ bài'}
                  </button>
                </div>
              </div>

            </div>

            {/* Handwriting Canvas Pad Column */}
            {showHandwriting && (
              <div className="w-full lg:w-[320px] shrink-0 lg:border-l lg:border-hairline lg:dark:border-divider-dark lg:pl-8">
                <HandwritingCanvas onRecognize={(char) => {
                  setFormData((prev) => ({
                    ...prev,
                    hanzi: prev.hanzi + char
                  }));
                  setLastEditedField('hanzi');
                }} />
              </div>
            )}

          </div>
        </form>
      )}

      {/* ════════════════════ TAB: AI ════════════════════ */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Config Card */}
          <div className="bg-surface-card dark:bg-surface-dark/50 p-6 rounded-xl border border-hairline dark:border-divider-dark shadow-sm space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink dark:text-on-dark">Tạo flashcard bằng AI</h2>
                <p className="text-[11px] text-mute">Nhập chủ đề và AI sẽ tạo bộ thẻ từ vựng tiếng Trung cho bạn.</p>
              </div>
            </div>

            {/* Topic input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Chủ đề <span className="text-primary">*</span></label>
              <input
                type="text"
                placeholder="VD: Đồ ăn, Gia đình, Du lịch..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiGenerate(); } }}
                className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
              />
            </div>

            {/* Count + HSK level row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Số thẻ muốn tạo</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark cursor-pointer"
                >
                  {COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n} className="dark:bg-surface-dark">{n} thẻ</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Cấp độ HSK</label>
                <select
                  value={aiHskLevel ?? ''}
                  onChange={(e) => setAiHskLevel(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark cursor-pointer"
                >
                  {HSK_LEVELS.map((lvl) => (
                    <option key={lvl.value ?? 'null'} value={lvl.value ?? ''} className="dark:bg-surface-dark">
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {aiError && (
              <p className="text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50">
                {aiError}
              </p>
            )}

            <button
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiTopic.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary-deep disabled:from-stone disabled:to-stone text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {aiGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang tạo flashcard...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  ✨ Tạo với AI
                </>
              )}
            </button>
          </div>

          {/* Generated Cards */}
          {aiCards.length > 0 && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-ink dark:text-on-dark">
                    {aiCards.length} thẻ được tạo
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1 text-[11px] font-bold text-mute hover:text-primary transition-colors cursor-pointer"
                  >
                    {selectedCards.size === aiCards.length ? (
                      <><CheckSquare size={14} className="text-primary" /> Bỏ chọn tất cả</>
                    ) : (
                      <><Square size={14} /> Chọn tất cả</>
                    )}
                  </button>
                </div>
                <span className="text-[11px] text-mute">{selectedCards.size} thẻ đã chọn</span>
              </div>

              {/* Cards grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {aiCards.map((card, idx) => {
                  const isSelected = selectedCards.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCardSelection(idx)}
                      className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                        : 'border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/50 opacity-60 hover:opacity-80'
                        }`}
                    >
                      {/* Checkbox */}
                      <div className={`absolute top-3 right-3 ${isSelected ? 'text-primary' : 'text-mute'}`}>
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>

                      {/* Hanzi */}
                      <div className="text-3xl font-display font-black text-ink dark:text-on-dark mb-1 leading-none pr-6">
                        {card.hanzi || card.chinese || card.word || '?'}
                      </div>
                      {/* Pinyin */}
                      <div className="text-sm font-semibold text-primary mb-1">
                        {card.pinyin || '—'}
                      </div>
                      {/* Meaning */}
                      <div className="text-xs text-body dark:text-on-dark-mute line-clamp-2">
                        {card.meaning || card.vietnamese || card.definition || '—'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save section */}
              <div className="bg-surface-card dark:bg-surface-dark/50 p-5 rounded-xl border border-hairline dark:border-divider-dark shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-ink dark:text-on-dark flex items-center gap-2">
                  <Save size={15} className="text-primary" />
                  Lưu thẻ vào bộ bài
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Chọn bộ bài <span className="text-primary">*</span></label>
                  <select
                    value={aiSaveDeckId}
                    onChange={(e) => setAiSaveDeckId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark cursor-pointer"
                  >
                    <option value="" className="dark:bg-surface-dark">-- Chọn bộ bài để lưu thẻ --</option>
                    {decks.filter(d => !d.isSystem).map((deck) => (
                      <option key={deck.id} value={deck.id} className="dark:bg-surface-dark">
                        {deck.title || deck.name}
                      </option>
                    ))}
                  </select>

                  {/* Inline Deck Creation for AI */}
                  {showNewDeckInput ? (
                    <div className="flex gap-2 items-center mt-2">
                      <input
                        type="text"
                        placeholder="Tên bộ bài mới..."
                        value={newDeckTitle}
                        onChange={(e) => setNewDeckTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateNewDeck(); } }}
                        className="flex-1 px-4 py-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                      />
                      <button
                        type="button"
                        onClick={handleCreateNewDeck}
                        disabled={isCreatingDeck || !newDeckTitle.trim()}
                        className="px-4 py-2 bg-primary hover:bg-primary-deep text-white text-xs font-bold rounded-full transition-colors disabled:bg-stone cursor-pointer"
                      >
                        {isCreatingDeck ? 'Đang tạo...' : 'Lưu'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNewDeckInput(false); setNewDeckTitle(''); }}
                        className="px-4 py-2 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-xs font-bold rounded-full transition-colors cursor-pointer bg-transparent"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1.5 pl-2">
                      <button
                        type="button"
                        onClick={() => setShowNewDeckInput(true)}
                        className="text-xs font-semibold text-primary dark:text-link hover:underline bg-transparent border-none p-0 cursor-pointer flex items-center gap-1"
                      >
                        ➕ Tạo bộ bài cá nhân mới
                      </button>
                    </div>
                  )}
                </div>

                {aiSaveMsg.text && (
                  <p className={`text-[11px] font-semibold ${aiSaveMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {aiSaveMsg.text}
                  </p>
                )}

                <button
                  onClick={handleAiSave}
                  disabled={aiSaving || selectedCards.size === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-deep disabled:bg-stone text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer transition-colors disabled:cursor-not-allowed"
                >
                  {aiSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Lưu {selectedCards.size} thẻ đã chọn
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
