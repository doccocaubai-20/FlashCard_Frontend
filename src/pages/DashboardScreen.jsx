import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSummary, fetchHeatmap } from '../features/stats/statsSlice';
import { fetchAllDecks } from '../features/deck/deckSlice';
import { statsApi } from '../services/statsApi';
import {
  Sparkles, Volume2, Star, PenTool,
  BookOpen, Gamepad2, Search, PlusCircle,
  ArrowRight, ChevronRight, Flame, GraduationCap,
  Trophy, Settings, Shield, ShoppingBag, LayoutGrid, HelpCircle,
  TrendingUp, Award, User, RefreshCw, X, ShoppingCart, MessageSquare, CheckCircle2,
  Loader2
} from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { dictionaryApi } from '../services/dictionaryApi';
import { speakChinese } from '../utils/tts';
import { useTheme } from '../context/ThemeContext';
import ZenGarden from '../components/stats/ZenGarden';



// ─────────────────────────────────────────────────────────────
// COMPONENT PHỤ CŨ (Classic Mode)
// ─────────────────────────────────────────────────────────────
function HeroWord() {
  const [wotd, setWotd] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('WOTD favorites:', err);
    }
  };

  useEffect(() => { loadFavorites(); }, []);

  const isFavorite = wotd ? favorites.some((f) => f.hanzi === wotd.s) : false;

  const handleToggleFavorite = async () => {
    if (!wotd || favLoading) return;
    setFavLoading(true);
    try {
      if (isFavorite) await favoriteWordsApi.deleteFavoriteByHanzi(wotd.s);
      else await favoriteWordsApi.addFavorite({ hanzi: wotd.s, pinyin: wotd.p || '', sv: wotd.sv || '', vi: wotd.vi || '' });
      await loadFavorites();
    } catch (err) { console.error(err); }
    finally { setFavLoading(false); }
  };

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const cachedWord = localStorage.getItem('wotd_word');
    const cachedDate = localStorage.getItem('wotd_date');
    if (cachedDate === todayStr && cachedWord) {
      try { setWotd(JSON.parse(cachedWord)); setLoading(false); return; } catch (err) { console.error('Failed to parse cached wotd:', err); }
    }
    (async () => {
      setLoading(true);
      try {
        const res = await dictionaryApi.getWordOfTheDay();
        if (res.data) {
          localStorage.setItem('wotd_word', JSON.stringify(res.data));
          localStorage.setItem('wotd_date', todayStr);
          setWotd(res.data);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSpeak = () => {
    if (!wotd) return;
    speakChinese(wotd.s);
  };

  if (loading || !wotd) {
    return (
      <div className="flex items-center justify-center py-20 animate-pulse">
        <div className="text-center space-y-3">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-surface-bone dark:bg-white/5" />
          <div className="h-3 w-32 mx-auto bg-surface-bone dark:bg-white/5 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-card via-surface-card to-primary-light/30 dark:from-surface-card dark:via-surface-card dark:to-primary/10 shadow-sm border border-hairline dark:border-white/5 p-6 sm:p-8">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <span
              className="text-7xl sm:text-8xl font-display font-bold text-ink dark:text-on-dark leading-none select-none"
              style={{ fontFamily: "'Noto Serif SC', 'Lora', serif" }}
            >
              {wotd.s}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer"
              title="Nghe phát âm"
            >
              <Volume2 size={14} />
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
                  : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-amber-500'
              }`}
              title={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            >
              <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <Link
              to={`/write?word=${encodeURIComponent(wotd.s)}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer"
              title="Luyện viết"
            >
              <PenTool size={14} />
            </Link>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-mute uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={11} className="text-primary" />
              Từ vựng hôm nay
            </span>
            {wotd.hsk && (
              <span className="text-[9px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                HSK {wotd.hsk}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-lg font-bold text-primary font-mono">{wotd.p}</span>
              {wotd.sv && (
                <span className="text-xs font-semibold text-charcoal dark:text-ash uppercase tracking-wider">{wotd.sv}</span>
              )}
            </div>
            <p className="text-sm font-medium text-body dark:text-on-dark-mute leading-relaxed">
              {wotd.vi}
            </p>
          </div>

          <Link
            to={`/write?word=${encodeURIComponent(wotd.s)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-deep transition-colors mt-1 group"
          >
            <PenTool size={12} />
            Tập viết chữ này
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MiniWeekStrip({ data = [], streak = 0 }) {
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
    if (count >= 2) return 'bg-primary/50 text-white';
    if (count >= 1) return 'bg-primary/20 text-primary';
    return 'bg-[#edf2f7] dark:bg-white/5 text-mute';
  };

  return (
    <div className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/60 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-ink dark:text-on-dark flex items-center gap-1.5">
          <Flame size={13} className="text-amber-500" />
          7 ngày gần nhất
        </span>
        <Link to="/stats" className="text-[10px] font-bold text-mute hover:text-primary transition-colors">
          Xem chi tiết →
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekData.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-mute uppercase">{d.day}</span>
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${getCellIntensity(d.count)} ${
                d.isToday ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-surface-card dark:ring-offset-surface-dark' : ''
              }`}
              title={`${d.count} lần học`}
            >
              {d.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const getQuestIcon = (type) => {
  switch (type) {
    case 'STUDY_CARDS': return <BookOpen size={14} className="text-blue-400" />;
    case 'AI_CHAT': return <MessageSquare size={14} className="text-green-400" />;
    case 'DICTIONARY_LOOKUP': return <Search size={14} className="text-teal-400" />;
    case 'FAVORITE_WORD': return <Star size={14} className="text-yellow-400" />;
    case 'PLAY_GAME': return <Gamepad2 size={14} className="text-purple-400" />;
    case 'WRITE_PRACTICE': return <PenTool size={14} className="text-rose-400" />;
    case 'SPEAK_PRACTICE': return <Volume2 size={14} className="text-amber-400" />;
    default: return <Sparkles size={14} className="text-primary" />;
  }
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Core Global States
  const user = useSelector((state) => state.auth.user);
  const summary = useSelector((state) => state.stats.summary);
  const heatmapData = useSelector((state) => state.stats.heatmapData);
  const decks = useSelector((state) => state.deck.decks);

  const { viewMode, toggleViewMode } = useTheme();

  // UI Interactive States (Gamified Mode)
  const [showShop, setShowShop] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showAiMentor, setShowAiMentor] = useState(false);
  const [shopFeedback, setShopFeedback] = useState('');
  const [xpBoostTimeLeft, setXpBoostTimeLeft] = useState('');

  // Daily Quiz interactive state
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [quizStatus, setQuizStatus] = useState('idle'); // idle, correct, incorrect
  const [quizFeedback, setQuizFeedback] = useState('');
  const [hasCompletedTodayQuiz, setHasCompletedTodayQuiz] = useState(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return localStorage.getItem('chongzi_daily_quiz_completed') === todayStr;
  });

  // Dynamic Daily HSK Quiz state
  const [dailyQuiz, setDailyQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState('quests'); // 'quests' | 'quiz'

  const [quests, setQuests] = useState([]);
  const [questsLoading, setQuestsLoading] = useState(true);

  const loadDailyQuiz = async () => {
    try {
      setQuizLoading(true);
      const res = await statsApi.getDailyQuiz();
      setDailyQuiz(res.data);
    } catch (err) {
      console.error('Failed to load daily quiz:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  const loadQuests = async () => {
    try {
      setQuestsLoading(true);
      const res = await statsApi.getQuests();
      setQuests(res.data || []);
    } catch (err) {
      console.error('Failed to load quests:', err);
    } finally {
      setQuestsLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchHeatmap());
    dispatch(fetchAllDecks());
    loadQuests();
    loadDailyQuiz();
  }, [dispatch]);

  const streak = summary?.streak ?? 0;
  const xp = summary?.xp ?? 0;
  const coins = summary?.coins ?? 0;
  const dailyTarget = summary?.dailyTarget ?? 20;
  const studiedCards = summary?.completedCards ?? 0;
  const totalCards = decks?.reduce((sum, d) => sum + (d.cardCount || 0), 0) || 0;

  const firstName = user?.name?.split(' ').pop() || 'học viên';

  // Level & Title Calculation based on XP
  const userLevel = Math.floor(xp / 1000) + 1;
  const xpProgress = xp % 1000; // xp progress in current level (0 to 1000)
  
  const getScholarTitle = (lvl) => {
    if (lvl >= 50) return 'Trạng Nguyên';
    if (lvl >= 35) return 'Thám Hoa';
    if (lvl >= 25) return 'Tiến Sĩ';
    if (lvl >= 15) return 'Cử Nhân';
    if (lvl >= 6) return 'Tú Tài';
    return 'Đồng Sinh';
  };
  const scholarTitle = getScholarTitle(userLevel);



  // Submit Daily Quiz answer
  const handleAnswerQuiz = async () => {
    if (!dailyQuiz || hasCompletedTodayQuiz || selectedQuizOption === null) return;
    const opt = dailyQuiz.options[selectedQuizOption];
    if (opt.isCorrect) {
      setQuizStatus('correct');
      setQuizFeedback('Chính xác! Bạn nhận được +20 XP và +10 ChongZi Coins!');
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('chongzi_daily_quiz_completed', todayStr);
      setHasCompletedTodayQuiz(true);
      try {
        // Update database score
        await statsApi.addXpCoins(20, 10);
        dispatch(fetchSummary());
      } catch (err) {
        console.error('Failed to add quiz reward:', err);
      }
    } else {
      setQuizStatus('incorrect');
      setQuizFeedback('Đáp án chưa chính xác, hãy thử lại nhé!');
    }
  };

  // Buy item from shop
  const handleBuyItem = async (itemName, price) => {
    if (coins < price) {
      setShopFeedback('Số lượng xu ChongZi tích lũy không đủ!');
      setTimeout(() => setShopFeedback(''), 3000);
      return;
    }

    try {
      await statsApi.buyItem(price, itemName);
      setShopFeedback('Mua vật phẩm thành công!');
      setTimeout(() => setShopFeedback(''), 3000);
      dispatch(fetchSummary()); // Refresh stats & inventory in DB
    } catch (err) {
      console.error(err);
      setShopFeedback(err.response?.data?.message || 'Lỗi máy chủ khi thanh toán.');
      setTimeout(() => setShopFeedback(''), 3000);
    }
  };

  // Use XP Boost potion
  const handleUseXpBoost = async () => {
    try {
      await statsApi.useXpBoost();
      setShopFeedback('Đã kích hoạt Thần Dược Nhân Đôi XP! 🧪');
      setTimeout(() => setShopFeedback(''), 3000);
      dispatch(fetchSummary()); // Refresh stats & countdown
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể sử dụng bình nhân đôi XP.');
    }
  };

  // Real-time Countdown Timer for XP Boost
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
        dispatch(fetchSummary()); // Refresh stats after boost expires
      } else {
        const minutes = Math.floor(diff / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        setXpBoostTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [summary?.xpBoostUntil, dispatch]);

  // Helper coordinate calculators for SVG Radar Chart (Pentagon)
  const calculateRadarPath = (writing, speaking, reading, listening, vocab) => {
    const r = 60; // Max radius
    const cx = 90; // Center X
    const cy = 90; // Center Y
    
    // Angles for 5 vertices in radians
    const angles = [
      -Math.PI / 2,                // Viết (Trực diện trên)
      -Math.PI / 2 + (2 * Math.PI / 5),     // Nói (Phải trên)
      -Math.PI / 2 + (4 * Math.PI / 5),     // Đọc (Phải dưới)
      -Math.PI / 2 + (6 * Math.PI / 5),     // Nghe (Trái dưới)
      -Math.PI / 2 + (8 * Math.PI / 5),     // Từ vựng (Trái trên)
    ];

    const vals = [writing, speaking, reading, listening, vocab];
    const points = angles.map((ang, i) => {
      const dist = r * (vals[i] / 100);
      const x = cx + dist * Math.cos(ang);
      const y = cy + dist * Math.sin(ang);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')} Z`;
  };

  // Build Radar SVG grid lines
  const radarGridPaths = [20, 40, 60, 80, 100].map((percent) => {
    const r = 60 * (percent / 100);
    const cx = 90;
    const cy = 90;
    const angles = [
      -Math.PI / 2,
      -Math.PI / 2 + (2 * Math.PI / 5),
      -Math.PI / 2 + (4 * Math.PI / 5),
      -Math.PI / 2 + (6 * Math.PI / 5),
      -Math.PI / 2 + (8 * Math.PI / 5),
    ];
    const points = angles.map((ang) => {
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')} Z`;
  });

  // Classic quick actions
  const quickActions = [
    {
      label: 'Ôn thẻ',
      sub: 'Flashcard SRS',
      icon: GraduationCap,
      path: '/study',
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Chơi game',
      sub: 'Đấu trường HSK',
      icon: Gamepad2,
      path: '/game-arcade',
      gradient: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
    {
      label: 'Tra từ điển',
      sub: 'Hán Việt • Pinyin',
      icon: Search,
      path: '/reference-hub',
      gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Tạo thẻ mới',
      sub: 'Thủ công • AI',
      icon: PlusCircle,
      path: '/flashcards/new',
      gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // RENDER CLASSIC MODE
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'classic') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-8 select-none">
        {/* Toggle Button + Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink dark:text-on-dark tracking-tight">
              Xin chào, {firstName} 👋
            </h1>
            <p className="text-xs text-mute mt-0.5">
              Tiếp tục hành trình chinh phục tiếng Trung của bạn.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer shadow-xs"
            >
              <LayoutGrid size={13} />
              <span>Không gian Game</span>
            </button>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-semibold bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full">
                <span className="text-base">🔥</span>
                <span><span className="font-bold">{streak}</span> ngày liên tục</span>
              </div>
            )}
          </div>
        </div>

        {/* Hero: Word of the Day */}
        <HeroWord />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`group relative flex flex-col items-start gap-3 p-4 rounded-xl bg-gradient-to-br ${action.gradient} border border-hairline dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.iconBg}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink dark:text-on-dark block">{action.label}</span>
                  <span className="text-[10px] text-mute dark:text-ash">{action.sub}</span>
                </div>
                <ChevronRight
                  size={14}
                  className="absolute top-4 right-4 text-mute/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                />
              </button>
            );
          })}
        </div>

        {/* Bottom Row */}
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <MiniWeekStrip data={heatmapData} streak={streak} />
            <div className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/60 shadow-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink dark:text-on-dark">Hôm nay</span>
                <span className="font-bold text-primary">{studiedCards} thẻ đã ôn</span>
              </div>
              <div className="h-2 w-full bg-[#edf2f7] dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-hero-glow rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (studiedCards / dailyTarget) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-mute">
                <span>Mục tiêu: {dailyTarget} thẻ/ngày</span>
                <span>{totalCards} thẻ tổng cộng</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/60 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ink dark:text-on-dark flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" />
                Bộ bài của bạn
              </h2>
              <Link to="/decks" className="text-[10px] font-bold text-mute hover:text-primary transition-colors">
                Tất cả →
              </Link>
            </div>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {decks?.length > 0 ? (
                decks.slice(0, 6).map((deck) => (
                  <Link
                    key={deck.id}
                    to={`/decks/${deck.id}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-bone/60 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary text-xs font-bold">
                        {(deck.title || deck.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-medium text-ink dark:text-on-dark truncate group-hover:text-primary transition-colors">
                          {deck.title || deck.name || 'Chưa đặt tên'}
                        </h3>
                        <p className="text-[10px] text-mute truncate">{deck.description || 'Không có mô tả'}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-mute bg-surface-bone dark:bg-white/5 px-2 py-0.5 rounded-md">
                      {deck.cardCount ?? 0}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-mute">
                  <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
                  Chưa có bộ bài nào.
                  <Link to="/flashcards/new" className="block mt-1 text-primary font-bold">Tạo bộ bài đầu tiên →</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER GAMIFIED MODE (High-Fidelity Workspace)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-[calc(100vh-80px)] w-full rounded-3xl overflow-hidden p-6 text-white border border-hairline dark:border-white/5 select-none bg-cover bg-center flex flex-col justify-between"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(16, 16, 24, 0.80), rgba(10, 10, 16, 0.92)), url('https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1920&auto=format&fit=crop')"
      }}
    >
      
      {/* 1. Header Bar: Greeting & Stats capsule */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            {scholarTitle} (Cấp {userLevel})
          </span>
          <h1 className="text-xl font-bold font-sans tracking-tight text-white mt-1">
            Chào buổi chiều, {firstName}!
          </h1>
        </div>

        {/* Floating Stats Capsule */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full shadow-md w-fit">
          {xpBoostTimeLeft && (
            <>
              <div className="flex items-center gap-1 text-xs font-black text-purple-400 animate-pulse" title="Thần dược nhân đôi XP đang hiệu lực!">
                <span>⚡ X2 XP: {xpBoostTimeLeft}</span>
              </div>
              <div className="h-3 w-px bg-white/15" />
            </>
          )}
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-500" title="Chuỗi ôn tập liên tục">
            <Flame size={14} className="fill-current" />
            <span>{streak} ngày</span>
          </div>
          <div className="h-3 w-px bg-white/15" />
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-400" title="Điểm kinh nghiệm tích lũy">
            <TrendingUp size={14} />
            <span>{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-3 w-px bg-white/15" />
          <div className="flex items-center gap-1 text-xs font-semibold text-yellow-400" title="ChongZi Coins">
            <Award size={14} />
            <span>{coins} Xu</span>
          </div>
          <div className="h-3 w-px bg-white/15" />
          
          {/* Change View Mode Button */}
          <button
            onClick={toggleViewMode}
            className="text-[10px] font-bold text-white/70 hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
            title="Quay lại giao diện truyền thống"
          >
            <RefreshCw size={11} />
            <span>Giao diện cũ</span>
          </button>
        </div>
      </div>

      {/* 2. Main floating panels (Left, Center, Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-6 items-stretch flex-1">
        
        {/* PANEL TRÁI: Skill Radar (3 cols) */}
        <div className="lg:col-span-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />
          <div>
            <span className="text-[10px] font-sans font-bold text-white/50 uppercase tracking-widest block mb-1">
              HỒ SƠ NĂNG LỰC
            </span>
            <h2 className="text-sm font-bold text-white">Chỉ số ngũ giác</h2>
          </div>

          {/* SVG Radar Chart */}
          <div className="flex items-center justify-center my-3">
            <svg width="150" height="150" viewBox="0 0 180 180">
              {/* Grid backgrounds */}
              {radarGridPaths.map((path, idx) => (
                <path
                  key={idx}
                  d={path}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              ))}
              {/* Pentagon axis lines */}
              <line x1="90" y1="90" x2="90" y2="30" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
              <line x1="90" y1="90" x2="147" y2="71" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
              <line x1="90" y1="90" x2="125" y2="139" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
              <line x1="90" y1="90" x2="55" y2="139" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
              <line x1="90" y1="90" x2="33" y2="71" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />

              {/* Data area */}
              <path
                d={calculateRadarPath(
                  Math.min(100, 30 + (studiedCards / 5) * 10), // Viết
                  Math.min(100, 40 + streak * 5),             // Nói
                  Math.min(100, 20 + userLevel * 6),          // Đọc
                  Math.min(100, 35 + studiedCards * 2),       // Nghe
                  Math.min(100, Math.min(100, (totalCards / 100) * 10)) // Từ vựng
                )}
                fill="rgba(234, 40, 4, 0.28)"
                stroke="#ea2804"
                strokeWidth="1.5"
              />

              {/* Axis labels */}
              <text x="90" y="22" textAnchor="middle" fill="rgba(255, 255, 255, 0.6)" fontSize="9" fontWeight="bold">VIẾT</text>
              <text x="154" y="73" textAnchor="start" fill="rgba(255, 255, 255, 0.6)" fontSize="9" fontWeight="bold">NÓI</text>
              <text x="131" y="150" textAnchor="start" fill="rgba(255, 255, 255, 0.6)" fontSize="9" fontWeight="bold">ĐỌC</text>
              <text x="49" y="150" textAnchor="end" fill="rgba(255, 255, 255, 0.6)" fontSize="9" fontWeight="bold">NGHE</text>
              <text x="26" y="73" textAnchor="end" fill="rgba(255, 255, 255, 0.6)" fontSize="9" fontWeight="bold">TỪ VỰNG</text>
            </svg>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white/70">
              <span>Đại học sĩ: {xpProgress}/1,000 XP</span>
              <span>Cấp {userLevel + 1}</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${(xpProgress / 1000) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* PANEL GIỮA: Zen Vocabulary Garden (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-stretch">
          <ZenGarden summary={summary} onHarvestSuccess={() => dispatch(fetchSummary())} />
        </div>

        {/* PANEL PHẢI: Tabbed Quests & Quiz + Inventory (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Card 1: Tabbed Quests & Quiz */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden flex-1">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
            
            <div className="flex flex-col h-full justify-between">
            {/* Tab Header Selectors */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-3 shrink-0">
              <button
                onClick={() => setRightPanelTab('quests')}
                className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                  rightPanelTab === 'quests'
                    ? 'bg-primary text-slate-950 font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Nhiệm vụ
              </button>
              <button
                onClick={() => setRightPanelTab('quiz')}
                className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                  rightPanelTab === 'quiz'
                    ? 'bg-primary text-slate-950 font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Thử thách
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 flex flex-col justify-between min-h-0">
              {rightPanelTab === 'quests' ? (
                // TAB 1: QUESTS & WEEK PROGRESS
                <div className="flex flex-col justify-between h-full flex-1">
                  <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                    {questsLoading ? (
                      <div className="py-8 flex justify-center items-center">
                        <Loader2 size={18} className="animate-spin text-white/40" />
                      </div>
                    ) : (
                      quests.map((q) => {
                        const percent = Math.min(100, Math.round((q.progress / q.target) * 100));
                        return (
                          <div
                            key={q.id}
                            className={`p-2 rounded-xl border transition-all ${
                              q.completed
                                ? 'bg-green-500/10 border-green-500/20 text-white/80'
                                : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                                <div className={`p-1 rounded-md shrink-0 ${q.completed ? 'bg-green-500/15' : 'bg-white/5'}`}>
                                  {getQuestIcon(q.questType)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className={`text-[10px] font-bold truncate ${q.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                                    {q.title}
                                  </h4>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[9px] font-mono font-bold block">
                                  {q.progress}/{q.target}
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1.5 border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  q.completed ? 'bg-green-500' : 'bg-sky-400'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Weekly Progress bar */}
                  <div className="border-t border-white/10 pt-3 mt-3 flex items-center justify-between gap-3 shrink-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg width="60" height="60" className="transform -rotate-90">
                        <circle cx="30" cy="30" r="24" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="transparent" />
                        <circle
                          cx="30"
                          cy="30"
                          r="24"
                          stroke="#ea2804"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - Math.min(1, studiedCards / dailyTarget))}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black tracking-tighter text-white">
                          {Math.round(Math.min(100, (studiedCards / dailyTarget) * 100))}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-sans font-bold text-white/50 uppercase tracking-widest block">MỤC TIÊU TUẦN</span>
                      <span className="text-[11px] text-white font-bold block mt-0.5">Đã ôn {studiedCards}/{dailyTarget} thẻ</span>
                    </div>
                  </div>
                </div>
              ) : (
                // TAB 2: DYNAMIC DAILY HSK QUIZ
                <div className="flex flex-col justify-between h-full flex-1">
                  {quizLoading ? (
                    <div className="py-12 flex flex-col justify-center items-center gap-2">
                      <Loader2 size={20} className="animate-spin text-white/40" />
                      <span className="text-[10px] text-white/40">Đang chuẩn bị câu hỏi...</span>
                    </div>
                  ) : dailyQuiz ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-sans font-bold text-white/40 uppercase tracking-widest">TRẮC NGHIỆM ĐỘNG</span>
                          <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">+20 XP</span>
                        </div>
                        <h3 className="text-[11px] font-bold text-white leading-relaxed mb-3">
                          {dailyQuiz.question}
                        </h3>
                        
                        <div className="space-y-1.5">
                          {dailyQuiz.options.map((opt, index) => (
                            <button
                              key={index}
                              onClick={() => !hasCompletedTodayQuiz && setSelectedQuizOption(index)}
                              disabled={hasCompletedTodayQuiz}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                                selectedQuizOption === index
                                  ? 'bg-primary/25 border-primary text-white'
                                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/80'
                              } ${hasCompletedTodayQuiz ? 'cursor-not-allowed opacity-80' : ''}`}
                            >
                              <span className="truncate pr-2">{opt.text}</span>
                              {hasCompletedTodayQuiz && opt.isCorrect && (
                                <span className="text-[8px] font-black uppercase text-green-400 bg-green-500/10 px-1.5 py-0.2 rounded border border-green-500/20">ĐÚNG</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-2.5 mt-3 flex items-center justify-between gap-2 shrink-0">
                        <span className="text-[9px] text-white/40 leading-snug truncate max-w-[120px]">
                          {quizStatus === 'idle' ? 'Trả lời để nhận thưởng' : quizFeedback}
                        </span>
                        {!hasCompletedTodayQuiz ? (
                          <button
                            onClick={handleAnswerQuiz}
                            disabled={selectedQuizOption === null}
                            className={`px-3.5 py-1.5 rounded-full text-[10px] font-black transition-all shadow-xs cursor-pointer ${
                              selectedQuizOption !== null
                                ? 'bg-primary hover:bg-primary-deep text-slate-950 font-bold'
                                : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            Gửi đi
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-green-400">✓ Đã hoàn thành</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-[10px] text-white/40">
                      Không có câu hỏi hôm nay.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Mentor glowing holographic orb */}
            <div className="border-t border-white/10 pt-3 mt-3 flex items-center gap-3 shrink-0">
              <div className="relative shrink-0">
                <div
                  onClick={() => setShowAiMentor(true)}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-indigo-300 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"
                  title="Mở gợi ý từ AI Mentor"
                >
                  <Sparkles size={14} className="text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="text-[10px] font-black text-white leading-none">AI Mentor gợi ý</h4>
                <span className="text-[8px] text-white/40 block mt-1">Khuyên dùng học tập hôm nay.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Inventory */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-primary/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-primary" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Túi Đồ Vật Phẩm</h3>
            </div>
            <button
              onClick={() => setShowShop(true)}
              className="text-[9px] font-black uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full hover:bg-primary hover:text-slate-950 transition-all cursor-pointer"
            >
              Cửa hàng
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Item 1: Streak Freeze */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                  <Flame size={14} className="fill-current" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-bold text-white truncate">Bảo Mệnh Đan</h4>
                  <p className="text-[8px] text-white/50 truncate">Tự động giữ chuỗi khi nghỉ học</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono font-bold text-white bg-white/5 border border-white/5 px-2 py-1 rounded-md">
                  x{summary?.streakFreezeCount ?? 0}
                </span>
              </div>
            </div>

            {/* Item 2: XP Boost */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                  <Sparkles size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-bold text-white truncate">Thần Dược Nhân Đôi</h4>
                  <p className="text-[8px] text-white/50 truncate">Nhân đôi XP học tập trong 1 giờ</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono font-bold text-white bg-white/5 border border-white/5 px-2 py-1 rounded-md mr-1">
                  x{summary?.xpBoostCount ?? 0}
                </span>
                {xpBoostTimeLeft ? (
                  <button
                    disabled
                    className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-bold animate-pulse cursor-not-allowed shrink-0"
                  >
                    {xpBoostTimeLeft}
                  </button>
                ) : (
                  <button
                    onClick={handleUseXpBoost}
                    disabled={!(summary?.xpBoostCount > 0)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all shrink-0 ${
                      summary?.xpBoostCount > 0
                        ? 'bg-primary hover:bg-primary-deep text-slate-950 font-black cursor-pointer'
                        : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    Kích hoạt
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* 3. Bottom macOS-style Interactive Dock */}
      <div className="flex justify-center w-full mt-4 pb-2">
        <div className="bg-black/30 border border-white/10 backdrop-blur-md px-6 py-2.5 rounded-full flex gap-6 items-center shadow-2xl relative">
          
          <button
            onClick={() => navigate('/flashcards/new')}
            className="text-white/70 hover:text-primary transition-all hover:scale-125 duration-200 cursor-pointer flex flex-col items-center gap-0.5"
            title="Thêm thẻ mới"
          >
            <PlusCircle size={18} />
            <span className="text-[8px] font-bold uppercase tracking-wider block scale-75 opacity-0 hover:opacity-100 transition-opacity">Thêm</span>
          </button>
          
          <button
            onClick={() => navigate('/study-hub')}
            className="text-white/70 hover:text-primary transition-all hover:scale-125 duration-200 cursor-pointer flex flex-col items-center gap-0.5"
            title="Khu học tập HSK"
          >
            <GraduationCap size={18} />
            <span className="text-[8px] font-bold uppercase tracking-wider block scale-75 opacity-0 hover:opacity-100 transition-opacity">Học</span>
          </button>

          <button
            onClick={() => navigate('/game-arcade')}
            className="text-white/70 hover:text-primary transition-all hover:scale-125 duration-200 cursor-pointer flex flex-col items-center gap-0.5"
            title="Đấu trường game"
          >
            <Gamepad2 size={18} />
            <span className="text-[8px] font-bold uppercase tracking-wider block scale-75 opacity-0 hover:opacity-100 transition-opacity">Chơi</span>
          </button>

          {/* Center Space: Orbit Skill Tree Button */}
          <button
            onClick={() => setShowRoadmap(true)}
            className="h-9 w-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-deep shadow-md hover:scale-115 transition-all cursor-pointer"
            title="Xem lộ trình vũ trụ của tôi"
          >
            <LayoutGrid size={15} />
          </button>

          <button
            onClick={() => navigate('/dictionary')}
            className="text-white/70 hover:text-primary transition-all hover:scale-125 duration-200 cursor-pointer flex flex-col items-center gap-0.5"
            title="Tra cứu từ điển"
          >
            <Search size={18} />
            <span className="text-[8px] font-bold uppercase tracking-wider block scale-75 opacity-0 hover:opacity-100 transition-opacity">Tra từ</span>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="text-white/70 hover:text-primary transition-all hover:scale-125 duration-200 cursor-pointer flex flex-col items-center gap-0.5"
            title="Bảng xếp hạng"
          >
            <Trophy size={18} />
            <span className="text-[8px] font-bold uppercase tracking-wider block scale-75 opacity-0 hover:opacity-100 transition-opacity">Bảng</span>
          </button>

          <button
            onClick={() => setShowShop(true)}
            className="text-white/70 hover:text-primary transition-all hover:scale-125 duration-200 cursor-pointer flex flex-col items-center gap-0.5"
            title="Cửa hàng ChongZi"
          >
            <ShoppingBag size={18} />
            <span className="text-[8px] font-bold uppercase tracking-wider block scale-75 opacity-0 hover:opacity-100 transition-opacity">Cửa hàng</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
      MODAL 1: CỬA HÀNG CHONGZI (Shop Modal)
      ───────────────────────────────────────────────────────────── */}
      {showShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-dark border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-yellow-400">
                <ShoppingCart size={20} />
                <h3 className="font-bold text-white text-base">Cửa hàng ChongZi</h3>
              </div>
              <button
                onClick={() => { setShowShop(false); setShopFeedback(''); }}
                className="text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance */}
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-xs text-white/60">Số dư hiện tại:</span>
              <div className="flex items-center gap-1 text-sm font-bold text-yellow-400">
                <Award size={16} />
                <span>{coins} Xu</span>
              </div>
            </div>

            {shopFeedback && (
              <div className="text-center text-xs font-semibold py-1 px-3 rounded-lg bg-primary/20 text-primary border border-primary/30 animate-pulse">
                {shopFeedback}
              </div>
            )}

            {/* Item List */}
            <div className="space-y-3">
              {/* Item 1: Streak Freeze */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    💊 Bảo Mệnh Đan <span className="text-[9px] text-white/50 normal-case font-normal">(Streak Freeze)</span>
                  </h4>
                  <p className="text-[10px] text-white/60 pr-4">Đóng băng chuỗi ngày học nếu bạn bận đột xuất. Hiện có: {summary?.streakFreezeCount ?? 0}</p>
                </div>
                <button
                  onClick={() => handleBuyItem('freeze', 50)}
                  className="px-3 py-1.5 rounded-full bg-primary hover:bg-primary-deep text-slate-950 text-[10px] font-bold shadow-xs cursor-pointer shrink-0"
                >
                  50 Xu
                </button>
              </div>

              {/* Item 2: Double XP Potion */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    🧪 Thần Dược Nhân Đôi <span className="text-[9px] text-white/50 normal-case font-normal">(Double XP)</span>
                  </h4>
                  <p className="text-[10px] text-white/60 pr-4">Nhân đôi điểm kinh nghiệm trong 1 giờ để leo rank. Hiện có: {summary?.xpBoostCount ?? 0}</p>
                </div>
                <button
                  onClick={() => handleBuyItem('booster', 100)}
                  className="px-3 py-1.5 rounded-full bg-primary hover:bg-primary-deep text-slate-950 text-[10px] font-bold shadow-xs cursor-pointer shrink-0"
                >
                  100 Xu
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <p className="text-[9px] text-white/40">Ghi chú: Lượng Xu được tích lũy khi bạn học thẻ SRS và chơi game.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
      MODAL 2: AI MENTOR SUGGESTIONS (AI Mentor Drawer)
      ───────────────────────────────────────────────────────────── */}
      {showAiMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-dark border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-1.5 text-blue-400">
                <Sparkles size={18} />
                <h3 className="font-bold text-white text-base">Khuyên dùng từ AI Mentor</h3>
              </div>
              <button
                onClick={() => setShowAiMentor(false)}
                className="text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Recommendations List */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <h4 className="text-xs font-bold text-blue-400">📝 Nhiệm vụ ôn tập</h4>
                <p className="text-[10px] text-white/80 leading-relaxed">
                  Bạn có các thẻ đến hạn hôm nay. Hãy học ít nhất {dailyTarget} thẻ bài để giữ vững chuỗi học tập 7 ngày.
                </p>
                <button
                  onClick={() => { setShowAiMentor(false); navigate('/study'); }}
                  className="mt-2 text-[10px] text-primary hover:text-white font-bold block"
                >
                  Luyện ngay →
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <h4 className="text-xs font-bold text-blue-400">🎙️ Kỹ năng giao tiếp</h4>
                <p className="text-[10px] text-white/80 leading-relaxed">
                  Khẩu lực (nói) của bạn đang thấp nhất trong biểu đồ radar. Bạn nên ghé qua **Speaking Sandbox** để luyện phát âm tự do.
                </p>
                <button
                  onClick={() => { setShowAiMentor(false); navigate('/speaking-sandbox'); }}
                  className="mt-2 text-[10px] text-primary hover:text-white font-bold block"
                >
                  Luyện ngay →
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <h4 className="text-xs font-bold text-blue-400">🛍️ Tích trữ vật phẩm</h4>
                <p className="text-[10px] text-white/80 leading-relaxed">
                  Ví tiền đang có {coins} Xu. Bạn nên mua sẵn **Bảo Mệnh Đan** trong Cửa hàng để đề phòng các ngày bận rộn đứt streak.
                </p>
                <button
                  onClick={() => { setShowAiMentor(false); setShowShop(true); }}
                  className="mt-2 text-[10px] text-primary hover:text-white font-bold block"
                >
                  Mở Cửa hàng →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
      MODAL 3: HỆ MẶT TRỜI LỘ TRÌNH HỌC TẬP (Roadmap Space Tree)
      ───────────────────────────────────────────────────────────── */}
      {showRoadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-surface-dark/95 border border-white/10 p-6 rounded-2xl max-w-2xl w-full shadow-2xl space-y-5 flex flex-col h-[500px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-primary">
                <LayoutGrid size={18} />
                <h3 className="font-bold text-white text-base">Lộ trình Vũ trụ của tôi (HSK Orbit Map)</h3>
              </div>
              <button
                onClick={() => setShowRoadmap(false)}
                className="text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Orbit Map Space */}
            <div className="flex-1 relative bg-black/45 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
              {/* Star Background overlay */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-transparent to-transparent pointer-events-none" />

              {/* Sun (Core) */}
              <div className="absolute h-12 w-12 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center font-bold text-[10px] text-white select-none">
                HSK Core
              </div>

              {/* Orbits */}
              <div className="absolute border border-dashed border-white/10 rounded-full h-24 w-24 pointer-events-none" />
              <div className="absolute border border-dashed border-white/10 rounded-full h-40 w-40 pointer-events-none" />
              <div className="absolute border border-dashed border-white/10 rounded-full h-56 w-56 pointer-events-none" />
              <div className="absolute border border-dashed border-white/10 rounded-full h-72 w-72 pointer-events-none" />

              {/* Planet Nodes */}
              {/* HSK 1 */}
              <button
                onClick={() => { setShowRoadmap(false); navigate('/study-hub'); }}
                className="absolute transform -translate-y-12 rounded-full h-7 w-7 bg-blue-500 border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-md hover:scale-115 transition-transform cursor-pointer"
                title="HSK 1 - Sơ cấp"
              >
                H1
              </button>

              {/* HSK 2 */}
              <button
                onClick={() => { setShowRoadmap(false); navigate('/study-hub'); }}
                className="absolute transform translate-x-16 translate-y-6 rounded-full h-8 w-8 bg-green-500 border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-md hover:scale-115 transition-transform cursor-pointer"
                title="HSK 2 - Cơ bản"
              >
                H2
              </button>

              {/* HSK 3 */}
              <button
                onClick={() => { setShowRoadmap(false); navigate('/study-hub'); }}
                className="absolute transform -translate-x-20 -translate-y-12 rounded-full h-9 w-9 bg-purple-500 border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-md hover:scale-115 transition-transform cursor-pointer"
                title="HSK 3 - Trung cấp"
              >
                H3
              </button>

              {/* HSK 4 */}
              <button
                onClick={() => { setShowRoadmap(false); navigate('/study-hub'); }}
                className="absolute transform translate-y-20 -translate-x-12 rounded-full h-9 w-9 bg-orange-500 border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-md hover:scale-115 transition-transform cursor-pointer"
                title="HSK 4 - Phổ thông"
              >
                H4
              </button>

              {/* HSK 5 */}
              <button
                onClick={() => { setShowRoadmap(false); navigate('/study-hub'); }}
                className="absolute transform translate-x-28 -translate-y-16 rounded-full h-10 w-10 bg-indigo-500 border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-md hover:scale-115 transition-transform cursor-pointer"
                title="HSK 5 - Cao cấp"
              >
                H5
              </button>

              {/* HSK 6 */}
              <button
                onClick={() => { setShowRoadmap(false); navigate('/study-hub'); }}
                className="absolute transform -translate-x-32 translate-y-16 rounded-full h-11 w-11 bg-pink-500 border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-md hover:scale-115 transition-transform cursor-pointer"
                title="HSK 6 - Tự do"
              >
                H6
              </button>
            </div>

            <div className="text-center text-xs text-white/50">
              Nhấp chọn vào hành tinh đại diện để chuyển đến bộ thẻ ôn tập tương ứng.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
