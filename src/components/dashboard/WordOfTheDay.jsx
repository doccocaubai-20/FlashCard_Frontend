import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Star, PenTool, ArrowRight, BookOpen } from 'lucide-react';
import { dictionaryApi } from '../../services/dictionaryApi';
import { favoriteWordsApi } from '../../services/favoriteWordsApi';
import { speakChinese } from '../../utils/tts';
import { safeLocalGet, safeLocalSet } from '../../utils/storage';
import HoverableText from '../common/HoverableText';

const FALLBACK_WORD = {
  s: '学',
  t: '學',
  p: 'xué',
  sv: 'HỌC',
  vi: 'Học tập, tiếp thu tri thức, nghiên cứu',
  hsk: 1,
};

export default function WordOfTheDay({ initialWord = null }) {
  const [wotd, setWotd] = useState(initialWord);
  const [loading, setLoading] = useState(!initialWord);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Check if current word is favorited
  const checkFavoriteStatus = useCallback(async (wordStr) => {
    if (!wordStr) return;
    try {
      const res = await favoriteWordsApi.getFavorites();
      const list = res.data || [];
      setIsFavorite(list.some((f) => f.hanzi === wordStr));
    } catch (err) {
      console.warn('WordOfTheDay favorites check error:', err);
    }
  }, []);

  // Fetch or load from storage cache
  useEffect(() => {
    if (initialWord) {
      setWotd(initialWord);
      checkFavoriteStatus(initialWord.s);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const cachedWord = safeLocalGet('wotd_word', null);
    const cachedDate = safeLocalGet('wotd_date', null);

    if (cachedDate === todayStr && cachedWord) {
      setWotd(cachedWord);
      setLoading(false);
      checkFavoriteStatus(cachedWord.s);
      return;
    }

    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await dictionaryApi.getWordOfTheDay();
        if (res?.data && isMounted) {
          const word = res.data;
          setWotd(word);
          safeLocalSet('wotd_word', word);
          safeLocalSet('wotd_date', todayStr);
          checkFavoriteStatus(word.s);
        } else if (isMounted) {
          setWotd(FALLBACK_WORD);
        }
      } catch (err) {
        console.warn('Failed to fetch Word of the Day from API, using fallback:', err);
        if (isMounted) {
          setWotd(FALLBACK_WORD);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialWord, checkFavoriteStatus]);

  const handleSpeak = () => {
    if (!wotd?.s) return;
    speakChinese(wotd.s);
  };

  const handleToggleFavorite = async () => {
    if (!wotd?.s || favLoading) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await favoriteWordsApi.deleteFavoriteByHanzi(wotd.s);
        setIsFavorite(false);
      } else {
        await favoriteWordsApi.addFavorite({
          hanzi: wotd.s,
          pinyin: wotd.p || '',
          sv: wotd.sv || '',
          vi: wotd.vi || '',
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setFavLoading(false);
    }
  };

  if (loading || !wotd) {
    return (
      <div className="rounded-2xl bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 p-6 shadow-xs flex items-center justify-center min-h-[160px] animate-pulse">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-xl bg-surface-bone dark:bg-white/5" />
          <div className="space-y-2.5">
            <div className="h-4 w-28 bg-surface-bone dark:bg-white/5 rounded-md" />
            <div className="h-6 w-40 bg-surface-bone dark:bg-white/5 rounded-md" />
            <div className="h-3 w-52 bg-surface-bone dark:bg-white/5 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  const characters = Array.from(wotd.s || '');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-card via-surface-card to-primary-light/20 dark:from-surface-card dark:via-surface-card dark:to-primary/10 border border-hairline dark:border-white/10 p-5 sm:p-6 shadow-xs transition-all">
      {/* Decorative gradient accents */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
        {/* Left Column: Calligraphy Grid (Mễ tự ô) & Quick Tool Buttons */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <div className="flex gap-2 flex-wrap justify-center">
            {characters.map((char, index) => (
              <div
                key={index}
                className="relative w-16 h-16 sm:w-20 sm:h-20 border border-red-500/25 dark:border-red-500/30 bg-red-50/40 dark:bg-red-950/20 flex items-center justify-center rounded-xl shadow-xs overflow-hidden select-none"
              >
                {/* Classic Chinese Rice Grid (Mễ tự ô / 米字格) */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  <line
                    x1="0"
                    y1="50"
                    x2="100"
                    y2="50"
                    stroke="rgba(239, 68, 68, 0.2)"
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="50"
                    y1="0"
                    x2="50"
                    y2="100"
                    stroke="rgba(239, 68, 68, 0.2)"
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="100"
                    y2="100"
                    stroke="rgba(239, 68, 68, 0.15)"
                    strokeWidth="0.6"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="100"
                    y1="0"
                    x2="0"
                    y2="100"
                    stroke="rgba(239, 68, 68, 0.15)"
                    strokeWidth="0.6"
                    strokeDasharray="3 3"
                  />
                </svg>

                {/* Character with Tooltip */}
                <span className="text-3xl sm:text-4xl font-serif z-10 text-ink dark:text-on-dark selection:bg-transparent">
                  <HoverableText text={char} hideMeaning={true} />
                </span>
              </div>
            ))}
          </div>

          {/* Action Row: Audio TTS, Favorite, Shortcut to Write */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeak}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light transition-all cursor-pointer active:scale-95"
              title="Nghe phát âm chuẩn"
              aria-label="Phát âm"
            >
              <Volume2 size={15} />
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer active:scale-95 ${isFavorite
                  ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
                  : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-amber-500'
                }`}
              title={isFavorite ? 'Bỏ lưu từ yêu thích' : 'Lưu vào từ yêu thích'}
              aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            >
              <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <Link
              to={`/write?word=${encodeURIComponent(wotd.s)}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light transition-all cursor-pointer active:scale-95"
              title="Luyện viết chữ Hán trên canvas"
              aria-label="Luyện viết"
            >
              <PenTool size={14} />
            </Link>
          </div>
        </div>

        {/* Right Column: Information, Pinyin, Sino-Vietnamese & Meaning */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-mute uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen size={13} className="text-primary dark:text-hero-glow" />
              Từ vựng hôm nay
            </span>
            {wotd.hsk && (
              <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary dark:text-primary-light px-2 py-0.5 rounded-md border border-primary/20">
                HSK {wotd.hsk}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-lg sm:text-xl font-bold text-primary dark:text-hero-glow font-mono">
                {wotd.p}
              </span>
              {wotd.sv && (
                <span className="text-xs font-semibold text-charcoal dark:text-ash uppercase tracking-wider bg-surface-bone dark:bg-white/5 px-2 py-0.5 rounded">
                  {wotd.sv}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-body dark:text-on-dark-mute leading-relaxed line-clamp-3">
              {wotd.vi}
            </p>
          </div>

          <div className="pt-1 flex items-center gap-4">
            <Link
              to={`/write?word=${encodeURIComponent(wotd.s)}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-hero-glow hover:text-primary-deep dark:hover:text-white transition-colors group"
            >
              <span>Luyện viết chữ này</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to={`/dictionary?q=${encodeURIComponent(wotd.s)}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-mute hover:text-primary transition-colors"
            >
              <span>Tra từ điển chi tiết →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
