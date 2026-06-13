import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  RotateCcw, 
  Check, 
  Grid, 
  Grid3X3, 
  Volume2, 
  Copy, 
  Sparkles, 
  Info,
  BookOpen
} from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';
import { useToast } from '../context/ToastContext';

export default function ScribbleWriteScreen() {
  const navigate = useNavigate();
  const { lookupMultiple } = useDictionary();
  const { showToast } = useToast();

  // Blackboard / whiteboard drawing states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState({ x: [], y: [], t: [] });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Brush settings
  const [brushColor, setBrushColor] = useState('#54cbd4'); // default primary teal
  const [brushWidth, setBrushWidth] = useState(6);
  const [showGrid, setShowGrid] = useState(true);

  // Notepad text state
  const [notepadText, setNotepadText] = useState('');
  const [dictCards, setDictCards] = useState([]);

  // Dictionary lookup for characters in notepad
  useEffect(() => {
    const lookupNotepadWords = async () => {
      const chars = Array.from(notepadText.trim()).filter(c => /[\u4e00-\u9fa5]/.test(c));
      if (chars.length === 0) {
        setDictCards([]);
        return;
      }

      // De-duplicate characters to keep results concise
      const uniqueChars = [...new Set(chars)];
      const cardsData = [];

      for (const char of uniqueChars) {
        try {
          const matches = await lookupMultiple('hanzi', char);
          const exact = matches.find(m => m.s === char || m.t === char);
          if (exact) {
            cardsData.push(exact);
          } else {
            cardsData.push({ s: char, t: char, p: '', sv: '', vi: 'Chưa có định nghĩa trong từ điển.' });
          }
        } catch (e) {
          console.error('Failed to lookup char:', char, e);
        }
      }
      setDictCards(cardsData);
    };

    const timer = setTimeout(() => {
      lookupNotepadWords();
    }, 500); // debounce lookups

    return () => clearTimeout(timer);
  }, [notepadText, lookupMultiple]);

  // Set up grid and brush on mount and settings changes
  useEffect(() => {
    drawGridBackground();
  }, [showGrid, brushColor, brushWidth]);

  // Setup drawing coordinates
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Map actual screen coordinates to canvas pixels
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const time = Date.now();

    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x, y);

    setCurrentStroke({
      x: [x],
      y: [y],
      t: [time]
    });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const time = Date.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(x, y);
    ctx.stroke();

    setCurrentStroke((prev) => ({
      x: [...prev.x, x],
      y: [...prev.y, y],
      t: [...prev.t, time]
    }));
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.x.length > 0) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      recognizeStrokes(newStrokes);
    }
    setCurrentStroke({ x: [], y: [], t: [] });
  };

  // Redraw the entire canvas: grid + strokes
  const redrawCanvas = (allStrokes = strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw calligraphic grid
    if (showGrid) {
      const isDark = document.documentElement.classList.contains('dark');
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(32, 32, 32, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      // Center lines
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      // Diagonals
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.moveTo(canvas.width, 0);
      ctx.lineTo(0, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]); // reset
    }

    // Draw all strokes
    allStrokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(stroke.x[0], stroke.y[0]);
      for (let i = 1; i < stroke.x.length; i++) {
        ctx.lineTo(stroke.x[i], stroke.y[i]);
      }
      ctx.stroke();
    });
  };

  const drawGridBackground = () => {
    redrawCanvas(strokes);
  };

  const undo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redrawCanvas(newStrokes);

    if (newStrokes.length > 0) {
      recognizeStrokes(newStrokes);
    } else {
      setCandidates([]);
    }
  };

  const clearBoard = (resetCandidates = true) => {
    setStrokes([]);
    if (resetCandidates) {
      setCandidates([]);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // redraw grid if active
    setTimeout(() => {
      redrawCanvas([]);
    }, 50);
  };

  // Google Input Tools IME Recognition
  const recognizeStrokes = async (strokeData = strokes) => {
    if (strokeData.length === 0) return;
    setLoading(true);

    try {
      const ink = strokeData.map((stroke) => [
        stroke.x.map((x) => Math.round(x)),
        stroke.y.map((y) => Math.round(y)),
        stroke.t.map((t) => t - stroke.t[0])
      ]);

      const response = await fetch(
        'https://inputtools.google.com/request?itc=zh-t-i0-handwrit&app=translate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            app_version: 20,
            api_level: '533.0',
            device: '',
            input_type: 0,
            options: 'enable_pre_space',
            requests: [
              {
                writing_guide: {
                  writing_area_width: 300,
                  writing_area_height: 300
                },
                pre_segments: [],
                max_num_results: 12,
                max_completions: 0,
                language: 'zh',
                ink: ink
              }
            ]
          })
        }
      );

      const json = await response.json();
      if (json[0] === 'SUCCESS') {
        const results = json[1][0][1];
        setCandidates(results);
      }
    } catch (err) {
      console.error('Google Handwriting recognition failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Append clicked character candidate to notepad
  const handleSelectCandidate = (char) => {
    setNotepadText((prev) => prev + char);
    clearBoard(true);
  };

  // Copy to Clipboard
  const handleCopyText = () => {
    if (!notepadText) return;
    navigator.clipboard.writeText(notepadText);
    showToast('Đã sao chép văn bản vào bộ nhớ tạm!', 'success');
  };

  // Text to Speech
  const handleSpeakText = () => {
    if (!notepadText || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(notepadText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // Colors available for the brush
  const colorsList = [
    { name: 'Teal', value: '#54cbd4' },
    { name: 'Green', value: '#2b9a66' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Gold', value: '#f59e0b' },
    { name: 'White/Charcoal', value: '#94a3b8' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/study-hub')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-black text-mute cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Sparkles size={22} className="text-primary animate-pulse" />
              Luyện viết tự do HSK
            </h1>
            <p className="text-xs text-mute mt-0.5">Bảng vẽ nháp chữ Hán không giới hạn nét vẽ, tự động phân tích chữ viết.</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Canvas Scribble Column (5/12 grid) */}
        <div className="lg:col-span-5 bg-surface-card dark:bg-surface-dark/40 p-6 rounded-xl border border-hairline dark:border-white/5 shadow-sm flex flex-col justify-between min-h-[500px]">
          
          {/* Canvas header controls */}
          <div className="flex justify-between items-center pb-2.5">
            <span className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Bảng vẽ tự do</span>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                showGrid 
                  ? 'bg-primary/10 border-primary/30 text-primary' 
                  : 'bg-surface-card border-hairline hover:bg-surface-bone text-mute'
              }`}
              title="Ẩn/Hiện ô lưới chữ Hán"
            >
              <Grid3X3 size={15} />
            </button>
          </div>

          {/* Interactive Whiteboard Canvas */}
          <div className="relative aspect-square w-full max-w-[320px] mx-auto border-2 border-hairline dark:border-divider-dark rounded-xl bg-canvas dark:bg-black/40 shadow-inner overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full block touch-none"
            />
          </div>

          {/* Brush Color & Thickness Tools */}
          <div className="space-y-3 py-3 border-t border-hairline dark:border-white/5 mt-4">
            {/* Color Palette */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-mute uppercase tracking-wider w-12 text-left">Màu mực:</span>
              <div className="flex gap-2">
                {colorsList.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setBrushColor(c.value)}
                    className={`h-5 w-5 rounded-full border-2 transition-all cursor-pointer ${
                      brushColor === c.value 
                        ? 'border-primary scale-110 shadow-sm' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Thickness */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-mute uppercase tracking-wider w-12 text-left">Nét cọ:</span>
              <div className="flex gap-2">
                {[
                  { label: 'Mỏng', width: 3 },
                  { label: 'Vừa', width: 6 },
                  { label: 'Dày', width: 10 }
                ].map((size) => (
                  <button
                    key={size.label}
                    type="button"
                    onClick={() => setBrushWidth(size.width)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                      brushWidth === size.width
                        ? 'bg-primary border-transparent text-white shadow-sm'
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border-hairline text-ink dark:text-on-dark'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reset / Undo Buttons */}
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={undo}
              disabled={strokes.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-hairline dark:border-divider-dark text-xs font-mono font-semibold text-ink dark:text-on-dark rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-surface-card dark:bg-surface-dark shadow-sm"
            >
              <RotateCcw size={13} />
              Hoàn tác
            </button>
            <button
              onClick={() => clearBoard(true)}
              disabled={strokes.length === 0 && candidates.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-hairline dark:border-divider-dark text-xs font-mono font-semibold text-ink dark:text-on-dark rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-surface-card dark:bg-surface-dark shadow-sm"
            >
              <Trash2 size={13} />
              Xóa sạch
            </button>
          </div>

        </div>

        {/* Right Candidate / Notepad Column (7/12 grid) */}
        <div className="lg:col-span-7 bg-surface-card dark:bg-surface-dark/40 p-6 rounded-xl border border-hairline dark:border-white/5 shadow-sm flex flex-col justify-between min-h-[500px] text-left">
          
          <div className="space-y-5 flex-1 flex flex-col">
            
            {/* 1. Candidates Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Ký tự nhận diện được:</span>
                {loading && (
                  <span className="text-[9px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                    Đang xử lý...
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 min-h-[56px] items-center bg-surface-bone/50 dark:bg-black/30 p-3 rounded-lg border border-hairline dark:border-divider-dark">
                {candidates.length > 0 ? (
                  candidates.map((char) => (
                    <button
                      key={char}
                      onClick={() => handleSelectCandidate(char)}
                      className="w-10 h-10 flex items-center justify-center bg-surface-card dark:bg-surface-dark hover:bg-surface-bone dark:hover:bg-black border border-hairline dark:border-divider-dark hover:border-primary dark:hover:border-primary text-ink dark:text-on-dark font-extrabold rounded-md text-xl transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {char}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-mute dark:text-on-dark-mute italic flex items-center gap-1.5">
                    <Info size={13} className="text-primary shrink-0" />
                    Vẽ chữ Hán bừa bãi lên bảng vẽ bên trái để AI phân tích nét và đề xuất chữ ở đây.
                  </span>
                )}
              </div>
            </div>

            {/* 2. Text Notepad Area */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Sổ tay nháp tạm thời:</span>
                <span className="text-[10px] font-mono text-mute">{notepadText.length} ký tự</span>
              </div>
              
              <div className="relative flex-1 flex flex-col min-h-[140px]">
                <textarea
                  value={notepadText}
                  onChange={(e) => setNotepadText(e.target.value)}
                  placeholder="Gõ hoặc viết chữ để lưu trữ văn bản ở đây..."
                  className="w-full flex-1 p-4 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-base text-ink dark:text-on-dark shadow-sm resize-none"
                />
                
                {notepadText && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={handleSpeakText}
                      className="p-2 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full text-primary shadow-sm hover:scale-105 transition-all cursor-pointer"
                      title="Phát âm toàn văn bản"
                    >
                      <Volume2 size={15} />
                    </button>
                    <button
                      onClick={handleCopyText}
                      className="p-2 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full text-primary shadow-sm hover:scale-105 transition-all cursor-pointer"
                      title="Sao chép văn bản"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={() => setNotepadText('')}
                      className="p-2 bg-surface-card hover:bg-red-50 dark:hover:bg-red-950/20 border border-hairline dark:border-divider-dark rounded-full text-red-500 shadow-sm hover:scale-105 transition-all cursor-pointer"
                      title="Xóa toàn bộ"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Dictionary definition bento box section */}
      {notepadText.trim() && (
        <div className="bg-surface-card dark:bg-surface-dark/40 p-6 rounded-xl border border-hairline dark:border-white/5 shadow-sm text-left space-y-4">
          <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-2.5">
            <BookOpen size={14} className="text-primary" />
            Tra cứu từ điển các từ vừa viết
          </h3>
          
          {dictCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dictCards.map((item, index) => (
                <div 
                  key={index}
                  className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-4 rounded-xl flex gap-3 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <span className="text-4xl font-display font-black text-primary shrink-0 leading-none py-1">
                    {item.s}
                  </span>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-xs font-mono font-bold text-ink dark:text-on-dark">{item.p}</span>
                      {item.sv && (
                        <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">
                          {item.sv}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-semibold line-clamp-3">
                      {item.vi}
                    </p>
                    {item.hsk && (
                      <span className="inline-block px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[8px] font-mono font-bold rounded">
                        HSK {item.hsk}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-mute dark:text-on-dark-mute italic">
              <span className="animate-pulse">Đang nạp nghĩa từ điển...</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
