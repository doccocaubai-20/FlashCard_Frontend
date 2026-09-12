import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  Volume2, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';
import { useReadingAudio } from '../../context/ReadingAudioContext';

export default function FloatingReadingPlayer() {
  const navigate = useNavigate();
  const {
    currentPassage,
    currentParagraphIndex,
    isPlaying,
    isPaused,
    togglePlayPause,
    nextParagraph,
    prevParagraph,
    stopAudio,
  } = useReadingAudio();

  if (!currentPassage || (!isPlaying && !isPaused)) {
    return null;
  }

  const totalParas = currentPassage.paragraphs?.length || 1;
  const currentPara = currentPassage.paragraphs?.[currentParagraphIndex];
  const progressPercent = Math.round(((currentParagraphIndex + 1) / totalParas) * 100);

  const handleNavigateToPassage = () => {
    if (currentPassage?.id) {
      navigate(`/reading/${currentPassage.id}?level=${currentPassage.hskLevel || 1}`);
    }
  };

  return (
    <div className="fixed top-16 right-3 sm:top-5 sm:right-6 z-[99999] animate-slide-down select-none">
      <div className="bg-surface/95 dark:bg-card-dark/95 backdrop-blur-xl border border-primary/35 shadow-2xl rounded-2xl p-3 sm:p-3.5 w-[92vw] sm:w-[380px] space-y-2.5 transition-all">
        
        {/* Top Header: Title + Close Button */}
        <div className="flex items-center justify-between gap-2">
          <div 
            onClick={handleNavigateToPassage}
            className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1"
            title="Bấm để mở bài đọc này"
          >
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
              isPlaying ? 'bg-primary text-white shadow-xs animate-pulse' : 'bg-primary/10 text-primary'
            }`}>
              <Volume2 size={15} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-primary px-1.5 py-0.2 rounded bg-primary/10 shrink-0">
                  HSK {currentPassage.hskLevel}
                </span>
                <span className="font-bold text-xs sm:text-sm text-ink dark:text-on-dark truncate group-hover:text-primary transition-colors">
                  {currentPassage.title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-bold text-mute bg-surface-bone dark:bg-white/5 px-2 py-0.5 rounded-full border border-hairline dark:border-white/10">
              {currentParagraphIndex + 1}/{totalParas}
            </span>

            <button
              onClick={stopAudio}
              className="p-1.5 rounded-lg text-mute hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Tắt trình phát"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Current Paragraph Snippet */}
        {currentPara && (
          <div className="px-2.5 py-1.5 rounded-xl bg-surface-bone/70 dark:bg-white/5 border border-hairline dark:border-white/5">
            <p className="font-serif text-xs sm:text-sm text-ink/85 dark:text-on-dark/85 truncate leading-normal">
              {currentPara.hanzi}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-surface-bone dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-amber-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] font-medium text-mute">
            {isPlaying ? 'Đang phát...' : 'Đã tạm dừng'}
          </span>

          <div className="flex items-center gap-2">
            {/* Prev Paragraph */}
            <button
              onClick={prevParagraph}
              disabled={currentParagraphIndex === 0}
              className="p-1.5 rounded-xl bg-surface-bone dark:bg-white/5 text-ink dark:text-on-dark hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Đoạn trước"
            >
              <SkipBack size={15} />
            </button>

            {/* Play / Pause Toggle */}
            <button
              onClick={togglePlayPause}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Tạm dừng' : 'Tiếp tục phát'}
            >
              {isPlaying ? (
                <>
                  <Pause size={14} className="fill-white" />
                  <span>Dừng</span>
                </>
              ) : (
                <>
                  <Play size={14} className="fill-white" />
                  <span>Phát tiếp</span>
                </>
              )}
            </button>

            {/* Next Paragraph */}
            <button
              onClick={nextParagraph}
              disabled={currentParagraphIndex >= totalParas - 1}
              className="p-1.5 rounded-xl bg-surface-bone dark:bg-white/5 text-ink dark:text-on-dark hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Đoạn tiếp theo"
            >
              <SkipForward size={15} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
