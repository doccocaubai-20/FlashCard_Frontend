import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Printer, 
  Download, 
  Save, 
  Edit, 
  BookOpen, 
  RefreshCw,
  Info,
  Check,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { deckApi } from '../services/deckApi';
import { flashcardApi } from '../services/flashcardApi';
import { useDictionary } from '../hooks/useDictionary';

// Tianzige background lines for SVG
function TianzigeBackground() {
  return (
    <>
      {/* Dashed guidelines */}
      <line x1="0" y1="512" x2="1024" y2="512" stroke="#fca5a5" strokeWidth="6" strokeDasharray="16,16" />
      <line x1="512" y1="0" x2="512" y2="1024" stroke="#fca5a5" strokeWidth="6" strokeDasharray="16,16" />
      <line x1="0" y1="0" x2="1024" y2="1024" stroke="#fee2e2" strokeWidth="6" strokeDasharray="10,10" />
      <line x1="1024" y1="0" x2="0" y2="1024" stroke="#fee2e2" strokeWidth="6" strokeDasharray="10,10" />
      {/* Outer border */}
      <rect x="0" y="0" width="1024" height="1024" fill="none" stroke="#f87171" strokeWidth="16" />
    </>
  );
}

export default function WritingNotebookScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { lookup } = useDictionary();

  // User input states
  const [sourceMode, setSourceMode] = useState('manual'); // manual, deck
  const [inputText, setInputText] = useState('不要 汽车 汉语 汉字');
  const [userDecks, setUserDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  
  // Custom definitions state
  const [wordsList, setWordsList] = useState([]);
  const [editingWordIndex, setEditingWordIndex] = useState(null);
  const [editPinyin, setEditPinyin] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  
  // Custom layout configurations
  const [layoutMode, setLayoutMode] = useState('word'); // word (keep grouped), char (split into individual chars)
  const [linesCount, setLinesCount] = useState(2); // number of practice lines per character (1 to 6)
  const [guidesCount, setGuidesCount] = useState(4); // number of trace/guide cells (0 to 12)
  const [showSteps, setShowSteps] = useState(true); // show step-by-step stroke breakdown
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [notebookTitle, setNotebookTitle] = useState('Vở Tập Viết Chữ Hán');

  // Stroke data cache
  const [charDataMap, setCharDataMap] = useState({});
  const [loadingStrokes, setLoadingStrokes] = useState(false);

  // Fetch user decks for importing words
  useEffect(() => {
    deckApi.getDecks()
      .then(res => {
        setUserDecks(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedDeckId(res.data[0].id.toString());
        }
      })
      .catch(err => console.error('Failed to fetch decks:', err));
  }, []);

  // Fetch words list definitions from input text
  useEffect(() => {
    const resolveInputDefinitions = async () => {
      // Split by spaces, commas, newlines and filter out empty / non-Chinese values
      const rawWords = inputText
        .replace(/[。？！，、；：.,/#!$%^&*;:{}=_`~()?-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.trim() && /[\u4e00-\u9fa5]/.test(w));

      if (rawWords.length === 0) {
        setWordsList([]);
        return;
      }

      // Fetch definition for each word
      const resolved = await Promise.all(
        rawWords.map(async (word) => {
          const dictRes = await lookup('hanzi', word);
          const firstMatch = Array.isArray(dictRes) ? dictRes[0] : dictRes;
          return {
            word,
            pinyin: firstMatch?.p || '',
            meaning: firstMatch?.vi || ''
          };
        })
      );
      setWordsList(resolved);
    };

    const delayDebounce = setTimeout(() => {
      resolveInputDefinitions();
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [inputText, lookup]);

  // Load words from selected deck
  const handleImportFromDeck = async () => {
    if (!selectedDeckId) return;
    try {
      const res = await flashcardApi.getByDeck(Number(selectedDeckId));
      const cards = res.data || [];
      const deckText = cards
        .map(c => c.hanzi)
        .filter(w => /[\u4e00-\u9fa5]/.test(w))
        .join(' ');
      
      if (!deckText) {
        showToast('Bộ thẻ được chọn không có từ vựng tiếng Trung nào.', 'warning');
        return;
      }
      setInputText(deckText);
      showToast('Đã nhập từ vựng từ bộ thẻ thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải từ vựng từ bộ bài.', 'error');
    }
  };

  // Fetch SVG stroke coordinates data for all unique characters
  useEffect(() => {
    const fetchAllStrokeData = async () => {
      // Extract unique Chinese characters from the word list
      const allChars = new Set();
      wordsList.forEach(item => {
        Array.from(item.word).forEach(char => {
          if (/[\u4e00-\u9fa5]/.test(char)) {
            allChars.add(char);
          }
        });
      });

      const charsToFetch = Array.from(allChars).filter(char => !charDataMap[char]);
      if (charsToFetch.length === 0) return;

      setLoadingStrokes(true);
      const newStrokeData = { ...charDataMap };

      await Promise.all(
        charsToFetch.map(async (char) => {
          try {
            const res = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`);
            if (res.ok) {
              const data = await res.json();
              newStrokeData[char] = data;
            }
          } catch (e) {
            console.warn(`Failed to fetch stroke data for: ${char}`, e);
          }
        })
      );

      setCharDataMap(newStrokeData);
      setLoadingStrokes(false);
    };

    if (wordsList.length > 0) {
      fetchAllStrokeData();
    }
  }, [wordsList, charDataMap]);

  // Custom edit handler for a word's metadata
  const handleEditWord = (index) => {
    setEditingWordIndex(index);
    setEditPinyin(wordsList[index].pinyin);
    setEditMeaning(wordsList[index].meaning);
  };

  const handleSaveWordEdit = (index) => {
    const updated = [...wordsList];
    updated[index].pinyin = editPinyin;
    updated[index].meaning = editMeaning;
    setWordsList(updated);
    setEditingWordIndex(null);
    showToast('Đã lưu chỉnh sửa thông tin từ.', 'success');
  };

  // Render SVG Stroke Steps
  const renderStrokeSteps = (char) => {
    const data = charDataMap[char];
    if (!data || !data.strokes) return <div className="text-xs text-mute py-4">Đang nạp nét...</div>;

    const totalStrokes = data.strokes.length;
    // We can fit about 11 steps in our sequence display width, cap if character has more
    const maxSteps = Math.min(11, totalStrokes);

    return (
      <div className="flex flex-wrap gap-1.5 justify-start py-1.5">
        {Array.from({ length: maxSteps }).map((_, stepIdx) => (
          <div key={stepIdx} className="flex flex-col items-center gap-0.5">
            <svg viewBox="0 0 1024 1024" className="w-[38px] h-[38px] bg-white rounded border border-red-100 shrink-0">
              <TianzigeBackground />
              <g transform="translate(0, 900) scale(1, -1)">
                {/* Draw all strokes as light background guide */}
                {data.strokes.map((path, idx) => (
                  <path key={idx} d={path} fill="#fee2e2" />
                ))}
                {/* Draw completed strokes in black, current stroke in red */}
                {data.strokes.map((path, idx) => {
                  if (idx < stepIdx) {
                    return <path key={idx} d={path} fill="#1e293b" />;
                  }
                  if (idx === stepIdx) {
                    return <path key={idx} d={path} fill="#ef4444" />;
                  }
                  return null;
                })}
              </g>
            </svg>
            <span className="text-[8px] font-mono font-black text-mute">Nét {stepIdx + 1}</span>
          </div>
        ))}
      </div>
    );
  };

  // Render Tianzige Grids Row
  const renderPracticeGrids = (char, rowIdx) => {
    const data = charDataMap[char];
    const totalCells = 12; // fits nicely on A4 width

    return (
      <div className="flex gap-1.5 justify-between py-1">
        {/* Cell 1: Large target display character (only on first row) */}
        {rowIdx === 0 ? (
          <svg viewBox="0 0 1024 1024" className="w-[46px] h-[46px] bg-red-50/20 rounded-sm shrink-0 shadow-3xs">
            <TianzigeBackground />
            {data && data.strokes && (
              <g transform="translate(0, 900) scale(1, -1)">
                {data.strokes.map((path, idx) => (
                  <path key={idx} d={path} fill="#0f172a" />
                ))}
              </g>
            )}
          </svg>
        ) : (
          // Empty grid cell placeholder
          <svg viewBox="0 0 1024 1024" className="w-[46px] h-[46px] rounded-sm shrink-0">
            <TianzigeBackground />
          </svg>
        )}

        {/* Cells 2 to 12: Tracing guides followed by empty grids */}
        {Array.from({ length: totalCells - 1 }).map((_, cellIdx) => {
          const isGuide = cellIdx < guidesCount;
          return (
            <svg key={cellIdx} viewBox="0 0 1024 1024" className="w-[46px] h-[46px] rounded-sm shrink-0">
              <TianzigeBackground />
              {isGuide && data && data.strokes && (
                <g transform="translate(0, 900) scale(1, -1)">
                  {data.strokes.map((path, idx) => (
                    <path key={idx} d={path} fill="#cbd5e1" /> // Gray tracing color
                  ))}
                </g>
              )}
            </svg>
          );
        })}
      </div>
    );
  };

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Stylesheet specifically injected for A4 layout printing and hiding controls */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide all UI elements except the preview document wrapper */
          nav, aside, .no-print, header, footer, button, .sidebar-ctrl {
            display: none !important;
          }
          .main-content-layout {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .notebook-preview-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .a4-page {
            width: 100% !important;
            height: auto !important;
            min-height: 100vh !important;
            page-break-after: always;
            break-after: page;
            border: none !important;
            box-shadow: none !important;
            padding: 2.5cm !important;
          }
          /* Prevent page break inside character blocks */
          .word-block-entry {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Header (No-print) */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-5 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/study-hub')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-black text-mute cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <BookOpen size={22} className="text-primary animate-pulse" />
              Tạo Vở Tập Viết Chữ Hán
            </h1>
            <p className="text-xs text-mute mt-0.5">Tự thiết kế vở viết chữ Hán ô vuông Tianzige kèm nét vẽ mẫu và xuất PDF in ấn khổ A4.</p>
          </div>
        </div>
        
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-deep text-white font-mono font-bold rounded-full transition-all cursor-pointer shadow-md active:scale-95 text-xs"
        >
          <Printer size={14} />
          <span>In tài liệu / Xuất PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start main-content-layout">
        
        {/* Left Column: Sidebar Controls (no-print) */}
        <div className="lg:col-span-4 space-y-6 sidebar-ctrl no-print text-left">
          
          <div className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-white/5 p-6 rounded-xl space-y-5 shadow-sm">
            
            {/* Input Selection Tab */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-mute uppercase tracking-wider flex items-center gap-1.5">
                <Settings size={13} className="text-primary" />
                Nội dung tập viết
              </h3>
              
              <div className="flex border-b border-hairline dark:border-divider-dark">
                <button
                  onClick={() => setSourceMode('manual')}
                  className={`flex-1 pb-2 text-[10px] font-mono font-bold uppercase border-b-2 tracking-wider ${
                    sourceMode === 'manual' ? 'border-primary text-primary' : 'border-transparent text-mute'
                  }`}
                >
                  Nhập tự do
                </button>
                <button
                  onClick={() => setSourceMode('deck')}
                  className={`flex-1 pb-2 text-[10px] font-mono font-bold uppercase border-b-2 tracking-wider ${
                    sourceMode === 'deck' ? 'border-transparent text-mute' : 'border-primary text-primary'
                  }`}
                >
                  Chọn từ Thư viện
                </button>
              </div>
            </div>

            {sourceMode === 'manual' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-mute">Nhập chữ Hán cần viết (cách bằng dấu cách)</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ví dụ: 苹果 火车 谢谢 你好"
                  className="w-full p-3.5 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary resize-none min-h-[100px]"
                />
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-surface-bone dark:bg-black/20 rounded-lg border border-hairline dark:border-divider-dark">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-mute">Chọn bộ thẻ của bạn</label>
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="w-full px-3 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary cursor-pointer"
                  >
                    <option value="">-- Chọn bộ thẻ --</option>
                    {userDecks.map(d => (
                      <option key={d.id} value={d.id}>{d.title} ({d.language === 'EN' ? 'Tiếng Anh' : 'Tiếng Trung'})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleImportFromDeck}
                  disabled={!selectedDeckId}
                  className="w-full py-2 bg-primary text-white disabled:opacity-50 text-xs font-mono font-bold rounded-lg cursor-pointer hover:bg-primary-deep transition-colors"
                >
                  Nhập từ vựng vào vở viết
                </button>
              </div>
            )}

            {/* List of resolved words & customization */}
            <div className="space-y-3 border-t border-hairline dark:border-divider-dark pt-4">
              <h4 className="text-[10px] font-mono font-bold text-mute uppercase tracking-wider">Từ vựng đã phân tích ({wordsList.length})</h4>
              <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                {wordsList.map((item, index) => (
                  <div key={index} className="bg-surface-bone/50 dark:bg-black/10 border border-hairline dark:border-divider-dark p-2.5 rounded-lg flex items-center justify-between gap-2">
                    {editingWordIndex === index ? (
                      <div className="flex-1 space-y-2">
                        <div className="text-sm font-display font-black text-primary">{item.word}</div>
                        <input
                          type="text"
                          value={editPinyin}
                          onChange={(e) => setEditPinyin(e.target.value)}
                          className="w-full px-2 py-1 border border-hairline dark:border-white/15 rounded bg-surface-card dark:bg-surface-dark text-[10px] font-mono text-ink dark:text-on-dark focus:outline-hidden"
                          placeholder="Pinyin"
                        />
                        <input
                          type="text"
                          value={editMeaning}
                          onChange={(e) => setEditMeaning(e.target.value)}
                          className="w-full px-2 py-1 border border-hairline dark:border-white/15 rounded bg-surface-card dark:bg-surface-dark text-[10px] text-ink dark:text-on-dark focus:outline-hidden"
                          placeholder="Nghĩa tiếng Việt"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingWordIndex(null)}
                            className="px-2 py-0.5 border border-hairline text-[9px] font-mono font-bold rounded"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveWordEdit(index)}
                            className="px-2 py-0.5 bg-primary text-white text-[9px] font-mono font-bold rounded"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-display font-black text-ink dark:text-on-dark">{item.word}</span>
                            <span className="text-[10px] font-mono font-semibold text-primary">{item.pinyin}</span>
                          </div>
                          <p className="text-[10px] text-mute line-clamp-1">{item.meaning || 'Chưa dịch nghĩa'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditWord(index)}
                          className="text-mute hover:text-primary p-1"
                          title="Sửa thông tin"
                        >
                          <Edit size={12} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Display Settings Configurations */}
            <div className="space-y-4 border-t border-hairline dark:border-divider-dark pt-4">
              <h3 className="text-xs font-mono font-bold text-mute uppercase tracking-wider">Cấu hình hiển thị trang in</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-mute">Tiêu đề tiêu đề vở viết</label>
                <input
                  type="text"
                  value={notebookTitle}
                  onChange={(e) => setNotebookTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Lines count practice grids */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold text-mute uppercase text-[10px]">Số dòng luyện tập</span>
                <div className="flex items-center border border-hairline dark:border-divider-dark rounded-md overflow-hidden bg-surface-card dark:bg-surface-dark">
                  <button
                    type="button"
                    onClick={() => setLinesCount(Math.max(1, linesCount - 1))}
                    className="px-2.5 py-1 text-mute hover:bg-surface-bone dark:hover:bg-black font-black"
                  >
                    -
                  </button>
                  <span className="px-3 font-mono font-bold text-ink dark:text-on-dark">{linesCount}</span>
                  <button
                    type="button"
                    onClick={() => setLinesCount(Math.min(6, linesCount + 1))}
                    className="px-2.5 py-1 text-mute hover:bg-surface-bone dark:hover:bg-black font-black"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Guides count count */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold text-mute uppercase text-[10px]">Số chữ gợi ý (tô mờ)</span>
                <div className="flex items-center border border-hairline dark:border-divider-dark rounded-md overflow-hidden bg-surface-card dark:bg-surface-dark">
                  <button
                    type="button"
                    onClick={() => setGuidesCount(Math.max(0, guidesCount - 1))}
                    className="px-2.5 py-1 text-mute hover:bg-surface-bone dark:hover:bg-black font-black"
                  >
                    -
                  </button>
                  <span className="px-3 font-mono font-bold text-ink dark:text-on-dark">{guidesCount}</span>
                  <button
                    type="button"
                    onClick={() => setGuidesCount(Math.min(10, guidesCount + 1))}
                    className="px-2.5 py-1 text-mute hover:bg-surface-bone dark:hover:bg-black font-black"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Toggle Switches */}
              <div className="space-y-2 pt-1.5 text-xs font-mono font-bold text-mute">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase">Hiển thị thứ tự nét mẫu</span>
                  <button
                    type="button"
                    onClick={() => setShowSteps(p => !p)}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {showSteps ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase">Hiển thị phiên âm Pinyin</span>
                  <button
                    type="button"
                    onClick={() => setShowPinyin(p => !p)}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {showPinyin ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase">Hiển thị nghĩa Tiếng Việt</span>
                  <button
                    type="button"
                    onClick={() => setShowMeaning(p => !p)}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {showMeaning ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>

            </div>

          </div>

          <div className="bg-surface-bone dark:bg-black/20 p-4 rounded-xl border border-hairline dark:border-divider-dark text-[10px] text-mute leading-relaxed font-mono">
            💡 <strong>Mẹo in ấn:</strong> Ở cửa sổ in (Print Dialog) của Chrome/Edge, hãy tích chọn <strong>"Background graphics" (Đồ họa nền)</strong> và đặt Margins là <strong>"Default"</strong> hoặc <strong>"None"</strong> để đảm bảo ô lưới Tianzige hiển thị đầy đủ màu đỏ sắc nét.
          </div>

        </div>

        {/* Right Column: Print Preview Document (A4 Container) */}
        <div className="lg:col-span-8 flex justify-center w-full overflow-x-auto py-4 bg-surface-bone dark:bg-black/30 rounded-xl border border-hairline dark:border-divider-dark/40 notebook-preview-wrapper min-h-[600px]">
          
          {loadingStrokes ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-24 text-mute text-xs">
              <RefreshCw className="animate-spin text-primary shrink-0" size={24} />
              <span>Đang tải hình ảnh nét vẽ chữ Hán...</span>
            </div>
          ) : wordsList.length > 0 ? (
            (() => {
              // Programmatic height budgeting to divide words into distinct A4 pages
              const maxPageHeight = 840; // available height in px for A4 page content
              const pages = [];
              let currentPage = [];
              let currentHeight = 0;

              wordsList.forEach((item) => {
                const charCount = Array.from(item.word).filter(c => /[\u4e00-\u9fa5]/.test(c)).length;
                if (charCount === 0) return;

                // Height estimation components:
                // Box container padding/margins: ~36px
                // Header (Word title / translation): ~40px
                // Character blocks: linesCount * 54px (tianzige) + 72px (stroke steps if shown) + 16px spacing
                const headerHeight = 40;
                const charHeight = (linesCount * 54) + (showSteps ? 72 : 0) + 16;
                const itemHeight = headerHeight + (charCount * charHeight) + 36;

                if (currentHeight + itemHeight > maxPageHeight && currentPage.length > 0) {
                  pages.push(currentPage);
                  currentPage = [item];
                  currentHeight = itemHeight;
                } else {
                  currentPage.push(item);
                  currentHeight += itemHeight;
                }
              });

              if (currentPage.length > 0) {
                pages.push(currentPage);
              }

              return (
                <div className="space-y-6 print:space-y-0">
                  {pages.map((pageWords, pageIdx) => (
                    <div 
                      key={pageIdx} 
                      className="a4-page w-[794px] h-[1123px] bg-white border border-gray-300 shadow-md p-10 text-black text-left flex flex-col justify-between font-sans mb-6 print:shadow-none print:border-none print:m-0 print:h-[297mm] print:w-[210mm] print:mb-0 relative shrink-0 overflow-hidden"
                    >
                      <div className="space-y-6">
                        {/* Page header title */}
                        <div className="border-b-4 border-red-500 pb-3 flex justify-between items-baseline">
                          <h2 className="text-xl font-extrabold tracking-wide uppercase text-red-650 font-serif">
                            {notebookTitle}
                          </h2>
                          <span className="text-[10px] font-mono font-bold text-red-400">ChongZi Tiếng Trung</span>
                        </div>

                        {/* Character Rows Grid list for current page */}
                        <div className="space-y-5">
                          {pageWords.map((item, idx) => (
                            <div key={idx} className="border-2 border-red-200 rounded-md p-4 space-y-3 word-block-entry bg-white relative">
                              
                              {/* Word header: pinyin and translation */}
                              <div className="flex justify-between items-center border-b border-red-100 pb-1.5">
                                <h3 className="text-lg font-serif font-black text-slate-800 tracking-wide">
                                  {item.word}
                                </h3>
                                <div className="text-xs font-mono font-bold text-slate-600 flex gap-3">
                                  {showPinyin && item.pinyin && (
                                    <span className="px-2 py-0.5 bg-red-50 text-red-650 rounded-sm">/{item.pinyin}/</span>
                                  )}
                                  {showMeaning && item.meaning && (
                                    <span className="text-slate-500 font-sans italic">{item.meaning}</span>
                                  )}
                                </div>
                              </div>

                              {/* Stroke sequences and practice blocks for each character in word */}
                              <div className="space-y-4">
                                {Array.from(item.word).map((char, charIdx) => {
                                  if (!/[\u4e00-\u9fa5]/.test(char)) return null;
                                  return (
                                    <div key={charIdx} className="space-y-2">
                                      {/* Character subtitle */}
                                      <div className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <span>Chữ: {char}</span>
                                      </div>

                                      {/* Step by step breakdowns */}
                                      {showSteps && charDataMap[char] && (
                                        <div className="p-2 bg-red-50/10 border border-red-100 rounded">
                                          {renderStrokeSteps(char)}
                                        </div>
                                      )}

                                      {/* Practice grids row(s) */}
                                      <div className="space-y-1">
                                        {Array.from({ length: linesCount }).map((_, lineIdx) => (
                                          <div key={lineIdx}>
                                            {renderPracticeGrids(char, lineIdx)}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer of A4 page */}
                      <div className="border-t border-red-100 pt-3 text-center text-[9px] font-mono font-bold text-red-400/80 flex justify-between uppercase">
                        <span>Trang {pageIdx + 1} / {pages.length}</span>
                        <span>Luyện tập viết chữ Hán mỗi ngày để đạt điểm cao HSK</span>
                      </div>

                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-mute py-24 space-y-3 max-w-sm mx-auto italic">
              <BookOpen size={48} className="stroke-1 text-mute/60 animate-bounce" />
              <h4 className="font-display font-extrabold text-sm text-ink dark:text-on-dark">Vở tập viết đang trống</h4>
              <p className="text-xs text-mute leading-relaxed font-sans">
                Hãy nhập một vài từ tiếng Trung hoặc chọn nhập từ vựng từ bộ bài yêu thích của bạn ở bảng điều khiển bên trái để bắt đầu tạo trang xem trước!
              </p>
            </div>
          )}
          
        </div>

      </div>

    </div>
  );
}
