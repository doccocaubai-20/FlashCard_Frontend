import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  X,
  Award,
  Flame,
  Calendar,
  LayoutGrid,
} from 'lucide-react';

import { fetchSummary, fetchHeatmap } from '../features/stats/statsSlice';
import { fetchAllDecks } from '../features/deck/deckSlice';
import { updateProfile } from '../features/auth/authSlice';
import { statsApi } from '../services/statsApi';
import { useTheme } from '../context/ThemeContext';
import { getLevelData, getSavedScholarPath, setSavedScholarPath } from '../utils/levelSystem';

// Sub-components (Requirement R3)
import GreetingBar from '../components/dashboard/GreetingBar';
import TodayMission from '../components/dashboard/TodayMission';
import WordOfTheDay from '../components/dashboard/WordOfTheDay';
import ScholarPathModal from '../components/common/ScholarPathModal';
import QuickLinksGrid from '../components/dashboard/QuickLinksGrid';
import RecentDecks from '../components/dashboard/RecentDecks';
import DailyQuests from '../components/dashboard/DailyQuests';

// Mini 7-day study streak indicator
function MiniWeekStrip({ data = [] }) {
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const found = data.find((item) => item?.date === dateStr);
    return {
      day: dayLabels[d.getDay()],
      date: d.getDate(),
      count: found?.count || 0,
      isToday: i === 6,
    };
  });

  const getCellIntensity = (count) => {
    if (count >= 4) return 'bg-primary text-white';
    if (count >= 2) return 'bg-primary/60 text-white';
    if (count >= 1) return 'bg-primary/20 text-primary dark:text-primary-light';
    return 'bg-surface-bone dark:bg-white/5 text-mute';
  };

  return (
    <div className="rounded-2xl border border-hairline dark:border-white/10 bg-surface-card dark:bg-surface-card p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-ink dark:text-on-dark flex items-center gap-1.5">
          <Flame size={14} className="text-amber-500 fill-current" />
          7 ngày gần nhất
        </span>
        <Link
          to="/stats"
          className="text-[11px] font-bold text-primary dark:text-hero-glow hover:underline transition-colors"
        >
          Chi tiết thống kê →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekData.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-mute uppercase">{d.day}</span>
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${getCellIntensity(
                d.count
              )} ${d.isToday
                ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-surface-card dark:ring-offset-surface-card'
                : ''
                }`}
              title={`${d.count} lượt học`}
            >
              {d.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { viewMode, toggleViewMode } = useTheme();

  // Redux Global States
  const user = useSelector((state) => state.auth.user);
  const summary = useSelector((state) => state.stats.summary);
  const heatmapData = useSelector((state) => state.stats.heatmapData);
  const decks = useSelector((state) => state.deck.decks);

  // Modals state
  const [showShop, setShowShop] = useState(false);
  const [showAiMentor, setShowAiMentor] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [shopFeedback, setShopFeedback] = useState('');
  const [xpBoostTimeLeft, setXpBoostTimeLeft] = useState('');

  // Primary data fetching
  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchHeatmap());
    dispatch(fetchAllDecks());
  }, [dispatch]);

  useEffect(() => {
    const refreshDecksWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        dispatch(fetchAllDecks());
      }
    };

    document.addEventListener('visibilitychange', refreshDecksWhenVisible);
    window.addEventListener('focus', refreshDecksWhenVisible);

    return () => {
      document.removeEventListener('visibilitychange', refreshDecksWhenVisible);
      window.removeEventListener('focus', refreshDecksWhenVisible);
    };
  }, [dispatch]);

  // Derived user statistics
  const streak = summary?.streak ?? 0;
  const xp = summary?.xp ?? 0;
  const coins = summary?.coins ?? 0;
  const dailyTarget = summary?.dailyTarget ?? 20;
  const studiedCards = summary?.completedCards ?? 0;
  const totalCards = decks?.reduce((sum, d) => sum + (d.cardCount || 0), 0) || 0;

  // Level & Title Calculation based on unified RPG curve and active Scholar Path
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(user?.scholarPath || getSavedScholarPath('imperial'));

  useEffect(() => {
    if (user?.scholarPath) {
      setCurrentPath(user.scholarPath);
    }
  }, [user?.scholarPath]);

  const levelData = useMemo(() => getLevelData(xp, currentPath), [xp, currentPath]);
  const userLevel = levelData.level;
  const scholarTitle = levelData.title;

  const handleSelectPath = useCallback(async (newPathId) => {
    setCurrentPath(newPathId);
    setSavedScholarPath(newPathId);
    if (user?.id) {
      try {
        await dispatch(updateProfile({ id: user.id, data: { scholarPath: newPathId } })).unwrap();
      } catch (err) {
        console.warn('Could not persist scholar path to backend:', err);
      }
    }
  }, [dispatch, user?.id]);

  // Real-time Countdown Timer for XP Boost Potion
  useEffect(() => {
    if (!summary?.xpBoostUntil) {
      setXpBoostTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const until = new Date(summary.xpBoostUntil).getTime();
      const now = Date.now();
      const diff = until - now;

      if (diff <= 0) {
        setXpBoostTimeLeft('');
        clearInterval(interval);
        dispatch(fetchSummary());
      } else {
        const minutes = Math.floor(diff / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        setXpBoostTimeLeft(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [summary?.xpBoostUntil, dispatch]);

  // Shop purchase handler
  const handleBuyItem = async (itemName, price) => {
    if (coins < price) {
      setShopFeedback(t('dashboard.shop_feedback_fail', 'Số dư Xu không đủ!'));
      setTimeout(() => setShopFeedback(''), 3000);
      return;
    }

    try {
      await statsApi.buyItem(price, itemName);
      setShopFeedback(t('dashboard.shop_feedback_success', 'Mua vật phẩm thành công! 🎉'));
      setTimeout(() => setShopFeedback(''), 3000);
      dispatch(fetchSummary());
    } catch (err) {
      console.error(err);
      setShopFeedback(err.response?.data?.message || t('common.error', 'Có lỗi xảy ra!'));
      setTimeout(() => setShopFeedback(''), 3000);
    }
  };

  // Booster activation
  const handleUseXpBoost = async () => {
    try {
      await statsApi.useXpBoost();
      setShopFeedback('Đã kích hoạt Thần Dược Nhân Đôi XP! ⚡');
      setTimeout(() => setShopFeedback(''), 3000);
      dispatch(fetchSummary());
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể sử dụng bình nhân đôi XP.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 select-none transition-colors">
      {/* 1. Greeting & User Header Bar */}
      <GreetingBar
        user={user}
        streak={streak}
        xp={xp}
        coins={coins}
        userLevel={userLevel}
        scholarTitle={scholarTitle}
        levelData={levelData}
        onOpenPathModal={() => setIsPathModalOpen(true)}
        xpBoostTimeLeft={xpBoostTimeLeft}
        onToggleViewMode={toggleViewMode}
        viewMode={viewMode}
        onOpenShop={() => setShowShop(true)}
      />

      {/* 2. Top Hero Hub: Today's Mission (Progress Ring) & Word of the Day */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <TodayMission
            studiedCards={studiedCards}
            dailyTarget={dailyTarget}
            totalCards={totalCards}
            onAction={(path) => navigate(path)}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <WordOfTheDay />
        </div>
      </section>

      {/* 3. Quick Links Bento Grid Navigation */}
      <QuickLinksGrid onNavigate={(path) => navigate(path)} />

      {/* 4. Core Activities: Recent Decks & Daily Quests */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-6 flex flex-col space-y-5">
          <RecentDecks
            decks={decks}
            onStudyDeck={(deckId) => navigate(`/study?deckId=${deckId}`)}
          />
          <MiniWeekStrip data={heatmapData} />
        </div>

        <div className="lg:col-span-6 flex flex-col space-y-5">
          <DailyQuests
            studiedCards={studiedCards}
            onRefreshSummary={() => dispatch(fetchSummary())}
          />

          {/* Quick Utility Launchers Bar (Shop, AI Mentor, Roadmap) */}
          <div className="rounded-2xl border border-hairline dark:border-white/10 bg-surface-card dark:bg-surface-card p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-primary dark:text-hero-glow" />
              <span className="text-xs sm:text-sm font-bold text-ink dark:text-on-dark">
                Tiện ích học tập mở rộng
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAiMentor(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Xem gợi ý học tập từ AI Mentor"
              >
                <Sparkles size={13} />
                <span>AI Mentor</span>
              </button>

              <button
                onClick={() => setShowRoadmap(true)}
                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light border border-primary/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Xem lộ trình HSK Orbit"
              >
                <LayoutGrid size={13} />
                <span>Lộ trình HSK</span>
              </button>

              <button
                onClick={() => setShowShop(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Mở cửa hàng ChongZi"
              >
                <ShoppingBag size={13} />
                <span>Cửa hàng</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: CỬA HÀNG CHONGZI (Shop Modal)
      ───────────────────────────────────────────────────────────── */}
      {showShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-white/10 p-5 sm:p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-hairline dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-500 dark:text-yellow-400">
                <ShoppingCart size={20} />
                <h3 className="font-bold text-ink dark:text-white text-base">
                  {t('dashboard.shop_title', 'Cửa Hàng ChongZi')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowShop(false);
                  setShopFeedback('');
                }}
                className="text-mute hover:text-ink dark:text-white/50 dark:hover:text-white transition-colors cursor-pointer"
                title="Đóng cửa hàng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance */}
            <div className="flex justify-between items-center bg-surface-bone dark:bg-white/5 p-3 rounded-xl border border-hairline dark:border-white/5">
              <span className="text-xs text-mute dark:text-white/60">
                {t('dashboard.balance', 'Số dư hiện có')}
              </span>
              <div className="flex items-center gap-1 text-sm font-bold text-amber-500 dark:text-yellow-400">
                <Award size={16} />
                <span>
                  {coins} {t('dashboard.coins', 'Xu')}
                </span>
              </div>
            </div>

            {shopFeedback && (
              <div className="text-center text-xs font-semibold py-1.5 px-3 rounded-xl bg-primary/20 text-primary dark:text-primary-light border border-primary/30 animate-pulse">
                {shopFeedback}
              </div>
            )}

            {/* Item List */}
            <div className="space-y-2.5">
              {/* Item 1: Double XP Potion */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-bone/60 dark:bg-white/5 hover:bg-surface-bone dark:hover:bg-white/10 transition-all border border-hairline dark:border-white/5">
                <div className="space-y-0.5 min-w-0 pr-3">
                  <h4 className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                    🧪 {t('dashboard.xp_potion', 'Bình Nhân Đôi XP')}{' '}
                    <span className="text-[10px] text-purple-600 dark:text-purple-300 font-normal">
                      (Double XP 1h)
                    </span>
                  </h4>
                  <p className="text-[11px] text-mute dark:text-white/60">
                    Sở hữu: {summary?.xpBoostCount ?? 0} bình
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleBuyItem('booster', 100)}
                    className="px-3 py-1.5 rounded-full bg-primary hover:bg-primary-deep text-white text-[11px] font-bold shadow-xs cursor-pointer active:scale-95"
                  >
                    100 Xu
                  </button>
                  {summary?.xpBoostCount > 0 && !xpBoostTimeLeft && (
                    <button
                      onClick={handleUseXpBoost}
                      className="px-2.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer"
                    >
                      Dùng
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: AI MENTOR SUGGESTIONS
      ───────────────────────────────────────────────────────────── */}
      {showAiMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-white/10 p-5 sm:p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-hairline dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-primary dark:text-hero-glow">
                <Sparkles size={18} />
                <h3 className="font-bold text-ink dark:text-white text-base">
                  {t('dashboard.ai_mentor_title', 'AI Mentor Gợi Ý')}
                </h3>
              </div>
              <button
                onClick={() => setShowAiMentor(false)}
                className="text-mute hover:text-ink dark:text-white/50 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-surface-bone/60 dark:bg-white/5 border border-hairline dark:border-white/5 space-y-1">
                <h4 className="text-xs font-bold text-primary dark:text-hero-glow">
                  Nhiệm vụ ôn tập hôm nay
                </h4>
                <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed">
                  Bạn có các thẻ đến hạn ôn tập. Hãy học ít nhất {dailyTarget} thẻ để duy trì chuỗi
                  học tập {streak} ngày.
                </p>
                <button
                  onClick={() => {
                    setShowAiMentor(false);
                    navigate('/study');
                  }}
                  className="mt-1 text-xs text-primary dark:text-hero-glow hover:underline font-bold block"
                >
                  Bắt đầu học ngay →
                </button>
              </div>

              <div className="p-3 rounded-xl bg-surface-bone/60 dark:bg-white/5 border border-hairline dark:border-white/5 space-y-1">
                <h4 className="text-xs font-bold text-primary dark:text-hero-glow">
                  Luyện viết chữ Hán
                </h4>
                <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed">
                  Tập viết từ vựng trên canvas giúp ghi nhớ mặt chữ và quy tắc bút thuận.
                </p>
                <button
                  onClick={() => {
                    setShowAiMentor(false);
                    navigate('/write');
                  }}
                  className="mt-1 text-xs text-primary dark:text-hero-glow hover:underline font-bold block"
                >
                  Vào bảng luyện viết →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: HSK ORBIT MAP MODAL
      ───────────────────────────────────────────────────────────── */}
      {showRoadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-white/10 p-5 sm:p-6 rounded-2xl max-w-xl w-full shadow-2xl space-y-4 animate-fade-in flex flex-col h-[460px]">
            <div className="flex items-center justify-between border-b border-hairline dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-primary dark:text-hero-glow">
                <LayoutGrid size={18} />
                <h3 className="font-bold text-ink dark:text-white text-base">
                  Lộ Trình Học Tập HSK Orbit
                </h3>
              </div>
              <button
                onClick={() => setShowRoadmap(false)}
                className="text-mute hover:text-ink dark:text-white/50 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Orbit Space Canvas */}
            <div className="flex-1 relative bg-surface-bone/50 dark:bg-black/50 rounded-xl border border-hairline dark:border-white/5 overflow-hidden flex items-center justify-center select-none">
              {/* Center Sun */}
              <div className="absolute h-12 w-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 shadow-md flex items-center justify-center font-black text-[10px] text-white">
                HSK
              </div>

              {/* Orbit Rings */}
              <div className="absolute border border-dashed border-primary/20 dark:border-white/10 rounded-full h-24 w-24 pointer-events-none" />
              <div className="absolute border border-dashed border-primary/20 dark:border-white/10 rounded-full h-40 w-40 pointer-events-none" />
              <div className="absolute border border-dashed border-primary/20 dark:border-white/10 rounded-full h-56 w-56 pointer-events-none" />
              <div className="absolute border border-dashed border-primary/20 dark:border-white/10 rounded-full h-72 w-72 pointer-events-none" />

              {/* Planet Nodes HSK 1 to 6 */}
              {[
                { lvl: 1, label: 'H1', x: -44, y: -44, color: 'bg-emerald-500' },
                { lvl: 2, label: 'H2', x: 60, y: -20, color: 'bg-teal-500' },
                { lvl: 3, label: 'H3', x: -75, y: 35, color: 'bg-blue-500' },
                { lvl: 4, label: 'H4', x: 80, y: 70, color: 'bg-indigo-500' },
                { lvl: 5, label: 'H5', x: -110, y: -65, color: 'bg-purple-500' },
                { lvl: 6, label: 'H6', x: 120, y: -50, color: 'bg-rose-500' },
              ].map((planet) => (
                <button
                  key={planet.lvl}
                  onClick={() => {
                    setShowRoadmap(false);
                    navigate('/study-hub');
                  }}
                  style={{
                    transform: `translate(${planet.x}px, ${planet.y}px)`,
                  }}
                  className={`absolute rounded-full h-8 w-8 ${planet.color} text-white text-[10px] font-bold shadow-md hover:scale-125 transition-transform flex items-center justify-center cursor-pointer border-2 border-white/20`}
                  title={`Cấp độ HSK ${planet.lvl}`}
                >
                  {planet.label}
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-mute">
              Nhấn vào các trạm hành tinh HSK để mở khu ôn tập chuyên biệt tương ứng.
            </p>
          </div>
        </div>
      )}

      {/* 5. Scholar Path Selection & Level Progress Modal */}
      <ScholarPathModal
        isOpen={isPathModalOpen}
        onClose={() => setIsPathModalOpen(false)}
        currentXp={xp}
        activePath={currentPath}
        onSelectPath={handleSelectPath}
      />
    </div>
  );
}
