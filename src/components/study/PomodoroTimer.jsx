import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, ChevronDown, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const PRESETS = [
  { label: '15 phút (Nhanh)', minutes: 15 },
  { label: '25 phút (Tiêu chuẩn Pomodoro)', minutes: 25 },
  { label: '45 phút (Chuyên sâu)', minutes: 45 },
];

export default function PomodoroTimer({ onTimerEnd }) {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const dropdownRef = useRef(null);
  const { showToast } = useToast();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Countdown effect
  useEffect(() => {
    let interval = null;
    if (timerEnabled && isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerEnabled && secondsLeft === 0) {
      setIsRunning(false);
      showToast('🍅 Hết giờ tập trung! Hãy nghỉ giải lao 5 phút để phục hồi năng lượng.', 'info');
      onTimerEnd?.();
    }
    return () => clearInterval(interval);
  }, [timerEnabled, isRunning, secondsLeft, showToast, onTimerEnd]);

  const handleSelectPreset = (minutes) => {
    setSelectedMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setTimerEnabled(true);
    setIsRunning(true);
    setIsDropdownOpen(false);
    showToast(`Đã bật Pomodoro: ${minutes} phút tập trung`, 'info');
  };

  const handleToggleTimer = () => {
    if (!timerEnabled) {
      setTimerEnabled(true);
      setSecondsLeft(selectedMinutes * 60);
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setIsRunning(false);
    setSecondsLeft(selectedMinutes * 60);
  };

  const handleDisableTimer = (e) => {
    e.stopPropagation();
    setIsRunning(false);
    setTimerEnabled(false);
    setIsDropdownOpen(false);
    showToast('Đã tắt Pomodoro Timer', 'info');
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Visual Countdown Pill or Inactive Button */}
      {timerEnabled ? (
        <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-surface-card dark:bg-black/40 border border-primary/30 rounded-full px-2.5 py-1 text-xs font-mono shadow-xs backdrop-blur-xs">
          <button
            type="button"
            onClick={handleToggleTimer}
            className="flex items-center gap-1.5 text-primary hover:text-primary-deep font-bold cursor-pointer transition-colors"
            title={isRunning ? 'Tạm dừng (Nhấn P)' : 'Tiếp tục (Nhấn P)'}
          >
            <span className={isRunning ? 'animate-pulse' : 'opacity-70'}>🍅</span>
            <span className="font-extrabold text-[12px]">{formattedTime}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTimer}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-mute hover:text-primary transition cursor-pointer"
            aria-label={isRunning ? 'Tạm dừng' : 'Tiếp tục'}
            title={isRunning ? 'Tạm dừng' : 'Tiếp tục'}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-mute hover:text-ink dark:hover:text-on-dark transition cursor-pointer"
            aria-label="Đặt lại thời gian"
            title="Đặt lại"
          >
            <RotateCcw size={13} />
          </button>

          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-mute hover:text-ink dark:hover:text-on-dark transition cursor-pointer"
            aria-label="Cài đặt Pomodoro"
            title="Tùy chọn thời gian"
          >
            <ChevronDown size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 bg-surface-bone/60 dark:bg-black/30 hover:bg-surface-bone dark:hover:bg-white/10 border border-hairline dark:border-divider-dark rounded-full text-xs font-mono font-medium text-mute hover:text-primary transition-all cursor-pointer"
          title="Bật Pomodoro Focus Timer"
        >
          <Timer size={14} className="text-primary" />
          <span>Pomodoro</span>
          <ChevronDown size={12} className="opacity-70" />
        </button>
      )}

      {/* Preset selection dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider text-mute dark:text-on-dark-mute border-b border-hairline dark:border-divider-dark flex items-center justify-between">
            <span>⏱️ Chế độ tập trung</span>
          </div>

          {PRESETS.map(({ label, minutes }) => {
            const isCurrent = timerEnabled && selectedMinutes === minutes;
            return (
              <button
                key={minutes}
                type="button"
                onClick={() => handleSelectPreset(minutes)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono text-left transition cursor-pointer ${
                  isCurrent
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'hover:bg-surface-bone dark:hover:bg-white/5 text-ink dark:text-on-dark'
                }`}
              >
                <span>{label}</span>
                {isCurrent && <Check size={14} className="text-primary shrink-0" />}
              </button>
            );
          })}

          {timerEnabled && (
            <div className="pt-1 border-t border-hairline dark:border-divider-dark">
              <button
                type="button"
                onClick={handleDisableTimer}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono text-red-500 hover:bg-red-500/10 transition cursor-pointer"
              >
                ✕ Tắt chế độ Pomodoro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
