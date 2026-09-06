import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Volume2, Home, BookOpen, AlertTriangle } from 'lucide-react';
import { statsApi } from '../../services/statsApi';
import { speakChinese } from '../../utils/tts';

export default function SessionSummary({
  stats = {},
  onReviewWeak,
  onRestartAll,
  onNextDeck,
  onGoHome,
}) {
  const navigate = useNavigate();
  const xpAwardedRef = useRef(false);

  const {
    masteredCount = 0,
    weakWords = [],
    accuracyRate = 100,
    durationSec = 0,
    xpEarned = 0,
    coinsEarned = 0,
    isSkimmed = false,
    bonusXpToAward = 0,
    bonusCoinsToAward = 0,
  } = stats;

  // Award XP and coins automatically upon session completion
  useEffect(() => {
    if (xpAwardedRef.current) return;
    const xpToAdd = bonusXpToAward !== undefined ? bonusXpToAward : xpEarned;
    const coinsToAdd = bonusCoinsToAward !== undefined ? bonusCoinsToAward : coinsEarned;

    if (xpToAdd > 0 || coinsToAdd > 0) {
      xpAwardedRef.current = true;
      statsApi.addXpCoins(xpToAdd, coinsToAdd).catch((err) => {
        console.warn('Could not sync XP/coins to backend:', err);
      });
    }
  }, [bonusXpToAward, bonusCoinsToAward, xpEarned, coinsEarned]);

  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      navigate('/');
    }
  };

  const handleNextDeck = () => {
    if (onNextDeck) {
      onNextDeck();
    } else {
      navigate('/decks');
    }
  };

  const handleSpeak = (e, text) => {
    e.stopPropagation();
    speakChinese(text);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Trophy & Congratulatory Card */}
      <div className="bg-gradient-to-br from-primary/15 via-teal-500/10 to-transparent border border-primary/20 dark:border-primary/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl backdrop-blur-xs">
        {isSkimmed ? (
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-surface-bone dark:bg-white/10 text-mute flex items-center justify-center text-3xl sm:text-4xl shadow-md ring-4 ring-black/5 dark:ring-white/5">
            📖
          </div>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-lg ring-4 ring-amber-400/20 animate-bounce">
            🏆
          </div>
        )}
        
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-ink dark:text-on-dark tracking-tight">
            {isSkimmed ? 'Đã xem lướt bộ thẻ' : 'Hoàn thành buổi học!'}
          </h1>
          <p className="text-xs sm:text-sm text-mute dark:text-on-dark-mute max-w-md mx-auto leading-relaxed">
            {isSkimmed
              ? 'Bạn vừa xem lướt qua các thẻ. Hãy lật thẻ và dừng lại ghi nhớ để tích lũy điểm kinh nghiệm (XP) nhé!'
              : 'Tuyệt vời! Bạn đã hoàn thành trọn vẹn buổi học flashcard và tích lũy thêm điểm kinh nghiệm.'}
          </p>
        </div>

        {/* 4 Key Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* 1. Accuracy Rate */}
          <div className="p-3.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider block">
              Độ chính xác
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {isSkimmed ? '0%' : `${accuracyRate}%`}
            </span>
          </div>

          {/* 2. Total Duration */}
          <div className="p-3.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider block">
              Thời gian
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-primary mt-1 block">
              {timeFormatted}
            </span>
          </div>

          {/* 3. Cards Mastered vs Review */}
          <div className="p-3.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider block">
              Đã thuộc / Ôn
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-ink dark:text-on-dark mt-1 block">
              <span className="text-emerald-500">{masteredCount}</span>
              <span className="text-xs text-mute font-normal mx-1">/</span>
              <span className="text-red-500 text-sm font-bold">{weakWords.length}</span>
            </span>
          </div>

          {/* 4. XP Earned */}
          <div className="p-3.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider block">
              Thưởng XP
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-amber-500 mt-1 block">
              +{isSkimmed ? 0 : xpEarned}
            </span>
          </div>
        </div>
      </div>

      {/* Weak Words List (Cards needing review) */}
      {weakWords.length > 0 && (
        <div className="bg-surface-card dark:bg-surface-dark border border-red-500/30 dark:border-red-500/20 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <h3 className="text-xs font-mono font-bold text-red-500 uppercase tracking-wider">
                Từ vựng cần ôn lại ({weakWords.length})
              </h3>
            </div>
            {onReviewWeak && (
              <button
                type="button"
                onClick={onReviewWeak}
                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-mono font-bold rounded-full transition cursor-pointer"
              >
                Ôn ngay →
              </button>
            )}
          </div>

          <div className="divide-y divide-hairline dark:divide-divider-dark max-h-60 overflow-y-auto pr-1">
            {weakWords.map((card, idx) => {
              const char = card.character || card.hanzi || card.front || '';
              return (
                <div key={card.id || idx} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <span className="text-lg font-display font-bold text-ink dark:text-on-dark">
                      {char}
                    </span>
                    <span className="text-xs font-mono font-semibold text-primary truncate">
                      {card.pinyin}
                    </span>
                    <span className="text-xs text-mute dark:text-on-dark-mute truncate hidden sm:inline">
                      {card.meaning}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleSpeak(e, char)}
                    className="p-2 hover:bg-surface-bone dark:hover:bg-white/10 rounded-full text-mute hover:text-primary transition cursor-pointer shrink-0"
                    aria-label={`Phát âm từ ${char}`}
                    title="Phát âm từ"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {weakWords.length > 0 && onReviewWeak && (
          <button
            type="button"
            onClick={onReviewWeak}
            className="flex-1 min-h-[44px] py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs rounded-full shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <RotateCcw size={14} />
            <span>Ôn lại các từ chưa thuộc ({weakWords.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleNextDeck}
          className="flex-1 min-h-[44px] py-3 px-4 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
        >
          <BookOpen size={14} />
          <span>Học tiếp bộ khác</span>
        </button>

        <button
          type="button"
          onClick={handleGoHome}
          className="min-h-[44px] py-3 px-6 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-white/5 border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
        >
          <Home size={14} />
          <span>Về trang chủ</span>
        </button>
      </div>

      {onRestartAll && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onRestartAll}
            className="text-xs font-mono font-semibold text-mute hover:text-primary transition underline cursor-pointer"
          >
            Học lại toàn bộ danh sách này
          </button>
        </div>
      )}
    </div>
  );
}
