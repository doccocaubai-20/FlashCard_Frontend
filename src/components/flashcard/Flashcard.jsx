import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import HoverableText from '../common/HoverableText';

export default function Flashcard({ 
  cardData, 
  isFlipped, 
  onFlip, 
  frontFaceMode = 'hanzi',
  showPinyinOnFront = false,
  onTogglePinyinOnFront
}) {
  const { character: frontChar, pinyin: frontPinyin, meaning: frontMeaning } = cardData || {};
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
            title="Ẩn/Hiện phiên âm Pinyin ở mặt trước"
          >
            {showPinyinOnFront ? <EyeOff size={14} className="text-primary" /> : <Eye size={14} className="text-primary" />}
            <span className="font-mono">{showPinyinOnFront ? 'Ẩn Pinyin' : 'Hiện Pinyin'}</span>
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
                  <HoverableText text={frontChar || '漢'} />
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
              <>
                <div className="text-3xl font-display font-extrabold tracking-tight max-w-md px-4 leading-normal text-primary">
                  {frontMeaning || 'Nghĩa tiếng Việt...'}
                </div>
              </>
            )}
          </div>

          {/* Luxury glassmorphic indicator at bottom */}
          <div className="self-center bg-surface-bone/80 dark:bg-black/30 border border-hairline dark:border-divider-dark px-6 py-2 rounded-full text-[10px] font-mono font-bold tracking-widest text-mute dark:text-on-dark-mute uppercase">
            Chạm vào thẻ để lật
          </div>
        </div>

        {/* Back Face (Luxurious Cream/Ivory Slate Theme) */}
        <div
          className="absolute inset-0 rounded-lg bg-surface-bone dark:bg-black p-8 text-ink dark:text-on-dark flex flex-col justify-between"
          style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
        >
          <div>
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary/30 mb-4">
              {showHanziOnFront ? 'Giải nghĩa chi tiết' : 'Từ vựng tiếng Trung'}
            </div>
            
            <div className="rounded-md bg-surface-card dark:bg-surface-dark p-6 border border-hairline dark:border-divider-dark">
              <div className="text-7xl font-display font-extrabold text-primary tracking-tight">
                <HoverableText text={backChar || '漢'} />
              </div>
              <div className="mt-2 text-2xl font-mono font-bold text-ink dark:text-on-dark">
                {backPinyin || 'hàn'}
              </div>
              <div className="mt-4 text-lg font-medium text-body dark:text-on-dark-mute border-l-4 border-primary pl-3 leading-relaxed">
                {backMeaning || 'nghĩa tiếng Việt...'}
              </div>
            </div>
          </div>

          <div className="self-center bg-surface-card/80 dark:bg-surface-dark/30 border border-hairline dark:border-divider-dark px-5 py-2 rounded-full text-[10px] font-mono font-bold tracking-widest text-mute dark:text-on-dark-mute uppercase">
            Chạm vào thẻ để quay lại
          </div>
        </div>

      </div>
    </div>
  );
}
