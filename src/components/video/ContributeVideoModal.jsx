import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileJson,
  Layers,
  Film
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import videoLessonApi from '../../services/videoLessonApi';

const HSK_OPTIONS = [
  { value: '1', label: 'HSK 1 - Căn bản' },
  { value: '2', label: 'HSK 2 - Sơ cấp' },
  { value: '3', label: 'HSK 3 - Trung cấp 1' },
  { value: '4', label: 'HSK 4 - Trung cấp 2' },
  { value: '5', label: 'HSK 5 - Cao cấp 1' },
  { value: '6', label: 'HSK 6 - Cao cấp 2' },
];

const SUGGESTED_TOPICS = [
  'Podcast',
  'Hoạt hình',
  'Giao tiếp đời sống',
  'Truyện ngắn',
  'Phim ảnh',
  'Âm nhạc',
  'Kinh doanh',
  'Khác',
];

export default function ContributeVideoModal({ isOpen, onClose, onCreated }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [inputMode, setInputMode] = useState('file'); // 'file' | 'paste'
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parsed Video Data for Review & Customization
  const [parsedData, setParsedData] = useState(null);
  const [customLevel, setCustomLevel] = useState('1');
  const [customTopic, setCustomTopic] = useState('Podcast');
  const [customTitleHanzi, setCustomTitleHanzi] = useState('');
  const [showPreviewSegments, setShowPreviewSegments] = useState(true);

  if (!isOpen) return null;

  // Extract YouTube ID from string or URL
  const extractYoutubeId = (str) => {
    if (!str) return '';
    const trimmed = str.trim();
    if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.')) {
      return trimmed;
    }
    const match = trimmed.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    );
    return match ? match[1] : trimmed;
  };

  // Helper to parse and validate JSON
  const handleParseJson = (rawContent, sourceName = '') => {
    setParseError('');
    try {
      if (!rawContent || !rawContent.trim()) {
        throw new Error('Nội dung JSON rỗng');
      }

      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch (e) {
        throw new Error('Định dạng tệp không phải JSON hợp lệ. Vui lòng kiểm tra cú pháp.');
      }

      // If wrapped in an array or parent object
      if (Array.isArray(parsed)) {
        parsed = parsed[0];
      }
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Cấu trúc JSON không hợp lệ');
      }

      const rawYtId = parsed.youtubeId || parsed.id;
      const youtubeId = extractYoutubeId(rawYtId);
      if (!youtubeId || youtubeId.length !== 11) {
        throw new Error(
          'Không tìm thấy youtubeId hợp lệ trong file JSON (cần 11 ký tự mã video YouTube).'
        );
      }

      if (!parsed.title || typeof parsed.title !== 'string') {
        throw new Error('Thiếu trường tiêu đề (title) trong file JSON.');
      }

      if (!Array.isArray(parsed.segments) || parsed.segments.length === 0) {
        throw new Error(
          'Mảng segments rỗng hoặc thiếu. Cần có danh sách câu phụ đề kèm thời gian.'
        );
      }

      // Check segments format
      const validSegments = parsed.segments.map((seg, idx) => {
        const start = typeof seg.start === 'number' ? seg.start : parseFloat(seg.start) || 0;
        const end = typeof seg.end === 'number' ? seg.end : parseFloat(seg.end) || start + 2;
        return {
          id: seg.id != null ? Number(seg.id) : idx + 1,
          start: Math.max(0, start),
          end: Math.max(start, end),
          hanzi: String(seg.hanzi || '').trim(),
          pinyin: seg.pinyin ? String(seg.pinyin).trim() : '',
          vi: seg.vi ? String(seg.vi).trim() : '',
        };
      });

      // Auto detect Level if null
      let detectedLevel = parsed.level != null ? String(parsed.level) : '';
      if (!detectedLevel) {
        const titleLower = parsed.title.toLowerCase();
        if (titleLower.includes('hsk 1') || titleLower.includes('hsk1')) detectedLevel = '1';
        else if (titleLower.includes('hsk 2') || titleLower.includes('hsk2')) detectedLevel = '2';
        else if (titleLower.includes('hsk 3') || titleLower.includes('hsk3')) detectedLevel = '3';
        else if (titleLower.includes('hsk 4') || titleLower.includes('hsk4')) detectedLevel = '4';
        else if (titleLower.includes('hsk 5') || titleLower.includes('hsk5')) detectedLevel = '5';
        else if (titleLower.includes('hsk 6') || titleLower.includes('hsk6')) detectedLevel = '6';
        else detectedLevel = '1';
      }

      // Auto detect Topic if null
      let detectedTopic = parsed.topic || '';
      if (!detectedTopic) {
        const titleLower = parsed.title.toLowerCase();
        if (titleLower.includes('podcast')) detectedTopic = 'Podcast';
        else if (titleLower.includes('hoạt hình') || titleLower.includes('animation'))
          detectedTopic = 'Hoạt hình';
        else if (titleLower.includes('giao tiếp') || titleLower.includes('hội thoại'))
          detectedTopic = 'Giao tiếp đời sống';
        else detectedTopic = 'Podcast';
      }

      const durationSec =
        parsed.durationSec != null
          ? Number(parsed.durationSec)
          : Math.ceil(validSegments[validSegments.length - 1].end);

      const readyData = {
        ...parsed,
        youtubeId,
        durationSec,
        totalSentences: validSegments.length,
        thumbnailUrl:
          parsed.thumbnailUrl ||
          `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
        segments: validSegments,
      };

      setParsedData(readyData);
      setCustomLevel(detectedLevel);
      setCustomTopic(detectedTopic);
      setCustomTitleHanzi(parsed.titleHanzi || '');
      if (sourceName) setFileName(sourceName);
    } catch (err) {
      setParseError(err.message);
      setParsedData(null);
    }
  };

  // Handle File Input Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      handleParseJson(content, file.name);
    };
    reader.onerror = () => {
      setParseError('Không thể đọc tệp tin đã chọn.');
    };
    reader.readAsText(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        handleParseJson(event.target?.result, file.name);
      };
      reader.readAsText(file);
    } else {
      setParseError('Vui lòng kéo thả tệp có định dạng .json');
    }
  };

  // Reset Form
  const handleReset = () => {
    setParsedData(null);
    setJsonText('');
    setFileName('');
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit to Backend & Local
  const handleSubmit = async () => {
    if (!parsedData) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...parsedData,
        level: Number(customLevel) || 1,
        topic: customTopic.trim() || 'Cộng đồng',
        titleHanzi: customTitleHanzi.trim() || null,
        isCommunity: true,
      };

      const saved = await videoLessonApi.contributeVideoLesson(payload);

      showToast(
        'Đã đóng góp video thành công! Bạn có thể bắt đầu học ngay.',
        'success'
      );
      if (onCreated) {
        onCreated(saved);
      }
      onClose();
    } catch (err) {
      showToast(
        `Lỗi khi lưu bài học: ${err.message || 'Vui lòng thử lại'}`,
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-surface-dark border border-hairline dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden z-10 transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-white/10 bg-surface-bone/30 dark:bg-surface-deep/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Film size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink dark:text-on-dark flex items-center gap-2">
                Đóng góp Video học Tiếng Trung
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  JSON
                </span>
              </h2>
              <p className="text-xs text-mute">
                Tải lên tệp JSON đã trích xuất từ YouTube để làm bài học đồng bộ phụ đề
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-mute hover:text-ink dark:hover:text-on-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!parsedData ? (
            <>
              {/* Tabs Switcher */}
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-surface-bone dark:bg-surface-deep/60 border border-hairline dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${inputMode === 'file'
                    ? 'bg-white dark:bg-surface-card text-primary shadow-sm'
                    : 'text-mute hover:text-ink dark:hover:text-on-dark'
                    }`}
                >
                  <Upload size={14} />
                  Tải tệp JSON từ máy
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${inputMode === 'paste'
                    ? 'bg-white dark:bg-surface-card text-primary shadow-sm'
                    : 'text-mute hover:text-ink dark:hover:text-on-dark'
                    }`}
                >
                  <FileCode size={14} />
                  Dán nội dung JSON
                </button>
              </div>

              {/* Input Mode 1: File Upload */}
              {inputMode === 'file' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${isDragging
                    ? 'border-primary bg-primary/5 scale-[0.99]'
                    : 'border-hairline dark:border-white/15 hover:border-primary/50 hover:bg-surface-bone/30 dark:hover:bg-white/5'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <FileJson size={28} />
                  </div>
                  <h3 className="text-sm font-bold text-ink dark:text-on-dark mb-1">
                    {fileName ? fileName : 'Chọn hoặc kéo thả tệp .json vào đây'}
                  </h3>
                  <p className="text-xs text-mute max-w-sm leading-relaxed">
                    Hỗ trợ tệp JSON trích xuất có cấu trúc youtubeId, title và mảng segments phụ đề tiếng Trung.
                  </p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm shadow-primary/30"
                  >
                    Duyệt tìm tệp JSON
                  </button>
                </div>
              ) : (
                /* Input Mode 2: Paste JSON */
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={8}
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder='Dán nội dung JSON tại đây... (ví dụ: { "youtubeId": "Tm9iK0Ohd2k", "title": "...", "segments": [...] })'
                      className="w-full p-4 rounded-2xl border border-hairline dark:border-white/10 bg-surface-bone/50 dark:bg-surface-deep text-xs font-mono text-ink dark:text-on-dark placeholder:text-mute focus:outline-none focus:border-primary transition resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!jsonText.trim()}
                    onClick={() => handleParseJson(jsonText, 'JSON dán trực tiếp')}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-deep transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Phân tích & Tiếp tục
                  </button>
                </div>
              )}

              {/* Error Message Alert */}
              {parseError && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Không thể đọc file JSON:</p>
                    <p className="mt-0.5 opacity-90">{parseError}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Review & Edit Form Before Final Save */
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Card Preview Header */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-surface-bone/50 dark:bg-surface-deep/50 border border-hairline dark:border-white/10">
                <div className="relative aspect-video w-full sm:w-44 rounded-xl overflow-hidden bg-black shrink-0">
                  <img
                    src={parsedData.thumbnailUrl}
                    alt={parsedData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${parsedData.youtubeId}/hqdefault.jpg`;
                    }}
                  />
                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                    <Clock size={10} />
                    <span>{Math.round(parsedData.durationSec / 60) || 1} phút</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-mute">
                      <span>Kênh: {parsedData.channel || 'YouTube'}</span>
                      <span>•</span>
                      <span className="text-primary font-bold">{parsedData.totalSentences} câu phụ đề</span>
                    </div>
                    <h4 className="text-sm font-bold text-ink dark:text-on-dark line-clamp-2 mt-1">
                      {parsedData.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-mute">
                    <span>Mã video: <code className="text-primary font-mono">{parsedData.youtubeId}</code></span>
                  </div>
                </div>
              </div>

              {/* Form Customization Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 1: Cấp độ HSK */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-ink dark:text-on-dark">
                    Cấp độ HSK <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={customLevel}
                    onChange={(e) => setCustomLevel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold border border-hairline dark:border-white/10 bg-surface-bone/50 dark:bg-surface-deep text-ink dark:text-on-dark focus:outline-none focus:border-primary transition"
                  >
                    {HSK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Chủ đề */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-ink dark:text-on-dark">
                    Chủ đề bài học
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="topics-list"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Ví dụ: Podcast, Hoạt hình..."
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-medium border border-hairline dark:border-white/10 bg-surface-bone/50 dark:bg-surface-deep text-ink dark:text-on-dark focus:outline-none focus:border-primary transition"
                    />
                    <datalist id="topics-list">
                      {SUGGESTED_TOPICS.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Field 3: Tiêu đề chữ Hán (nếu có) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-ink dark:text-on-dark">
                    Tiêu đề chữ Hán (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={customTitleHanzi}
                    onChange={(e) => setCustomTitleHanzi(e.target.value)}
                    placeholder="Ví dụ: 怎么点奶茶 / 用中文表达关心"
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-medium border border-hairline dark:border-white/10 bg-surface-bone/50 dark:bg-surface-deep text-ink dark:text-on-dark focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Subtitles Preview Drawer */}
              <div className="border border-hairline dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-surface-card">
                <button
                  type="button"
                  onClick={() => setShowPreviewSegments(!showPreviewSegments)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-bone/30 dark:bg-surface-deep/30 text-xs font-bold text-ink dark:text-on-dark cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-primary" />
                    Xem trước phụ đề mẫu (Đã nhận {parsedData.totalSentences} câu)
                  </span>
                  {showPreviewSegments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showPreviewSegments && (
                  <div className="p-3 max-h-52 overflow-y-auto space-y-2 text-xs divide-y divide-hairline/40 dark:divide-white/5">
                    {parsedData.segments.slice(0, 5).map((seg, i) => (
                      <div key={seg.id || i} className="pt-2 first:pt-0 space-y-0.5">
                        <div className="flex items-center gap-2 text-[10px] text-mute font-mono">
                          <span className="px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10">
                            #{i + 1}
                          </span>
                          <span>
                            {seg.start}s ➔ {seg.end}s
                          </span>
                        </div>
                        <p className="font-bold text-ink dark:text-on-dark text-sm">{seg.hanzi}</p>
                        {seg.pinyin && <p className="text-primary text-[11px]">{seg.pinyin}</p>}
                        {seg.vi && <p className="text-mute text-[11px] italic">{seg.vi}</p>}
                      </div>
                    ))}
                    {parsedData.segments.length > 5 && (
                      <div className="pt-2 text-center text-[11px] text-mute font-semibold">
                        ... và {parsedData.segments.length - 5} câu phụ đề đồng bộ tiếp theo
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-hairline dark:border-white/10 bg-surface-bone/30 dark:bg-surface-deep/40 flex items-center justify-between gap-3 shrink-0">
          {parsedData ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold bg-primary rounded-xl text-white dark:hover:text-on-dark hover:bg-primary-deep dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Chọn tệp khác
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-hairline dark:border-white/10 text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-deep shadow-md shadow-primary/30 disabled:opacity-50 cursor-pointer flex items-center gap-2 transition transform active:scale-98"
                >
                  {isSubmitting ? (
                    'Đang lưu...'
                  ) : (
                    <>

                      Xác nhận & Bắt đầu học
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-hairline dark:border-white/10 text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
