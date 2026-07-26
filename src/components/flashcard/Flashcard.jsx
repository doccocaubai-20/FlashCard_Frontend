import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import HoverableText from '../common/HoverableText';

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
        {!isFlipped && showHanziOnFront && (
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
          {/* Subtle Watermark Branding */}
          <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary/30">
            ChongZi Flashcard
          </div>

          <div className="flex flex-col items-center justify-center text-center my-auto">
            {showHanziOnFront ? (
              <div className="flex flex-col items-center">
                {/* Clean Ink or Accent Orange Text */}
                <div className="text-9xl font-display font-extrabold tracking-tight text-ink dark:text-on-dark">
                  <HoverableText text={frontChar || '漢'} hideMeaning={true} />
                </div>
                
                {/* Pinyin element (space reserved to prevent shifting) */}
                <div 
                  className={`text-2xl font-mono font-bold tracking-wide text-primary transition-all duration-300 mt-4 h-8 flex items-center justify-center ${
                    showPinyinOnFront ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
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
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary/30 mb-4">
              {showHanziOnFront ? t('study.detail_meaning') : t('study.chinese_vocab')}
            </div>
            
            <div className="rounded-md bg-surface-card dark:bg-surface-dark p-6 border border-hairline dark:border-divider-dark">
              <div className="text-7xl font-display font-extrabold text-primary tracking-tight">
                <HoverableText text={backChar || '漢'} hideMeaning={true} />
              </div>
              <div className="mt-2 text-2xl font-mono font-bold text-ink dark:text-on-dark">
                {backPinyin || 'hàn'}
              </div>
              <div className="mt-4 text-lg font-medium text-body dark:text-on-dark-mute border-l-4 border-primary pl-3 leading-relaxed flex flex-col items-start gap-1">
                <div>{cleanBackMeaning || t('study.meaning_placeholder')}</div>
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
