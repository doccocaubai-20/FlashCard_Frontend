import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Flashcard({ 
  cardData, 
  isFlipped, 
  onFlip, 
  frontFaceMode = 'hanzi',
  showPinyinOnFront = false,
  onTogglePinyinOnFront
}) {
  const { character, pinyin, meaning, example } = cardData || {};

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
        className="relative w-full h-[26rem] rounded-3xl shadow-2xl transition-transform duration-700 ease-in-out border border-[#d4af37]/20"
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
            className="absolute top-5 right-5 z-30 inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-black/50 hover:bg-black/70 px-4 py-2.5 text-xs font-bold text-amber-200/90 shadow-md backdrop-blur transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
            title="Ẩn/Hiện phiên âm Pinyin ở mặt trước"
          >
            {showPinyinOnFront ? <EyeOff size={14} className="text-amber-300" /> : <Eye size={14} className="text-amber-300" />}
            <span>{showPinyinOnFront ? 'Ẩn Pinyin' : 'Hiện Pinyin'}</span>
          </button>
        )}

        {/* Front Face (Luxurious Dark Sapphire & Gold Metallic Theme) */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#12131e] via-[#18192a] to-[#0c0d15] p-8 text-white shadow-2xl flex flex-col justify-between"
          style={faceStyle}
        >
          {/* Subtle Watermark Branding */}
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500/20">
            ChongZi Premium Card
          </div>

          <div className="flex flex-col items-center justify-center text-center my-auto">
            {showHanziOnFront ? (
              <div className="flex flex-col items-center">
                {/* Gold Metallic Text Gradient */}
                <div className="text-9xl font-black tracking-tight bg-gradient-to-b from-[#fff2cc] via-[#e2be6c] to-[#a8822d] bg-clip-text text-transparent filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                  {character || '漢'}
                </div>
                
                {/* Pinyin element (space reserved to prevent shifting) */}
                <div 
                  className={`text-2xl font-bold tracking-wide text-amber-300/90 filter drop-shadow-sm transition-all duration-300 mt-4 h-8 flex items-center justify-center ${
                    showPinyinOnFront ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  {pinyin || ''}
                </div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-extrabold tracking-wide max-w-md px-4 leading-normal bg-gradient-to-r from-amber-100 to-amber-300 bg-clip-text text-transparent">
                  {meaning || 'Nghĩa tiếng Việt...'}
                </div>
              </>
            )}
          </div>

          {/* Luxury glassmorphic indicator at bottom */}
          <div className="self-center bg-white/5 border border-white/10 backdrop-blur-md px-6 py-2.5 rounded-full text-[10px] font-bold tracking-widest text-amber-200/60 uppercase shadow-sm">
            Chạm vào thẻ để lật
          </div>
        </div>

        {/* Back Face (Luxurious Cream/Ivory Slate Theme) */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#fcfaf7] via-[#f6f4ee] to-[#ebe7dd] p-8 text-slate-900 shadow-2xl border border-amber-900/10 flex flex-col justify-between"
          style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-800/40 mb-4">
              {showHanziOnFront ? 'Giải nghĩa chi tiết' : 'Từ vựng tiếng Trung'}
            </div>
            
            <div className="rounded-2xl bg-white/95 p-6 shadow-md border border-[#d4af37]/15">
              <div className="text-6xl font-black text-slate-800 tracking-tight">
                {character || '漢'}
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-700">
                {pinyin || 'hàn'}
              </div>
              <div className="mt-4 text-lg font-bold text-slate-700 border-l-4 border-amber-500 pl-3 leading-relaxed">
                {meaning || 'nghĩa tiếng Việt...'}
              </div>
            </div>
          </div>

          {example && (
            <div className="rounded-2xl bg-amber-900/5 border border-amber-900/10 p-4 text-xs text-slate-600">
              <div className="font-extrabold text-amber-900/80 uppercase tracking-wider mb-1">Ví dụ</div>
              <p className="leading-relaxed font-medium">{example}</p>
            </div>
          )}

          <div className="self-center bg-amber-900/5 px-5 py-2 rounded-full text-[10px] font-bold tracking-widest text-amber-800/40 uppercase">
            Chạm vào thẻ để quay lại
          </div>
        </div>

      </div>
    </div>
  );
}
