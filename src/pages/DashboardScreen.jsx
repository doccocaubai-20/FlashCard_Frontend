import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import GoalTracker from '../components/stats/GoalTracker';
import Heatmap from '../components/stats/Heatmap';
import { fetchSummary, fetchHeatmap, fetchBadges } from '../features/stats/statsSlice';
import { fetchAllDecks } from '../features/deck/deckSlice';
import { Trophy, Flame, Calendar, Award, Sparkles, Volume2, Star, PenTool } from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';
import { favoriteWordsApi } from '../services/favoriteWordsApi';

function WordOfTheDay({ dictArray, dictLoading }) {
  const [wotd, setWotd] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  const loadFavorites = async () => {
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('WOTD: Failed to load favorites:', err);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const isFavorite = wotd ? favorites.some((f) => f.hanzi === wotd.s) : false;

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!wotd || favLoading) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await favoriteWordsApi.deleteFavoriteByHanzi(wotd.s);
      } else {
        await favoriteWordsApi.addFavorite({
          hanzi: wotd.s,
          pinyin: wotd.p || '',
          sv: wotd.sv || '',
          vi: wotd.vi || '',
        });
      }
      await loadFavorites();
    } catch (err) {
      console.error('WOTD: Failed to toggle favorite:', err);
    } finally {
      setFavLoading(false);
    }
  };

  useEffect(() => {
    if (dictLoading || !dictArray || dictArray.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const cachedWord = localStorage.getItem('wotd_word');
    const cachedDate = localStorage.getItem('wotd_date');

    if (cachedDate === todayStr && cachedWord) {
      try {
        setWotd(JSON.parse(cachedWord));
        return;
      } catch (err) {
        console.error('Error parsing cached WOTD:', err);
      }
    }

    const candidates = dictArray.filter(
      (e) => e && e.hsk && e.hsk >= 1 && e.hsk <= 3 && e.s && e.s.length <= 2
    );
    const pool = candidates.length > 0 ? candidates : dictArray.filter(e => e && e.s && e.s.length <= 2);
    
    if (pool.length > 0) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const selected = pool[randomIndex];
      
      if (!selected.sv && selected.s) {
        const chars = Array.from(selected.s);
        const svs = chars.map(char => {
          const match = dictArray.find(m => m.s === char);
          return match?.sv || '';
        }).filter(Boolean).join(' ');
        selected.sv = svs;
      }

      localStorage.setItem('wotd_word', JSON.stringify(selected));
      localStorage.setItem('wotd_date', todayStr);
      setWotd(selected);
    }
  }, [dictArray, dictLoading]);

  const handleSpeak = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!wotd || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(wotd.s);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  if (dictLoading || !wotd) {
    return (
      <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-6 flex flex-col justify-center items-center min-h-[150px]">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        <span className="text-xs text-mute mt-2">Đang tải từ vựng hôm nay...</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-5 relative shadow-sm overflow-hidden flex flex-col gap-4 text-left group transition-all duration-300 hover:shadow-md">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all pointer-events-none" />

      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-3">
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary" />
          Từ vựng hôm nay
        </h3>
        {wotd.hsk && (
          <span className="text-[9px] font-extrabold uppercase bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded shadow-sm">
            HSK {wotd.hsk}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <h2 className="text-4xl font-extrabold text-ink dark:text-on-dark font-display leading-none">
            {wotd.s}
          </h2>
          
          <div className="flex items-center gap-2 text-xs font-bold text-mute dark:text-on-dark-mute">
            <span className="text-primary font-mono">{wotd.p}</span>
            {wotd.sv && (
              <>
                <span>|</span>
                <span className="text-charcoal dark:text-on-dark-mute uppercase text-[10px] tracking-wider">{wotd.sv}</span>
              </>
            )}
          </div>
          
          <p className="text-xs font-semibold text-body dark:text-on-dark-mute leading-relaxed pt-1 line-clamp-2">
            {wotd.vi}
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSpeak}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-sm transition-all cursor-pointer text-xs"
            title="Nghe phát âm"
          >
            <Volume2 size={13} />
          </button>

          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all cursor-pointer text-xs ${
              isFavorite
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-mute'
            }`}
            title={isFavorite ? 'Xóa khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}
          >
            <Star size={13} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>

          <Link
            to={`/write?word=${encodeURIComponent(wotd.s)}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-sm transition-all cursor-pointer text-xs"
            title="Luyện viết từ này"
          >
            <PenTool size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

const badgeIconMap = {
  Flame: Flame,
  Calendar: Calendar,
  Award: Award,
  Trophy: Trophy,
};

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.stats.summary);
  const heatmapData = useSelector((state) => state.stats.heatmapData);
  const badges = useSelector((state) => state.stats.badges);
  const goals = useSelector((state) => state.stats.goals);
  const decks = useSelector((state) => state.deck.decks);
  const { dictArray, loading: dictLoading } = useDictionary();

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchHeatmap());
    dispatch(fetchAllDecks());
    dispatch(fetchBadges());
  }, [dispatch]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline dark:border-divider-dark pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Dashboard</h1>
        </div>
        <div className="text-sm text-charcoal dark:text-on-dark-mute font-mono bg-surface-bone dark:bg-black/20 border border-hairline dark:border-divider-dark px-4 py-2 rounded-full w-fit">
          Chuỗi học hiện tại: <span className="font-bold text-primary">{summary?.streak ?? 0} ngày 🔥</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] w-full min-w-0">
        
        {/* Left Column: Stats & Heatmap */}
        <div className="space-y-6 min-w-0">
          <GoalTracker completed={summary?.completedCards ?? 0} target={goals?.dailyTarget ?? 20} />
          <Heatmap data={heatmapData} />

          {/* Unlocked Badges Container */}
          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-5">
            <h2 className="font-display text-sm font-bold text-ink dark:text-on-dark tracking-tight uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-primary" />
              Huy hiệu đạt được ({badges?.length ?? 0})
            </h2>
            {badges?.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {badges.map((badge) => {
                  const IconComponent = badgeIconMap[badge.icon] || Trophy;
                  return (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-md border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/25"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink dark:text-on-dark">{badge.name}</h4>
                        <p className="text-[10px] text-mute dark:text-on-dark-mute mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-hairline dark:border-divider-dark rounded-md text-xs text-mute dark:text-on-dark-mute">
                Chưa có huy hiệu nào. Hãy tích cực học bài mỗi ngày để tích luỹ danh hiệu nhé!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Word of the Day & Decks Panel */}
        <div className="space-y-6 min-w-0">
          <WordOfTheDay dictArray={dictArray} dictLoading={dictLoading} />
          
          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-6">
            <h2 className="font-display text-xl font-bold text-ink dark:text-on-dark tracking-tight">Bộ bài của bạn</h2>
            <p className="mt-1 text-sm text-mute dark:text-on-dark-mute">Chọn một bộ bài bên dưới để bắt đầu luyện tập hoặc ôn thẻ.</p>
          <div className="mt-6 space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {decks?.length > 0 ? (
              decks.map((deck) => (
                <Link
                  key={deck.id}
                  to={`/decks/${deck.id}`}
                  className="block rounded-md border border-hairline dark:border-divider-dark bg-canvas dark:bg-surface-dark p-4 transition-all duration-200 hover:-translate-y-[2px] hover:border-primary dark:hover:border-primary"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-ink dark:text-on-dark">{deck.title || deck.name || 'Bộ bài chưa đặt tên'}</h3>
                      <p className="mt-1 text-xs text-mute dark:text-on-dark-mute line-clamp-1">{deck.description || 'Không có mô tả cho bộ bài này.'}</p>
                    </div>
                    <span className="rounded-full bg-surface-bone dark:bg-black/35 px-3 py-1 text-xs font-mono font-semibold text-charcoal dark:text-on-dark-mute shrink-0">
                      {deck.cardCount ?? 0} thẻ
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-hairline dark:border-divider-dark bg-canvas dark:bg-surface-dark/50 p-6 text-center text-mute dark:text-on-dark-mute">
                Chưa có bộ bài nào. Hãy tạo hoặc nhập một bộ bài mới để bắt đầu.
              </div>
            )}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
