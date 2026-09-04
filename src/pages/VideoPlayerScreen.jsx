import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  Mic,
  MicOff,
  Square,
  Eye,
  EyeOff,
  Repeat,
  Maximize2,
  Sparkles,
  ChevronRight,
  Tv,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import videoLessonsData from '../data/videoLessonsData';
import HoverableText from '../components/common/HoverableText';
import { useToast } from '../context/ToastContext';

export default function VideoPlayerScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Tìm bài học theo ID
  const lesson = useMemo(() => {
    return videoLessonsData.find(v => v.id === id || v.youtubeId === id) || videoLessonsData[0];
  }, [id]);

  // YouTube Player State
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Học tập & Phụ đề settings
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isAutoPause, setIsAutoPause] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isLargeVideo, setIsLargeVideo] = useState(false);

  // Active Segment
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const transcriptListRef = useRef(null);
  const lastPausedSegRef = useRef(-1);

  // Ghi âm / Luyện nói (Shadowing)
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedAudioRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Hàm cuộn mượt mà bản chép tới câu được chỉ định, luôn giữ câu ở khoảng 1/3 khung nhìn
  const scrollToSegment = (index, behavior = 'smooth') => {
    const container = transcriptListRef.current;
    if (!container) return;
    const card = container.querySelector(`[data-segment-index="${index}"]`);
    if (!card) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const offsetFromContainerTop = cardRect.top - containerRect.top;

    // Giữ thẻ đang phát luôn nằm cách đỉnh container khoảng 100px
    const targetScroll = container.scrollTop + offsetFromContainerTop - 110;

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: behavior
    });
  };

  // 1. Tải và khởi tạo YouTube IFrame API
  useEffect(() => {
    let checkInterval = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('youtube-player-iframe', {
        videoId: lesson.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          fs: 1
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration() || lesson.durationSec);
          },
          onStateChange: (event) => {
            // 1: PLAYING, 2: PAUSED, 0: ENDED
            if (event.data === 1) {
              setIsPlaying(true);
              lastPausedSegRef.current = -1; // Reset để có thể tự dừng ở câu tiếp
            } else {
              setIsPlaying(false);
            }
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    // Interval tracking currentTime mỗi 120ms
    checkInterval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
        } catch (e) { }
      }
    }, 120);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [lesson.youtubeId]);

  // 2. Tìm câu active dựa theo currentTime & xử lý tự dừng / lặp câu
  useEffect(() => {
    if (!lesson.segments || lesson.segments.length === 0) return;

    const segIndex = lesson.segments.findIndex(
      (s) => currentTime >= s.start && currentTime < s.end
    );

    if (segIndex !== -1 && segIndex !== activeSegmentIndex) {
      setActiveSegmentIndex(segIndex);
      scrollToSegment(segIndex, 'smooth');
    }

    // Xử lý Lặp câu (Loop) hoặc Tự động dừng (Auto-pause) ở đầu câu tiếp theo
    const currentSeg = lesson.segments[activeSegmentIndex];
    if (currentSeg && isPlaying) {
      if (isLooping) {
        if (currentTime >= currentSeg.end - 0.1) {
          playerRef.current?.seekTo(currentSeg.start, true);
        }
      } else if (isAutoPause) {
        // Video chạy hết câu này và hết cả đoạn ngắt (nếu có).
        // Đến đúng đầu câu tiếp theo (nextSeg.start) thì dừng luôn không phát.
        const nextIndex = activeSegmentIndex + 1;
        const nextSeg = lesson.segments[nextIndex];

        if (nextSeg) {
          if (currentTime >= nextSeg.start - 0.04 && lastPausedSegRef.current !== activeSegmentIndex) {
            lastPausedSegRef.current = activeSegmentIndex;
            playerRef.current?.pauseVideo();
            playerRef.current?.seekTo(nextSeg.start, true);
          }
        } else {
          // Câu cuối cùng của video
          if (currentTime >= currentSeg.end && lastPausedSegRef.current !== activeSegmentIndex) {
            lastPausedSegRef.current = activeSegmentIndex;
            playerRef.current?.pauseVideo();
          }
        }
      }
    }
  }, [currentTime, lesson.segments, activeSegmentIndex, isLooping, isAutoPause, isPlaying]);

  const activeSegment = lesson.segments[activeSegmentIndex] || lesson.segments[0] || {};
  const progressPercent = lesson.segments.length > 0
    ? Math.round(((activeSegmentIndex + 1) / lesson.segments.length) * 100)
    : 0;

  // Điều khiển tua câu
  const seekToSegment = (seg, index) => {
    lastPausedSegRef.current = -1;
    setActiveSegmentIndex(index);
    scrollToSegment(index, 'smooth');
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seg.start, true);
      playerRef.current.playVideo();
    }
  };

  const replayCurrentSegment = () => {
    lastPausedSegRef.current = -1;
    if (activeSegment && playerRef.current) {
      playerRef.current.seekTo(activeSegment.start, true);
      playerRef.current.playVideo();
      scrollToSegment(activeSegmentIndex, 'smooth');
    }
  };

  const handlePrevSegment = () => {
    if (activeSegmentIndex > 0) {
      const prev = lesson.segments[activeSegmentIndex - 1];
      seekToSegment(prev, activeSegmentIndex - 1);
    }
  };

  const handleNextSegment = () => {
    if (activeSegmentIndex < lesson.segments.length - 1) {
      const next = lesson.segments[activeSegmentIndex + 1];
      seekToSegment(next, activeSegmentIndex + 1);
    }
  };

  // 3. Ghi âm luyện nói Shadowing
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast('Đang ghi âm giọng đọc của bạn...', 'info');
    } catch (err) {
      console.error(err);
      showToast('Không thể truy cập microphone. Vui lòng cấp quyền.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      showToast('Đã lưu bản ghi âm! Bấm "Phát lại ghi âm" để nghe.', 'success');
    }
  };

  const playRecordedAudio = () => {
    if (!audioBlobUrl) return;
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
    }
    const audio = new Audio(audioBlobUrl);
    recordedAudioRef.current = audio;
    setIsPlayingRecorded(true);
    audio.play();
    audio.onended = () => setIsPlayingRecorded(false);
  };

  return (
    <div className="max-w-[1550px] mx-auto space-y-4 pb-12">
      {/* Breadcrumb & Tiêu đề bài học */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-mute">
          <Link to="/video" className="hover:text-primary transition flex items-center gap-1">
            <ArrowLeft size={16} />
            <span>Học qua video</span>
          </Link>
          <ChevronRight size={14} className="opacity-40" />
          <span className="truncate max-w-[280px] sm:max-w-md text-ink dark:text-on-dark font-bold">
            {lesson.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
            HSK {lesson.level}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            {lesson.topic}
          </span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className={`grid gap-5 ${isLargeVideo ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>

        {/* CỘT TRÁI: Video Player + Subtitle Box + Controls + Shadowing (Chiếm 7 hoặc 8 cột) */}
        <div className={`space-y-4 ${isLargeVideo ? 'col-span-1' : 'lg:col-span-7 xl:col-span-8'}`}>
          {/* Container Trình phát YouTube */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-hairline dark:border-divider-dark">
            <div id="youtube-player-iframe" className="w-full h-full" />
          </div>

          {/* Hộp Phụ đề đồng bộ 3 tầng (Khớp chính xác câu đang phát) */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 sm:p-5 border border-hairline dark:border-divider-dark shadow-sm space-y-2.5 relative min-h-[125px] max-h-[160px] sm:max-h-[185px] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between text-xs text-mute pb-2 border-b border-hairline/60 dark:border-divider-dark/60">
              <span className="font-bold flex items-center gap-1.5 text-primary">
                <span>Câu {activeSegment.id || activeSegmentIndex + 1} / {lesson.segments.length}</span>
              </span>
              <span className="font-mono text-[11px]">
                {Math.floor(activeSegment.start || 0)}s - {Math.floor(activeSegment.end || 0)}s
              </span>
            </div>

            {/* Phụ đề Pinyin */}
            {showPinyin && activeSegment.pinyin && (
              <p className="text-sm sm:text-base font-semibold text-primary/85 dark:text-primary font-mono tracking-wide leading-relaxed">
                {activeSegment.pinyin}
              </p>
            )}

            {/* Phụ đề Chữ Hán với HoverableText */}
            <div className="text-xl sm:text-2xl font-black text-ink dark:text-on-dark font-display leading-relaxed tracking-wide">
              <HoverableText text={activeSegment.hanzi} />
            </div>

            {/* Phụ đề Tiếng Việt */}
            {showTranslation && activeSegment.vi && (
              <p className="text-sm sm:text-base font-medium text-sub dark:text-on-dark-mute leading-relaxed pt-1">
                {activeSegment.vi}
              </p>
            )}
          </div>

          {/* Thanh công cụ điều khiển thông minh */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-surface-dark p-3.5 rounded-2xl border border-hairline dark:border-divider-dark shadow-sm">
            {/* Tua câu & Lặp */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevSegment}
                disabled={activeSegmentIndex === 0}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition cursor-pointer text-ink dark:text-on-dark"
                title="Câu trước"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={replayCurrentSegment}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition cursor-pointer"
                title="Tua lại câu này"
              >
                <RotateCcw size={15} />
                <span>Tua lại</span>
              </button>

              <button
                onClick={handleNextSegment}
                disabled={activeSegmentIndex >= lesson.segments.length - 1}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition cursor-pointer text-ink dark:text-on-dark"
                title="Câu tiếp theo"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Toggles: Pinyin, Dịch, Tự động dừng, Lặp */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPinyin(!showPinyin)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${showPinyin
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-mute hover:bg-black/5 dark:hover:bg-white/10 border border-transparent'
                  }`}
              >
                {showPinyin ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Pinyin</span>
              </button>

              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${showTranslation
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                    : 'text-mute hover:bg-black/5 dark:hover:bg-white/10 border border-transparent'
                  }`}
              >
                {showTranslation ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Dịch</span>
              </button>

              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${isLooping
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-mute hover:bg-black/5 dark:hover:bg-white/10 border border-transparent'
                  }`}
                title="Lặp lại câu này liên tục"
              >
                <Repeat size={14} />
                <span>Lặp câu</span>
              </button>

              <button
                onClick={() => setIsAutoPause(!isAutoPause)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${isAutoPause
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-mute hover:bg-black/5 dark:hover:bg-white/10 border border-transparent'
                  }`}
                title="Tự dừng khi hết câu để luyện đọc"
              >
                <span>Tự dừng</span>
              </button>

              <button
                onClick={() => setIsLargeVideo(!isLargeVideo)}
                className="hidden lg:flex p-1.5 rounded-xl text-mute hover:text-ink dark:hover:text-on-dark hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                title="Phóng to video"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          {/* Phần Luyện Nói Theo Câu (Shadowing & Recording) */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-hairline dark:border-divider-dark shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink dark:text-on-dark flex items-center gap-1.5">
                <Mic size={15} className="text-primary" />
                <span>Luyện nói theo câu (Shadowing)</span>
              </h4>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-bone/40 dark:bg-surface-deep/60 border border-hairline/60 dark:border-divider-dark/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-bold text-ink dark:text-on-dark font-display">
                  {activeSegment.hanzi}
                </div>
                <div className="text-xs text-mute">
                  {activeSegment.vi}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={replayCurrentSegment}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-hairline dark:border-divider-dark hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold transition cursor-pointer text-ink dark:text-on-dark"
                >
                  <Volume2 size={15} className="text-primary" />
                  <span>Nghe mẫu</span>
                </button>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                  >
                    <Mic size={15} />
                    <span>Ghi âm</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-extrabold shadow-sm transition animate-pulse cursor-pointer"
                  >
                    <Square size={14} className="fill-current text-rose-500" />
                    <span>Dừng ghi</span>
                  </button>
                )}

                {audioBlobUrl && (
                  <button
                    onClick={playRecordedAudio}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${isPlayingRecorded
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                  >
                    <Play size={14} className="fill-current" />
                    <span>{isPlayingRecorded ? 'Đang phát...' : 'Phát lại ghi âm'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BẢN CHÉP TƯƠNG TÁC (Synchronized Interactive Transcript) */}
        <div className={`${isLargeVideo ? 'col-span-1' : 'lg:col-span-5 xl:col-span-4'}`}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-hairline dark:border-divider-dark shadow-sm flex flex-col h-[680px]">
            {/* Header Bản chép */}
            <div className="p-4 border-b border-hairline dark:border-divider-dark flex items-center justify-between shrink-0 bg-surface-bone/20 dark:bg-surface-deep/40 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-extrabold text-ink dark:text-on-dark flex items-center gap-2">
                  <span>BẢN CHÉP</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    {progressPercent}%
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPinyin(!showPinyin)}
                  className={`p-1.5 rounded-lg text-xs font-bold transition ${showPinyin ? 'text-primary bg-primary/10' : 'text-mute'}`}
                  title="Ẩn/hiện Pinyin trong bản chép"
                >
                  Pinyin
                </button>
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`p-1.5 rounded-lg text-xs font-bold transition ${showTranslation ? 'text-sky-600 bg-sky-500/10' : 'text-mute'}`}
                  title="Ẩn/hiện Dịch trong bản chép"
                >
                  Dịch
                </button>
              </div>
            </div>

            {/* Danh sách câu có cuộn đồng bộ */}
            <div
              ref={transcriptListRef}
              className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y-0 custom-scrollbar"
            >
              {lesson.segments.map((seg, idx) => {
                const isActive = idx === activeSegmentIndex;
                return (
                  <div
                    key={seg.id || idx}
                    data-segment-index={idx}
                    onClick={() => seekToSegment(seg, idx)}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer select-text ${isActive
                        ? 'bg-primary/5 dark:bg-primary/15 border-2 border-primary shadow-sm shadow-primary/10 scale-[1.01]'
                        : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    {/* Header câu: Số thứ tự & Thời gian */}
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className={isActive ? 'text-primary font-black' : 'text-mute'}>
                        #{seg.id || idx + 1}
                      </span>
                      <span className="font-mono text-mute">
                        {Math.floor(seg.start)}s
                      </span>
                    </div>

                    {/* Pinyin */}
                    {showPinyin && seg.pinyin && (
                      <p className="text-xs font-medium text-primary/80 dark:text-primary/90 font-mono leading-relaxed mb-0.5">
                        {seg.pinyin}
                      </p>
                    )}

                    {/* Hanzi */}
                    <div className="text-base font-bold text-ink dark:text-on-dark font-display leading-snug">
                      <HoverableText text={seg.hanzi} />
                    </div>

                    {/* Tiếng Việt */}
                    {showTranslation && seg.vi && (
                      <p className="text-xs text-sub dark:text-on-dark-mute leading-relaxed mt-1">
                        {seg.vi}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
