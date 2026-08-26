import React, { useState, useEffect, useRef } from 'react';
import { useDictionary } from '../hooks/useDictionary';
import HandwritingCanvas from '../components/common/HandwritingCanvas';
import { Search, BookOpen, ArrowLeft, Sparkles, Copy, Check, History, Trash2, Star, Volume2, Camera, X } from 'lucide-react';
import { dictionaryHistoryApi } from '../services/dictionaryHistoryApi';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { useSearchParams } from 'react-router-dom';
import { translationData } from '../data/translationData';
import { dialoguesData } from '../data/dialoguesData';
import { grammarData } from '../data/grammarData';
import api from '../services/api';
import { speakChinese } from '../utils/tts';
import HoverableText from '../components/common/HoverableText';

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

// Helper to convert numbered pinyin like "bai2 bai2" to tone marks like "bái bái"
const convertNumberedPinyin = (pinyinStr) => {
  if (!pinyinStr) return '';
  const tones = {
    a: ['ā', 'á', 'ǎ', 'à', 'a'],
    e: ['ē', 'é', 'ě', 'è', 'e'],
    o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
    i: ['ī', 'í', 'ǐ', 'ì', 'i'],
    u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
    v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü']
  };

  return pinyinStr.split(/\s+/).map(word => {
    const match = word.match(/^([a-zA-ZüÜ]+)([1-5])$/);
    if (!match) return word;

    const base = match[1];
    const toneNum = parseInt(match[2]) - 1;

    let targetChar = '';
    if (base.includes('a')) targetChar = 'a';
    else if (base.includes('e')) targetChar = 'e';
    else if (base.includes('ou')) targetChar = 'o';
    else {
      // Find last vowel
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
      return base.substring(0, idx) + (isUpper ? toned.toUpperCase() : toned) + base.substring(idx + 1);
    }

    return word;
  }).join(' ');
};

// Strips bracketed Hanzi+Pinyin to keep summaries clean in list views
const stripBrackets = (text) => {
  if (!text) return '';
  const regex = /([\u4e00-\u9fa5]+(?:[|｜][\u4e00-\u9fa5]+)*)\[([a-zA-Z0-9\s]+)\]/g;
  return text.replace(regex, (match, rawWord) => {
    if (rawWord.includes('|')) return rawWord.split('|')[1];
    if (rawWord.includes('｜')) return rawWord.split('｜')[1];
    return rawWord;
  });
};

// External sentences loaded dynamically in the background
let _externalSentences = [];

// Compile list of unique sentences once when the module loads
const getAllSentences = () => {
  const list = [];

  // 1. From translationData
  if (Array.isArray(translationData)) {
    translationData.forEach(item => {
      list.push({
        hanzi: item.hanzi || '',
        pinyin: item.pinyin || '',
        meaning: item.meaning || '',
        source: `HSK câu dịch (${item.level || 'HSK'})`
      });
    });
  }

  // 2. From dialoguesData
  if (Array.isArray(dialoguesData)) {
    dialoguesData.forEach(dialogue => {
      if (dialogue.lines && Array.isArray(dialogue.lines)) {
        dialogue.lines.forEach(line => {
          list.push({
            hanzi: line.hanzi || '',
            pinyin: line.pinyin || '',
            meaning: line.meaning || '',
            source: `Hội thoại (${dialogue.title || ''} - ${dialogue.level || 'HSK'})`
          });
        });
      }
    });
  }

  // 3. From grammarData
  if (Array.isArray(grammarData)) {
    grammarData.forEach(grammar => {
      if (grammar.examples && Array.isArray(grammar.examples)) {
        grammar.examples.forEach(ex => {
          list.push({
            hanzi: ex.hanzi || '',
            pinyin: ex.pinyin || '',
            meaning: ex.meaning || '',
            source: `Ngữ pháp: ${grammar.title || ''} (${grammar.level || 'HSK'})`
          });
        });
      }
    });
  }

  // 4. From external ALT corpus
  if (Array.isArray(_externalSentences)) {
    _externalSentences.forEach(item => {
      list.push({
        hanzi: item.hanzi || '',
        pinyin: item.pinyin || '',
        meaning: item.meaning || '',
        source: item.source || 'ALT song ngữ'
      });
    });
  }

  // Deduplicate by normalized Hanzi
  const unique = [];
  const seen = new Set();
  for (const item of list) {
    if (!item.hanzi) continue;
    const cleanHanzi = item.hanzi.replace(new RegExp('[.,/#!$%^&*;:{}=\\-_`~()?？。！，、；：\\s]', 'g'), '');
    if (!seen.has(cleanHanzi)) {
      seen.add(cleanHanzi);
      unique.push(item);
    }
  }

  return unique;
};

// Cached full sentences array
let _cachedSentences = null;

