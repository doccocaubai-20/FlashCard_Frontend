import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  History as HistoryIcon,
  Sparkles,
  PenTool,
  BookOpen,
} from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';
import { dictionaryHistoryApi } from '../services/dictionaryHistoryApi';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { translationData } from '../data/translationData';
import { dialoguesData } from '../data/dialoguesData';
import { grammarData } from '../data/grammarData';
import { safeLocalGet, safeLocalSet } from '../utils/storage';

// 4 Sub-Components (R5 Architecture)
import SearchTab from '../components/dictionary/SearchTab';
import HistoryTab from '../components/dictionary/HistoryTab';
import AiExplanationTab from '../components/dictionary/AiExplanationTab';
import HandwritingTab from '../components/dictionary/HandwritingTab';

const HISTORY_STORAGE_KEY = 'chongzi_dict_history_cache';

// Background dynamic corpus
let _externalSentences = [];
let _cachedSentences = null;

// Compile unique sentence corpus
const getAllSentences = () => {
  const list = [];

  if (Array.isArray(translationData)) {
    translationData.forEach((item) => {
      list.push({
        hanzi: item.hanzi || '',
        pinyin: item.pinyin || '',
        meaning: item.meaning || '',
        source: `HSK câu dịch (${item.level || 'HSK'})`,
      });
    });
  }

  if (Array.isArray(dialoguesData)) {
    dialoguesData.forEach((dialogue) => {
      if (dialogue.lines && Array.isArray(dialogue.lines)) {
        dialogue.lines.forEach((line) => {
          list.push({
            hanzi: line.hanzi || '',
            pinyin: line.pinyin || '',
            meaning: line.meaning || '',
            source: `Hội thoại (${dialogue.title || ''} - ${dialogue.level || 'HSK'})`,
          });
        });
      }
    });
  }

  if (Array.isArray(grammarData)) {
    grammarData.forEach((grammar) => {
      if (grammar.examples && Array.isArray(grammar.examples)) {
        grammar.examples.forEach((ex) => {
          list.push({
            hanzi: ex.hanzi || '',
            pinyin: ex.pinyin || '',
            meaning: ex.meaning || '',
            source: `Ngữ pháp: ${grammar.title || ''} (${grammar.level || 'HSK'})`,
          });
        });
      }
    });
  }

  if (Array.isArray(_externalSentences)) {
    _externalSentences.forEach((item) => {
      list.push({
        hanzi: item.hanzi || '',
        pinyin: item.pinyin || '',
        meaning: item.meaning || '',
        source: item.source || 'ALT song ngữ',
      });
    });
  }

  const unique = [];
  const seen = new Set();
  for (const item of list) {
    if (!item.hanzi) continue;
    const cleanHanzi = item.hanzi.replace(/[.,/#!$%^&*;:{}=\\-_`~()?？。！，、；：\s]/g, '');
    if (!seen.has(cleanHanzi)) {
      seen.add(cleanHanzi);
      unique.push(item);
    }
  }

  return unique;
};

const searchRelatedSentences = (q) => {
  const trimmed = (q || '').trim();
  if (!trimmed) return [];

  if (!_cachedSentences) {
    _cachedSentences = getAllSentences();
  }

  const cleanPinyin = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/ü/g, 'v')
      .replace(/[^a-z0-9]/g, '');
  };

  const qLower = trimmed.toLowerCase();
  const qPinyinClean = cleanPinyin(trimmed);
  const isHanzi = /[\u4e00-\u9fa5]/.test(trimmed);

  const matched = [];

  for (const item of _cachedSentences) {
    let matches = false;

    if (isHanzi) {
      matches = item.hanzi.includes(trimmed);
      if (!matches) {
        const cleanQ = trimmed.replace(/[.,/#!$%^&*;:{}=\\-_`~()?？。！，、；：\s]/g, '');
        if (cleanQ) {
          matches = item.hanzi.replace(/[.,/#!$%^&*;:{}=\\-_`~()?？。！，、；：\s]/g, '').includes(cleanQ);
        }
      }
    } else {
      if (qPinyinClean) {
        const sentSyllables = (item.pinyin || '')
          .toLowerCase()
          .replace(/[.,/#!$%^&*;:{}=\\-_`~()?？。！，、；：]/g, ' ')
          .split(/\s+/)
          .map((s) => cleanPinyin(s));
        if (sentSyllables.includes(qPinyinClean)) {
          matches = true;
        }
      }

      if (!matches && item.meaning) {
        const meaningLower = item.meaning.toLowerCase();
        const escapedQ = qLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBoundaryRegex = new RegExp(`(^|[^a-zà-ỹ0-9])${escapedQ}([^a-zà-ỹ0-9]|$)`, 'i');
        if (wordBoundaryRegex.test(meaningLower)) {
          matches = true;
        }
      }
    }

    if (matches) {
      matched.push(item);
      if (matched.length >= 40) break;
    }
  }

  matched.sort((a, b) => {
    if (a.hanzi === trimmed && b.hanzi !== trimmed) return -1;
    if (b.hanzi === trimmed && a.hanzi !== trimmed) return 1;
    return a.hanzi.length - b.hanzi.length;
  });

  return matched.slice(0, 10);
};

export default function DictionaryScreen() {
  const { lookupMultiple } = useDictionary();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'search' | 'history' | 'ai' | 'handwriting'
  const tabParam = searchParams.get('tab');
  const wordParam = searchParams.get('word');

  const [activeTab, setActiveTab] = useState(
    ['search', 'history', 'ai', 'handwriting'].includes(tabParam) ? tabParam : 'search'
  );

  // --- LIFTED STATE FOR PERSISTENCE ACROSS TABS ---
  const [query, setQuery] = useState(wordParam || '');
  const [results, setResults] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [relatedSentences, setRelatedSentences] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Global History State
  const [history, setHistory] = useState(() => safeLocalGet(HISTORY_STORAGE_KEY, []));

  // Global Favorites State
  const [favorites, setFavorites] = useState([]);

  // Load Corpus and initial datasets
  useEffect(() => {
    import('../data/opusSentences.json')
      .then((module) => {
        _externalSentences = module.default || [];
        _cachedSentences = null;
      })
      .catch((err) => console.error('Failed to load ALT parallel sentences:', err));

    // Fetch DB history
    dictionaryHistoryApi
      .getHistory()
      .then((res) => {
        const fetchedHistory = res.data || [];
        setHistory(fetchedHistory);
        safeLocalSet(HISTORY_STORAGE_KEY, fetchedHistory);
      })
      .catch((err) => console.error('Failed to load history from DB:', err));

    // Fetch Favorites
    favoriteWordsApi
      .getFavorites()
      .then((res) => setFavorites(res.data || []))
      .catch((err) => console.error('Failed to load favorites:', err));
  }, []);

  // Sync tab with URL parameter
  const handleTabChange = useCallback(
    (newTab, targetWord = null) => {
      setActiveTab(newTab);
      if (targetWord) {
        setSelectedWord(targetWord);
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', newTab);
        if (targetWord?.s) {
          next.set('word', targetWord.s);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Hanzi sentence segmentation engine
  const segmentHanziSentence = useCallback(
    async (text) => {
      const cleanText = text.replace(/[.,/#!$%^&*;:{}=\\-_`~()?？。！，、；：]/g, '').trim();
      if (!cleanText) return [];

      const chars = Array.from(cleanText);
      const res = [];
      let i = 0;
      const maxWordLength = 6;

      while (i < chars.length) {
        let matched = false;
        for (let len = Math.min(maxWordLength, chars.length - i); len >= 1; len--) {
          const word = chars.slice(i, i + len).join('');
          const matches = await lookupMultiple('hanzi', word);
          const exact = matches?.find((m) => m.s === word || m.t === word);
          if (exact) {
            res.push({ ...exact, isSegmentedPart: true });
            i += len;
            matched = true;
            break;
          }
        }

        if (!matched) {
          const char = chars[i];
          res.push({
            s: char,
            t: char,
            p: '',
            vi: 'Từ tố chưa cập nhật nghĩa',
            isVirtual: true,
            isSegmentedPart: true,
          });
          i++;
        }
      }
      return res;
    },
    [lookupMultiple]
  );

  // Pinyin segmenter
  const segmentPinyin = useCallback(
    async (s) => {
      if (!s) return [];
      const memo = new Map();
      const helper = async (startIndex) => {
        if (startIndex === s.length) return [];
        if (memo.has(startIndex)) return memo.get(startIndex);

        for (let len = Math.min(6, s.length - startIndex); len >= 1; len--) {
          const part = s.substring(startIndex, startIndex + len);
          const matches = await lookupMultiple('pinyin', part);
          if (matches && matches.length > 0) {
            const rest = await helper(startIndex + len);
            if (rest !== null) {
              const result = [part, ...rest];
              memo.set(startIndex, result);
              return result;
            }
          }
        }
        memo.set(startIndex, null);
        return null;
      };
      return (await helper(0)) || [];
    },
    [lookupMultiple]
  );

  const resolvePinyinSentence = useCallback(
    async (text) => {
      const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (!cleanText) return [];

      const words = cleanText.split(/\s+/);
      const pinyinSyllables = [];
      let isPurePinyin = true;

      for (const word of words) {
        const segmented = await segmentPinyin(word);
        if (segmented && segmented.length > 0) {
          pinyinSyllables.push(...segmented);
        } else {
          isPurePinyin = false;
          break;
        }
      }

      if (!isPurePinyin || pinyinSyllables.length === 0) return [];

      const resolvedChars = [];
      for (const syl of pinyinSyllables) {
        const matches = await lookupMultiple('pinyin', syl);
        if (matches && matches.length > 0) {
          resolvedChars.push(matches[0]);
        }
      }

      if (resolvedChars.length === 0) return [];
      const hanziSentence = resolvedChars.map((c) => c.s).join('');
      return await segmentHanziSentence(hanziSentence);
    },
    [lookupMultiple, segmentPinyin, segmentHanziSentence]
  );

  // Master Search Handler
  const handleSearch = useCallback(
    async (searchQuery = query) => {
      const trimmedQuery = (searchQuery || '').trim();
      if (!trimmedQuery) {
        setResults([]);
        setRelatedSentences([]);
        setHasSearched(false);
        return;
      }

      const qLower = trimmedQuery.toLowerCase();
      setIsSearching(true);

      try {
        const searchResults = await lookupMultiple('all', trimmedQuery);

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

          // 1. Exact Hanzi
          if (s === qLower || t === qLower) score += 100000;
          else if (s.startsWith(qLower) || t.startsWith(qLower)) score += 40000;
          else if (s.includes(qLower) || t.includes(qLower)) score += 20000;

          // 2. Exact Pinyin
          if (p === qLower || pt === qLower) score += 80000;
          else if (sp === qLower) score += 60000;
          else if (p.startsWith(qLower) || pt.startsWith(qLower)) score += 30000;
          else if (sp.startsWith(qLower)) score += 20000;

          // 3. Exact Hán-Việt
          if (sv === qLower) score += 50000;
          else if (sv.startsWith(qLower)) score += 25000;
          else if (sv.split(/[\s·-]+/).includes(qLower)) score += 15000;

          // 4. Vietnamese meaning
          const firstVi = vi.split(/[/;,()]/)[0].trim();
          if (firstVi === qLower || vi.trim() === qLower) score += 50000;
          else if (firstVi.startsWith(qLower) || vi.startsWith(qLower)) score += 35000;
          else {
            const escapedQ = qLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordBoundaryRegex = new RegExp(`(^|[^a-zà-ỹ0-9])${escapedQ}([^a-zà-ỹ0-9]|$)`, 'i');
            if (wordBoundaryRegex.test(vi)) score += 20000;
          }

          // 5. English translation
          const enLower = Array.isArray(item.en) ? item.en.map((e) => e.toLowerCase()) : [];
          if (enLower.includes(qLower) || enLower.includes(`to ${qLower}`)) score += 50000;
          else if (en.includes(qLower)) score += 15000;

          if (score === 0) return 0;

          // 6. HSK Bonus
          if (item.hsk && item.hsk >= 1 && item.hsk <= 6) {
            score += (7 - item.hsk) * 5000;
          }

          // 7. Shorter word boost
          score += Math.max(0, (5 - (s.length || 1)) * 500);

          return score;
        };

        const sortedResults = (searchResults || [])
          .map((item) => ({ item, score: getSortScore(item) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .map(({ item }) => item);

        let finalResults = sortedResults.slice(0, 100);

        if (finalResults.length === 0) {
          const isHanzi = /[\u4e00-\u9fa5]/.test(trimmedQuery);
          let decomposedResults = [];
          if (isHanzi) {
            decomposedResults = await segmentHanziSentence(trimmedQuery);
          } else {
            const isPinyinFormat = /^[a-zA-Z\s1-5]+$/.test(trimmedQuery) && trimmedQuery.includes(' ');
            if (isPinyinFormat) {
              decomposedResults = await resolvePinyinSentence(trimmedQuery);
            }
          }

          if (decomposedResults.length > 0) {
            finalResults = decomposedResults;
          }
        }

        setResults(finalResults);
        setHasSearched(true);

        const matchedSentences = searchRelatedSentences(trimmedQuery);
        setRelatedSentences(matchedSentences);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    },
    [query, lookupMultiple, segmentHanziSentence, resolvePinyinSentence]
  );

  // Favorite toggling handler
  const handleToggleFavorite = useCallback(
    async (wordToToggle) => {
      if (!wordToToggle?.s) return;
      const hanzi = wordToToggle.s;
      const isFav = favorites.some((f) => f.hanzi === hanzi);
      const previousFavorites = [...favorites];

      if (isFav) {
        setFavorites((prev) => prev.filter((f) => f.hanzi !== hanzi));
      } else {
        const tempFav = {
          id: -Date.now(),
          hanzi,
          pinyin: wordToToggle.p || '',
          sv: wordToToggle.sv || '',
          vi: wordToToggle.vi || '',
        };
        setFavorites((prev) => [tempFav, ...prev]);
      }

      try {
        if (isFav) {
          await favoriteWordsApi.deleteFavoriteByHanzi(hanzi);
        } else {
          const res = await favoriteWordsApi.addFavorite({
            hanzi,
            pinyin: wordToToggle.p || '',
            sv: wordToToggle.sv || '',
            vi: wordToToggle.vi || '',
          });
          setFavorites((prev) => prev.map((f) => (f.hanzi === hanzi ? res.data : f)));
        }
      } catch (err) {
        console.error('Failed to toggle favorite:', err);
        setFavorites(previousFavorites);
      }
    },
    [favorites]
  );

  // Handle word selection and record history
  const handleSelectWord = useCallback(
    async (item) => {
      setSelectedWord(item);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('word', item.s);
        return next;
      });

      try {
        await dictionaryHistoryApi.addHistory({
          hanzi: item.s,
          pinyin: item.p || '',
          sv: item.sv || '',
          vi: item.vi || '',
        });

        // Update local history list
        setHistory((prev) => {
          const filtered = prev.filter((h) => h.hanzi !== item.s);
          const updated = [{ hanzi: item.s, pinyin: item.p || '', sv: item.sv || '', vi: item.vi || '' }, ...filtered];
          safeLocalSet(HISTORY_STORAGE_KEY, updated);
          return updated;
        });
      } catch (err) {
        console.error('Failed to save word history:', err);
      }
    },
    [setSearchParams]
  );

  // Clear all history
  const handleClearAllHistory = useCallback(async () => {
    try {
      await dictionaryHistoryApi.clearHistory();
    } catch (err) {
      console.error('Failed to clear DB history:', err);
    }
    setHistory([]);
    safeLocalSet(HISTORY_STORAGE_KEY, []);
  }, []);

  // Handle initial word URL param
  const initialWordChecked = useRef(false);
  useEffect(() => {
    if (!initialWordChecked.current && wordParam) {
      initialWordChecked.current = true;
      const cleanParam = wordParam.trim();
      if (!cleanParam) return;

      lookupMultiple('hanzi', cleanParam)
        .then((matches) => {
          const exact = matches?.find((m) => m.s === cleanParam || m.t === cleanParam);
          if (exact) {
            setSelectedWord(exact);
          } else {
            handleSearch(cleanParam);
          }
        })
        .catch(() => handleSearch(cleanParam));
    }
  }, [wordParam, lookupMultiple, handleSearch]);

  // Tab definitions
  const tabs = useMemo(
    () => [
      {
        id: 'search',
        label: 'Tra từ thông minh',
        shortLabel: 'Tra từ',
        icon: Search,
        badge: results.length > 0 ? results.length : null,
      },
      {
        id: 'history',
        label: 'Lịch sử tra cứu',
        shortLabel: 'Lịch sử',
        icon: HistoryIcon,
        badge: history.length > 0 ? history.length : null,
      },
      {
        id: 'ai',
        label: 'AI Giải thích chi tiết',
        shortLabel: 'AI Từ nguyên',
        icon: Sparkles,
        badge: null,
      },
      {
        id: 'handwriting',
        label: 'Luyện viết tay chữ Hán',
        shortLabel: 'Viết tay',
        icon: PenTool,
        badge: null,
      },
    ],
    [results.length, history.length]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 px-3 sm:px-6 animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex items-center gap-3.5 pt-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-xs shrink-0">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">
            Từ điển chữ Hán ChongZi
          </h1>

        </div>
      </div>

      {/* Top 4-Tab Navigation Bar */}
      <div className="border-b border-hairline dark:border-divider-dark pb-1">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 select-none ${isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark border border-hairline dark:border-divider-dark hover:border-primary/40'
                  }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-primary'} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>

                {tab.badge !== null && tab.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary dark:bg-primary/20'
                      }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab View Canvas Container */}
      <div className="min-h-[520px]">
        {activeTab === 'search' && (
          <SearchTab
            query={query}
            setQuery={setQuery}
            results={results}
            setResults={setResults}
            selectedWord={selectedWord}
            setSelectedWord={setSelectedWord}
            relatedSentences={relatedSentences}
            setRelatedSentences={setRelatedSentences}
            isSearching={isSearching}
            hasSearched={hasSearched}
            handleSearch={handleSearch}
            onSwitchTab={handleTabChange}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            lookupMultiple={lookupMultiple}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            setHistory={setHistory}
            onSelectWord={handleSelectWord}
            onSwitchTab={handleTabChange}
            onClearAllHistory={handleClearAllHistory}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'ai' && (
          <AiExplanationTab
            selectedWord={selectedWord}
            onSelectWord={setSelectedWord}
            history={history}
            lookupMultiple={lookupMultiple}
          />
        )}

        {activeTab === 'handwriting' && (
          <HandwritingTab
            currentWord={selectedWord || query}
            onSelectWord={handleSelectWord}
            onSwitchTab={handleTabChange}
          />
        )}
      </div>
    </div>
  );
}
