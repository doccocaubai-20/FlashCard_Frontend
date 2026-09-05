import React from 'react';
import { Flame, TrendingUp, Award, LayoutGrid, Zap, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GreetingBar({
  user = {},
  streak = 0,
  xp = 0,
  coins = 0,
  userLevel = 1,
  scholarTitle = 'Đồng sinh',
  xpBoostTimeLeft = '',
  onToggleViewMode,
  viewMode = 'gamified',
  onOpenShop,
}) {
  const { t } = useTranslation();

  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return t('dashboard.greeting_morning', 'Chào buổi sáng');
    }
    if (hour >= 12 && hour < 18) {
      return t('dashboard.greeting_afternoon', 'Chào buổi chiều');
    }
    return t('dashboard.greeting_evening', 'Chào buổi tối');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || t('common.student', 'học viên');
  const avatarUrl = user?.avatarUrl;
  const initial = (displayName.charAt(0) || 'H').toUpperCase();

  return (
    <header className="relative w-full rounded-2xl bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: User Avatar & Greeting */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 dark:ring-primary/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-hero-glow text-white flex items-center justify-center font-bold text-lg shadow-xs select-none">
                {initial}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white ring-2 ring-surface-card dark:ring-surface-card shadow-xs"
              title={`Cấp độ ${userLevel}`}
            >
              {userLevel}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-primary-light bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md border border-primary/20">
                {scholarTitle} (Lv.{userLevel})
              </span>
              {xpBoostTimeLeft && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-800 animate-pulse">
                  <Zap size={11} className="fill-current" />
                  X2 XP: {xpBoostTimeLeft}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-ink dark:text-on-dark tracking-tight truncate mt-1">
              {getGreetingText()}, <span className="text-primary dark:text-hero-glow">{displayName}</span>!
            </h1>
          </div>
        </div>

        {/* Right: Stats Capsule & View Mode Toggle */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Stats Capsule */}
          <div className="flex items-center gap-2 sm:gap-3 bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            {/* Streak */}
            <div
              className="flex items-center gap-1 text-amber-600 dark:text-amber-400 select-none"
              title={t('dashboard.streak_days', 'Chuỗi ngày học')}
            >
              <Flame size={15} className="fill-current animate-bounce" style={{ animationDuration: '2s' }} />
              <span className="font-bold">{streak}</span>
              <span className="text-[11px] text-mute dark:text-ash hidden sm:inline">{t('common.days', 'ngày')}</span>
            </div>

            <div className="h-3 w-px bg-hairline dark:bg-white/15" />

            {/* XP Points */}
            <div
              className="flex items-center gap-1 text-sky-600 dark:text-sky-400 select-none"
              title={t('dashboard.xp_points', 'Điểm XP')}
            >
              <TrendingUp size={15} />
              <span className="font-bold">{Number(xp).toLocaleString()}</span>
              <span className="text-[11px] text-mute dark:text-ash hidden sm:inline">XP</span>
            </div>

            <div className="h-3 w-px bg-hairline dark:bg-white/15" />

            {/* Coins */}
            <button
              onClick={onOpenShop}
              className="flex items-center gap-1 text-amber-500 hover:text-amber-600 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors cursor-pointer select-none"
              title={t('dashboard.coins', 'Xu thưởng - Nhấn để mở cửa hàng')}
            >
              <Award size={15} />
              <span className="font-bold">{coins}</span>
              <span className="text-[11px] text-mute dark:text-ash hidden sm:inline">{t('dashboard.coins', 'Xu')}</span>
            </button>
          </div>

          {/* Quick Shop Button (if callback provided) */}
          {onOpenShop && (
            <button
              onClick={onOpenShop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-all cursor-pointer shadow-xs active:scale-95"
              title={t('dashboard.shop', 'Cửa hàng')}
            >
              <Sparkles size={13} className="text-amber-500" />
              <span className="hidden md:inline">{t('dashboard.shop', 'Cửa hàng')}</span>
            </button>
          )}

          {/* View Mode Toggle Button */}
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light border border-primary/20 transition-all cursor-pointer shadow-xs active:scale-95"
              title={viewMode === 'gamified' ? 'Chuyển sang giao diện Cổ điển' : 'Chuyển sang giao diện Tương tác'}
            >
              <LayoutGrid size={13} />
              <span className="capitalize">{viewMode === 'gamified' ? 'Cổ điển' : 'Gamified'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
