import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllDecks, createFlashcard } from '../features/deck/deckSlice';
import { PlusCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';
import HandwritingCanvas from '../components/common/HandwritingCanvas';

export default function CreateFlashcardScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const decks = useSelector((state) => state.deck.decks);
  const isLoading = useSelector((state) => state.deck.isLoading);

  const { lookup, lookupMultiple, loading: isDictLoading } = useDictionary();

  const [formData, setFormData] = useState({
    deckId: '',
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

  // Handle dictionary search
  const handleLookup = async (field, value) => {
    if (!value) return;
    const candidates = await lookupMultiple(field, value);
    if (candidates && candidates.length > 0) {
      const sorted = [...candidates].sort((a, b) => getSortScore(b) - getSortScore(a));
      const result = sorted[0];
      setFormData((prev) => {
        const updated = { ...prev };
        if (field !== 'hanzi') {
          updated.hanzi = result.s || updated.hanzi;
        }
        if (field !== 'pinyin') {
          updated.pinyin = result.p || updated.pinyin;
        }
        if (field !== 'meaning') {
          updated.meaning = result.vi || updated.meaning;
        }
        return updated;
      });
    }
  };

  // Immediate lookup and clean suggestions on blur
  const handleBlur = (field) => {
    handleLookup(field, formData[field]);
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

  // Query autocomplete suggestions as user types
  useEffect(() => {
    if (!lastEditedField) return;

    const valueToSearch = formData[lastEditedField];
    if (!valueToSearch || valueToSearch.trim().length < 1) {
      setSuggestions({ field: null, list: [] });
      return;
    }

    const handler = setTimeout(async () => {
      const candidates = await lookupMultiple(lastEditedField, valueToSearch);
      const sorted = [...candidates].sort((a, b) => getSortScore(b) - getSortScore(a));
      setSuggestions({
        field: lastEditedField,
        list: sorted
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [formData.hanzi, formData.pinyin, formData.meaning, lastEditedField, lookupMultiple]);

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
      setErrorMsg('Tạo thẻ mới thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className={`mx-auto space-y-6 transition-all duration-300 ${showHandwriting ? 'max-w-5xl' : 'max-w-2xl'}`}>
      
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

      {/* Form Container */}
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
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id} className="dark:bg-surface-dark">
                    {deck.title || deck.name} {deck.isSystem ? '(Hệ thống)' : ''}
                  </option>
                ))}
              </select>
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
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 cursor-pointer ${
                        showHandwriting
                          ? 'bg-primary border-transparent text-white'
                          : 'bg-surface-bone dark:bg-black/30 border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark'
                      }`}
                    >
                      ✍️ {showHandwriting ? 'Đóng viết' : 'Viết tay'}
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

    </div>
  );
}
