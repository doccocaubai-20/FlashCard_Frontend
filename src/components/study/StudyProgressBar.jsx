import React from 'react';
import { Clock } from 'lucide-react';

export default function StudyProgressBar({ current = 0, total = 0, estimatedMinutes }) {
  const currentCardNum = total > 0 ? Math.min(current + 1, total) : 0;
  const percentage = total > 0 ? Math.min(100, Math.round((currentCardNum / total) * 100)) : 0;

  const remainingCards = Math.max(0, total - (current + 1));
  const calculatedMinutes = estimatedMinutes !== undefined
    ? estimatedMinutes
    : Math.max(1, Math.ceil((remainingCards * 8) / 60));

  const timeLabel = remainingCards === 0
    ? '< 1 phút còn lại'
    : `~${calculatedMinutes} phút còn lại`;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-mute dark:text-on-dark-mute">
        <span className="tracking-wide">
          Thẻ {currentCardNum} / {total} <span className="text-primary font-extrabold">({percentage}%)</span>
        </span>
        <span className="flex items-center gap-1.5 text-primary">
          <Clock size={13} className="shrink-0" />
          <span>{timeLabel}</span>
        </span>
      </div>
      <div className="w-full h-2 bg-surface-bone dark:bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-teal-400 dark:to-teal-300 rounded-full transition-all duration-300 ease-out shadow-xs"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
