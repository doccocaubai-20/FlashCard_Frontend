import React, { useState, useEffect } from 'react';
import { useDictionary } from '../hooks/useDictionary';
import HandwritingCanvas from '../components/common/HandwritingCanvas';
import { Search, BookOpen, ArrowLeft, Sparkles, Copy, Check, History, Trash2, Star } from 'lucide-react';
import { dictionaryHistoryApi } from '../services/dictionaryHistoryApi';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { useSearchParams } from 'react-router-dom';

export default function DictionaryScreen() {
  const { lookupMultiple, loading } = useDictionary();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const wordParam = searchParams.get('word');

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Favorites State
  const [favorites, setFavorites] = useState([]);

  // Detail View State
  const [selectedWord, setSelectedWord] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [tabDetails, setTabDetails] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiLimit, setAiLimit] = useState({ count: 0, limit: 10 });

  const loadAiLimit = async () => {
    try {
      const res = await dictionaryHistoryApi.getTodayCount();
      if (res.data) {
        setAiLimit({ count: res.data.count, limit: res.data.limit });
      }
    } catch (err) {
      console.error('Failed to load AI limit:', err);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  const isFavorite = (hanzi) => {
    return favorites.some((f) => f.hanzi === hanzi);
  };

  const handleToggleFavorite = async () => {
    if (!selectedWord) return;
    const hanzi = selectedWord.s;
    const alreadyFav = isFavorite(hanzi);
    try {
      if (alreadyFav) {
        await favoriteWordsApi.deleteFavoriteByHanzi(hanzi);
      } else {
        const sv = getCompoundHanViet(hanzi) || '';
        await favoriteWordsApi.addFavorite({
          hanzi,
          pinyin: selectedWord.p || '',
          sv,
          vi: selectedWord.vi || '',
        });
      }
      loadFavorites();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await dictionaryHistoryApi.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load dictionary history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadFavorites();
    loadAiLimit();
  }, []);

  // Read and handle URL parameter (?word=...) on mount/load
  useEffect(() => {
    if (wordParam) {
      const cleanParam = wordParam.trim();
      if (!cleanParam) return;

      const runUrlLoad = async () => {
        // Try exact Hanzi match first
        const matches = await lookupMultiple('hanzi', cleanParam);
        const exactMatch = matches.find((m) => m.s === cleanParam || m.t === cleanParam);

        if (exactMatch) {
          setSelectedWord(exactMatch);
          setActiveTab(exactMatch.s);
          setTabDetails(exactMatch);

          const existing = history.find((h) => h.hanzi === exactMatch.s);
          if (existing && existing.aiExplanation) {
            setAiExplanation(existing.aiExplanation);
          } else {
            setAiExplanation('');
          }
        } else {
          setQuery(cleanParam);
          handleSearch(cleanParam);
        }
      };

      runUrlLoad();
    }
  }, [wordParam, history.length]);

  // Debounced search on query change
  useEffect(() => {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(query);
    }, 250); // 250ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (searchQuery) => {
    const actualQuery = typeof searchQuery === 'string' ? searchQuery : query;
    const trimmedQuery = (actualQuery || '').trim();
    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    // Lookup across multiple indexes: Hanzi, Pinyin, and Meaning
    const [hanziMatches, pinyinMatches, meaningMatches] = await Promise.all([
      lookupMultiple('hanzi', trimmedQuery),
      lookupMultiple('pinyin', trimmedQuery),
      lookupMultiple('meaning', trimmedQuery)
    ]);

    // Combine results and deduplicate
    const seen = new Set();
    const combined = [...hanziMatches, ...pinyinMatches, ...meaningMatches];
    const searchResults = [];

    for (const item of combined) {
      if (!item) continue;
      const key = `${item.s}-${item.p}-${item.vi}`;
      if (!seen.has(key)) {
        seen.add(key);
        searchResults.push(item);
      }
    }

    // Sort matches dynamically using relevance scores
    const qLower = trimmedQuery.toLowerCase();
    const getSortScore = (item) => {
      const s = (item.s || '').toLowerCase();
      const t = (item.t || '').toLowerCase();
      const p = (item.p || '').toLowerCase();
      const pt = (item.pt || '').toLowerCase();
      const sp = (item.sp || '').toLowerCase();
      const sv = (item.sv || '').toLowerCase();
      const vi = (item.vi || '').toLowerCase();
      const en = Array.isArray(item.en) ? item.en.join(' ').toLowerCase() : (item.en || '').toLowerCase();

      let score = 0;

      // 1. Exact Hanzi match
      if (s === qLower || t === qLower) {
        score += 10000;
      }

      // 2. Exact Pinyin match
      if (p === qLower || pt === qLower || sp === qLower) {
        score += 5000;
      }

      // 3. Exact Hán-Việt match
      if (sv === qLower) {
        score += 2000;
      }

      // 4. Exact meaning match (first translation before / or full match)
      const firstVi = vi.split('/')[0].trim();
      if (firstVi === qLower || vi.trim() === qLower) {
        score += 1000;
      }

      // 5. Starts with Hanzi
      if (s.startsWith(qLower) || t.startsWith(qLower)) {
        score += 500;
      }

      // 6. Starts with Hán-Việt
      if (sv.startsWith(qLower)) {
        score += 300;
      }

      // 7. Common Word Boost & Rank Penalty
      if (item.hsk) {
        score += (10 - item.hsk) * 200; // HSK 1 gets +1800, HSK 7 gets +600
      }
      if (item.b) {
        score += item.b * 10; // e.g. b 76.3 gets +763
      }
      if (item.bwr) {
        score -= item.bwr * 0.1; // e.g. rank 8 subtracts 0.8, rank 75159 subtracts 7515.9
      }
      if (item.mwr) {
        score -= item.mwr * 0.1;
      }

      // 8. Archaic/Rare Variant Penalty
      const isVariant =
        vi.includes('biến thể cổ của') ||
        vi.includes('biến thể của') ||
        vi.includes('biến thể cũ của') ||
        vi.includes('cổ của') ||
        en.includes('variant of') ||
        en.includes('archaic variant') ||
        en.includes('old variant');

      if (isVariant) {
        score -= 8000;
      }

      // 9. Shorter words are more fundamental (tie-breaker)
      score -= s.length * 10;

      return score;
    };

    searchResults.sort((a, b) => getSortScore(b) - getSortScore(a));

    setResults(searchResults.slice(0, 30));
    setHasSearched(true);
    setSelectedWord(null); // Reset detail view when performing a new search
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRecognize = (character) => {
    setQuery((prev) => {
      const nextQuery = prev + character;
      handleSearch(nextQuery); // Trigger search immediately on handwriting select
      return nextQuery;
    });
  };

  // Helper to dynamically get the Hán Việt of a compound word
  const getCompoundHanViet = (word) => {
    if (!word) return '';
    if (selectedWord && selectedWord.s === word) return selectedWord.sv || '';
    if (tabDetails && tabDetails.s === word) return tabDetails.sv || '';
    
    // Search in results list
    const found = results.find(r => r.s === word);
    if (found) return found.sv || '';
    
    return '';
  };

  // Handle selected word breakdown options
  const handleSelectWord = async (item) => {
    setSelectedWord(item);
    setActiveTab(item.s);
    setTabDetails(item);

    // Update URL parameter
    setSearchParams({ word: item.s });

    // Check if this item already exists in history and has a cached explanation
    const existing = history.find((h) => h.hanzi === item.s);
    if (existing && existing.aiExplanation) {
      setAiExplanation(existing.aiExplanation);
    } else {
      setAiExplanation('');
    }

    // Save search history entry to database in the background
    try {
      const pinyin = item.p || '';
      const sv = getCompoundHanViet(item.s) || '';
      const vi = item.vi || '';
      await dictionaryHistoryApi.addHistory({
        hanzi: item.s,
        pinyin,
        sv,
        vi
      });
      loadHistory();
    } catch (err) {
      console.error('Failed to save search history:', err);
    }
  };

  const handleSelectHistoryWord = (historyItem) => {
    const mappedWord = {
      s: historyItem.hanzi,
      t: historyItem.hanzi,
      p: historyItem.pinyin || '',
      sv: historyItem.sv || '',
      vi: historyItem.vi || '',
      en: []
    };
    setSelectedWord(mappedWord);
    setActiveTab(mappedWord.s);
    setTabDetails(mappedWord);
    setAiExplanation(historyItem.aiExplanation || '');

    // Update URL parameter
    setSearchParams({ word: historyItem.hanzi });

    // Move to top in DB history
    try {
      dictionaryHistoryApi.addHistory({
        hanzi: historyItem.hanzi,
        pinyin: historyItem.pinyin || '',
        sv: historyItem.sv || '',
        vi: historyItem.vi || ''
      }).then(() => loadHistory());
    } catch (err) {
      console.error('Failed to update history ordering:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tra cứu không?')) return;
    try {
      await dictionaryHistoryApi.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleTabClick = (tabText) => {
    setActiveTab(tabText);
    if (tabText === selectedWord.s) {
      setTabDetails(selectedWord);
    } else {
      // Find matching entry for individual character
      const matches = lookupMultiple('hanzi', tabText);
      const exactMatch = matches.find((m) => m.s === tabText || m.t === tabText);
      setTabDetails(exactMatch || { s: tabText, p: '', vi: 'Không có dữ liệu chi tiết cho từ này.' });
    }
  };

  // Hybrid Hán-Việt analyzer and live DeepSeek AI explainer
  const generateAIExplanation = async (refresh = false) => {
    if (!selectedWord) return;
    setAiLoading(true);
    setAiExplanation('');

    // Generate local offline breakdown in case of errors/fallback
    const runOfflineBreakdown = () => {
      const chars = Array.from(selectedWord.s);
      const breakdown = [];
      let hasMissingSv = false;

      chars.forEach((char) => {
        if (!char.trim()) return;
        const matches = lookupMultiple('hanzi', char);
        const match = matches.find((m) => m.s === char || m.t === char);
        if (match && match.sv) {
          breakdown.push(`- **${char}** (${match.sv.toUpperCase()}): ${match.vi}`);
        } else if (match) {
          hasMissingSv = true;
          breakdown.push(`- **${char}** <span class="text-amber-600 font-semibold">[Chữ này chưa có âm Hán Việt]</span>: ${match.vi}`);
        } else {
          hasMissingSv = true;
          breakdown.push(`- **${char}** <span class="text-red-500 font-semibold">[Không tìm thấy dữ liệu]</span>`);
        }
      });

      const footnote = hasMissingSv
        ? `<div class="mt-3 text-[11px] text-amber-600 dark:text-amber-500 font-medium border-t border-hairline dark:border-divider-dark pt-2 flex items-start gap-1">
              <em>Lưu ý: Các chữ hiển thị dạng ngoặc vuông (như [爆], [炸]) do trường âm Hán Việt (sv) trong từ điển của bạn đang bị bỏ trống.</em>
           </div>`
        : '';

      const explanationHtml = `
<div class="space-y-4 text-body dark:text-on-dark-mute text-sm">
  <p class="font-bold text-ink dark:text-on-dark border-b border-hairline dark:border-divider-dark pb-2 flex items-center gap-2">
    ✨ Phân tích cấu trúc từ ghép <strong>"${selectedWord.s}"</strong> (Chế độ Ngoại tuyến):
  </p>
  <ul class="space-y-2 list-none pl-0">
    ${breakdown.map(line => `<li class="flex items-start gap-2 bg-surface-bone/80 dark:bg-black/35 p-2.5 rounded-md border border-hairline dark:border-divider-dark">${line}</li>`).join('')}
  </ul>
  ${footnote}
  <div class="mt-4 bg-surface-bone dark:bg-black/50 border border-hairline dark:border-divider-dark rounded-md p-4">
    <p class="font-bold text-primary mb-1">💡 Nghĩa tổng hợp:</p>
    <p class="text-ink dark:text-on-dark font-medium leading-relaxed">
      Sự kết hợp các từ tố trên tạo nên nghĩa khái niệm: <em>"${selectedWord.vi || 'Chưa rõ nghĩa dịch'}"</em>. 
    </p>
  </div>
</div>
      `;
      setAiExplanation(explanationHtml);
    };

    try {
      const sv = getCompoundHanViet(selectedWord.s) || '';
      const response = await dictionaryHistoryApi.explain({
        hanzi: selectedWord.s,
        traditional: selectedWord.t,
        pinyin: selectedWord.p,
        sv,
        vi: selectedWord.vi,
        en: selectedWord.en,
        refresh
      });

      if (response && response.data && response.data.aiExplanation) {
        setAiExplanation(response.data.aiExplanation);
        if (response.data.todayCount !== undefined) {
          setAiLimit({ count: response.data.todayCount, limit: response.data.limit });
        }
        loadHistory();
      } else {
        runOfflineBreakdown();
      }
    } catch (err) {
      console.error('Failed to generate AI explanation:', err);
      
      // If rate limited (status 429), show custom rate limit alert
      if (err.response && err.response.status === 429) {
        const errorHtml = `
<div class="space-y-4 text-body dark:text-on-dark-mute text-sm">
  <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-md p-4">
    <p class="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
      ⚠️ Hạn mức sử dụng AI trong ngày:
    </p>
    <p class="text-ink dark:text-on-dark mt-2 leading-relaxed">
      Bạn đã vượt quá giới hạn <strong>10 lượt</strong> giải thích bằng AI hôm nay. Vui lòng quay lại vào ngày mai!
    </p>
    <p class="text-xs text-mute dark:text-on-dark-mute mt-2 border-t border-amber-200 dark:border-amber-900/30 pt-2">
      💡 Mẹo: Bạn vẫn có thể xem lại các từ đã từng giải thích trước đó hoặc sử dụng chế độ Ngoại tuyến thông thường.
    </p>
  </div>
</div>
        `;
        setAiExplanation(errorHtml);
      } else {
        // General fallback to offline breakdown
        runOfflineBreakdown();
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Copy AI prompt to clipboard
  const handleCopyPrompt = () => {
    if (!selectedWord) return;
    const briefMeaning = selectedWord.en
      ? (Array.isArray(selectedWord.en) ? selectedWord.en[0] : selectedWord.en.split(/[;,]/)[0]).trim()
      : (selectedWord.vi || '').split('/')[0].trim();

    const isSingleChar = selectedWord.s.length === 1;
    const promptText = `Hãy đóng vai là một giáo viên tiếng Trung bản xứ chuyên nghiệp, am hiểu sâu sắc về từ nguyên học (etymology). Hãy phân tích ${isSingleChar ? 'chữ đơn' : 'từ ghép'} tiếng Trung: "${selectedWord.s}" (Phồn thể: ${selectedWord.t || selectedWord.s}, Bính âm: ${selectedWord.p || ''}, Hán Việt: ${getCompoundHanViet(selectedWord.s) || ''}, Nghĩa định hướng: ${briefMeaning}).

Yêu cầu tạo kết quả phân tích bằng mã HTML chuẩn, bọc gọn hoàn toàn trong một thẻ <div>. Tuyệt đối KHÔNG viết lời dẫn mở đầu hay kết luận dông dài, và KHÔNG bọc trong khối code markdown \`\`\`html.

Cấu trúc yêu cầu như sau:

1. Thẻ bao ngoài: <div class="space-y-4">

2. Phần Phân tích cấu tạo chữ (Đặt tiêu đề: <h3 class="text-xs font-bold text-primary mb-2.5 uppercase tracking-wide">1. Phân tích chi tiết</h3>)
${isSingleChar ? `   - Hãy giải thích chi tiết cấu tạo chữ "${selectedWord.s}": thuộc loại chữ nào trong Lục thư (tượng hình, chỉ sự, hội ý, hình thanh,...), gồm bộ thủ chính nào cấu thành và ý nghĩa nguyên bản của chữ đơn này. Giải thích sâu sắc nhưng cô đọng (khoảng 3-4 câu).` : `   - Hãy lần lượt duyệt qua từng chữ đơn cấu thành từ ghép "${selectedWord.s}". Với mỗi chữ đơn, giải thích cấu tạo (thuộc loại chữ nào trong Lục thư, bộ thủ chính cấu thành) và nghĩa cốt lõi của chữ đó. Giải thích cô đọng (khoảng 2-3 câu mỗi chữ).`}
   - Định dạng mỗi chữ đơn phân tích nằm trong một khối:
     <div class="bg-surface-bone/30 dark:bg-black/10 p-3 rounded-md border border-hairline dark:border-divider-dark mb-2">
       <span class="font-bold text-ink dark:text-on-dark text-sm">[Chữ đơn]</span> - <span class="text-xs text-primary font-semibold">[Hán Việt / Bính âm]</span>: [Nội dung phân tích]
     </div>

${isSingleChar ? '' : `3. Phần Giải nghĩa tổng hợp (Đặt tiêu đề: <h3 class="text-xs font-bold text-primary mt-4 mb-2 uppercase tracking-wide">2. Giải nghĩa tổng hợp</h3>)
   - Giải thích cách kết hợp ý nghĩa của các chữ đơn để cấu thành nên nghĩa khái niệm hiện tại của từ ghép "${selectedWord.s}". Viết cô đọng trong 2-3 câu.
`}

4. Phần Ví dụ thực tế (Đặt tiêu đề: <h3 class="text-xs font-bold text-primary mt-4 mb-2.5 uppercase tracking-wide">${isSingleChar ? '2' : '3'}. Ví dụ thực tế ngắn</h3>)
   - Đưa ra đúng 3 ví dụ giao tiếp thực tế cực kỳ ngắn gọn (mỗi câu dưới 12 chữ Hán) sử dụng từ/chữ "${selectedWord.s}".
   - Định dạng mỗi ví dụ nằm trong một thẻ <li> với đúng cấu trúc:
     <li class="bg-surface-bone/50 dark:bg-black/20 p-3 rounded border border-hairline dark:border-divider-dark mb-2 list-none text-xs">
       <div class="font-bold text-sm text-ink dark:text-on-dark mb-1">[Câu tiếng Trung]</div>
       <div class="text-xs text-amber-500 font-mono font-medium mb-1">[Phiên âm Pinyin]</div>
       <div class="text-xs text-body dark:text-on-dark-mute italic">[Dịch nghĩa tiếng Việt tự nhiên, trôi chảy]</div>
     </li>`;

    navigator.clipboard.writeText(promptText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Failed to copy prompt:', err));
  };

  // Generate character tab list
  const tabOptions = selectedWord
    ? [
      selectedWord.s,
      ...Array.from(new Set(Array.from(selectedWord.s))).filter(
        (c) => c.trim() && c !== selectedWord.s
      )
    ]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm shrink-0">
          <BookOpen size={18} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Tra cứu từ điển</h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-0.5">
            Tìm kiếm bằng Hán tự, Phiên âm (Pinyin), âm Hán Việt hoặc Nghĩa tiếng Việt.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Search Panel & Results */}
        <div className="lg:col-span-2 bg-surface-card dark:bg-surface-dark/50 p-6 rounded-md border border-hairline dark:border-divider-dark shadow-sm flex flex-col gap-6 min-h-[580px] transition-colors">

          {selectedWord ? (
            /* Word Detail Panel */
            <div className="flex flex-col gap-6 text-left">

              {/* Back Header */}
              <div className="flex items-center gap-3 border-b border-hairline dark:border-divider-dark pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWord(null);
                    setSearchParams({});
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-mute dark:text-on-dark-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                </button>
                <div>
                  <h3 className="font-display font-extrabold text-ink dark:text-on-dark text-md tracking-tight">Thông tin từ vựng</h3>
                  <p className="text-xs text-mute dark:text-on-dark-mute">Chi tiết ý nghĩa, âm Hán Việt và phân tích từ đơn.</p>
                </div>
              </div>

              {/* Character Tab Bar */}
              <div className="flex gap-2 border-b border-hairline dark:border-divider-dark pb-3 overflow-x-auto select-none no-scrollbar">
                {tabOptions.map((tabText, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTabClick(tabText)}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all border cursor-pointer whitespace-nowrap ${activeTab === tabText
                        ? 'bg-primary border-transparent text-white shadow-sm'
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                      }`}
                  >
                    {tabText}
                  </button>
                ))}
              </div>

              {/* Main Premium Card */}
              <div className="bg-surface-bone dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                <span className="text-[10px] uppercase font-bold text-mute dark:text-on-dark-mute tracking-wider absolute top-4">
                  {tabDetails?.s === tabDetails?.t ? 'Từ vựng' : 'Giản thể'}
                </span>

                {tabDetails && (
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`absolute top-4 right-4 p-2 rounded-full border transition-all cursor-pointer ${
                      isFavorite(tabDetails.s)
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark'
                    }`}
                    title={isFavorite(tabDetails.s) ? 'Xóa khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}
                  >
                    <Star size={16} fill={isFavorite(tabDetails.s) ? 'currentColor' : 'none'} />
                  </button>
                )}

                <h2 className="text-6xl md:text-7xl font-bold text-ink dark:text-on-dark tracking-wide font-display py-4">
                  {tabDetails?.s}
                </h2>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-mute dark:text-on-dark-mute uppercase tracking-widest">Bính âm - Hán Việt</span>
                  <div className="flex items-center gap-2 text-sm text-body dark:text-on-dark-mute font-bold">
                    <span>{tabDetails?.p || 'Không có Pinyin'}</span>
                    {getCompoundHanViet(tabDetails?.s) && (
                      <>
                        <span className="text-mute dark:text-on-dark-mute font-normal">|</span>
                        <span className="text-primary dark:text-link">{getCompoundHanViet(tabDetails.s)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>-c              {/* AI Explanation Area */}
              <div className="border border-hairline dark:border-divider-dark rounded-md p-5 flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" />
                    Giải thích bằng AI
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-mute dark:text-on-dark-mute font-semibold bg-surface-bone dark:bg-surface-dark px-2 py-0.5 rounded-full border border-hairline dark:border-divider-dark">
                      {Math.max(0, aiLimit.limit - aiLimit.count)}/{aiLimit.limit} lượt
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark rounded-full text-xs font-semibold transition-all cursor-pointer bg-surface-card dark:bg-surface-dark"
                    >
                      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      {copied ? 'Đã sao chép' : 'Copy prompt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => generateAIExplanation(!!aiExplanation)}
                      disabled={aiLoading}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 ${aiExplanation ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:bg-primary-deep'} disabled:bg-stone dark:disabled:bg-surface-dark text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95`}
                    >
                      {aiExplanation ? '🔄 Giải thích lại' : '⚡ Giải thích'}
                    </button>
                  </div>
                </div>

                {aiLoading && (
                  <div className="flex items-center justify-center py-8 text-mute gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-xs font-medium">AI đang phân tích cấu trúc chữ...</span>
                  </div>
                )}

                {!aiLoading && aiExplanation && (
                  <div
                    className="bg-surface-bone/50 dark:bg-surface-dark/20 p-4 rounded-md border border-hairline dark:border-divider-dark text-xs text-body dark:text-on-dark-mute leading-relaxed animate-fade-in"
                    dangerouslySetInnerHTML={{ __html: aiExplanation }}
                  />
                )}

                {!aiLoading && !aiExplanation && (
                  <p className="text-xs text-mute dark:text-on-dark-mute italic">
                    Bấm nút "Giải thích" để phân tích cấu trúc Hán-Việt chi tiết từng ký tự cấu thành từ ghép này.
                  </p>
                )}
              </div>e=              {/* Translation meanings */}
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">Ý nghĩa</h4>
                  {tabDetails?.b && (
                    <span className="text-[10px] bg-surface-bone dark:bg-surface-dark text-mute dark:text-on-dark-mute font-semibold px-2 py-0.5 rounded-full border border-hairline dark:border-divider-dark">
                      {tabDetails.b} nét
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {tabDetails?.vi && (
                    <div className="flex items-start gap-2.5">
                      <span className="text-[9px] uppercase font-extrabold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 mt-0.5 flex-shrink-0">
                        VN
                      </span>
                      <p className="text-sm text-ink dark:text-on-dark font-semibold leading-relaxed">
                        {tabDetails.vi}
                      </p>
                    </div>
                  )}

                  {tabDetails?.en && tabDetails.en.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <span className="text-[9px] uppercase font-extrabold bg-surface-bone dark:bg-surface-dark text-ink dark:text-on-dark px-1.5 py-0.5 rounded border border-hairline dark:border-divider-dark mt-0.5 flex-shrink-0">
                        GB
                      </span>
                      <p className="text-sm text-body dark:text-on-dark-mute leading-relaxed font-medium">
                        {Array.isArray(tabDetails.en) ? tabDetails.en.join('; ') : tabDetails.en}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Search Box Area */}
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Nhập từ khóa cần tra cứu... (Ví dụ: khứ, rén, 去, người)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-11 pr-4 py-3 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark shadow-sm"
                  />
                  <Search className="absolute left-4 top-3.5 text-mute" size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="px-5 py-3 rounded-full bg-primary hover:bg-primary-deep disabled:bg-stone text-white text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Search size={15} />
                  Tìm kiếm
                </button>
              </div>                {/* Results List */}
              <div className="flex-1 min-h-[450px] max-h-[600px] overflow-y-auto pr-1 flex flex-col gap-3">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 text-mute gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-sm font-medium">Đang tải và đồng bộ từ điển...</span>
                  </div>
                )}

                {!loading && results.length === 0 && (
                  hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-20 text-mute bg-surface-bone/30 dark:bg-surface-dark/30 rounded-md border border-dashed border-hairline dark:border-divider-dark animate-fade-in">
                      <BookOpen size={48} className="stroke-1 text-mute dark:text-on-dark-mute mb-3" />
                      <p className="text-sm font-medium text-body dark:text-on-dark-mute max-w-sm text-center leading-relaxed">
                        Không tìm thấy kết quả phù hợp cho từ khóa này.
                      </p>
                    </div>
                  ) : history.length > 0 ? (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-2">
                        <h4 className="text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5">
                          <History size={14} className="text-mute" />
                          Lịch sử tra cứu gần đây
                        </h4>
                        <button
                          type="button"
                          onClick={handleClearHistory}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary-deep font-semibold cursor-pointer border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark hover:bg-surface-bone dark:hover:bg-black px-2 py-1 rounded-full transition-all"
                        >
                          <Trash2 size={12} />
                          Xóa lịch sử
                        </button>
                      </div>

                      <div className="divide-y divide-hairline dark:divide-divider-dark">
                        {history.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectHistoryWord(item)}
                            className="flex gap-5 py-3.5 items-center hover:bg-surface-bone/50 dark:hover:bg-surface-dark/30 px-4 rounded-md transition-all border border-transparent hover:border-hairline dark:hover:border-divider-dark cursor-pointer group bg-transparent"
                          >
                            {/* Calligraphy square */}
                            <div className="flex-shrink-0 w-12 min-h-12 h-auto py-1.5 bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md flex flex-col items-center justify-center shadow-sm font-display group-hover:bg-surface-card dark:group-hover:bg-black group-hover:border-primary/50 group-hover:text-primary dark:group-hover:text-primary transition-all">
                              <div className={`flex flex-col items-center justify-center gap-0.5 leading-none font-semibold text-ink dark:text-on-dark ${item.hanzi.length > 3 ? 'text-xs' : item.hanzi.length > 1 ? 'text-sm' : 'text-xl'}`}>
                                {Array.from(item.hanzi).map((char, index) => (
                                  <span key={index}>{char}</span>
                                ))}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-1 text-left">
                              <div className="flex flex-wrap items-center gap-2">
                                {item.sv && (
                                  <span className="text-sm font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-primary transition-colors">
                                    {item.sv.toUpperCase()}
                                  </span>
                                )}
                                {item.pinyin && (
                                  <span className="text-xs font-semibold text-primary dark:text-link bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                    {item.pinyin}
                                  </span>
                                )}
                                {item.aiExplanation && (
                                  <span className="text-[10px] text-primary dark:text-link bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 font-bold flex items-center gap-0.5">
                                    <Sparkles size={10} /> Đã giải thích
                                  </span>
                                )}
                              </div>
                              {item.vi && (
                                <p className="text-xs text-body dark:text-on-dark-mute line-clamp-1">
                                  {item.vi}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-mute bg-surface-bone/30 dark:bg-surface-dark/30 rounded-md border border-dashed border-hairline dark:border-divider-dark animate-fade-in">
                      <BookOpen size={48} className="stroke-1 text-mute dark:text-on-dark-mute mb-3" />
                      <p className="text-sm font-medium text-body dark:text-on-dark-mute max-w-sm text-center leading-relaxed">
                        Nhập từ khóa vào ô trên hoặc viết tay bằng khung vẽ bên phải để bắt đầu tra từ điển.
                      </p>
                    </div>
                  )
                )}

                {!loading && results.length > 0 && (
                  <div className="divide-y divide-hairline dark:divide-divider-dark">
                    {results.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectWord(item)}
                        className="flex gap-5 py-4 items-center hover:bg-surface-bone/50 dark:hover:bg-surface-dark/30 px-4 rounded-md transition-all border border-transparent hover:border-hairline dark:hover:border-divider-dark cursor-pointer group bg-transparent"
                      >
                        {/* Character Column */}
                        <div className="flex-shrink-0 w-16 min-h-16 h-auto py-2.5 bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md flex flex-col items-center justify-center shadow-sm font-display group-hover:bg-surface-card dark:group-hover:bg-black group-hover:border-primary/50 group-hover:text-primary dark:group-hover:text-primary transition-all">
                          <div className={`flex flex-col items-center justify-center gap-0.5 leading-none font-semibold text-ink dark:text-on-dark ${item.s.length > 3 ? 'text-xl' : item.s.length > 1 ? 'text-2xl' : 'text-3xl'}`}>
                            {Array.from(item.s).map((char, index) => (
                              <span key={index}>{char}</span>
                            ))}
                          </div>
                        </div>

                        {/* Word Details */}
                        <div className="flex-1 space-y-1.5 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            {getCompoundHanViet(item.s) && (
                              <span className="text-md font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-primary transition-colors">
                                {getCompoundHanViet(item.s).toUpperCase()}
                              </span>
                            )}
                            {item.p && (
                              <span className="text-xs font-semibold text-primary dark:text-link bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                {item.p}
                              </span>
                            )}
                            {isFavorite(item.s) && (
                              <Star size={12} className="text-amber-500 fill-amber-500" />
                            )}
                            {item.t && item.t !== item.s && (
                              <span className="text-xs text-mute dark:text-on-dark-mute font-medium bg-surface-bone dark:bg-surface-dark px-1.5 py-0.5 rounded-full border border-hairline dark:border-divider-dark">
                                Phồn: {item.t}
                              </span>
                            )}
                          </div>

                          {item.vi && (
                            <p className="text-sm text-body dark:text-on-dark-mute leading-relaxed font-medium line-clamp-2">
                              {item.vi}
                            </p>
                          )}

                          {item.en && item.en.length > 0 && (
                            <p className="text-[11px] text-mute dark:text-on-dark-mute font-medium italic">
                              EN: {Array.isArray(item.en) ? item.en.join(', ') : item.en}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Right Panel: Handwriting Recognition Canvas */}
        <div className="lg:col-span-1 h-full">
          <HandwritingCanvas 
            onRecognize={handleRecognize} 
            query={query}
            onDeleteLastChar={() => {
              setQuery((prev) => {
                const next = prev.slice(0, -1);
                return next;
              });
            }}
            onClearAll={() => {
              setQuery('');
              setResults([]);
              setHasSearched(false);
              setSelectedWord(null);
            }}
          />
        </div>

      </div>

    </div>
  );
}
