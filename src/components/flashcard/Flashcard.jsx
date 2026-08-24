import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import HoverableText from '../common/HoverableText';


const TOPICS = {
  1: { name: 'Cơ thể & Sinh học', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/5 dark:border-emerald-500/10' },
  2: { name: 'Sức khỏe & Y tế', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20 dark:bg-teal-500/5 dark:border-teal-500/10' },
  3: { name: 'Tâm lý & Nhận thức', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20 dark:bg-sky-500/5 dark:border-sky-500/10' },
  4: { name: 'Thời trang & Chăm sóc', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-500/5 dark:border-indigo-500/10' },
  5: { name: 'Gia đình & Vòng đời', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/5 dark:border-rose-500/10' },
  6: { name: 'Giao tiếp & Tương tác', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20 dark:bg-violet-500/5 dark:border-violet-500/10' },
  7: { name: 'Giáo dục & Học thuật', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/5 dark:border-purple-500/10' },
  8: { name: 'Tôn giáo & Triết học', color: 'bg-amber-700/10 text-amber-700 border-amber-700/20 dark:bg-amber-700/5 dark:border-amber-700/10' },
  9: { name: 'Địa lý & Cảnh quan', color: 'bg-green-600/10 text-green-600 border-green-600/20 dark:bg-green-600/5 dark:border-green-600/10' },
  10: { name: 'Khí hậu & Thời tiết', color: 'bg-blue-400/10 text-blue-500 border-blue-400/20 dark:bg-blue-400/5 dark:border-blue-400/10' },
  11: { name: 'Hệ sinh thái Động - Thực vật', color: 'bg-lime-600/10 text-lime-600 border-lime-600/20 dark:bg-lime-600/5 dark:border-lime-600/10' },
  12: { name: 'Vũ trụ & Thiên văn', color: 'bg-fuchsia-600/10 text-fuchsia-600 border-fuchsia-600/20 dark:bg-fuchsia-600/5 dark:border-fuchsia-600/10' },
  13: { name: 'Thương mại & Tài chính', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/5 dark:border-amber-500/10' },
  14: { name: 'Nghề nghiệp & Việc làm', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 dark:bg-orange-500/5 dark:border-orange-500/10' },
  15: { name: 'Chính trị & Pháp luật', color: 'bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-600/5 dark:border-blue-600/10' },
  16: { name: 'Quân sự & Quốc phòng', color: 'bg-red-600/10 text-red-600 border-red-600/20 dark:bg-red-600/5 dark:border-red-600/10' },
  17: { name: 'Nghệ thuật & Biểu diễn', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20 dark:bg-pink-500/5 dark:border-pink-500/10' },
  18: { name: 'Ẩm thực & Đồ uống', color: 'bg-yellow-600/10 text-yellow-600 border-yellow-600/20 dark:bg-yellow-600/5 dark:border-yellow-600/10' },
  19: { name: 'Thể thao & Trò chơi', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 dark:bg-cyan-500/5 dark:border-cyan-500/10' },
  20: { name: 'Du lịch & Khách sạn', color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20 dark:bg-emerald-600/5 dark:border-emerald-600/10' },
  21: { name: 'Khoa học tự nhiên & Đo lường', color: 'bg-stone-500/10 text-stone-500 border-stone-500/20 dark:bg-stone-500/5 dark:border-stone-500/10' },
  22: { name: 'Công nghệ thông tin & Viễn thông', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/10' },
  23: { name: 'Kỹ thuật & Sản xuất', color: 'bg-slate-600/10 text-slate-600 border-slate-600/20 dark:bg-slate-600/5 dark:border-slate-600/10' },
  24: { name: 'Giao thông & Hạ tầng', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 dark:bg-zinc-500/5 dark:border-zinc-500/10' },
};

function parsePosAndMeaning(meaning) {
  if (!meaning) return { pos: '', meaning: '' };
  
  // Kiểm tra cấu trúc dạng: (Từ loại) Nghĩa của từ
  const match = meaning.match(/^\s*\(\s*([^)]+)\s*\)\s*(.*)$/);
  if (match) {
    const rawPos = match[1].trim();
    const cleanMeaning = match[2].trim();
    const posLower = rawPos.toLowerCase();
    let posAbbr = rawPos;
    
    if (posLower === 'danh từ' || posLower === 'n' || posLower === 'noun') {
      posAbbr = 'n';
    } else if (posLower === 'động từ' || posLower === 'v' || posLower === 'verb') {
      posAbbr = 'v';
    } else if (posLower === 'tính từ' || posLower === 'adj' || posLower === 'adjective') {
      posAbbr = 'adj';
    } else if (posLower === 'đại từ' || posLower === 'pron' || posLower === 'pronoun') {
      posAbbr = 'pron';
    } else if (posLower === 'phó từ' || posLower === 'trạng từ' || posLower === 'adv' || posLower === 'adverb') {
      posAbbr = 'adv';
    } else if (posLower === 'giới từ' || posLower === 'prep' || posLower === 'preposition') {
      posAbbr = 'prep';
    } else if (posLower === 'liên từ' || posLower === 'conj' || posLower === 'conjunction') {
      posAbbr = 'conj';
    } else if (posLower === 'thán từ' || posLower === 'int' || posLower === 'interjection') {
      posAbbr = 'int';
    } else if (posLower === 'trợ từ' || posLower === 'part' || posLower === 'particle') {
      posAbbr = 'part';
    } else if (posLower === 'lượng từ' || posLower === 'm' || posLower === 'measure word' || posLower === 'classifier') {
      posAbbr = 'm';
    } else if (posLower === 'số từ' || posLower === 'num' || posLower === 'numeral') {
      posAbbr = 'num';
    } else if (posLower === 'trợ động từ' || posLower === 'aux' || posLower === 'auxiliary verb') {
      posAbbr = 'aux';
    }
    
    return { pos: posAbbr, meaning: cleanMeaning };
  }
  return { pos: '', meaning: meaning };
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
  onTogglePinyinOnFront
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
      }, 700); // Delay matches transition-transform duration-700
      return () => clearTimeout(timer);
    }
  }, [isFlipped, cardData]);

  const { character: backChar, pinyin: backPinyin, meaning: backMeaning } = backCardData || {};
  const { pos: backPos, meaning: cleanBackMeaning } = parsePosAndMeaning(backMeaning);

  const cardStyle = {
    transformStyle: 'preserve-3d',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const faceStyle = {
    backfaceVisibility: 'hidden',
  };

  const showHanziOnFront = frontFaceMode === 'hanzi';
  const isEnglish = isEnglishWord(frontChar || backChar);

  return (
    <div 
      className="relative w-full max-w-xl cursor-pointer select-none" 
      style={{ perspective: '1200px' }}
      onClick={onFlip}
    >
      <div
        className="relative w-full h-[26rem] rounded-lg transition-transform duration-700 ease-in-out border border-hairline dark:border-divider-dark"
        style={cardStyle}
      >
        
        {/* Toggle Pinyin Button (Front Face only) */}
        {!isFlipped && showHanziOnFront && !isEnglish && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Prevents flipping the card
              onTogglePinyinOnFront?.();
            }}
            className="absolute top-5 right-5 z-30 inline-flex items-center gap-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card/85 dark:bg-surface-dark/85 hover:bg-surface-bone dark:hover:bg-black px-4 py-2 text-xs font-semibold text-ink dark:text-on-dark shadow-sm backdrop-blur transition-all duration-200 cursor-pointer"
            title={t('study.toggle_pinyin_tooltip', 'Ẩn/Hiện phiên âm Pinyin ở mặt trước')}
          >
            {showPinyinOnFront ? <EyeOff size={14} className="text-primary" /> : <Eye size={14} className="text-primary" />}
            <span className="font-mono">{showPinyinOnFront ? t('study.hide_pinyin') : t('study.show_pinyin')}</span>
          </button>
        )}

        {/* Front Face (Clean Replicate Cream/Dark Slate Theme) */}
        <div
          className="absolute inset-0 rounded-lg bg-surface-card dark:bg-surface-dark p-8 text-ink dark:text-on-dark flex flex-col justify-between"
          style={faceStyle}
        >
          {/* Subtle Watermark Branding & Topic Pill */}
          <div className="flex items-center justify-between w-full">
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary/30">
              ChongZi Flashcard
            </div>
            {cardData?.topicId && TOPICS[cardData.topicId] && (
              <span className={`text-[10px] font-bold font-mono px-3 py-1 rounded-full border transition-all ${TOPICS[cardData.topicId].color}`}>
                🏷️ {TOPICS[cardData.topicId].name}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center text-center my-auto w-full">
            {showHanziOnFront ? (
              <div className="flex flex-col items-center w-full">
                {/* Clean Ink or Accent Orange Text */}
                <div className={`${isEnglish ? 'text-5xl px-4 word-break break-all' : 'text-9xl'} font-display font-extrabold tracking-tight text-ink dark:text-on-dark`}>
                  {isEnglish ? <span>{frontChar}</span> : <HoverableText text={frontChar || '漢'} hideMeaning={true} />}
                </div>
                
                {/* Pinyin or IPA element (space reserved to prevent shifting) */}
                <div 
                  className={`text-2xl font-mono font-bold tracking-wide text-primary transition-all duration-300 mt-4 h-8 flex items-center justify-center ${
                    showPinyinOnFront || isEnglish ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  {frontPinyin || ''}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl font-display font-extrabold tracking-tight max-w-md px-4 leading-normal text-primary">
                  {cleanFrontMeaning || t('study.meaning_placeholder')}
                </div>
                {frontPos && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-primary/10 text-primary rounded-full mt-2 tracking-wider">
                    {frontPos}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Luxury glassmorphic indicator at bottom */}
          <div className="self-center bg-surface-bone/80 dark:bg-black/30 border border-hairline dark:border-divider-dark px-6 py-2 rounded-full text-[10px] font-mono font-bold tracking-widest text-mute dark:text-on-dark-mute uppercase">
            {t('study.flip_hint_short')}
          </div>
        </div>

        {/* Back Face (Luxurious Cream/Ivory Slate Theme) */}
        <div
          className="absolute inset-0 rounded-lg bg-surface-bone dark:bg-black p-8 text-ink dark:text-on-dark flex flex-col justify-between"
          style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
        >
          <div>
            <div className="flex items-center justify-between w-full mb-4">
              <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary/30">
                {showHanziOnFront ? t('study.detail_meaning') : (isEnglish ? 'Từ vựng Tiếng Anh' : t('study.chinese_vocab'))}
              </div>
              {cardData?.topicId && TOPICS[cardData.topicId] && (
                <span className={`text-[10px] font-bold font-mono px-3 py-1 rounded-full border transition-all ${TOPICS[cardData.topicId].color}`}>
                  🏷️ {TOPICS[cardData.topicId].name}
                </span>
              )}
            </div>
            
            <div className="rounded-md bg-surface-card dark:bg-surface-dark p-6 border border-hairline dark:border-divider-dark">
              <div className={`${isEnglish ? 'text-4xl word-break break-all' : 'text-7xl'} font-display font-extrabold text-primary tracking-tight`}>
                {isEnglish ? <span>{backChar}</span> : <HoverableText text={backChar || '漢'} hideMeaning={true} />}
              </div>
              <div className="mt-2 text-2xl font-mono font-bold text-ink dark:text-on-dark">
                {backPinyin || ''}
              </div>
              <div className="mt-4 text-lg font-medium text-body dark:text-on-dark-mute border-l-4 border-primary pl-3 leading-relaxed flex flex-col items-start gap-1">
                <div title={cleanBackMeaning} className="text-left">
                  {cleanBackMeaning && cleanBackMeaning.length > 90 
                    ? cleanBackMeaning.substring(0, 90).trim() + '...' 
                    : cleanBackMeaning || t('study.meaning_placeholder')}
                </div>
                {backPos && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full mt-1.5 tracking-wider">
                    {backPos}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="self-center bg-surface-card/80 dark:bg-surface-dark/30 border border-hairline dark:border-divider-dark px-5 py-2 rounded-full text-[10px] font-mono font-bold tracking-widest text-mute dark:text-on-dark-mute uppercase">
            {t('study.flip_back_hint')}
          </div>
        </div>

      </div>
    </div>
  );
}
