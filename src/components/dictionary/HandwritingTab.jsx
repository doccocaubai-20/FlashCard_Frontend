import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  RotateCcw,
  Trash2,
  Check,
  Grid,
  Play,
  Award,
  Search,
  BookOpen,
  Palette,
  Sliders,
  Sparkles,
  Volume2
} from 'lucide-react';
import { speakChinese } from '../../utils/tts';

const GRID_TYPES = [
  { id: 'mi', label: 'Mễ tự ô (米)' },
  { id: 'tian', label: 'Điền tự ô (田)' },
  { id: 'jiu', label: 'Cửu cung (九)' },
  { id: 'none', label: 'Ô trống' },
];

const STROKE_COLORS = [
  { id: 'teal', value: '#0F5257', label: 'Ngọc bích (Jade Teal)' },
  { id: 'charcoal', value: '#1a2332', label: 'Mực tàu (Charcoal)' },
  { id: 'vermilion', value: '#b91c1c', label: 'Chu sa (Cinnabar Red)' },
  { id: 'blue', value: '#1d4ed8', label: 'Lam ngọc (Royal Blue)' },
];

const STROKE_WIDTHS = [
  { id: 'thin', value: 3, label: 'Thanh' },
  { id: 'medium', value: 6, label: 'Vừa' },
  { id: 'thick', value: 10, label: 'Đậm' },
];

