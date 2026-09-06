import React, { useState } from 'react';
import { X, Check, Sparkles, Award, Zap } from 'lucide-react';
import { SCHOLAR_PATHS, SCHOLAR_TIERS, getLevelData } from '../../utils/levelSystem';

export default function ScholarPathModal({
  isOpen,
  onClose,
  currentXp = 0,
  activePath = 'imperial',
  onSelectPath,
}) {
  const [selectedPath, setSelectedPath] = useState(activePath);

  React.useEffect(() => {
    setSelectedPath(activePath);
  }, [activePath, isOpen]);

  if (!isOpen) return null;

  const currentData = getLevelData(currentXp, selectedPath);

  const handleSelect = (pathId) => {
    setSelectedPath(pathId);
    if (onSelectPath) {
      onSelectPath(pathId);
    }
  };

  const handleConfirm = () => {
    if (onSelectPath) {
      onSelectPath(selectedPath);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">✨</span>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-ink dark:text-on-dark tracking-tight">
                Đạo Lộ Học Tập & Danh Hiệu
              </h2>
              <p className="text-xs text-mute dark:text-on-dark-mute">
                Chọn phong cách danh xưng mà bạn yêu thích nhất
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-surface-bone dark:hover:bg-white/10 rounded-full text-mute hover:text-ink dark:hover:text-on-dark transition cursor-pointer"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Level Status Card */}
        <div className="bg-gradient-to-r from-primary/15 via-teal-500/10 to-transparent border border-primary/20 dark:border-primary/30 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark flex items-center justify-center text-2xl shadow-xs">
                {currentData.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary dark:text-hero-glow uppercase tracking-wider">
                    Cấp {currentData.level}
                  </span>
                  <span className="text-xs text-mute/40">•</span>
                  <span className="text-xs font-medium text-mute dark:text-on-dark-mute">
                    {currentData.subtitle}
                  </span>
                </div>
                <h3 className="text-lg font-display font-black text-ink dark:text-on-dark">
                  {currentData.title}
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-mute dark:text-on-dark-mute block">Tổng kinh nghiệm</span>
              <span className="text-base font-mono font-black text-amber-500">
                ⚡ {currentData.xp.toLocaleString()} XP
              </span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-mono font-semibold text-mute dark:text-on-dark-mute">
              <span>Tiến độ cấp {currentData.level}</span>
              <span>
                {currentData.xpInLevel} / {currentData.xpRequiredForNext} XP ({currentData.progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-surface-bone dark:bg-white/10 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full ${currentData.progressBg} rounded-full transition-all duration-500`}
                style={{ width: `${currentData.progressPercent}%` }}
              />
            </div>
            {currentData.nextTitle && (
              <p className="text-[11px] text-mute dark:text-on-dark-mute flex items-center justify-between pt-0.5">
                <span>Còn <strong className="text-ink dark:text-on-dark">{currentData.xpRequiredForNext - currentData.xpInLevel} XP</strong> nữa để lên cấp {currentData.level + 1}</span>
                <span className="font-medium text-primary">Mục tiêu: {currentData.nextTitle}</span>
              </p>
            )}
          </div>
        </div>

        {/* 3 Path Selection Cards */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-mute dark:text-on-dark-mute block">
            Chọn 1 trong 3 Đạo Lộ:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.values(SCHOLAR_PATHS).map((path) => {
              const isCurrent = selectedPath === path.id;
              const pathData = getLevelData(currentXp, path.id);

              return (
                <div
                  key={path.id}
                  onClick={() => handleSelect(path.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left relative flex flex-col justify-between select-none ${
                    isCurrent
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.02]'
                      : 'border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark hover:border-primary/40 hover:bg-surface-bone dark:hover:bg-white/5'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-3xl">{path.icon}</div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-ink dark:text-on-dark flex items-center gap-1.5">
                        {path.name}
                      </h4>
                      <span className="text-[10px] font-mono font-semibold text-primary block mt-0.5">
                        {path.concept}
                      </span>
                    </div>
                    <p className="text-[11px] text-mute dark:text-on-dark-mute leading-relaxed line-clamp-2">
                      {path.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-hairline dark:border-divider-dark/60 space-y-1">
                    <span className="text-[10px] font-mono text-mute block">Danh hiệu hiện tại:</span>
                    <span className="text-xs font-bold text-ink dark:text-on-dark flex items-center gap-1">
                      <span>{pathData.icon}</span>
                      <span className="truncate">{pathData.title}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info & confirm */}
        <div className="pt-2 border-t border-hairline dark:border-divider-dark flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[11px] text-mute dark:text-on-dark-mute">
            💡 <em>Mọi đạo lộ đều chung cấp độ và điểm số. Bạn có thể đổi lại bất kỳ lúc nào!</em>
          </p>
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full shadow-md transition cursor-pointer"
          >
            Đã hiểu & Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
