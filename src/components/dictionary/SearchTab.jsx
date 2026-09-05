import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Volume2,
  Star,
  BookmarkPlus,
  Sparkles,
  PenTool,
  ArrowLeft,
  Camera,
  X,
  BookOpen,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { speakChinese } from '../../utils/tts';
import HoverableText from '../common/HoverableText';
import { deckApi } from '../../services/deckApi';
import { flashcardApi } from '../../services/flashcardApi';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const TOPICS = {
  1: { name: 'Cơ thể & Sinh học', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  2: { name: 'Sức khỏe & Y tế', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20' },
  3: { name: 'Tâm lý & Nhận thức', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20' },
  4: { name: 'Thời trang & Chăm sóc', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' },
  5: { name: 'Gia đình & Vòng đời', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
  6: { name: 'Giao tiếp & Tương tác', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20' },
  7: { name: 'Giáo dục & Học thuật', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' },
  8: { name: 'Tôn giáo & Triết học', color: 'bg-amber-700/10 text-amber-700 border-amber-700/20 dark:bg-amber-700/10 dark:text-amber-400 dark:border-amber-700/20' },
  9: { name: 'Địa lý & Cảnh quan', color: 'bg-green-600/10 text-green-600 border-green-600/20 dark:bg-green-600/10 dark:text-green-400 dark:border-green-600/20' },
  10: { name: 'Khí hậu & Thời tiết', color: 'bg-blue-400/10 text-blue-600 border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20' },
  11: { name: 'Hệ sinh thái Động - Thực vật', color: 'bg-lime-600/10 text-lime-600 border-lime-600/20 dark:bg-lime-600/10 dark:text-lime-400 dark:border-lime-600/20' },
  12: { name: 'Vũ trụ & Thiên văn', color: 'bg-fuchsia-600/10 text-fuchsia-600 border-fuchsia-600/20 dark:bg-fuchsia-600/10 dark:text-fuchsia-400 dark:border-fuchsia-600/20' },
  13: { name: 'Thương mại & Tài chính', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  14: { name: 'Nghề nghiệp & Việc làm', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' },
  15: { name: 'Chính trị & Pháp luật', color: 'bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-600/10 dark:text-blue-400 dark:border-blue-600/20' },
  16: { name: 'Quân sự & Quốc phòng', color: 'bg-red-600/10 text-red-600 border-red-600/20 dark:bg-red-600/10 dark:text-red-400 dark:border-red-600/20' },
  17: { name: 'Nghệ thuật & Biểu diễn', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20' },
  18: { name: 'Ẩm thực & Đồ uống', color: 'bg-yellow-600/10 text-yellow-600 border-yellow-600/20 dark:bg-yellow-600/10 dark:text-yellow-400 dark:border-yellow-600/20' },
  19: { name: 'Thể thao & Trò chơi', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20' },
  20: { name: 'Du lịch & Khách sạn', color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20 dark:bg-emerald-600/10 dark:text-emerald-400 dark:border-emerald-600/20' },
  21: { name: 'Khoa học tự nhiên & Đo lường', color: 'bg-stone-500/10 text-stone-600 border-stone-500/20 dark:bg-stone-500/10 dark:text-stone-400 dark:border-stone-500/20' },
  22: { name: 'Công nghệ thông tin & Viễn thông', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  23: { name: 'Kỹ thuật & Sản xuất', color: 'bg-slate-600/10 text-slate-600 border-slate-600/20 dark:bg-slate-600/10 dark:text-slate-400 dark:border-slate-600/20' },
  24: { name: 'Giao thông & Hạ tầng', color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20' },
};

// Convert numbered pinyin like "ni3 hao3" to accented "nǐ hǎo"
const convertNumberedPinyin = (pinyinStr) => {
  if (!pinyinStr) return '';
  const tones = {
    a: ['ā', 'á', 'ǎ', 'à', 'a'],
    e: ['ē', 'é', 'ě', 'è', 'e'],
    o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
    i: ['ī', 'í', 'ǐ', 'ì', 'i'],
    u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
    v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  };

  return pinyinStr
    .split(/\s+/)
    .map((word) => {
      const match = word.match(/^([a-zA-ZüÜ]+)([1-5])$/);
      if (!match) return word;

      const base = match[1];
      const toneNum = parseInt(match[2], 10) - 1;

      let targetChar = '';
      if (base.includes('a')) targetChar = 'a';
      else if (base.includes('e')) targetChar = 'e';
      else if (base.includes('ou')) targetChar = 'o';
      else {
        for (let i = base.length - 1; i >= 0; i--) {
          const c = base[i].toLowerCase();
          if (tones[c]) {
            targetChar = c;
            break;
          }
        }
      }

      if (targetChar && tones[targetChar]) {
        const idx = base.toLowerCase().lastIndexOf(targetChar);
        const isUpper = base[idx] === base[idx].toUpperCase();
        const toned = tones[targetChar][toneNum] || targetChar;
        return (
          base.substring(0, idx) +
          (isUpper ? toned.toUpperCase() : toned) +
          base.substring(idx + 1)
        );
      }

      return word;
    })
    .join(' ');
};


export default function SearchTab({
  query,
  setQuery,
  results,
  selectedWord,
  setSelectedWord,
  relatedSentences,
  isSearching,
  hasSearched,
  handleSearch,
  onSwitchTab,
  favorites = [],
  onToggleFavorite,
  lookupMultiple,
}) {
  const toast = useToast();

  // Local input state for 250ms debounce
  const [inputValue, setInputValue] = useState(query);
  const debounceTimerRef = useRef(null);

  // Chunked rendering pagination: start at 20 items
  const [visibleCount, setVisibleCount] = useState(20);
  const sentinelRef = useRef(null);

  // Detail View Active Sub-Tab (if compound word has single char tabs)
  const [activeCharTab, setActiveCharTab] = useState('');
  const [charDetails, setCharDetails] = useState(null);

  // Add to deck modal
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [userDecks, setUserDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [addingToDeck, setAddingToDeck] = useState(false);
  const [deckCardForm, setDeckCardForm] = useState({ front: '', pinyin: '', back: '' });

  // Camera OCR states
  const [showOcrScanner, setShowOcrScanner] = useState(false);
  const [ocrSentenceResult, setOcrSentenceResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Synchronize input value when query changes from outside (e.g. handwriting select or URL param)
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Reset pagination whenever results change
  useEffect(() => {
    setVisibleCount(20);
  }, [results]);

  // Debounced input handler (250ms)
  const handleInputChange = (e) => {
    const nextVal = e.target.value;
    setInputValue(nextVal);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setQuery(nextVal);
      if (nextVal.trim()) {
        handleSearch(nextVal);
      }
    }, 250);
  };

  const handleManualSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery(inputValue);
    handleSearch(inputValue);
  };

  const handleClearQuery = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setInputValue('');
    setQuery('');
  };

  // IntersectionObserver for progressive chunk loading
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < results.length) {
          setVisibleCount((prev) => Math.min(prev + 20, results.length));
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, results.length]);

  // Handle word detail character tab switching
  useEffect(() => {
    if (!selectedWord) {
      setActiveCharTab('');
      setCharDetails(null);
      return;
    }

    setActiveCharTab(selectedWord.s);
    setCharDetails(selectedWord);
  }, [selectedWord]);

  const handleCharTabClick = async (tabChar) => {
    setActiveCharTab(tabChar);
    if (!selectedWord) return;

    if (tabChar === selectedWord.s) {
      setCharDetails(selectedWord);
    } else if (lookupMultiple) {
      try {
        const matches = await lookupMultiple('hanzi', tabChar);
        const match = matches ? matches.find((m) => m.s === tabChar || m.t === tabChar) : null;
        setCharDetails(match || { s: tabChar, p: '', vi: 'Chưa có thông tin chi tiết cho từ tố này.' });
      } catch (err) {
        console.error('Failed to lookup character details:', err);
        setCharDetails({ s: tabChar, p: '', vi: 'Chưa có thông tin chi tiết cho từ tố này.' });
      }
    }
  };

  // Check if character is favorited
  const isWordFavorite = useCallback(
    (hanzi) => {
      return favorites.some((f) => f.hanzi === hanzi);
    },
    [favorites]
  );

  // Character tabs for detail view
  const characterTabs = useMemo(() => {
    if (!selectedWord?.s) return [];
    const uniqueChars = Array.from(new Set(Array.from(selectedWord.s))).filter(
      (c) => /[\u4e00-\u9fa5]/.test(c) && c !== selectedWord.s
    );
    return [selectedWord.s, ...uniqueChars];
  }, [selectedWord]);

  // Open "Add to Deck" modal
  const handleOpenDeckModal = async (word) => {
    const targetWord = word || selectedWord;
    if (!targetWord) return;

    setDeckCardForm({
      front: targetWord.s || '',
      pinyin: targetWord.p || '',
      back: targetWord.vi || '',
    });

    setShowDeckModal(true);
    try {
      const res = await deckApi.getDecks();
      const decks = res.data || [];
      setUserDecks(decks);
      if (decks.length > 0 && !selectedDeckId) {
        setSelectedDeckId(decks[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to fetch user decks:', err);
      toast?.addToast('Không thể tải danh sách bộ thẻ. Vui lòng thử lại!', 'error');
    }
  };

  const handleSaveToDeck = async (e) => {
    e.preventDefault();
    if (!selectedDeckId) {
      toast?.addToast('Vui lòng chọn bộ thẻ cần thêm!', 'error');
      return;
    }
    if (!deckCardForm.front.trim() || !deckCardForm.back.trim()) {
      toast?.addToast('Mặt trước và mặt sau không được để trống!', 'error');
      return;
    }

    setAddingToDeck(true);
    try {
      await flashcardApi.create({
        deckId: Number(selectedDeckId),
        front: deckCardForm.front.trim(),
        pinyin: deckCardForm.pinyin.trim(),
        back: deckCardForm.back.trim(),
      });
      toast?.addToast(`Đã thêm từ "${deckCardForm.front}" vào bộ thẻ thành công!`, 'success');
      setShowDeckModal(false);
    } catch (err) {
      console.error('Failed to add card to deck:', err);
      toast?.addToast('Lỗi khi thêm thẻ vào bộ thẻ. Vui lòng thử lại!', 'error');
    } finally {
      setAddingToDeck(false);
    }
  };

  // OCR handling
  useEffect(() => {
    if (showOcrScanner) {
      navigator.mediaDevices
        ?.enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(videoInputs);
        })
        .catch((err) => console.error('Enumerate devices failed:', err));
    } else {
      setCapturedImage(null);
      setRecognizedText('');
      setOcrError('');
      setOcrProgress('');
      setSelectedDeviceId('');
    }
  }, [showOcrScanner]);

  useEffect(() => {
    let activeStream = null;
    if (showOcrScanner && !capturedImage) {
      const useFacingMode = !selectedDeviceId;
      const constraints = useFacingMode
        ? { video: { facingMode: 'environment' } }
        : { video: { deviceId: { exact: selectedDeviceId } } };

      navigator.mediaDevices
        ?.getUserMedia(constraints)
        .then((s) => {
          activeStream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.setAttribute('playsinline', '');
            videoRef.current.setAttribute('muted', '');
            videoRef.current.play().catch((e) => console.log('Autoplay failed:', e));
          }
        })
        .catch(() => {
          setOcrError('Không thể truy cập camera. Vui lòng cấp quyền camera cho ứng dụng!');
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showOcrScanner, selectedDeviceId, capturedImage]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);

    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }

    performOcr(canvas);
  };

  const performOcr = async (imageSource) => {
    if (!window.Tesseract) {
      setOcrError('Không tìm thấy thư viện OCR. Vui lòng kiểm tra kết nối mạng!');
      return;
    }
    setOcrLoading(true);
    setOcrError('');
    setOcrProgress('Đang chuẩn bị công cụ nhận diện...');

    try {
      const {
        data: { text },
      } = await window.Tesseract.recognize(imageSource, 'chi_sim', {
        langPath: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0',
        logger: (m) => {
          const pct = Math.round(m.progress * 100);
          if (m.status === 'recognizing text') {
            setOcrProgress(`Đang nhận dạng chữ Hán: ${pct}%`);
          } else {
            setOcrProgress(`${m.status}: ${pct}%`);
          }
        },
      });

      const cleanedText = text.replace(/\s+/g, '').trim();
      setRecognizedText(cleanedText);
      if (!cleanedText) {
        setOcrError('Không tìm thấy chữ Hán nào trong hình ảnh. Hãy thử chụp rõ hơn!');
      } else {
        setOcrProgress('Nhận diện thành công!');
      }
    } catch (err) {
      console.error('OCR failed:', err);
      setOcrError('Lỗi trong quá trình nhận diện hình ảnh.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOcrAnalyze = async () => {
    if (!recognizedText.trim()) return;
    setOcrLoading(true);
    setOcrError('');
    setOcrProgress('AI đang dịch nghĩa & phân tách câu...');
    try {
      const res = await api.post('/api/dictionary/ocr-analyze', {
        text: recognizedText.trim(),
      });
      setOcrSentenceResult(res.data);
      setShowOcrScanner(false);
    } catch (err) {
      console.error('OCR Analysis failed:', err);
      setOcrError(err.response?.data?.message || 'Lỗi khi phân tích câu bằng AI.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Render formatted Vietnamese definitions with clickable link words
  const renderFormattedVi = (text) => {
    if (!text) return null;
    const regex = /([\u4e00-\u9fa5]+(?:[|｜][\u4e00-\u9fa5]+)*)\[([a-zA-Z0-9\s]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const rawWord = match[1];
      const pinyinRaw = match[2];
      const searchWord = rawWord.includes('|')
        ? rawWord.split('|')[1]
        : rawWord.includes('｜')
          ? rawWord.split('｜')[1]
          : rawWord;

      const formattedPinyin = convertNumberedPinyin(pinyinRaw);

      parts.push(
        <span key={matchIndex} className="inline-flex flex-wrap items-center gap-0.5 mx-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInputValue(searchWord);
              setQuery(searchWord);
              handleSearch(searchWord);
            }}
            className="text-primary hover:underline font-bold focus:outline-none cursor-pointer"
          >
            {rawWord}
          </button>
          <span className="text-[11px] text-mute font-mono">({formattedPinyin})</span>
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tra cứu chữ Hán, Pinyin, Hán-Việt hoặc nghĩa Tiếng Việt... (Ví dụ: 去, ren, khứ, người)"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleManualSearch();
            }}
            className="w-full pl-11 pr-20 py-3.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark shadow-xs"
          />
          <Search className="absolute left-4 top-4 text-mute" size={18} />

          <div className="absolute right-3 top-2.5 flex items-center gap-1">
            {inputValue && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="p-1.5 rounded-full text-mute hover:text-ink dark:hover:text-on-dark hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
                title="Xóa ô tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowOcrScanner(true)}
              className="p-1.5 rounded-full text-mute hover:text-primary hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
              title="Quét chữ bằng Camera (OCR)"
            >
              <Camera size={18} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualSearch}
          disabled={isSearching}
          className="px-6 py-3.5 rounded-full bg-primary hover:bg-primary-deep disabled:bg-stone text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 shrink-0"
        >
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Search size={16} />
          )}
          <span>Tìm kiếm</span>
        </button>
      </div>


      {/* OCR Result Banner if available */}
      {ocrSentenceResult && (
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 p-5 rounded-2xl space-y-3 animate-fade-in relative shadow-xs">
          <button
            type="button"
            onClick={() => setOcrSentenceResult(null)}
            className="absolute top-4 right-4 text-mute hover:text-ink dark:hover:text-on-dark font-bold text-xs cursor-pointer p-1 rounded-full"
          >
            <X size={16} />
          </button>
          <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/15 px-2.5 py-1 rounded-full inline-block">
            Kết quả quét Camera AI
          </span>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-display font-extrabold text-ink dark:text-on-dark">
              {ocrSentenceResult.originalText}
            </h3>
            <button
              type="button"
              onClick={() => speakChinese(ocrSentenceResult.originalText)}
              className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-primary flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
              title="Phát âm"
            >
              <Volume2 size={14} />
            </button>
          </div>
          <p className="text-sm font-mono font-bold text-primary dark:text-link">
            {ocrSentenceResult.pinyin}
          </p>
          <p className="text-xs text-body dark:text-on-dark-mute italic font-medium leading-relaxed">
            Dịch nghĩa: {ocrSentenceResult.translation}
          </p>

          {ocrSentenceResult.words && ocrSentenceResult.words.length > 0 && (
            <div className="border-t border-hairline dark:border-divider-dark pt-3 mt-2 space-y-2">
              <h4 className="text-[11px] font-bold text-mute uppercase tracking-wider">
                Phân tách từ tố (Click để tra chi tiết):
              </h4>
              <div className="flex flex-wrap gap-2">
                {ocrSentenceResult.words.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputValue(item.word);
                      setQuery(item.word);
                      handleSearch(item.word);
                    }}
                    className="px-3 py-1.5 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark rounded-xl text-xs font-semibold text-ink dark:text-on-dark hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center gap-0.5 shadow-xs"
                  >
                    <span className="font-bold text-sm text-primary">{item.word}</span>
                    <span className="text-[10px] text-mute font-normal">{item.meaning}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content: Word Detail View OR Search Results List */}
      {selectedWord ? (
        /* WORD DETAIL VIEW */
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Header & Back Button */}
          <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedWord(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer shadow-xs"
                title="Quay lại danh sách kết quả"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="font-display font-extrabold text-ink dark:text-on-dark text-lg tracking-tight">
                  Chi tiết từ vựng
                </h3>
                <p className="text-xs text-mute dark:text-on-dark-mute">
                  Ý nghĩa, âm Hán-Việt, phát âm và phân tách chữ Hán
                </p>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenDeckModal(selectedWord)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark text-xs font-semibold transition-all cursor-pointer shadow-xs"
                title="Thêm từ này vào bộ thẻ Flashcard"
              >
                <BookmarkPlus size={14} className="text-primary" />
                <span className="hidden sm:inline">Thêm vào thẻ</span>
              </button>

              <button
                type="button"
                onClick={() => onSwitchTab('ai', selectedWord)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Xem phân tích từ nguyên sâu bằng AI"
              >
                <Sparkles size={14} />
                <span>AI Phân tích</span>
              </button>

              <button
                type="button"
                onClick={() => onSwitchTab('handwriting', selectedWord)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Tập viết nét chữ Hán này"
              >
                <PenTool size={14} className="text-amber-600" />
                <span className="hidden sm:inline">Luyện viết</span>
              </button>
            </div>
          </div>

          {/* Sub Character Tabs (if compound word) */}
          {characterTabs.length > 1 && (
            <div className="flex gap-2 border-b border-hairline dark:border-divider-dark pb-3 overflow-x-auto select-none no-scrollbar">
              {characterTabs.map((charTab) => (
                <button
                  key={charTab}
                  type="button"
                  onClick={() => handleCharTabClick(charTab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all border cursor-pointer whitespace-nowrap ${activeCharTab === charTab
                    ? 'bg-primary border-primary text-white shadow-xs'
                    : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                    }`}
                >
                  {charTab === selectedWord.s ? `Từ ghép: ${charTab}` : `Chữ đơn: ${charTab}`}
                </button>
              ))}
            </div>
          )}

          {/* Large Word Display Card */}
          <div className="bg-surface-bone dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
            {/* Top info badge */}
            <span className="text-[11px] uppercase font-bold text-mute tracking-wider absolute top-4 left-5">
              {charDetails?.s === charDetails?.t ? 'Từ vựng Giản thể' : 'Giản thể & Phồn thể'}
            </span>

            {/* Top Right Action Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => speakChinese(charDetails?.s || selectedWord.s)}
                className="p-2.5 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-primary hover:text-primary-deep shadow-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                title="Phát âm từ này"
              >
                <Volume2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(selectedWord)}
                className={`p-2.5 rounded-full border transition-all cursor-pointer shadow-xs ${isWordFavorite(selectedWord.s)
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-500 hover:bg-amber-500/25'
                  : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark'
                  }`}
                title={isWordFavorite(selectedWord.s) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                <Star size={18} fill={isWordFavorite(selectedWord.s) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Calligraphy Box (Mễ tự ô) Presentation */}
            <div className="my-3 flex flex-wrap items-center justify-center gap-4">
              {Array.from(charDetails?.s || selectedWord.s).map((ch, chIdx) => (
                <div
                  key={chIdx}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 bg-surface-card dark:bg-surface-dark border-2 border-primary/20 dark:border-primary/30 rounded-xl flex items-center justify-center shadow-xs select-all"
                >
                  {/* Mễ tự ô guidelines */}
                  <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-15">
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 border-l border-dashed border-primary" />
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 border-t border-dashed border-primary" />
                  </div>
                  <span className="text-5xl sm:text-6xl font-display font-extrabold text-ink dark:text-on-dark z-10">
                    {ch}
                  </span>
                </div>
              ))}
            </div>

            {/* Phonetics & Meta */}
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <span className="text-xs font-semibold text-mute uppercase tracking-widest">
                Bính âm &amp; Âm Hán-Việt
              </span>
              <div className="flex items-center gap-2 text-base text-ink dark:text-on-dark font-bold">
                <span className="text-primary font-mono">{charDetails?.p || selectedWord.p || '---'}</span>
                {(charDetails?.sv || selectedWord.sv) && (
                  <>
                    <span className="text-mute font-normal">|</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono tracking-wide">
                      {(charDetails?.sv || selectedWord.sv).toUpperCase()}
                    </span>
                  </>
                )}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {selectedWord.hsk && (
                  <span className="text-[11px] font-bold font-mono px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    HSK {selectedWord.hsk}
                  </span>
                )}
                {charDetails?.b && (
                  <span className="text-[11px] font-semibold text-mute bg-surface-card dark:bg-surface-dark px-2.5 py-0.5 rounded-full border border-hairline dark:border-divider-dark">
                    {charDetails.b} nét
                  </span>
                )}
                {selectedWord.topicId && TOPICS[selectedWord.topicId] && (
                  <span
                    className={`text-[10px] font-bold font-mono px-3 py-0.5 rounded-full border ${TOPICS[selectedWord.topicId].color
                      }`}
                  >
                    🏷️ {TOPICS[selectedWord.topicId].name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Definitions Section */}
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-6 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={15} className="text-primary" />
              Định nghĩa &amp; Giải thích ngữ nghĩa
            </h4>

            <div className="space-y-3">
              {/* Vietnamese definition */}
              {(charDetails?.vi || selectedWord.vi) && (
                <div className="flex items-start gap-3 bg-surface-bone/60 dark:bg-black/20 p-4 rounded-xl border border-hairline dark:border-divider-dark">
                  <span className="text-[10px] uppercase font-extrabold bg-primary/15 text-primary px-2 py-0.5 rounded border border-primary/20 mt-0.5 shrink-0">
                    VI
                  </span>
                  <div className="text-sm text-ink dark:text-on-dark font-medium leading-relaxed">
                    {renderFormattedVi(charDetails?.vi || selectedWord.vi)}
                  </div>
                </div>
              )}

              {/* English translation */}
              {(charDetails?.en || selectedWord.en) && (
                <div className="flex items-start gap-3 bg-surface-bone/40 dark:bg-black/10 p-4 rounded-xl border border-hairline dark:border-divider-dark">
                  <span className="text-[10px] uppercase font-extrabold bg-surface-card dark:bg-surface-dark text-mute px-2 py-0.5 rounded border border-hairline dark:border-divider-dark mt-0.5 shrink-0">
                    EN
                  </span>
                  <p className="text-sm text-body dark:text-on-dark-mute leading-relaxed font-normal">
                    {Array.isArray(charDetails?.en || selectedWord.en)
                      ? (charDetails?.en || selectedWord.en).join('; ')
                      : charDetails?.en || selectedWord.en}
                  </p>
                </div>
              )}
            </div>

            {/* Word examples from dictionary */}
            {charDetails?.examples && charDetails.examples.length > 0 && (
              <div className="border-t border-hairline dark:border-divider-dark pt-4 mt-4 space-y-3">
                <h5 className="text-xs font-bold text-mute uppercase tracking-wider flex items-center gap-1.5">
                  Ví dụ câu trong từ điển ({charDetails.examples.length})
                </h5>
                <div className="flex flex-col gap-2.5">
                  {charDetails.examples.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="bg-surface-bone/35 dark:bg-black/15 p-3.5 rounded-xl border border-hairline dark:border-divider-dark flex justify-between items-start gap-3"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-base font-display font-bold text-ink dark:text-on-dark">
                          <HoverableText text={ex.hanzi} />
                        </div>
                        {ex.pinyin && (
                          <div className="text-xs font-mono font-semibold text-primary">
                            {ex.pinyin}
                          </div>
                        )}
                        <div className="text-xs text-body dark:text-on-dark-mute italic font-medium">
                          {ex.meaning}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakChinese(ex.hanzi)}
                        className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark text-primary border border-hairline dark:border-divider-dark flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
                        title="Nghe phát âm ví dụ"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SEARCH RESULTS LIST VIEW */
        <div className="flex flex-col gap-6">
          {/* Loading Indicator */}
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-20 text-mute gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <span className="text-sm font-medium">Đang tìm kiếm từ điển...</span>
            </div>
          )}

          {/* Empty or No Results State */}
          {!isSearching && results.length === 0 && relatedSentences.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-card dark:bg-surface-dark/40 rounded-2xl border border-dashed border-hairline dark:border-divider-dark animate-fade-in">
              <BookOpen size={44} className="stroke-1 text-mute mb-3 opacity-60" />
              <p className="text-base font-bold text-ink dark:text-on-dark">
                {hasSearched ? 'Không tìm thấy kết quả phù hợp' : 'Tra từ điển thông minh'}
              </p>
              <p className="text-xs text-mute dark:text-on-dark-mute max-w-md mt-1 leading-relaxed">
                {hasSearched
                  ? `Từ khóa "${query}" chưa có trong từ điển. Hãy thử tìm theo Bính âm (Pinyin), Hán tự đơn lẻ, hoặc viết tay.`
                  : 'Nhập chữ Hán, phiên âm Pinyin, âm Hán-Việt hoặc nghĩa Tiếng Việt để bắt đầu tìm kiếm nhanh chóng.'}
              </p>
            </div>
          )}

          {/* Results List */}
          {!isSearching && results.length > 0 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-2">
                <span className="text-xs font-bold text-mute uppercase tracking-wider">
                  Kết quả tìm kiếm ({results.length} từ)
                </span>
                <span className="text-[11px] text-mute font-mono">
                  Hiển thị {Math.min(visibleCount, results.length)}/{results.length}
                </span>
              </div>

              {/* Segmented alert if sentence query */}
              {results[0]?.isSegmentedPart && (
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 p-3.5 rounded-xl text-xs text-primary dark:text-link text-left flex items-start gap-2.5 shadow-xs">
                  <span className="text-base shrink-0">💡</span>
                  <div>
                    <p className="font-bold">Nhận diện câu / cụm từ ghép</p>
                    <p className="mt-0.5 text-mute font-normal">
                      Từ điển đã tự động phân tách câu của bạn thành từng từ tố đơn lẻ dưới đây:
                    </p>
                  </div>
                </div>
              )}

              {/* Render Visible Results Chunk */}
              <div className="divide-y divide-hairline dark:divide-divider-dark">
                {results.slice(0, visibleCount).map((item, idx) => (
                  <div
                    key={`${item.s}_${idx}`}
                    onClick={() => setSelectedWord(item)}
                    className="flex gap-4 py-4 items-center hover:bg-surface-bone/50 dark:hover:bg-surface-dark/30 px-3 sm:px-4 rounded-xl transition-all border border-transparent hover:border-hairline dark:hover:border-divider-dark cursor-pointer group bg-transparent"
                  >
                    {/* Character Column */}
                    <div className="shrink-0 min-w-[4rem] h-16 px-3 bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl flex items-center justify-center shadow-xs font-display group-hover:border-primary/50 group-hover:text-primary transition-all">
                      <span className="text-2xl font-bold text-ink dark:text-on-dark tracking-wide leading-none">
                        {item.s}
                      </span>
                    </div>

                    {/* Word Details */}
                    <div className="flex-1 min-w-0 space-y-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.sv && (
                          <span className="text-sm font-bold text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                            {item.sv.toUpperCase()}
                          </span>
                        )}
                        {item.p && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                            {item.p}
                          </span>
                        )}
                        {item.hsk && (
                          <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                            HSK {item.hsk}
                          </span>
                        )}
                        {isWordFavorite(item.s) && (
                          <Star size={13} className="text-amber-500 fill-amber-500" />
                        )}
                      </div>

                      {item.vi && (
                        <p className="text-xs sm:text-sm text-body dark:text-on-dark-mute leading-relaxed font-medium line-clamp-2">
                          {item.vi}
                        </p>
                      )}

                      {item.en && item.en.length > 0 && (
                        <p className="text-[11px] text-mute font-normal italic line-clamp-1">
                          EN: {Array.isArray(item.en) ? item.en.join(', ') : item.en}
                        </p>
                      )}
                    </div>

                    {/* Action buttons on card */}
                    <div className="shrink-0 flex items-center gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakChinese(item.s);
                        }}
                        className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-primary flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
                        title="Phát âm từ"
                      >
                        <Volume2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeckModal(item);
                        }}
                        className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:text-primary flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
                        title="Thêm vào bộ thẻ"
                      >
                        <BookmarkPlus size={13} />
                      </button>
                      <ChevronRight size={16} className="text-mute group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button / Intersection Sentinel */}
              {visibleCount < results.length && (
                <div className="flex flex-col items-center justify-center pt-3 pb-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 20, results.length))}
                    className="px-5 py-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark text-xs font-bold text-ink dark:text-on-dark transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    Tải thêm ({results.length - visibleCount} từ còn lại)
                  </button>
                  <div ref={sentinelRef} className="h-4 w-full" />
                </div>
              )}
            </div>
          )}

          {/* Related Example Sentences Section */}
          {!isSearching && relatedSentences.length > 0 && (
            <div className="flex flex-col gap-4 text-left border-t border-hairline dark:border-divider-dark pt-5 animate-fade-in">
              <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" />
                Câu ví dụ song ngữ liên quan ({relatedSentences.length})
              </h4>
              <div className="flex flex-col gap-3">
                {relatedSentences.map((sentence, sIdx) => (
                  <div
                    key={sIdx}
                    className="bg-surface-card dark:bg-surface-dark/40 p-4 rounded-xl border border-hairline dark:border-divider-dark flex justify-between items-start gap-4 hover:border-primary/30 transition-all shadow-xs"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="text-base sm:text-lg font-display font-extrabold text-ink dark:text-on-dark">
                        <HoverableText text={sentence.hanzi} />
                      </div>
                      <div className="text-xs font-mono font-bold text-primary dark:text-link">
                        {sentence.pinyin}
                      </div>
                      <div className="text-xs text-body dark:text-on-dark-mute italic font-medium pt-0.5">
                        {sentence.meaning}
                      </div>
                      <div className="pt-1.5">
                        <span className="text-[9px] uppercase font-bold text-mute bg-surface-bone dark:bg-black/20 border border-hairline dark:border-divider-dark px-1.5 py-0.5 rounded">
                          {sentence.source}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakChinese(sentence.hanzi)}
                      className="h-8 w-8 rounded-full bg-surface-bone hover:bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark text-primary shadow-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
                      title="Nghe đọc toàn bộ câu"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add To Deck Modal */}
      {showDeckModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-3">
              <div className="flex items-center gap-2">
                <BookmarkPlus size={18} className="text-primary" />
                <h3 className="font-display font-bold text-ink dark:text-on-dark text-base">
                  Thêm vào bộ thẻ Flashcard
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeckModal(false)}
                className="text-mute hover:text-ink dark:hover:text-on-dark p-1 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveToDeck} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-mute uppercase tracking-wider mb-1">
                  Chọn bộ thẻ đích:
                </label>
                {userDecks.length > 0 ? (
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    {userDecks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.cardsCount || 0} thẻ)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-mute italic">
                    Chưa có bộ thẻ nào. Hãy tạo bộ thẻ trước trong trang Bộ thẻ!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mute uppercase tracking-wider mb-1">
                  Mặt trước (Chữ Hán):
                </label>
                <input
                  type="text"
                  value={deckCardForm.front}
                  onChange={(e) => setDeckCardForm({ ...deckCardForm, front: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 text-ink dark:text-on-dark font-display font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mute uppercase tracking-wider mb-1">
                  Phiên âm (Pinyin):
                </label>
                <input
                  type="text"
                  value={deckCardForm.pinyin}
                  onChange={(e) => setDeckCardForm({ ...deckCardForm, pinyin: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 text-ink dark:text-on-dark font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mute uppercase tracking-wider mb-1">
                  Mặt sau (Định nghĩa):
                </label>
                <textarea
                  rows={3}
                  value={deckCardForm.back}
                  onChange={(e) => setDeckCardForm({ ...deckCardForm, back: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 text-ink dark:text-on-dark resize-none font-medium leading-relaxed"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeckModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark text-ink dark:text-on-dark text-xs font-bold cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingToDeck || userDecks.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-deep disabled:bg-stone text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                >
                  {addingToDeck ? 'Đang lưu...' : 'Lưu vào bộ thẻ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR Scanner Modal */}
      {showOcrScanner && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-xl text-left relative">
            <button
              type="button"
              onClick={() => setShowOcrScanner(false)}
              className="absolute top-4 right-4 text-mute hover:text-ink dark:hover:text-on-dark p-2 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-hairline dark:border-divider-dark pb-3">
              <Camera size={20} className="text-primary" />
              <div>
                <h3 className="font-display font-extrabold text-base text-ink dark:text-on-dark">
                  Quét chữ Hán bằng Camera (OCR)
                </h3>
                <p className="text-xs text-mute mt-0.5">
                  Hướng camera vào trang sách hoặc tài liệu để nhận diện chữ Hán.
                </p>
              </div>
            </div>

            {ocrError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold">
                ⚠️ {ocrError}
              </div>
            )}

            <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-hairline dark:border-divider-dark flex items-center justify-center">
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-8 border-2 border-dashed border-primary/70 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="bg-black/60 text-white text-[9px] px-2 py-1 rounded font-bold tracking-wider uppercase">
                      Căn chữ Hán vào khung này
                    </span>
                  </div>
                </>
              ) : (
                <img src={capturedImage} alt="Captured frame" className="w-full h-full object-cover" />
              )}

              {ocrLoading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-3 p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  <span className="text-xs font-semibold tracking-wide animate-pulse">{ocrProgress}</span>
                </div>
              )}
            </div>

            {!capturedImage && videoDevices.length > 1 && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-mute tracking-wider">
                  Chọn Camera
                </label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary cursor-pointer"
                >
                  {videoDevices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {recognizedText && (
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-mute tracking-wider">
                  Chữ Hán nhận diện được (Click để sửa nếu cần):
                </label>
                <textarea
                  value={recognizedText}
                  onChange={(e) => setRecognizedText(e.target.value)}
                  rows={2}
                  className="w-full text-sm p-3 rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary resize-none font-display font-semibold"
                />
              </div>
            )}

            <div className="flex gap-3 mt-1">
              {capturedImage ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      setRecognizedText('');
                      setOcrError('');
                      setOcrProgress('');
                    }}
                    className="flex-1 py-2.5 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl text-ink dark:text-on-dark text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Chụp lại
                  </button>
                  <button
                    type="button"
                    onClick={handleOcrAnalyze}
                    disabled={ocrLoading || !recognizedText.trim()}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-deep text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98 disabled:bg-stone"
                  >
                    <Sparkles size={14} />
                    Dịch &amp; Phân tích AI
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={captureFrame}
                  className="w-full py-2.5 bg-primary hover:bg-primary-deep text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                >
                  <Camera size={14} />
                  Chụp &amp; Nhận diện chữ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
