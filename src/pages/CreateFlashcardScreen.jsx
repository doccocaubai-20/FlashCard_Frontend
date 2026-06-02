import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllDecks, createFlashcard } from '../features/deck/deckSlice';
import { PlusCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';

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
  const handleLookup = (field, value) => {
    if (!value) return;
    const candidates = lookupMultiple(field, value);
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

    const handler = setTimeout(() => {
      const candidates = lookupMultiple(lastEditedField, valueToSearch);
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
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Back button and Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <PlusCircle size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm thẻ mới</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Tạo thêm thẻ từ vựng vào bộ bài của bạn.</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors"
      >
        
        {/* Deck Dropdown Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Chọn bộ bài <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.deckId}
            onChange={(e) => setFormData({ ...formData, deckId: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="" className="dark:bg-slate-900">-- Chọn bộ bài để lưu thẻ --</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id} className="dark:bg-slate-900">
                {deck.title || deck.name} {deck.isSystem ? '(Hệ thống)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Vocabulary Fields */}
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Hán tự (Hanzi) <span className="text-red-500">*</span></span>
              {isDictLoading && (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal animate-pulse">
                  Đang tải từ điển...
                </span>
              )}
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              />
              {suggestions.field === 'hanzi' && suggestions.list.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {suggestions.list.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex flex-col gap-0.5 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{item.p}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.vi}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phiên âm (Pinyin) <span className="text-red-500">*</span>
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              />
              {suggestions.field === 'pinyin' && suggestions.list.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {suggestions.list.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex flex-col gap-0.5 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{item.p}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.vi}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ý nghĩa <span className="text-red-500">*</span>
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              />
              {suggestions.field === 'meaning' && suggestions.list.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {suggestions.list.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex flex-col gap-0.5 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{item.p}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.vi}</span>
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Bộ thủ (Radicals)</label>
            <input
              type="text"
              placeholder="Ví dụ: 亻(nhân)"
              value={formData.radicals}
              onChange={(e) => setFormData({ ...formData, radicals: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Example Block */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">Ví dụ minh họa (Tùy chọn)</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Hán tự ví dụ</label>
              <input
                type="text"
                placeholder="Ví dụ: 你好"
                value={formData.exampleHanzi}
                onChange={(e) => setFormData({ ...formData, exampleHanzi: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Pinyin ví dụ</label>
              <input
                type="text"
                placeholder="Ví dụ: nǐ hǎo"
                value={formData.examplePinyin}
                onChange={(e) => setFormData({ ...formData, examplePinyin: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nghĩa ví dụ</label>
              <input
                type="text"
                placeholder="Ví dụ: Xin chào"
                value={formData.exampleMeaning}
                onChange={(e) => setFormData({ ...formData, exampleMeaning: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-xs font-semibold text-red-500">{errorMsg}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold transition-colors cursor-pointer bg-transparent"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-slate-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isLoading ? 'Đang tạo...' : 'Tạo thẻ bài'}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