export default function HandwritingTab({
  currentWord,
  onSelectWord,
  onSwitchTab,
}) {
  // Mode selector: 'recognition' (Mode 1) | 'stroke_practice' (Mode 2)
  const [activeMode, setActiveMode] = useState('recognition');

  // Canvas Settings (shared / Mode 1)
  const [gridType, setGridType] = useState('mi');
  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);

  // --- Mode 1 State: Recognition Canvas ---
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState({ x: [], y: [], t: [] });
  const [candidates, setCandidates] = useState([]);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // --- Mode 2 State: Stroke Guide / Practice Quiz ---
  const [practiceWord, setPracticeWord] = useState('');
  const [practiceCharIndex, setPracticeCharIndex] = useState(0);
  const [quizMode, setQuizMode] = useState('idle'); // 'idle' | 'quiz' | 'animating'
  const [quizScore, setQuizScore] = useState({ totalMistakes: 0, completed: false });
  const [writerStrokeProgress, setWriterStrokeProgress] = useState({ current: 0, total: 0 });
  const hanziWriterContainerRef = useRef(null);
  const writerInstanceRef = useRef(null);

  // Sync currentWord into practice word
  useEffect(() => {
    if (currentWord?.s) {
      setPracticeWord(currentWord.s);
    } else if (typeof currentWord === 'string' && currentWord.trim()) {
      setPracticeWord(currentWord.trim());
    } else if (!practiceWord) {
      setPracticeWord('永'); // The famous character "Vĩnh" containing all 8 fundamental strokes (Vĩnh tự bát pháp)
    }
  }, [currentWord, practiceWord]);

  // Render Grid onto Canvas in Mode 1
  const drawCanvasGrid = useCallback(
    (ctx, width, height) => {
      ctx.clearRect(0, 0, width, height);

      if (gridType === 'none') return;

      const isDark = document.documentElement.classList.contains('dark');
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 82, 87, 0.16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      if (gridType === 'mi') {
        // Mễ tự ô (米) - center cross + diagonals
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
      } else if (gridType === 'tian') {
        // Điền tự ô (田) - center cross
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
      } else if (gridType === 'jiu') {
        // Cửu cung ô (九) - 3x3 grid
        ctx.beginPath();
        ctx.moveTo(width / 3, 0);
        ctx.lineTo(width / 3, height);
        ctx.moveTo((width * 2) / 3, 0);
        ctx.lineTo((width * 2) / 3, height);
        ctx.moveTo(0, height / 3);
        ctx.lineTo(width, height / 3);
        ctx.moveTo(0, (height * 2) / 3);
        ctx.lineTo(width, (height * 2) / 3);
        ctx.stroke();
      }

      ctx.restore();
    },
    [gridType]
  );

  // Redraw all strokes on canvas
  const redrawStrokes = useCallback(
    (strokeList = strokes) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawCanvasGrid(ctx, canvas.width, canvas.height);

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      strokeList.forEach((stroke) => {
        if (!stroke.x || stroke.x.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(stroke.x[0], stroke.y[0]);
        for (let i = 1; i < stroke.x.length; i++) {
          ctx.lineTo(stroke.x[i], stroke.y[i]);
        }
        ctx.stroke();
      });
      ctx.restore();
    },
    [strokes, strokeColor, strokeWidth, drawCanvasGrid]
  );

  // Mode 1 Canvas Init & Grid redraw on settings change
  useEffect(() => {
    if (activeMode === 'recognition') {
      redrawStrokes(strokes);
    }
  }, [activeMode, gridType, strokeColor, strokeWidth, redrawStrokes, strokes]);

  // Canvas Drawing Coordinates Helper
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
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x, y);

    setCurrentStroke({ x: [x], y: [y], t: [time] });
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
      t: [...prev.t, time],
    }));
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.x.length > 0) {
      const nextStrokes = [...strokes, currentStroke];
      setStrokes(nextStrokes);
      recognizeStrokes(nextStrokes);
    }
    setCurrentStroke({ x: [], y: [], t: [] });
  };

  const handleClear = () => {
    setStrokes([]);
    setCandidates([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawCanvasGrid(ctx, canvas.width, canvas.height);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    setStrokes(nextStrokes);
    redrawStrokes(nextStrokes);
    if (nextStrokes.length > 0) {
      recognizeStrokes(nextStrokes);
    } else {
      setCandidates([]);
    }
  };

  // Google IME Stroke Recognizer
  const recognizeStrokes = async (strokeData = strokes) => {
    if (strokeData.length === 0) return;
    setIsRecognizing(true);

    try {
      const ink = strokeData.map((stroke) => [
        stroke.x.map((x) => Math.round(x)),
        stroke.y.map((y) => Math.round(y)),
        stroke.t.map((t) => t - stroke.t[0]),
      ]);

      const response = await fetch(
        'https://inputtools.google.com/request?itc=zh-t-i0-handwrit&app=translate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_version: 20,
            api_level: '533.0',
            device: '',
            input_type: 0,
            options: 'enable_pre_space',
            requests: [
              {
                writing_guide: { writing_area_width: 320, writing_area_height: 320 },
                pre_segments: [],
                max_num_results: 14,
                max_completions: 0,
                language: 'zh',
                ink,
              },
            ],
          }),
        }
      );

      const json = await response.json();
      if (json[0] === 'SUCCESS') {
        const results = json[1][0][1];
        setCandidates(results);
      }
    } catch (err) {
      console.error('Handwriting recognition failed:', err);
    } finally {
      setIsRecognizing(false);
    }
  };

  // --- Mode 2 HanziWriter Logic ---
  const cleanPracticeWord = (practiceWord || '').replace(/[。？！，、；：\s?]/g, '');
  const practiceChars = Array.from(cleanPracticeWord).filter((c) => /[\u4e00-\u9fa5]/.test(c));
  const activeChar = practiceChars[practiceCharIndex] || practiceChars[0] || '永';

  useEffect(() => {
    if (activeMode !== 'stroke_practice') return;
    if (!hanziWriterContainerRef.current) return;

    hanziWriterContainerRef.current.innerHTML = '';
    setQuizScore({ totalMistakes: 0, completed: false });

    if (!window.HanziWriter) {
      console.warn('HanziWriter CDN is loading or unavailable');
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const outlineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 82, 87, 0.12)';
    const characterStrokeColor = strokeColor || '#0F5257';

    try {
      const writer = window.HanziWriter.create(hanziWriterContainerRef.current, activeChar, {
        width: 260,
        height: 260,
        padding: 12,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 220,
        strokeColor: characterStrokeColor,
        outlineColor,
        drawingColor: isDark ? '#2dd4bf' : '#0F5257',
        radicalColor: '#10b981',
        highlightColor: '#f97316',
        showCharacter: true,
      });

      writerInstanceRef.current = writer;

      // Animate character initially
      writer.animateCharacter({
        onComplete: () => {
          setQuizMode('idle');
        },
      });

      // Get character stroke count
      writer.getCharacterData().then((data) => {
        if (data?.strokes) {
          setWriterStrokeProgress({ current: 0, total: data.strokes.length });
        }
      });
    } catch (e) {
      console.error('Failed to initialize HanziWriter:', e);
    }

    return () => {
      if (writerInstanceRef.current) {
        try {
          writerInstanceRef.current.cancelQuiz();
        } catch {
          // ignore
        }
      }
    };
  }, [activeMode, activeChar, strokeColor]);

  const handleAnimateStrokes = () => {
    if (!writerInstanceRef.current) return;
    writerInstanceRef.current.cancelQuiz();
    setQuizMode('animating');
    setQuizScore({ totalMistakes: 0, completed: false });
    writerInstanceRef.current.animateCharacter({
      onComplete: () => {
        setQuizMode('idle');
      },
    });
  };

  const handleStartQuiz = () => {
    if (!writerInstanceRef.current) return;
    writerInstanceRef.current.cancelQuiz();
    setQuizMode('quiz');
    setQuizScore({ totalMistakes: 0, completed: false });

    writerInstanceRef.current.quiz({
      onMistake: () => {
        setQuizScore((prev) => ({ ...prev, totalMistakes: prev.totalMistakes + 1 }));
      },
      onCorrectStroke: (strokeData) => {
        setWriterStrokeProgress((prev) => ({ ...prev, current: strokeData.strokeNum + 1 }));
      },
      onComplete: () => {
        setQuizMode('idle');
        setQuizScore((prev) => ({ ...prev, completed: true }));
      },
    });
  };

  // Inspect character in SearchTab
  const handleInspectCharacter = (char) => {
    if (onSelectWord) {
      onSelectWord({
        s: char,
        t: char,
        p: '',
        sv: '',
        vi: 'Đang tra cứu từ...',
      });
    }
    if (onSwitchTab) {
      onSwitchTab('search');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline dark:border-divider-dark pb-4">
        <div>
          <h3 className="font-display font-extrabold text-ink dark:text-on-dark text-lg tracking-tight flex items-center gap-2">
            <PenTool size={20} className="text-primary" />
            Bảng luyện viết tay &amp; Nhận diện chữ Hán
          </h3>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-0.5">
            Vẽ tự do để nhận diện chữ Hán qua AI hoặc tập viết từng nét chuẩn theo quy tắc bút thuận.
          </p>
        </div>

        {/* Dual Mode Switcher Segmented Control */}
        <div className="flex items-center bg-surface-bone dark:bg-black/30 p-1 rounded-full border border-hairline dark:border-divider-dark shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('recognition')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'recognition'
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink dark:text-on-dark hover:text-primary'
            }`}
          >
            Nhận diện chữ viết
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('stroke_practice')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'stroke_practice'
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink dark:text-on-dark hover:text-primary'
            }`}
          >
            Tập viết chuẩn nét
          </button>
        </div>
      </div>

      {/* Canvas Tool Control Bar (Grid, Color, Width) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark p-3.5 rounded-2xl shadow-xs">
        {/* Grid Type Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-mute flex items-center gap-1">
            <Grid size={13} />
            Lưới:
          </span>
          <div className="flex gap-1">
            {GRID_TYPES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGridType(g.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  gridType === g.id
                    ? 'bg-primary/15 border-primary/40 text-primary font-bold'
                    : 'bg-surface-bone dark:bg-surface-dark border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:bg-surface-card'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brush Color & Width */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-mute flex items-center gap-1">
              <Palette size={13} />
              Màu nét:
            </span>
            <div className="flex gap-1.5">
              {STROKE_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setStrokeColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer shadow-2xs ${
                    strokeColor === c.value
                      ? 'ring-2 ring-primary ring-offset-2 scale-110'
                      : 'border-white/40 opacity-80 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-mute flex items-center gap-1">
              <Sliders size={13} />
              Cỡ nét:
            </span>
            <div className="flex gap-1">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setStrokeWidth(w.value)}
                  className={`px-2 py-0.5 rounded text-xs font-medium border transition-all cursor-pointer ${
                    strokeWidth === w.value
                      ? 'bg-primary/15 border-primary/40 text-primary font-bold'
                      : 'border-hairline dark:border-divider-dark text-mute'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODE 1: FREE HANDWRITING RECOGNITION CANVAS */}
      {activeMode === 'recognition' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Drawing Square */}
          <div className="lg:col-span-2 flex flex-col items-center gap-4 bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark p-6 rounded-2xl shadow-xs">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-mute uppercase tracking-wider">
                Vùng vẽ bút lông ({strokes.length} nét)
              </span>
              {isRecognizing && (
                <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                  Đang nhận diện...
                </span>
              )}
            </div>

            {/* Canvas with Calligraphy Grid */}
            <div className="relative aspect-square w-full max-w-[340px] border-2 border-primary/20 dark:border-primary/30 rounded-2xl bg-surface-bone/30 dark:bg-black/30 shadow-inner overflow-hidden cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
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

            {/* Canvas Control Action Buttons */}
            <div className="flex gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-hairline dark:border-divider-dark text-xs font-bold text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                <RotateCcw size={14} />
                <span>Hoàn tác nét</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={strokes.length === 0 && candidates.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-hairline dark:border-divider-dark text-xs font-bold text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                <Trash2 size={14} />
                <span>Xóa bảng vẽ</span>
              </button>

              <button
                type="button"
                onClick={() => recognizeStrokes()}
                disabled={strokes.length === 0 || isRecognizing}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary hover:bg-primary-deep disabled:bg-stone text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Check size={14} />
                <span>Nhận diện</span>
              </button>
            </div>
          </div>

          {/* Right Column: Recognized Candidates Panel */}
          <div className="lg:col-span-1 flex flex-col gap-4 bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-2.5">
              <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">
                Gợi ý nhận diện ({candidates.length})
              </h4>
              <span className="text-[10px] text-mute font-mono">Google IME API</span>
            </div>

            {candidates.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-mute">
                  Nhấp vào chữ để tra cứu nhanh hoặc chuyển sang luyện viết nét:
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {candidates.map((char, cIdx) => (
                    <div
                      key={cIdx}
                      className="group relative flex flex-col items-center bg-surface-bone/50 dark:bg-black/20 hover:bg-surface-bone dark:hover:bg-black/40 border border-hairline dark:border-divider-dark hover:border-primary/50 rounded-xl p-2.5 transition-all shadow-2xs"
                    >
                      <span className="text-2xl font-display font-extrabold text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                        {char}
                      </span>
                      <div className="flex gap-1 mt-2">
                        <button
                          type="button"
                          onClick={() => handleInspectCharacter(char)}
                          className="p-1 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                          title="Tra từ này trong từ điển"
                        >
                          <Search size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPracticeWord(char);
                            setActiveMode('stroke_practice');
                          }}
                          className="p-1 rounded-md bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                          title="Tập viết nét chữ này"
                        >
                          <PenTool size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-mute space-y-2">
                <PenTool size={36} className="mx-auto stroke-1 opacity-50 mb-2" />
                <p className="text-xs leading-relaxed">
                  Dùng chuột hoặc ngón tay vẽ từng nét chữ Hán vào khung bên trái. Hệ thống sẽ tự động hiển thị gợi ý chữ tương ứng.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: STROKE ORDER WRITING GUIDE & INTERACTIVE QUIZ */}
      {activeMode === 'stroke_practice' && (
        <div className="flex flex-col gap-6">
          {/* Target Word Input & Character Selection Tabs */}
          <div className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-mute uppercase tracking-wider whitespace-nowrap">
                Chữ cần luyện viết:
              </label>
              <input
                type="text"
                value={practiceWord}
                onChange={(e) => {
                  setPracticeWord(e.target.value);
                  setPracticeCharIndex(0);
                }}
                placeholder="Nhập chữ Hán cần tập viết..."
                className="px-3.5 py-1.5 rounded-full border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 text-ink dark:text-on-dark font-display font-bold text-sm outline-none focus:border-primary"
              />
            </div>

            {practiceChars.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-mute font-medium mr-1">Chọn chữ:</span>
                {practiceChars.map((ch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPracticeCharIndex(idx);
                      setQuizMode('idle');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-display font-bold border transition-all cursor-pointer ${
                      practiceCharIndex === idx
                        ? 'bg-primary border-primary text-white shadow-xs'
                        : 'bg-surface-bone hover:bg-surface-card dark:bg-surface-dark border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                    }`}
                  >
                    Chữ {idx + 1}: {ch}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive HanziWriter Stage */}
          <div className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-6 shadow-xs relative">
            {/* Status Top Badge */}
            <div className="flex items-center justify-between w-full max-w-md border-b border-hairline dark:border-divider-dark pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-extrabold text-primary">
                  {activeChar}
                </span>
                <button
                  type="button"
                  onClick={() => speakChinese(activeChar)}
                  className="p-1 text-primary hover:text-primary-deep cursor-pointer"
                  title="Nghe phát âm"
                >
                  <Volume2 size={15} />
                </button>
              </div>

              <div className="text-xs font-mono font-semibold text-mute">
                {quizMode === 'quiz' ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                    Đang viết: Lỗi {quizScore.totalMistakes} nét
                  </span>
                ) : writerStrokeProgress.total > 0 ? (
                  <span>Tổng cộng {writerStrokeProgress.total} nét</span>
                ) : null}
              </div>
            </div>

            {/* Target HanziWriter Box */}
            <div className="relative w-[280px] h-[280px] bg-surface-bone/30 dark:bg-black/30 border-2 border-primary/20 dark:border-primary/30 rounded-2xl p-2 flex items-center justify-center shadow-inner overflow-hidden">
              {/* Mễ tự ô background guidelines */}
              <div className="absolute inset-0 pointer-events-none opacity-25">
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 border-l border-dashed border-primary" />
                <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 border-t border-dashed border-primary" />
                <div className="absolute top-0 bottom-0 left-0 right-0 border-t border-dashed border-primary transform rotate-45" />
                <div className="absolute top-0 bottom-0 left-0 right-0 border-t border-dashed border-primary transform -rotate-45" />
              </div>

              {/* HanziWriter target DOM */}
              <div ref={hanziWriterContainerRef} className="w-[260px] h-[260px] z-10" />

              {/* Quiz Completion Overlay */}
              {quizScore.completed && (
                <div className="absolute inset-0 bg-primary/90 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20 animate-fade-in p-4 text-center">
                  <Award size={48} className="text-amber-300 animate-bounce" />
                  <h4 className="text-lg font-bold">Xuất sắc! Hoàn thành nét chữ!</h4>
                  <p className="text-xs opacity-90">
                    Số lần vẽ sai nét: <strong>{quizScore.totalMistakes}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="mt-2 px-4 py-1.5 rounded-full bg-white text-primary text-xs font-bold hover:bg-white/90 cursor-pointer shadow-xs transition-all"
                  >
                    Viết lại lần nữa
                  </button>
                </div>
              )}
            </div>

            {/* Action Playback & Quiz Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleAnimateStrokes}
                disabled={quizMode === 'animating'}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark text-ink dark:text-on-dark text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Play size={14} className="text-primary" />
                <span>Xem mẫu nét</span>
              </button>

              <button
                type="button"
                onClick={handleStartQuiz}
                className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98 ${
                  quizMode === 'quiz' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:bg-primary-deep'
                }`}
              >
                <PenTool size={14} />
                <span>{quizMode === 'quiz' ? 'Khởi động lại tập viết' : 'Tập viết nét'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleInspectCharacter(activeChar)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-hairline dark:border-divider-dark bg-surface-bone hover:bg-surface-card dark:bg-surface-dark text-ink dark:text-on-dark text-xs font-semibold transition-all cursor-pointer"
              >
                <BookOpen size={14} className="text-primary" />
                <span>Tra từ điển chữ này</span>
              </button>
            </div>

            {/* Eight Fundamental Strokes (Vĩnh Tự Bát Pháp - 永字八法) Reference */}
            <div className="w-full max-w-2xl border-t border-hairline dark:border-divider-dark pt-5 mt-2 space-y-2 text-left">
              <h5 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                Quy tắc bút thuận cơ bản (Vĩnh tự bát pháp):
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-body dark:text-on-dark-mute">
                <div className="p-2 rounded-lg bg-surface-bone/40 dark:bg-black/20 border border-hairline dark:border-divider-dark">
                  <span className="font-bold text-primary">1. Trên trước dưới sau</span>
                  <p className="text-[10px] text-mute">Viết từ phần đỉnh xuống chân</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-bone/40 dark:bg-black/20 border border-hairline dark:border-divider-dark">
                  <span className="font-bold text-primary">2. Trái trước phải sau</span>
                  <p className="text-[10px] text-mute">Viết từ bên trái qua bên phải</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-bone/40 dark:bg-black/20 border border-hairline dark:border-divider-dark">
                  <span className="font-bold text-primary">3. Ngang trước sổ sau</span>
                  <p className="text-[10px] text-mute">Nét ngang cắt nét sổ dọc</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-bone/40 dark:bg-black/20 border border-hairline dark:border-divider-dark">
                  <span className="font-bold text-primary">4. Ngoài trước trong sau</span>
                  <p className="text-[10px] text-mute">Bao bọc ngoài trước rồi đóng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
