import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Star, Volume2 } from 'lucide-react';
import HoverableText from '../common/HoverableText';
import { speakChinese } from '../../utils/tts';

const TOPICS = {
  1: { name: 'Cơ thể & Sinh học', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  2: { name: 'Sức khỏe & Y tế', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  3: { name: 'Tâm lý & Nhận thức', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  4: { name: 'Thời trang & Chăm sóc', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  5: { name: 'Gia đình & Vòng đời', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  6: { name: 'Giao tiếp & Tương tác', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
  7: { name: 'Giáo dục & Học thuật', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  8: { name: 'Tôn giáo & Triết học', color: 'bg-amber-700/10 text-amber-700 dark:text-amber-500 border-amber-700/20' },
  9: { name: 'Địa lý & Cảnh quan', color: 'bg-green-600/10 text-green-600 dark:text-green-400 border-green-600/20' },
  10: { name: 'Khí hậu & Thời tiết', color: 'bg-blue-400/10 text-blue-600 dark:text-blue-400 border-blue-400/20' },
  11: { name: 'Hệ sinh thái Động - Thực vật', color: 'bg-lime-600/10 text-lime-600 dark:text-lime-400 border-lime-600/20' },
  12: { name: 'Vũ trụ & Thiên văn', color: 'bg-fuchsia-600/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-600/20' },
  13: { name: 'Thương mại & Tài chính', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  14: { name: 'Nghề nghiệp & Việc làm', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  15: { name: 'Chính trị & Pháp luật', color: 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20' },
  16: { name: 'Quân sự & Quốc phòng', color: 'bg-red-600/10 text-red-600 dark:text-red-400 border-red-600/20' },
  17: { name: 'Nghệ thuật & Biểu diễn', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  18: { name: 'Ẩm thực & Đồ uống', color: 'bg-yellow-600/10 text-yellow-600 dark:text-yellow-400 border-yellow-600/20' },
  19: { name: 'Thể thao & Trò chơi', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  20: { name: 'Du lịch & Khách sạn', color: 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-600/20' },
  21: { name: 'Khoa học tự nhiên & Đo lường', color: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20' },
  22: { name: 'Công nghệ thông tin & Viễn thông', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  23: { name: 'Kỹ thuật & Sản xuất', color: 'bg-slate-600/10 text-slate-600 dark:text-slate-400 border-slate-600/20' },
  24: { name: 'Giao thông & Hạ tầng', color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
};

function parsePosAndMeaning(meaning) {
  if (!meaning) return { pos: '', meaning: '' };
  const match = meaning.match(/^\s*\(\s*([^)]+)\s*\)\s*(.*)$/);
  if (match) {
    const rawPos = match[1].trim();
    const cleanMeaning = match[2].trim();
    const posLower = rawPos.toLowerCase();
    let posAbbr = rawPos;
    
    if (posLower === 'danh từ' || posLower === 'n' || posLower === 'noun') posAbbr = 'n';
    else if (posLower === 'động từ' || posLower === 'v' || posLower === 'verb') posAbbr = 'v';
    else if (posLower === 'tính từ' || posLower === 'adj' || posLower === 'adjective') posAbbr = 'adj';
    else if (posLower === 'đại từ' || posLower === 'pron' || posLower === 'pronoun') posAbbr = 'pron';
    else if (posLower === 'phó từ' || posLower === 'trạng từ' || posLower === 'adv' || posLower === 'adverb') posAbbr = 'adv';
    else if (posLower === 'giới từ' || posLower === 'prep' || posLower === 'preposition') posAbbr = 'prep';
    else if (posLower === 'liên từ' || posLower === 'conj' || posLower === 'conjunction') posAbbr = 'conj';
    else if (posLower === 'thán từ' || posLower === 'int' || posLower === 'interjection') posAbbr = 'int';
    else if (posLower === 'trợ từ' || posLower === 'part' || posLower === 'particle') posAbbr = 'part';
    else if (posLower === 'lượng từ' || posLower === 'm' || posLower === 'measure word' || posLower === 'classifier') posAbbr = 'm';
    else if (posLower === 'số từ' || posLower === 'num' || posLower === 'numeral') posAbbr = 'num';
    else if (posLower === 'trợ động từ' || posLower === 'aux' || posLower === 'auxiliary verb') posAbbr = 'aux';
    
    return { pos: posAbbr, meaning: cleanMeaning };
  }
  return { pos: '', meaning: meaning };
}

function formatMeaning(meaning, maxLen = 75) {
  if (!meaning) return '';
  const trimmed = meaning.trim();
  if (trimmed.length > maxLen) {
    const parts = trimmed.split(/[/;]/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      let acc = parts[0];
      for (let i = 1; i < parts.length; i++) {
        if ((acc + ' / ' + parts[i]).length <= maxLen - 5) {
          acc += ' / ' + parts[i];
        } else {
          return acc + '...';
        }
      }
      return acc;
    }
    return trimmed.slice(0, maxLen - 5).trim() + '...';
  }
  return trimmed;
}

const isEnglishWord = (text) => {
  if (!text) return false;
  return !/[\u4e00-\u9fa5]/.test(text);
};

export default function Flashcard({ 
  cardData, 
  isFlipped, 
  onFlip, 
  frontFaceMode = 'hanzi',
  showPinyinOnFront = false,
  onTogglePinyinOnFront,
  isFavorite = false,
  onToggleFavorite
}) {
  const { t } = useTranslation();
  const { character: frontChar, pinyin: frontPinyin, meaning: frontMeaning } = cardData || {};
  const { pos: frontPos, meaning: cleanFrontMeaning } = parsePosAndMeaning(frontMeaning);
  const [backCardData, setBackCardData] = React.useState(cardData);

  React.useEffect(() => {
    if (isFlipped) {
      setBackCardData(cardData);
    } else {
      const timer = setTimeout(() => {
        setBackCardData(cardData);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFlipped, cardData]);

  const { character: backChar, pinyin: backPinyin, meaning: backMeaning } = backCardData || {};
  const { pos: backPos, meaning: cleanBackMeaning } = parsePosAndMeaning(backMeaning);

  const cardStyle = {
    transformStyle: 'preserve-3d',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const showHanziOnFront = frontFaceMode === 'hanzi';
  const isEnglish = isEnglishWord(frontChar || backChar);

  const handleSpeak = (e, text) => {
    e.preventDefault();
    e.stopPropagation();
    speakChinese(text, isEnglish ? 'en-US' : 'zh-CN');
  };

  const handleToggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.();
  };

  return (
    <div 
      className="relative w-full max-w-xl cursor-pointer select-none" 
      style={{ perspective: '1200px' }}
      onClick={onFlip}
    >
      <div
        className="relative w-full h-[27rem] rounded-2xl transition-transform duration-500 ease-out shadow-lg hover:shadow-xl dark:shadow-black/50 border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark"
        style={cardStyle}
      >
        
        {/* ===================== FRONT FACE ===================== */}
        <div
          className={`absolute inset-0 rounded-2xl bg-surface-card dark:bg-surface-dark p-6 sm:p-8 text-ink dark:text-on-dark flex flex-col justify-between overflow-hidden transition-opacity duration-300 ${
            isFlipped ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Top Bar (Header) */}
          <div className="flex items-center justify-between w-full gap-2 z-10">
            {/* Left: Star Favorite Button + Topic Tag */}
            <div className="flex items-center gap-2.5 min-w-0">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={handleToggleFav}
                  className={`p-2 rounded-full border transition-all duration-200 cursor-pointer shrink-0 ${
                    isFavorite
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25 shadow-xs'
                      : 'bg-surface-bone/60 dark:bg-black/30 border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark hover:bg-surface-bone'
                  }`}
                  title={isFavorite ? 'Xóa khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}
                >
                  <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}

              {cardData?.topicId && TOPICS[cardData.topicId] ? (
                <span className={`text-[11px] font-bold font-mono px-3 py-1 rounded-full border truncate ${TOPICS[cardData.topicId].color}`}>
                  🏷️ {TOPICS[cardData.topicId].name}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-mute dark:text-on-dark-mute">
                  ChongZi Flashcard
                </span>
              )}
            </div>

            {/* Right: Actions (Speaker & Pinyin Toggle) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => handleSpeak(e, frontChar)}
                className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-bone/60 dark:bg-black/30 hover:bg-surface-bone text-mute hover:text-primary transition cursor-pointer"
                title="Phát âm từ vựng"
              >
                <Volume2 size={15} />
              </button>

              {showHanziOnFront && !isEnglish && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTogglePinyinOnFront?.();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline dark:border-divider-dark bg-surface-bone/60 dark:bg-black/30 hover:bg-surface-bone px-3 py-1.5 text-xs font-mono font-semibold text-ink dark:text-on-dark transition cursor-pointer"
                  title="Ẩn / Hiện Pinyin"
                >
                  {showPinyinOnFront ? <EyeOff size={13} className="text-primary" /> : <Eye size={13} className="text-primary" />}
                  <span>{showPinyinOnFront ? 'Ẩn Pinyin' : 'Hiện Pinyin'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Main Content */}
          <div className="flex flex-col items-center justify-center text-center my-auto w-full px-4">
            {showHanziOnFront ? (
              <div className="flex flex-col items-center justify-center w-full">
                {/* Authentic Hanzi / Character typography */}
                <div className={`${isEnglish ? 'text-5xl px-4 word-break break-all' : 'text-9xl'} font-display tracking-tight text-ink dark:text-on-dark`}>
                  {isEnglish ? <span>{frontChar}</span> : <HoverableText text={frontChar || '漢'} hideMeaning={true} noUnderline={true} />}
                </div>
                
                {/* Pinyin */}
                <div 
                  className={`text-2xl font-mono font-bold tracking-wide text-primary transition-all duration-300 mt-4 h-8 flex items-center justify-center ${
                    showPinyinOnFront || isEnglish ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}
                >
                  {frontPinyin || ''}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="text-3xl font-display font-medium tracking-tight max-w-md px-4 leading-normal text-primary">
                  {formatMeaning(cleanFrontMeaning) || t('study.meaning_placeholder')}
                </div>
                {frontPos && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full tracking-wider">
                    {frontPos}
                  </span>
                )}
              </div>
            )}
          </div>


          {/* Spacer for clean bottom */}
          <div className="h-2" />
        </div>

        {/* ===================== BACK FACE ===================== */}
        <div
          className={`absolute inset-0 rounded-2xl bg-surface-card dark:bg-surface-dark p-6 sm:p-8 text-ink dark:text-on-dark flex flex-col justify-between overflow-hidden transition-opacity duration-300 ${
            isFlipped ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Top Bar (Header) */}
          <div className="flex items-center justify-between w-full gap-2 z-10">
            {/* Left: Star Favorite Button + Section Label */}
            <div className="flex items-center gap-2.5 min-w-0">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={handleToggleFav}
                  className={`p-2 rounded-full border transition-all duration-200 cursor-pointer shrink-0 ${
                    isFavorite
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25 shadow-xs'
                      : 'bg-surface-bone/60 dark:bg-black/30 border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark hover:bg-surface-bone'
                  }`}
                  title={isFavorite ? 'Xóa khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}
                >
                  <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}

              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                {showHanziOnFront ? 'Giải nghĩa chi tiết' : (isEnglish ? 'Từ vựng Tiếng Anh' : 'Từ vựng Hán tự')}
              </span>
            </div>

            {/* Right: Audio Pronounce Button */}
            <button
              type="button"
              onClick={(e) => handleSpeak(e, backChar)}
              className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-bone/60 dark:bg-black/30 hover:bg-surface-bone text-mute hover:text-primary transition cursor-pointer shrink-0"
              title="Phát âm từ vựng"
            >
              <Volume2 size={15} />
            </button>
          </div>

          {/* Center Main Content (Unified card surface, authentic typography) */}
          <div className="flex flex-col items-center justify-center text-center my-auto w-full px-4 space-y-2">
            {/* Character Headword with authentic font */}
            <div className={`${isEnglish ? 'text-4xl word-break break-all' : 'text-7xl'} font-display text-primary tracking-tight`}>
              {isEnglish ? <span>{backChar}</span> : <HoverableText text={backChar || '漢'} hideMeaning={true} noUnderline={true} />}
            </div>

            {/* Pinyin Pronunciation */}
            <div className="text-2xl font-mono font-bold text-ink dark:text-on-dark">
              {backPinyin || ''}
            </div>

            {/* Meaning & Part of Speech Badge */}
            <div className="flex flex-col items-center justify-center gap-2 pt-2 max-w-md mx-auto">
              <div 
                title={cleanBackMeaning}
                className="text-lg sm:text-xl font-medium text-body dark:text-on-dark-mute leading-relaxed max-w-md"
              >
                {formatMeaning(cleanBackMeaning, 80) || t('study.meaning_placeholder')}
              </div>

              {backPos && (
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full tracking-wider mt-1">
                  {backPos}
                </span>
              )}
            </div>
          </div>

          {/* Spacer for clean bottom */}
          <div className="h-2" />
        </div>

      </div>
    </div>
  );
}
