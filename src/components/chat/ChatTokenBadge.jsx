import React, { useState } from 'react';
import { Coins, Sparkles, RefreshCw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ChatTokenBadge({ quota, onRefillSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const { showToast } = useToast();

  const activeQuota = quota || { used: 0, limit: 50000, remaining: 50000, coins: 0, percentUsed: 0 };
  const { used = 0, limit = 50000, remaining = 50000, coins = 0, percentUsed = 0 } = activeQuota;

  // Format numbers to k (e.g., 42500 -> 42.5k)
  const formatTokens = (val) => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return val;
  };

  const handleRefill = async () => {
    if (coins < 50) {
      showToast('Bạn không đủ Xu để đổi. Hãy chăm sóc Nông trại để tích lũy thêm Xu nhé!', 'warning');
      return;
    }

    setIsRefilling(true);
    try {
      if (onRefillSuccess) {
        await onRefillSuccess();
      }
      showToast('Đổi thành công +15.000 tokens học tập!', 'success');
      setIsOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể đổi tokens lúc này.';
      showToast(msg, 'error');
    } finally {
      setIsRefilling(false);
    }
  };

  const isLow = remaining < 5000;
  const isExhausted = remaining <= 0;

  return (
    <>
      {/* Badge Button on Chat Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
          isExhausted
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            : isLow
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            : 'bg-surface-bone dark:bg-white/5 text-ink/80 dark:text-on-dark/80 border-hairline dark:border-white/10 hover:border-primary/40'
        }`}
        title="Bấm để xem chi tiết hạn mức Token & Nạp thêm"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className={isExhausted ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-primary'} />
          <span>
            {formatTokens(remaining)} / {formatTokens(limit)}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-12 h-1.5 bg-hairline dark:bg-white/10 rounded-full overflow-hidden hidden sm:block">
          <div
            className={`h-full rounded-full transition-all ${
              isExhausted
                ? 'bg-rose-500'
                : isLow
                ? 'bg-amber-500'
                : 'bg-primary'
            }`}
            style={{ width: `${Math.max(5, 100 - percentUsed)}%` }}
          />
        </div>
      </button>

      {/* Modal chi tiết Hạn mức & Đổi Xu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card-dark border border-hairline dark:border-white/10 p-5 sm:p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-hairline dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-ink dark:text-on-dark">
                    Hạn Mức AI Tokens Hàng Ngày
                  </h3>
                  <span className="text-[11px] text-mute">Tự động hồi phục 100% vào 00:00 mỗi ngày</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-mute hover:text-ink dark:hover:text-on-dark hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Token Usage Stats Card */}
            <div className="bg-surface-bone/70 dark:bg-white/5 p-4 rounded-2xl border border-hairline dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-mute">Tokens còn lại hôm nay:</span>
                <span className={`font-bold text-sm ${isExhausted ? 'text-rose-500' : 'text-primary'}`}>
                  {remaining.toLocaleString()} / {limit.toLocaleString()}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-hairline dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExhausted ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-teal-400'
                  }`}
                  style={{ width: `${Math.max(4, 100 - percentUsed)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-mute">
                <span>Đã dùng: {used.toLocaleString()} tokens</span>
                <span>{percentUsed}% đã sử dụng</span>
              </div>
            </div>

            {/* Warning if exhausted */}
            {isExhausted && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <p className="leading-relaxed">
                  Bạn đã dùng hết hạn mức tokens hôm nay. Hãy đổi 50 Xu thưởng bên dưới để nhận thêm +15.000 tokens học tập tiếp nhé!
                </p>
              </div>
            )}

            {/* Gamified Refill with Coins */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-amber-500" />
                  <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    Đổi Xu Thưởng lấy Tokens
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full">
                  Số dư: {coins.toLocaleString()} Xu
                </span>
              </div>

              <p className="text-xs text-ink/75 dark:text-on-dark/75 leading-relaxed">
                Đổi <strong className="text-amber-600 dark:text-amber-400">50 Xu</strong> để nhận ngay <strong className="text-primary">+15.000 tokens</strong> vào hạn mức hôm nay.
              </p>

              <button
                type="button"
                onClick={handleRefill}
                disabled={isRefilling || coins < 50}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
              >
                {isRefilling ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Đang xử lý đổi tokens...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Đổi 50 Xu ➔ Nhận +15.000 Tokens</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
