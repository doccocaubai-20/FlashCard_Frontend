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

  // Handle dictionary search
  const handleLookup = (field, value) => {
    if (!value) return;
    const result = lookup(field, value);
    if (result) {
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
      setSuggestions({
        field: lastEditedField,
        list: candidates
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
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <PlusCircle size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thêm thẻ mới</h1>
            <p className="text-slate-500 text-sm mt-0.5">Tạo thêm thẻ từ vựng vào bộ bài của bạn.</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6"
      >
        
        {/* Deck Dropdown Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Chọn bộ bài <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.deckId}
            onChange={(e) => setFormData({ ...formData, deckId: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800 cursor-pointer"
          >
            <option value="">-- Chọn bộ bài để lưu thẻ --</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.title || deck.name} {deck.isSystem ? '(Hệ thống)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Vocabulary Fields */}
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Hán tự (Hanzi) <span className="text-red-500">*</span></span>
              {isDictLoading && (
                <span className="text-xs text-slate-400 font-normal animate-pulse">
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800"
              />
              {suggestions.field === 'hanzi' && suggestions.list.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {suggestions.list.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 flex flex-col gap-0.5 transition-colors cursor-pointer border-none"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                        <span className="text-xs text-purple-600 font-semibold">{item.p}</span>
                      </div>
                      <span className="text-xs text-slate-500 truncate">{item.vi}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800"
              />
              {suggestions.field === 'pinyin' && suggestions.list.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {suggestions.list.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 flex flex-col gap-0.5 transition-colors cursor-pointer border-none"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                        <span className="text-xs text-purple-600 font-semibold">{item.p}</span>
                      </div>
                      <span className="text-xs text-slate-500 truncate">{item.vi}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800"
              />
              {suggestions.field === 'meaning' && suggestions.list.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {suggestions.list.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 flex flex-col gap-0.5 transition-colors cursor-pointer border-none"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">{item.s} {item.sv && `(${item.sv})`}</span>
                        <span className="text-xs text-purple-600 font-semibold">{item.p}</span>
                      </div>
                      <span className="text-xs text-slate-500 truncate">{item.vi}</span>
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">Bộ thủ (Radicals)</label>
            <input
              type="text"
              placeholder="Ví dụ: 亻(nhân)"
              value={formData.radicals}
              onChange={(e) => setFormData({ ...formData, radicals: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800"
            />
          </div>
        </div>

        {/* Example Block */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700">Ví dụ minh họa (Tùy chọn)</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Hán tự ví dụ</label>
              <input
                type="text"
                placeholder="Ví dụ: 你好"
                value={formData.exampleHanzi}
                onChange={(e) => setFormData({ ...formData, exampleHanzi: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Pinyin ví dụ</label>
              <input
                type="text"
                placeholder="Ví dụ: nǐ hǎo"
                value={formData.examplePinyin}
                onChange={(e) => setFormData({ ...formData, examplePinyin: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nghĩa ví dụ</label>
              <input
                type="text"
                placeholder="Ví dụ: Xin chào"
                value={formData.exampleMeaning}
                onChange={(e) => setFormData({ ...formData, exampleMeaning: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-red-500">{errorMsg}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isLoading ? 'Đang tạo...' : 'Tạo thẻ bài'}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