const searchRelatedSentences = (q) => {
  const trimmed = (q || '').trim();
  if (!trimmed) return [];

  if (!_cachedSentences) {
    _cachedSentences = getAllSentences();
  }

  // Normalize query for Pinyin search
  const cleanPinyin = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove tone marks
      .toLowerCase()
      .replace(/ü/g, 'v')
      .replace(/[^a-z0-9]/g, ''); // keep only alphanumeric
  };

  const qLower = trimmed.toLowerCase();
  const qPinyinClean = cleanPinyin(trimmed);
  const isHanzi = /[\u4e00-\u9fa5]/.test(trimmed);

  const matched = [];

  for (const item of _cachedSentences) {
    let matches = false;

    if (isHanzi) {
      // Substring check on Hanzi
      matches = item.hanzi.includes(trimmed);

      // Fallback clean check
      if (!matches) {
        const cleanQ = trimmed.replace(new RegExp('[.,/#!$%^&*;:{}=\\-_`~()?？。！，、；：\\s]', 'g'), '');
        if (cleanQ && cleanQ.length > 0) {
          matches = item.hanzi.replace(new RegExp('[.,/#!$%^&*;:{}=\\-_`~()?？.！，、；：\\s]', 'g'), '').includes(cleanQ);
        }
      }
    } else {
      // Pinyin substring check
      const sentPinyinClean = cleanPinyin(item.pinyin);
      if (qPinyinClean && sentPinyinClean.includes(qPinyinClean)) {
        matches = true;
      }

      // Vietnamese meaning substring check
      if (!matches && item.meaning) {
        const meaningLower = item.meaning.toLowerCase();
        if (meaningLower.includes(qLower)) {
          matches = true;
        }
      }
    }

    if (matches) {
      matched.push(item);
    }
  }

  // Sort matches by Hanzi length (shorter sentence first)
  matched.sort((a, b) => {
    if (a.hanzi === trimmed && b.hanzi !== trimmed) return -1;
    if (b.hanzi === trimmed && a.hanzi !== trimmed) return 1;
    return a.hanzi.length - b.hanzi.length;
  });

  return matched.slice(0, 10);
};

