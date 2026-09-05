import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, RotateCcw, Gamepad2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TodayMission({
  studiedCards = 0,
  dailyTarget = 20,
  totalCards = 0,
  onAction,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAction = (path) => {
    if (onAction) {
      onAction(path);
    } else {
      navigate(path);
    }
  };

  const target = Math.max(1, dailyTarget);
  const ratio = Math.min(1, Math.max(0, studiedCards / target));
  const percent = Math.round(ratio * 100);
  const isTargetAchieved = studiedCards >= target;

  // Circular SVG dimensions
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ratio * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 p-5 sm:p-6 shadow-xs transition-all">
      {/* Subtle ambient blur in background */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/5 dark:bg-primary/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Progress Ring & Stats Info */}
        <div className="flex items-center gap-5 sm:gap-6 min-w-0">
          {/* SVG Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg
              width={size}
              height={size}
              className="transform -rotate-90"
              aria-label={`Tiến độ: ${percent}%`}
            >
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-surface-bone dark:text-white/10"
                fill="transparent"
              />
              {/* Progress Stroke */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-700 ease-out ${isTargetAchieved
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-primary dark:text-hero-glow'
                  }`}
              />
            </svg>

            {/* Percentage / Icon Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              {isTargetAchieved ? (
                <>
                  <CheckCircle2 size={22} className="text-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">100%</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-black text-ink dark:text-on-dark tracking-tighter">
                    {percent}%
                  </span>
                  <span className="text-[8px] font-bold text-mute uppercase tracking-widest">
                    MỤC TIÊU
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Text Summary */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-mute">
                Nhiệm vụ hôm nay
              </span>
              {isTargetAchieved && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Hoàn thành mục tiêu!
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-on-dark">
                {studiedCards}
              </span>
              <span className="text-sm font-semibold text-mute">
                / {target} {t('dashboard.words_learned', 'thẻ đã ôn')}
              </span>
            </div>

            <p className="text-xs text-body dark:text-on-dark-mute line-clamp-2">
              {isTargetAchieved ? (
                <span>Chuỗi mục tiêu đã hoàn tất. Bạn có thể ôn thêm để tích lũy thêm XP!</span>
              ) : (
                <span>Còn <strong className="text-primary dark:text-hero-glow">{Math.max(0, target - studiedCards)}</strong> thẻ nữa để duy trì chuỗi học tập hàng ngày.</span>
              )}
            </p>
          </div>
        </div>

        {/* 3 Quick Action Buttons */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 w-full md:w-auto shrink-0">
          {/* Action 1: Học ngay */}
          <button
            onClick={() => handleAction('/study')}
            className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-deep text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer group"
            title="Bắt đầu học thẻ ngay với thuật toán lặp lại ngắt quãng SRS"
          >
            <GraduationCap size={17} className="transition-transform group-hover:rotate-12" />
            <span>Học ngay</span>
            <ArrowRight size={13} className="hidden sm:inline transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
