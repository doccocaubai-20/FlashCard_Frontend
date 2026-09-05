import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / Enter', label: 'Lật thẻ (Xem mặt trước / sau)' },
    { key: '← / →', label: 'Quay lại / Thẻ tiếp theo (hoặc Bỏ qua)' },
    { key: '1', label: 'Đánh giá: Quên (Lặp lại ngay)' },
    { key: '2', label: 'Đánh giá: Khó' },
    { key: '3', label: 'Đánh giá: Tốt' },
    { key: '4', label: 'Đánh giá: Dễ' },
    { key: 'P', label: 'Bật / Tạm dừng Pomodoro Focus Timer' },
    { key: 'T', label: 'Phát âm từ vựng hiện tại (TTS)' },
    { key: '?', label: 'Mở / Đóng bảng phím tắt này' },
    { key: 'Esc', label: 'Đóng bảng hướng dẫn' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-ink dark:text-on-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-hairline dark:border-divider-dark">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Keyboard size={18} />
            </div>
            <h3 className="font-display font-bold text-base text-ink dark:text-on-dark">Phím tắt học tập</h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-mute hover:text-ink dark:hover:text-on-dark transition cursor-pointer"
            aria-label="Đóng bảng phím tắt"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map(({ key, label }) => (
            <div 
              key={key} 
              className="flex items-center justify-between py-2 px-3 bg-surface-bone/50 dark:bg-black/20 rounded-xl text-xs font-mono"
            >
              <span className="text-body dark:text-on-dark-mute">{label}</span>
              <kbd className="px-2.5 py-1 bg-surface-card dark:bg-white/10 border border-hairline dark:border-white/15 rounded-lg text-[11px] font-bold text-primary shadow-2xs whitespace-nowrap ml-2">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        <button 
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full transition-colors cursor-pointer shadow-sm active:scale-[0.99]"
        >
          Đã hiểu (Esc)
        </button>
      </div>
    </div>
  );
}