// Stroke order guide and writing practice component for the dictionary
function DictionaryWritingPractice({ word }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [mode, setMode] = useState('idle'); // 'idle' | 'quiz'
  const [showOutline, setShowOutline] = useState(true);

  const cleanWord = (word || '').replace(/[。？！，、；：?]/g, '').trim();
  const chars = Array.from(cleanWord).filter(c => /[\u4e00-\u9fa5]/.test(c));
  const targetChar = chars[activeCharIndex] || chars[0] || '';

  useEffect(() => {
    // Reset active character index and state when the word changes
    setActiveCharIndex(0);
    setMode('idle');
  }, [word]);

  useEffect(() => {
    if (!containerRef.current || !window.HanziWriter || !targetChar) return;

    containerRef.current.innerHTML = '';

    const isDark = document.documentElement.classList.contains('dark');
    const outlineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(32, 32, 32, 0.08)';
    const strokeColor = '#0d9488'; // primary teal
    const drawingColor = isDark ? '#2dd4bf' : '#0d9488';
    const radicalColor = '#10b981';

    const writer = window.HanziWriter.create(containerRef.current, targetChar, {
      width: 140,
      height: 140,
      padding: 5,
      showOutline: showOutline,
      strokeColor,
      outlineColor,
      drawingColor,
      radicalColor,
      highlightColor: '#f97316',
      showCharacter: true
    });

    writerRef.current = writer;
    writer.animateCharacter(); // Animate strokes automatically when loaded
  }, [targetChar, showOutline]);

  const handleAnimate = () => {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    setMode('idle');
    writerRef.current.animateCharacter();
  };

  const handleQuiz = () => {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    setMode('quiz');
    writerRef.current.quiz({
      onComplete: () => {
        setMode('idle');
      }
    });
  };

  if (chars.length === 0) return null;

  return (
    <div className="bg-surface-card dark:bg-zinc-900/20 border border-hairline dark:border-divider-dark rounded-md p-5 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
      <div className="flex items-center justify-between w-full border-b border-hairline dark:border-divider-dark pb-2">
        <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen size={14} className="text-primary" />
          Hướng dẫn nét vẽ &amp; tập viết
        </h4>
        <span className="text-[10px] text-mute dark:text-on-dark-mute font-mono">
          Nét {activeCharIndex + 1}/{chars.length}
        </span>
      </div>

      {chars.length > 1 && (
        <div className="flex flex-wrap gap-1.5 select-none justify-center">
          {chars.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveCharIndex(i);
                setMode('idle');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all cursor-pointer ${activeCharIndex === i
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-zinc-800 text-ink dark:text-on-dark'
                }`}
            >
              Chữ {i + 1}: {c}
            </button>
          ))}
        </div>
      )}

      {/* Target Canvas Container */}
      <div className="relative bg-white dark:bg-zinc-900/60 border border-hairline dark:border-zinc-800 rounded-xl p-3 flex items-center justify-center shadow-xs">
        <div ref={containerRef} className="w-[140px] h-[140px]" />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAnimate}
          className="px-4 py-1.5 bg-surface-bone dark:bg-zinc-800 hover:bg-surface-card dark:hover:bg-black border border-hairline dark:border-zinc-700 text-ink dark:text-on-dark text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95"
        >
          Xem nét
        </button>
        <button
          type="button"
          onClick={handleQuiz}
          className={`px-4 py-1.5 text-white text-xs font-bold rounded-full shadow transition-all cursor-pointer active:scale-95 ${mode === 'quiz' ? 'bg-primary/50' : 'bg-primary hover:bg-primary-deep'
            }`}
        >
          {mode === 'quiz' ? 'Đang viết...' : 'Tập viết'}
        </button>
      </div>
    </div>
  );
}

export default function DictionaryScreen() {
  const { lookupMultiple } = useDictionary();
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [relatedSentences, setRelatedSentences] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const wordParam = searchParams.get('word');

  // History State
  const [history, setHistory] = useState([]);
  const [_historyLoading, setHistoryLoading] = useState(false);

  // Favorites State
  const [favorites, setFavorites] = useState([]);

  // Detail View State
  const [selectedWord, setSelectedWord] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [tabDetails, setTabDetails] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLimit, setAiLimit] = useState({ count: 0, limit: 10 });

  // Render formatted Vietnamese definitions with clickable links and toned pinyin
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
            onClick={async (e) => {
              e.stopPropagation();
              setQuery(searchWord);
              await handleSearch(searchWord);
            }}
            className="text-primary dark:text-link hover:underline font-bold focus:outline-none cursor-pointer"
          >
            {rawWord}
          </button>
          <span className="text-[11px] text-mute dark:text-on-dark-mute font-mono">({formattedPinyin})</span>
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Enumerate video devices on open scanner
  useEffect(() => {
    if (showOcrScanner) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
      }).catch(err => console.error('Enumerate devices failed:', err));
    } else {
      // Clear OCR state on close
      setCapturedImage(null);
      setRecognizedText('');
      setOcrError('');
      setOcrProgress('');
      setSelectedDeviceId('');
    }
  }, [showOcrScanner]);

  // Stream handling
  useEffect(() => {
    let activeStream = null;
    if (showOcrScanner && !capturedImage) {
      const useFacingMode = !selectedDeviceId;
      const constraints = useFacingMode
        ? { video: { facingMode: 'environment' } }
        : { video: { deviceId: { exact: selectedDeviceId } } };

      navigator.mediaDevices.getUserMedia(constraints).then((s) => {
        activeStream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.setAttribute('playsinline', '');
          videoRef.current.setAttribute('muted', '');
          videoRef.current.play().catch(e => console.log('Autoplay play failed:', e));
        }

        // Sync active device ID back to state for dropdown selector
        const activeTrack = s.getVideoTracks()[0];
        if (activeTrack && useFacingMode) {
          const settings = activeTrack.getSettings();
          if (settings && settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          }
        }
      }).catch((err) => {
        console.error('getUserMedia failed, trying default environment fallback:', err);
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        }).then((s) => {
          activeStream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.setAttribute('playsinline', '');
            videoRef.current.setAttribute('muted', '');
            videoRef.current.play().catch(e => console.log('Autoplay play failed:', e));
          }
        }).catch(() => {
          setOcrError('Không thể truy cập camera. Vui lòng cấp quyền camera cho ứng dụng!');
        });
      });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showOcrScanner, selectedDeviceId, capturedImage]);

  // Capture frame
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Match canvas dimensions to video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Save data URL of captured image to display it and freeze camera
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);

    // Stop video tracks immediately to turn off camera LED
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }

    // Trigger Tesseract OCR on captured canvas
    performOcr(canvas);
  };

  // Run Tesseract OCR
  const performOcr = async (imageSource) => {
    if (!window.Tesseract) {
      setOcrError('Không tìm thấy thư viện OCR. Vui lòng kiểm tra kết nối mạng hoặc thử lại!');
      return;
    }
    setOcrLoading(true);
    setOcrError('');
    setOcrProgress('Đang chuẩn bị công cụ nhận diện...');

    try {
      const { data: { text } } = await window.Tesseract.recognize(
        imageSource,
        'chi_sim',
        {
          langPath: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0',
          logger: m => {
            const pct = Math.round(m.progress * 100);
            if (m.status === 'loading tesseract core') {
              setOcrProgress(`Đang tải nhân xử lý OCR: ${pct}%`);
            } else if (m.status === 'initializing tesseract') {
              setOcrProgress('Đang khởi tạo nhân OCR...');
            } else if (m.status === 'loading language traineddata') {
              setOcrProgress(`Đang tải từ điển chữ Hán (10MB): ${pct}%`);
            } else if (m.status === 'initializing api') {
              setOcrProgress('Đang kết nối API nhận diện...');
            } else if (m.status === 'recognizing text') {
              setOcrProgress(`Đang nhận dạng chữ Hán: ${pct}%`);
            } else {
              setOcrProgress(`${m.status}: ${pct}%`);
            }
          }
        }
      );

      const cleanedText = text.replace(/\s+/g, '').trim();
      setRecognizedText(cleanedText);
      if (!cleanedText) {
        setOcrError('Không tìm thấy chữ Hán nào trong hình ảnh. Vui lòng thử chụp góc khác rõ hơn!');
      } else {
        setOcrProgress('Nhận diện thành công! Bạn có thể chỉnh sửa văn bản nếu cần.');
      }
    } catch (err) {
      console.error('OCR failed:', err);
      setOcrError('Lỗi trong quá trình nhận diện hình ảnh.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Submit recognized text to Backend AI analysis
  const handleOcrAnalyze = async () => {
    if (!recognizedText.trim()) return;
    setOcrLoading(true);
    setOcrError('');
    setOcrProgress('AI đang dịch nghĩa & phân tách từ...');
    try {
      const res = await api.post('/api/dictionary/ocr-analyze', {
        text: recognizedText.trim()
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

  async function loadAiLimit() {
    try {
      const res = await dictionaryHistoryApi.getTodayCount();
      if (res.data) {
        setAiLimit({ count: res.data.count, limit: res.data.limit });
      }
    } catch (err) {
      console.error('Failed to load AI limit:', err);
    }
  }

  async function loadFavorites() {
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }

  const isFavorite = (hanzi) => {
    return favorites.some((f) => f.hanzi === hanzi);
  };

  const handleToggleFavorite = async () => {
    if (!selectedWord) return;
    const hanzi = selectedWord.s;
    const alreadyFav = isFavorite(hanzi);

    // --- Cập nhật Lạc quan (Optimistic Update) ---
    const previousFavorites = [...favorites];
    if (alreadyFav) {
      // Xóa ngay lập tức trên UI
      setFavorites((prev) => prev.filter((f) => f.hanzi !== hanzi));
    } else {
      // Thêm tạm thời lên UI
      const tempFav = {
        id: -Date.now(),
        hanzi,
        pinyin: selectedWord.p || '',
        sv: '',
        vi: selectedWord.vi || '',
      };
      setFavorites((prev) => [tempFav, ...prev]);
    }
    // ---------------------------------------------

    try {
      if (alreadyFav) {
        await favoriteWordsApi.deleteFavoriteByHanzi(hanzi);
      } else {
        const sv = getCompoundHanViet(hanzi) || '';
        const res = await favoriteWordsApi.addFavorite({
          hanzi,
          pinyin: selectedWord.p || '',
          sv,
          vi: selectedWord.vi || '',
        });

        // Thay thế bản ghi tạm bằng bản ghi thật từ database
        setFavorites((prev) =>
          prev.map((f) => (f.hanzi === hanzi ? res.data : f))
        );
      }
      loadFavorites();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      // Hoàn tác về trạng thái cũ nếu API lỗi
      setFavorites(previousFavorites);
    }
  };

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      const res = await dictionaryHistoryApi.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load dictionary history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    loadFavorites();
    loadAiLimit();

    // Dynamically load the large ALT bilingual sentence corpus in the background
    import('../data/opusSentences.json')
      .then((module) => {
        _externalSentences = module.default || [];
        _cachedSentences = null; // Rebuild cache with the newly loaded sentences on next search
      })
      .catch((err) => {
        console.error('Failed to load ALT parallel sentences:', err);
      });
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

  // Clear search results when search bar is cleared
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setRelatedSentences([]);
      setHasSearched(false);
    }
  }, [query]);

  async function handleSearch(searchQuery) {
    if (isSearching) return;
    const actualQuery = typeof searchQuery === 'string' ? searchQuery : query;
    const trimmedQuery = (actualQuery || '').trim();
    if (!trimmedQuery) {
      setResults([]);
      setRelatedSentences([]);
      return;
    }

    const qLower = trimmedQuery.toLowerCase();

    setIsSearching(true);
    try {
      // Lookup using combined 'all' search type
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

        // 1. Exact Hanzi match
        if (s === qLower || t === qLower) {
          score += 10000;
        }

        // 2. Exact Pinyin match
        if (p === qLower || pt === qLower || sp === qLower) {
          score += 5000;
        }

        // 3. Exact Hán-Việt match (only if syllable count matches Chinese character length to avoid incomplete database readings)
        const svSyllables = sv.split(/[\s·-]+/).filter(Boolean).length;
        if (sv === qLower && s.length === svSyllables) {
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

        // 7. Proper Noun & Transliteration Penalty
        const itemP = item.p || '';
        const pSyllables = itemP.split(/[\s·’']+/);
        const isProper = pSyllables.some(syll => syll && syll[0] === syll[0].toUpperCase() && syll[0] !== syll[0].toLowerCase());
        if (isProper) {
          score -= 3000;
        }

        const isTransliteration =
          en.includes('transliteration') ||
          en.includes('surname') ||
          vi.includes('họ ') ||
          vi.includes('tập đoàn') ||
          vi.includes('diễn viên');
        if (isTransliteration) {
          score -= 5000;
        }

        // 8. Common Word Boost & Rank Penalty
        if (item.hsk) {
          score += (10 - item.hsk) * 200; // HSK 1 gets +1800, HSK 7 gets +600
        }
        if (item.b) {
          score += item.b * 10; // e.g. b 76.3 gets +763
        }
        if (item.bwr) {
          score -= item.bwr * 0.1; // e.g. rank 8 subtracts 0.8, rank 75159 subtracts 7515.9
        } else {
          score -= 10000; // default maximum penalty for unranked/obscure words
        }
        if (item.mwr) {
          score -= item.mwr * 0.1;
        }

        // 9. Archaic/Rare Variant Penalty
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

        // 10. Shorter words are more fundamental (tie-breaker)
        score -= s.length * 10;

        return score;
      };

      searchResults.sort((a, b) => getSortScore(b) - getSortScore(a));

      let finalResults = searchResults.slice(0, 30);

      if (finalResults.length === 0) {
        const isHanzi = /[\u4e00-\u9fa5]/.test(trimmedQuery);
        let decomposedResults;
        if (isHanzi) {
          decomposedResults = await segmentHanziSentence(trimmedQuery);
        } else {
          decomposedResults = await resolvePinyinSentence(trimmedQuery);
        }

        if (decomposedResults.length > 0) {
          finalResults = decomposedResults;
        }
      }

      setResults(finalResults);
      setHasSearched(true);
      setSelectedWord(null); // Reset detail view when performing a new search

      // Match related example sentences in static corpora
      const matchedSentences = searchRelatedSentences(trimmedQuery);
      setRelatedSentences(matchedSentences);
    } catch (err) {
      console.error('Failed to search dictionary:', err);
    } finally {
      setIsSearching(false);
    }
  }

  async function segmentPinyin(s) {
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
  }

  async function segmentHanziSentence(text) {
    const cleanText = text.replace(new RegExp('[.,/#!$%^&*;:{}=\\-_`~()?？。！，、；：]', 'g'), '').trim();
    if (!cleanText) return [];

    const chars = Array.from(cleanText);
    const result = [];
    let i = 0;
    const maxWordLength = 8;

    while (i < chars.length) {
      let matched = false;
      for (let len = Math.min(maxWordLength, chars.length - i); len >= 1; len--) {
        const word = chars.slice(i, i + len).join('');
        const matches = await lookupMultiple('hanzi', word);
        const exact = matches.find((m) => m.s === word || m.t === word);
        if (exact) {
          result.push({ ...exact, isSegmentedPart: true });
          i += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        const char = chars[i];
        result.push({
          s: char,
          t: char,
          p: '',
          vi: 'Từ tố chưa được cập nhật',
          isVirtual: true,
          isSegmentedPart: true
        });
        i++;
      }
    }
    return result;
  }

  async function resolvePinyinSentence(text) {
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

    if (!isPurePinyin || pinyinSyllables.length === 0) {
      return [];
    }

    const resolvedChars = [];
    for (const syl of pinyinSyllables) {
      const matches = await lookupMultiple('pinyin', syl);
      const singleCharMatches = matches.filter(m => m.s && m.s.length === 1);

      const getSortScore = (item) => {
        if (!item) return 0;
        const vi = (item.vi || '').toLowerCase();
        let score = 0;
        if (item.hsk) score += (10 - item.hsk) * 200;
        if (item.b) score += item.b * 10;
        if (item.bwr) score -= item.bwr * 0.1;

        const isVariant = vi.includes('biến thể') || vi.includes('chữ cổ');
        if (isVariant) score -= 8000;
        return score;
      };

      if (singleCharMatches.length > 0) {
        singleCharMatches.sort((a, b) => getSortScore(b) - getSortScore(a));
        resolvedChars.push(singleCharMatches[0]);
      } else if (matches.length > 0) {
        matches.sort((a, b) => getSortScore(b) - getSortScore(a));
        resolvedChars.push(matches[0]);
      }
    }

    if (resolvedChars.length === 0) {
      return [];
    }

    const hanziSentence = resolvedChars.map(c => c.s).join('');
    return await segmentHanziSentence(hanziSentence);
  }

  const speakSentence = (e, text) => {
    if (e) e.stopPropagation();
    speakChinese(text);
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
  function getCompoundHanViet(word) {
    if (!word) return '';
    if (selectedWord && selectedWord.s === word) return selectedWord.sv || '';
    if (tabDetails && tabDetails.s === word) return tabDetails.sv || '';

    // Search in results list
    const found = results.find(r => r.s === word);
    if (found) return found.sv || '';

    return '';
  }

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

  const handleTabClick = async (tabText) => {
    setActiveTab(tabText);
    if (tabText === selectedWord.s) {
      setTabDetails(selectedWord);
    } else {
      try {
        // Find matching entry for individual character
        const matches = await lookupMultiple('hanzi', tabText);
        const exactMatch = matches ? matches.find((m) => m.s === tabText || m.t === tabText) : null;
        setTabDetails(exactMatch || { s: tabText, p: '', vi: 'Không có dữ liệu chi tiết cho từ này.' });
      } catch (err) {
        console.error('Failed to load tab details:', err);
        setTabDetails({ s: tabText, p: '', vi: 'Không có dữ liệu chi tiết cho từ này.' });
      }
    }
  };

  // Hybrid Hán-Việt analyzer and live DeepSeek AI explainer
  const generateAIExplanation = async (refresh = false) => {
    if (!selectedWord) return;
    setAiLoading(true);
    setAiExplanation('');

    // Generate local offline breakdown in case of errors/fallback
    const runOfflineBreakdown = async () => {
      const chars = Array.from(selectedWord.s);
      const breakdown = [];
      let hasMissingSv = false;

      for (const char of chars) {
        if (!char.trim()) continue;
        try {
          const matches = await lookupMultiple('hanzi', char);
          const match = matches ? matches.find((m) => m.s === char || m.t === char) : null;
          if (match && match.sv) {
            breakdown.push(`- **${char}** (${match.sv.toUpperCase()}): ${match.vi}`);
          } else if (match) {
            hasMissingSv = true;
            breakdown.push(`- **${char}** <span class="text-amber-600 font-semibold">[Chữ này chưa có âm Hán Việt]</span>: ${match.vi}`);
          } else {
            hasMissingSv = true;
            breakdown.push(`- **${char}** <span class="text-red-500 font-semibold">[Không tìm thấy dữ liệu]</span>`);
          }
        } catch (err) {
          console.error("Offline lookup failed for char:", char, err);
          hasMissingSv = true;
          breakdown.push(`- **${char}** <span class="text-red-500 font-semibold">[Không tìm thấy dữ liệu]</span>`);
        }
      }

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
        await runOfflineBreakdown();
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
        await runOfflineBreakdown();
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
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => speakSentence(e, tabDetails.s)}
                      className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-primary hover:text-primary-deep shadow-sm flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                      title="Phát âm từ này"
                    >
                      <Volume2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className={`p-2 rounded-full border transition-all cursor-pointer ${isFavorite(tabDetails.s)
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark'
                        }`}
                      title={isFavorite(tabDetails.s) ? 'Xóa khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}
                    >
                      <Star size={16} fill={isFavorite(tabDetails.s) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                )}

                <h2 className="text-6xl md:text-7xl font-display font-extrabold tracking-tight text-ink dark:text-on-dark py-4 select-all">
                  {tabDetails?.s && Array.from(tabDetails.s).map((char, idx) => {
                    const isChinese = /[\u4e00-\u9fa5]/.test(char);
                    return isChinese ? (
                      <span key={idx} className="hanzi-char">{char}</span>
                    ) : (
                      <span key={idx}>{char}</span>
                    );
                  })}
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
                  {tabDetails?.topicId && TOPICS[tabDetails.topicId] && (
                    <span className={`text-[10px] font-bold font-mono px-3 py-1 rounded-full border mt-2.5 transition-all ${TOPICS[tabDetails.topicId].color}`}>
                      🏷️ {TOPICS[tabDetails.topicId].name}
                    </span>
                  )}
                </div>
              </div>

              {/* Stroke Order writing guide and practice card */}
              {tabDetails?.s && (
                <DictionaryWritingPractice word={tabDetails.s} />
              )}
              {/* AI Explanation Area */}
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
              </div>
              {/* Translation meanings */}
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
                        {renderFormattedVi(tabDetails.vi)}
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

                  {/* Examples from Database */}
                  {tabDetails?.examples && tabDetails.examples.length > 0 && (
                    <div className="border-t border-hairline dark:border-divider-dark pt-4 mt-4 space-y-2.5">
                      <h4 className="text-[10px] font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        Câu ví dụ trong từ điển
                      </h4>
                      <div className="flex flex-col gap-2">
                        {tabDetails.examples.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="bg-surface-bone/35 dark:bg-black/10 p-3 rounded-xl border border-hairline dark:border-divider-dark/50 flex justify-between items-start gap-4 hover:border-primary/20 transition-all"
                          >
                            <div className="flex-1 min-w-0 space-y-0.5 text-left">
                              <div className="text-[15px] font-display font-bold text-ink dark:text-on-dark">
                                <HoverableText text={ex.hanzi} />
                              </div>
                              {ex.pinyin && (
                                <div className="text-[11px] font-mono font-semibold text-primary dark:text-link">
                                  {ex.pinyin}
                                </div>
                              )}
                              <div className="text-[13px] text-body dark:text-on-dark-mute italic font-medium">
                                {ex.meaning}
                              </div>
                              <div className="pt-1">
                                <span className="text-[8px] uppercase font-extrabold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 px-1 py-0.5 rounded">
                                  {ex.source}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => speakSentence(e, ex.hanzi)}
                              className="h-7 w-7 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
                              title="Nghe phát âm"
                            >
                              <Volume2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
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
                    className="w-full pl-11 pr-12 py-3 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark shadow-sm"
                  />
                  <Search className="absolute left-4 top-3.5 text-mute" size={16} />
                  <button
                    type="button"
                    onClick={() => setShowOcrScanner(true)}
                    className="absolute right-4 top-2.5 p-1.5 rounded-full text-mute hover:text-primary hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
                    title="Quét chữ bằng Camera (OCR)"
                  >
                    <Camera size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  disabled={isSearching}
                  className="px-5 py-3 rounded-full bg-primary hover:bg-primary-deep disabled:bg-stone text-white text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Search size={15} />
                  Tìm kiếm
                </button>
              </div>                {/* Results List */}
              <div className="flex-1 min-h-[450px] max-h-[600px] overflow-y-auto pr-1 flex flex-col gap-3">
                {ocrSentenceResult && (
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 p-5 rounded-xl text-left space-y-4 animate-fade-in relative shadow-sm">
                    <button
                      type="button"
                      onClick={() => setOcrSentenceResult(null)}
                      className="absolute top-4 right-4 text-mute hover:text-ink dark:hover:text-on-dark font-bold text-xs cursor-pointer"
                    >
                      ✕ Đóng
                    </button>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/15 px-2.5 py-1 rounded-full">
                        Kết quả quét Camera AI
                      </span>
                      <div className="flex items-center gap-2 pt-2">
                        <h3 className="text-xl font-display font-extrabold text-ink dark:text-on-dark leading-none">
                          {ocrSentenceResult.originalText}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => speakSentence(e, ocrSentenceResult.originalText)}
                          className="h-7 w-7 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-primary flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                      <p className="text-sm font-mono font-bold text-primary dark:text-link">
                        {ocrSentenceResult.pinyin}
                      </p>
                      <p className="text-xs text-body dark:text-on-dark-mute italic font-medium leading-relaxed mt-1">
                        Dịch nghĩa: {ocrSentenceResult.translation}
                      </p>
                    </div>

                    <div className="border-t border-hairline dark:border-divider-dark pt-3.5 space-y-2.5">
                      <h4 className="text-[11px] font-bold text-mute uppercase tracking-wider">
                        Phân tách từ tố (Click để tra nghĩa chi tiết)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ocrSentenceResult.words && ocrSentenceResult.words.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={async () => {
                              const matches = await lookupMultiple('hanzi', item.word);
                              const exact = matches.find(m => m.s === item.word || m.t === item.word);
                              if (exact) {
                                handleSelectWord(exact);
                              } else {
                                handleSelectWord({
                                  s: item.word,
                                  t: item.word,
                                  p: '',
                                  vi: item.meaning || 'Chưa cập nhật nghĩa trong từ điển',
                                  isVirtual: true
                                });
                              }
                            }}
                            className="px-3 py-1.5 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark rounded-lg text-xs font-semibold text-ink dark:text-on-dark hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center gap-0.5"
                          >
                            <span className="font-bold text-sm text-primary">{item.word}</span>
                            <span className="text-[9px] text-mute font-normal">{item.meaning}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {isSearching && (
                  <div className="flex flex-col items-center justify-center py-20 text-mute gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-sm font-medium">Đang tìm kiếm...</span>
                  </div>
                )}

                {!isSearching && results.length === 0 && relatedSentences.length === 0 && (
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
                            <div className="flex-shrink-0 min-w-[3.5rem] h-12 px-3 bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md flex items-center justify-center shadow-sm font-display group-hover:bg-surface-card dark:group-hover:bg-black group-hover:border-primary/50 group-hover:text-primary dark:group-hover:text-primary transition-all">
                              <div className="text-xl font-bold text-ink dark:text-on-dark tracking-wide leading-none hanzi-text">
                                {item.hanzi}
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
                                  {stripBrackets(item.vi)}
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

                {!isSearching && (results.length > 0 || relatedSentences.length > 0) && (
                  <div className="flex flex-col gap-6">
                    {/* Word segments/results */}
                    {results.length > 0 && (
                      <div className="flex flex-col gap-3 animate-fade-in">
                        {results[0]?.isSegmentedPart && (
                          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 p-3.5 rounded-xl text-xs text-primary dark:text-link text-left flex items-start gap-2.5 shadow-xs">
                            <span className="text-sm shrink-0">💡</span>
                            <div>
                              <p className="font-bold">Nhận diện câu/cụm từ ghép</p>
                              <p className="mt-0.5 text-mute dark:text-on-dark-mute font-normal">Từ điển đã tự động phân tích và chia câu của bạn thành các từ tố đơn lẻ dưới đây:</p>
                            </div>
                          </div>
                        )}
                        <div className="divide-y divide-hairline dark:divide-divider-dark">
                          {results.map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectWord(item)}
                              className="flex gap-5 py-4 items-center hover:bg-surface-bone/50 dark:hover:bg-surface-dark/30 px-4 rounded-md transition-all border border-transparent hover:border-hairline dark:hover:border-divider-dark cursor-pointer group bg-transparent"
                            >
                              {/* Character Column */}
                              <div className="flex-shrink-0 min-w-[4.5rem] h-16 px-4 bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md flex items-center justify-center shadow-sm font-display group-hover:bg-surface-card dark:group-hover:bg-black group-hover:border-primary/50 group-hover:text-primary dark:group-hover:text-primary transition-all">
                                <div className="text-2xl font-bold text-ink dark:text-on-dark tracking-wide leading-none hanzi-text">
                                  {item.s}
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
                                  {item.topicId && TOPICS[item.topicId] && (
                                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${TOPICS[item.topicId].color}`} title="Chủ đề từ vựng">
                                      🏷️ {TOPICS[item.topicId].name}
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
                      </div>
                    )}

                    {/* Related Sentences section */}
                    {relatedSentences.length > 0 && (
                      <div className="flex flex-col gap-4 text-left border-t border-hairline dark:border-divider-dark pt-5 animate-fade-in">
                        <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
                          Câu ví dụ liên quan
                        </h4>
                        <div className="flex flex-col gap-3">
                          {relatedSentences.map((sentence, sIdx) => (
                            <div
                              key={sIdx}
                              className="bg-surface-bone/35 dark:bg-surface-dark/20 p-4 rounded-xl border border-hairline dark:border-divider-dark flex justify-between items-start gap-4 hover:border-primary/30 transition-all shadow-xs"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="text-lg font-display font-extrabold text-ink dark:text-on-dark">
                                  <HoverableText text={sentence.hanzi} />
                                </div>
                                <div className="text-xs font-mono font-bold text-primary dark:text-link">
                                  {sentence.pinyin}
                                </div>
                                <div className="text-xs text-body dark:text-on-dark-mute italic font-medium pt-0.5">
                                  {sentence.meaning}
                                </div>
                                <div className="pt-1.5">
                                  <span className="text-[9px] uppercase font-bold text-mute dark:text-on-dark-mute bg-surface-bone dark:bg-black/20 border border-hairline dark:border-divider-dark px-1.5 py-0.5 rounded">
                                    {sentence.source}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => speakSentence(e, sentence.hanzi)}
                                className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-sm flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
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
              setRelatedSentences([]);
              setHasSearched(false);
              setSelectedWord(null);
            }}
          />
        </div>

      </div>

      {/* OCR Camera Scanner Modal */}
      {showOcrScanner && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
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
                <h3 className="font-display font-extrabold text-lg text-ink dark:text-on-dark">Quét chữ bằng Camera (OCR)</h3>
                <p className="text-xs text-mute mt-0.5">Sử dụng camera để bóc tách chữ Hán và dịch nghĩa bằng AI.</p>
              </div>
            </div>

            {ocrError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold">
                ⚠️ {ocrError}
              </div>
            )}

            {/* Video viewport / Captured image preview */}
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
                  {/* Target frame overlay */}
                  <div className="absolute inset-8 border-2 border-dashed border-primary/60 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="bg-black/60 text-white text-[9px] px-2 py-1 rounded font-bold tracking-wider uppercase">
                      Căn chữ Hán vào khung này
                    </span>
                  </div>
                </>
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured frame"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Loader overlay */}
              {ocrLoading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-3 p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-xs font-semibold tracking-wide animate-pulse">{ocrProgress}</span>
                </div>
              )}
            </div>

            {/* Camera Select dropdown */}
            {!capturedImage && videoDevices.length > 1 && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Chọn Camera</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary cursor-pointer"
                >
                  {videoDevices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Textarea for review once recognized */}
            {recognizedText && (
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-mute tracking-wider">
                  Chữ Hán nhận diện được (Click để sửa lại nếu sai)
                </label>
                <textarea
                  value={recognizedText}
                  onChange={(e) => setRecognizedText(e.target.value)}
                  rows={2}
                  className="w-full text-sm p-3 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary resize-none font-display font-semibold"
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3 mt-2">
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
                    className="flex-1 py-2.5 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark rounded-xl text-ink dark:text-on-dark text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Chụp lại
                  </button>
                  <button
                    type="button"
                    onClick={handleOcrAnalyze}
                    disabled={ocrLoading || !recognizedText.trim()}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-deep text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:bg-stone"
                  >
                    <Sparkles size={14} />
                    Dịch & Phân tích bằng AI
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={captureFrame}
                  disabled={ocrError.includes('Không thể truy cập camera')}
                  className="w-full py-2.5 bg-primary hover:bg-primary-deep text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:bg-stone"
                >
                  <Camera size={14} />
                  Chụp và Nhận diện chữ
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
