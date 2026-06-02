import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Trash2, Check } from 'lucide-react';

export default function HandwritingCanvas({ onRecognize }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState({ x: [], y: [], t: [] });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set grid drawing style
    clearCanvas(true);
  }, []);

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
      
      // Auto-trigger recognition for a highly responsive typing-feel
      recognizeStrokes(newStrokes);
    }
    setCurrentStroke({ x: [], y: [], t: [] });
  };

  const clearCanvas = (resetCandidates = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const isDark = document.documentElement.classList.contains('dark');

    // Draw background grid lines (typical calligraphy drawing square style)
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1'; // slate-700 in dark mode, slate-300 in light mode
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    // Center cross lines
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

    // Reset styles for writing brush
    ctx.setLineDash([]);
    ctx.strokeStyle = isDark ? '#f1f5f9' : '#475569'; // slate-100 in dark mode, slate-600 in light mode
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setStrokes([]);
    if (resetCandidates) {
      setCandidates([]);
    }
  };

  const undo = () => {
    if (strokes.length === 0) return;
    
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const isDark = document.documentElement.classList.contains('dark');

    // Draw background grid
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();

    // Reset writing brush styles
    ctx.setLineDash([]);
    ctx.strokeStyle = isDark ? '#f1f5f9' : '#475569';
    ctx.lineWidth = 6;

    newStrokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.moveTo(stroke.x[0], stroke.y[0]);
      for (let i = 1; i < stroke.x.length; i++) {
        ctx.lineTo(stroke.x[i], stroke.y[i]);
      }
      ctx.stroke();
    });

    if (newStrokes.length > 0) {
      recognizeStrokes(newStrokes);
    } else {
      setCandidates([]);
    }
  };

  const recognizeStrokes = async (strokeData = strokes) => {
    if (strokeData.length === 0) return;
    setLoading(true);

    try {
      // Map to Google IME format
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
      console.error('Handwriting recognition failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm h-full justify-between transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Viết Tay (Handwriting)</h3>
        {loading && (
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
            Đang nhận diện...
          </span>
        )}
      </div>

      {/* Canvas Box */}
      <div className="relative aspect-square w-full max-w-[280px] mx-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/10 shadow-inner overflow-hidden cursor-crosshair">
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

      {/* Buttons block */}
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={undo}
          disabled={strokes.length === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-slate-900"
        >
          <RotateCcw size={13} />
          Hoàn tác
        </button>
        <button
          type="button"
          onClick={() => clearCanvas(true)}
          disabled={strokes.length === 0 && candidates.length === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-slate-900"
        >
          <Trash2 size={13} />
          Xóa
        </button>
        <button
          type="button"
          onClick={() => recognizeStrokes()}
          disabled={strokes.length === 0 || loading}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Check size={13} />
          Nhận diện
        </button>
      </div>

      {/* Recognition Results Candidates */}
      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 text-left">
        <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Kết quả nhận diện:</span>
        <div className="flex flex-wrap gap-2 min-h-[48px] items-center bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          {candidates.length > 0 ? (
            candidates.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => {
                  onRecognize(char);
                  clearCanvas(false); // clear lines but keep candidates visible so they can select another if needed
                }}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 text-slate-800 dark:text-slate-200 hover:text-indigo-750 dark:hover:text-indigo-400 font-bold rounded-xl text-xl transition-all cursor-pointer shadow-sm active:scale-95 hover:shadow"
              >
                {char}
              </button>
            ))
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nhấp vẽ nét chữ Hán để hiển thị gợi ý...</span>
          )}
        </div>
      </div>
    </div>
  );
}
