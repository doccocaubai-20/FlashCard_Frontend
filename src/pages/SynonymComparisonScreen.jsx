import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Sparkles, Languages, Search, X, BookOpen, Clock, Copy, Check, Filter } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import synonymsBankData from '../data/synonymsBank.json';

const PRESET_PAIRS = synonymsBankData.pairs || [];

const normalizeText = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
};

export default function SynonymComparisonScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('bank'); // 'bank' | 'custom' | 'history'
  const [selectedLevel, setSelectedLevel] = useState('ALL'); // 'ALL' | 'HSK 3-4' | 'HSK 5' | 'HSK 6'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPairId, setSelectedPairId] = useState(PRESET_PAIRS[0]?.id || null);

  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  // Load initial preset pair and history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chongzi_synonym_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load synonym history:', e);
    }

    if (PRESET_PAIRS.length > 0 && !explanation) {
      const first = PRESET_PAIRS[0];
      setSelectedPairId(first.id);
      setWord1(first.word1);
      setWord2(first.word2);
      setExplanation(first.explanation);
    }
  }, []);

  // Filter preset pairs by level & search query
  const filteredPresetPairs = useMemo(() => {
    return PRESET_PAIRS.filter((pair) => {
      if (selectedLevel !== 'ALL' && pair.level !== selectedLevel) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = normalizeText(searchQuery.trim());
      const matchWord1 = pair.word1.toLowerCase().includes(q);
      const matchWord2 = pair.word2.toLowerCase().includes(q);
      const matchPinyin1 = (pair.pinyin1 || '').toLowerCase().includes(q);
      const matchPinyin2 = (pair.pinyin2 || '').toLowerCase().includes(q);
      const matchMeaning = normalizeText(pair.meaning).includes(q);
      return matchWord1 || matchWord2 || matchPinyin1 || matchPinyin2 || matchMeaning;
    });
  }, [selectedLevel, searchQuery]);

  const handleSelectPresetPair = (pair) => {
    setSelectedPairId(pair.id);
    setWord1(pair.word1);
    setWord2(pair.word2);
    setExplanation(pair.explanation);
    setLoading(false);
  };

  const handleCompareCustom = async (e) => {
    e.preventDefault();
    const w1 = word1.trim();
    const w2 = word2.trim();
    if (!w1 || !w2) return;

    // Check if it matches an existing preset pair first
    const presetMatch = PRESET_PAIRS.find(
      (p) =>
        (p.word1 === w1 && p.word2 === w2) ||
        (p.word1 === w2 && p.word2 === w1)
    );
    if (presetMatch) {
      handleSelectPresetPair(presetMatch);
      showToast('Đã lấy bài so sánh từ Kho 100 từ có sẵn!', 'info');
      return;
    }

    setLoading(true);
    setExplanation('');
    setSelectedPairId(null);

    // Check history cache
    const key = [w1, w2].sort().join('-');
    const cached = history.find((h) => h.key === key);
    if (cached) {
      setExplanation(cached.explanation);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/dictionary/compare-synonyms', {
        word1: w1,
        word2: w2,
      });
      if (res.data && res.data.explanation) {
        const expl = res.data.explanation;
        setExplanation(expl);

        const newHistoryItem = {
          key,
          word1: w1,
          word2: w2,
          explanation: expl,
          timestamp: Date.now(),
        };
        const updatedHistory = [
          newHistoryItem,
          ...history.filter((h) => h.key !== key),
        ].slice(0, 30);
        setHistory(updatedHistory);
        try {
          localStorage.setItem('chongzi_synonym_history', JSON.stringify(updatedHistory));
        } catch (err) {
          console.warn('Failed to save synonym history in localStorage:', err);
        }
      } else {
        showToast('Không nhận được phản hồi từ AI.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Lỗi kết nối hoặc xử lý phân tích.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyExplanation = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Đã sao chép nội dung bài so sánh!', 'success');
  };

  const getLevelBadgeClass = (level) => {
    if (level === 'HSK 3-4') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (level === 'HSK 5') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (level === 'HSK 6') {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    return 'bg-primary/10 text-primary border-primary/20';
  };

  const renderTableHtml = (headers, rows) => {
    const headerCols = headers
      .map(
        (h) =>
          `<th class="p-3 text-left font-mono font-bold text-xs uppercase tracking-wider text-mute border-b border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/35">${h}</th>`
      )
      .join('');

    const bodyRows = rows
      .map((row) => {
        const cells = row
          .map(
            (cell) =>
              `<td class="p-3 text-xs leading-relaxed text-body dark:text-on-dark-mute border-b border-hairline/50 dark:border-divider-dark/40">${cell}</td>`
          )
          .join('');
        return `<tr class="hover:bg-surface-bone/20 dark:hover:bg-black/10 transition-colors">${cells}</tr>`;
      })
      .join('');

    return `
      <div class="my-4 overflow-x-auto rounded-lg border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/30 shadow-xs">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr>${headerCols}</tr>
          </thead>
          <tbody class="divide-y divide-hairline dark:divide-divider-dark/40">
            ${bodyRows}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderContentAsHtml = (text) => {
    if (!text) return '';

    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escaped.split('\n');
    const result = [];

    let inTable = false;
    let tableHeaders = [];
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));

        if (isSeparator) {
          continue;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else {
        if (inTable) {
          result.push(renderTableHtml(tableHeaders, tableRows));
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
      }

      if (line.startsWith('### ')) {
        result.push(`<h4 class="text-sm font-bold text-primary mt-4 mb-2">${line.slice(4)}</h4>`);
      } else if (line.startsWith('## ')) {
        result.push(`<h3 class="text-base font-bold text-primary mt-5 mb-2">${line.slice(3)}</h3>`);
      } else if (line.startsWith('# ')) {
        result.push(`<h2 class="text-lg font-extrabold text-primary mt-6 mb-3">${line.slice(2)}</h2>`);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        result.push(`<li class="ml-4 list-disc text-xs leading-relaxed mt-1">${line.slice(2)}</li>`);
      } else if (line === '') {
        result.push('<div class="h-2"></div>');
      } else {
        result.push(`<p class="text-xs leading-relaxed text-body dark:text-on-dark-mute">${line}</p>`);
      }
    }

    if (inTable) {
      result.push(renderTableHtml(tableHeaders, tableRows));
    }

    let finalHtml = result.join('\n');

    finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    finalHtml = finalHtml.replace(/__(.*?)__/g, '<strong>$1</strong>');
    finalHtml = finalHtml.replace(
      /`(.*?)`/g,
      '<code class="bg-surface-bone dark:bg-black/35 px-1.5 py-0.5 rounded font-mono text-[10px] text-primary font-bold border border-hairline dark:border-divider-dark">$1</code>'
    );

    return finalHtml;
  };

  const currentPresetMatch = PRESET_PAIRS.find((p) => p.id === selectedPairId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reference-hub')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-mute dark:text-on-dark-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Languages size={22} className="text-primary" />
              So sánh Từ đồng nghĩa Tiếng Trung
            </h1>
            <p className="text-xs text-mute mt-0.5">
              Kho 100 cặp từ dễ nhầm lẫn nhất (HSK 3–6) được phân tích chi tiết ngữ pháp, ngữ cảnh và cách dùng.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Tabs for Presets, Custom AI, History */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Tabs */}
          <div className="flex rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/25 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-surface-card dark:bg-surface-dark text-primary shadow-xs border border-hairline dark:border-divider-dark'
                  : 'text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              <BookOpen size={14} />
              <span>Kho 100 từ</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full font-mono">
                {PRESET_PAIRS.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-surface-card dark:bg-surface-dark text-primary shadow-xs border border-hairline dark:border-divider-dark'
                  : 'text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              <Sparkles size={14} />
              <span>Tự do AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-surface-card dark:bg-surface-dark text-primary shadow-xs border border-hairline dark:border-divider-dark'
                  : 'text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              <Clock size={14} />
              <span>Lịch sử</span>
              {history.length > 0 && (
                <span className="text-[10px] bg-mute/20 text-mute px-1.5 py-0.2 rounded-full font-mono">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Kho 100 từ có sẵn */}
          {activeTab === 'bank' && (
            <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-xl p-4 shadow-sm space-y-3.5 text-left">
              {/* Level Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 select-none text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedLevel('ALL')}
                  className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                    selectedLevel === 'ALL'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-bone/50 dark:bg-black/20 text-mute border-hairline dark:border-divider-dark hover:border-primary/30'
                  }`}
                >
                  Tất cả ({PRESET_PAIRS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLevel('HSK 3-4')}
                  className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                    selectedLevel === 'HSK 3-4'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-surface-bone/50 dark:bg-black/20 text-mute border-hairline dark:border-divider-dark hover:border-emerald-500/30'
                  }`}
                >
                  HSK 3-4 (30)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLevel('HSK 5')}
                  className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                    selectedLevel === 'HSK 5'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-surface-bone/50 dark:bg-black/20 text-mute border-hairline dark:border-divider-dark hover:border-amber-500/30'
                  }`}
                >
                  HSK 5 (40)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLevel('HSK 6')}
                  className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                    selectedLevel === 'HSK 6'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-surface-bone/50 dark:bg-black/20 text-mute border-hairline dark:border-divider-dark hover:border-purple-500/30'
                  }`}
                >
                  HSK 6 (30)
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm chữ Hán, pinyin hoặc nghĩa..."
                  className="w-full pl-8.5 pr-8 py-2 text-xs rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink dark:hover:text-on-dark"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Counter info */}
              <div className="flex justify-between items-center text-[10px] text-mute font-mono px-0.5">
                <span>Hiển thị {filteredPresetPairs.length} cặp từ</span>
                <span>Tốc độ: tức thì (0ms)</span>
              </div>

              {/* Scrollable list of pairs */}
              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {filteredPresetPairs.length === 0 ? (
                  <div className="text-center py-10 text-xs text-mute italic">
                    Không tìm thấy cặp từ nào phù hợp với "{searchQuery}".
                  </div>
                ) : (
                  filteredPresetPairs.map((p) => {
                    const isSelected = selectedPairId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPresetPair(p)}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer text-xs space-y-1.5 ${
                          isSelected
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/20'
                            : 'border-hairline dark:border-divider-dark bg-surface-bone/25 dark:bg-black/15 hover:bg-surface-bone/60 dark:hover:bg-black/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-ink dark:text-on-dark group-hover:text-primary">
                            {p.word1} <span className="text-mute font-normal text-xs">vs</span> {p.word2}
                          </span>
                          <span
                            className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${getLevelBadgeClass(
                              p.level
                            )}`}
                          >
                            {p.level}
                          </span>
                        </div>
                        <div className="text-[11px] text-mute font-mono">
                          {p.pinyin1} · {p.pinyin2}
                        </div>
                        <div className="text-[11px] text-body dark:text-on-dark-mute line-clamp-1 leading-snug">
                          {p.meaning}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: So sánh tự do bằng AI */}
          {activeTab === 'custom' && (
            <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-xl p-5 shadow-sm space-y-4 text-left">
              <h3 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-3">
                <Sparkles size={14} className="text-primary" />
                Nhập cặp từ tự do (AI Phân tích)
              </h3>
              <form onSubmit={handleCompareCustom} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Từ thứ nhất</label>
                  <input
                    type="text"
                    required
                    value={word1}
                    onChange={(e) => setWord1(e.target.value)}
                    placeholder="Ví dụ: 觉得"
                    className="w-full text-xs p-3 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Từ thứ hai</label>
                  <input
                    type="text"
                    required
                    value={word2}
                    onChange={(e) => setWord2(e.target.value)}
                    placeholder="Ví dụ: 认为"
                    className="w-full text-xs p-3 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !word1.trim() || !word2.trim()}
                  className="w-full py-2.5 bg-primary hover:bg-primary-deep disabled:bg-stone text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs active:scale-95"
                >
                  <Sparkles size={14} />
                  {loading ? 'AI đang phân tích...' : 'So sánh bằng AI'}
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Lịch sử đã so sánh */}
          {activeTab === 'history' && (
            <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-xl p-5 shadow-sm space-y-3 text-left">
              <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-3">
                <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" />
                  Lịch sử so sánh ({history.length})
                </h4>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('chongzi_synonym_history');
                    }}
                    className="text-[10px] text-red-500 hover:underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-mute italic">
                  Chưa có lịch sử so sánh nào.
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {history.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setSelectedPairId(null);
                        setWord1(item.word1);
                        setWord2(item.word2);
                        setExplanation(item.explanation);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/25 dark:bg-black/15 hover:bg-surface-bone dark:hover:bg-black text-left transition-all cursor-pointer text-xs group"
                    >
                      <span className="font-semibold text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                        {item.word1} vs {item.word2}
                      </span>
                      <span className="text-[9px] text-mute font-mono">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Results Panel */}
        <div className="lg:col-span-7 bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-xl p-6 shadow-sm min-h-[500px] text-left flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
                🎯 Kết quả phân biệt chi tiết
              </h3>
              {currentPresetMatch && (
                <span
                  className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${getLevelBadgeClass(
                    currentPresetMatch.level
                  )}`}
                >
                  {currentPresetMatch.level}
                </span>
              )}
            </div>

            {explanation && (
              <button
                type="button"
                onClick={handleCopyExplanation}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-mute hover:text-ink dark:hover:text-on-dark bg-surface-bone/50 dark:bg-black/20 hover:bg-surface-bone rounded-md border border-hairline dark:border-divider-dark transition-all cursor-pointer"
                title="Sao chép bài so sánh"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            )}
          </div>

          {/* Subtitle difference summary for presets */}
          {currentPresetMatch && (
            <div className="p-3 rounded-lg bg-surface-bone/40 dark:bg-black/20 border border-hairline dark:border-divider-dark text-xs flex items-center gap-2">
              <span className="font-bold text-primary shrink-0">Điểm khác biệt cốt lõi:</span>
              <span className="text-body dark:text-on-dark-mute font-medium">
                {currentPresetMatch.meaning}
              </span>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-mute gap-3 flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-xs font-semibold">AI đang phân tích và soạn bài giảng so sánh...</span>
            </div>
          )}

          {!loading && explanation && (
            <div
              className="bg-surface-bone/30 dark:bg-surface-dark/20 p-5 rounded-lg border border-hairline dark:border-divider-dark text-xs text-body dark:text-on-dark-mute leading-relaxed space-y-2 select-text"
              dangerouslySetInnerHTML={{ __html: renderContentAsHtml(explanation) }}
            />
          )}

          {!loading && !explanation && (
            <div className="flex flex-col items-center justify-center py-24 text-mute flex-1 text-center">
              <Languages size={44} className="stroke-1 opacity-30 mb-2" />
              <p className="text-xs italic max-w-xs">
                Chọn một cặp từ từ danh sách 100 từ có sẵn bên trái hoặc nhập từ tự do để xem bài giảng phân tích chi tiết.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
