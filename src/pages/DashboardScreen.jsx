import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSummary, fetchHeatmap } from '../features/stats/statsSlice';
import { fetchAllDecks } from '../features/deck/deckSlice';
import {
  Sparkles, Volume2, Star, PenTool,
  BookOpen, Gamepad2, Search, PlusCircle,
  ArrowRight, ChevronRight, Flame, GraduationCap,
} from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { dictionaryApi } from '../services/dictionaryApi';
import { speakChinese } from '../utils/tts';

// ─────────────────────────────────────────────────────────────
// HERO: Chữ Hán Hôm Nay — trung tâm trang chủ
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
      {/* Decorative blobs */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
        {/* Big Character */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <span
              className="text-7xl sm:text-8xl font-display font-bold text-ink dark:text-on-dark leading-none select-none"
              style={{ fontFamily: "'Noto Serif SC', 'Lora', serif" }}
            >
              {wotd.s}
            </span>
          </div>
          {/* Action buttons under character */}
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

        {/* Word Details */}
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

// ─────────────────────────────────────────────────────────────
// QUICK ACTIONS — 4 card ngang
// ─────────────────────────────────────────────────────────────
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
// MINI HEATMAP — chỉ 7 ngày gần nhất
// ─────────────────────────────────────────────────────────────
function MiniWeekStrip({ data = [], streak: _streak = 0 }) {
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();

  // Build 7-day array from heatmap data
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

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const summary = useSelector((state) => state.stats.summary);
  const heatmapData = useSelector((state) => state.stats.heatmapData);
  const decks = useSelector((state) => state.deck.decks);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchHeatmap());
    dispatch(fetchAllDecks());
  }, [dispatch]);

  const streak = summary?.streak ?? 0;
  const firstName = user?.name?.split(' ').pop() || 'bạn';

  // Due cards count (cards with SRS due today or overdue)
  const totalCards = decks?.reduce((sum, d) => sum + (d.cardCount || 0), 0) || 0;
  const studiedCards = summary?.completedCards ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">

      {/* ── Greeting + Streak ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-on-dark tracking-tight">
            Xin chào, {firstName} 👋
          </h1>
          <p className="text-xs text-mute mt-0.5">
            Tiếp tục hành trình chinh phục tiếng Trung của bạn.
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-semibold bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full w-fit">
            <span className="text-base">🔥</span>
            <span><span className="font-bold">{streak}</span> ngày liên tục</span>
          </div>
        )}
      </div>

      {/* ── Hero: Chữ Hán Hôm Nay ── */}
      <HeroWord />

      {/* ── Quick Actions Grid ── */}
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

      {/* ── Bottom Row: Week Strip + Decks ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: Mini Week + Stats */}
        <div className="space-y-4">
          <MiniWeekStrip data={heatmapData} streak={streak} />

          {/* Daily progress compact */}
          <div className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/60 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink dark:text-on-dark">Hôm nay</span>
              <span className="font-bold text-primary">{studiedCards} thẻ đã ôn</span>
            </div>
            <div className="h-2 w-full bg-[#edf2f7] dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-hero-glow rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (studiedCards / 20) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-mute">
              <span>Mục tiêu: 20 thẻ/ngày</span>
              <span>{totalCards} thẻ tổng cộng</span>
            </div>
          </div>
        </div>

        {/* Right: Deck list */}
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
