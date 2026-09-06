import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FarmPlantGraphic from './FarmPlantGraphic';
import { speakChinese } from '../../utils/tts';
import {
  X,
  Volume2,
  Droplet,
  Sparkles,
  PenTool,
  RotateCw,
  Calendar,
  Award,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function PlantDetailModal({
  plant,
  onClose,
  onWater,
  onFertilize,
  waterCount = 0,
  fertilizerCount = 0,
  actionLoading = false,
}) {
  const [flipped, setFlipped] = useState(false);

  if (!plant) return null;

  const {
    id,
    hanzi,
    pinyin,
    meaning,
    exampleHanzi,
    examplePinyin,
    exampleMeaning,
    stage,
    interval = 0,
    repetitions = 0,
    isOverdue = false,
    growthPercentage = 0,
  } = plant;

  const handleSpeak = (e) => {
    e.stopPropagation();
    speakChinese(hanzi);
  };

  const stageNames = {
    seed: { name: 'Hạt giống non', desc: 'Mới nạp vào vườn, cần ôn tập thêm', icon: '🟤' },
    sprout: { name: 'Mầm non 2 lá', desc: 'Ghi nhớ ngắn hạn (dưới 7 ngày)', icon: '🌱' },
    sapling: { name: 'Cây đơm hoa', desc: 'Ghi nhớ trung hạn (từ 7 - 29 ngày)', icon: '🌸' },
    golden: { name: 'Đại cổ thụ hoàng kim', desc: 'Làm chủ vĩnh viễn (từ 30 ngày trở lên)', icon: '🌳' },
  };

  const stageInfo = stageNames[stage] || stageNames.seed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden select-none text-white my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background aura */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5 z-20"
        >
          <X size={18} />
        </button>

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-white/10 pb-5">
          {/* Plant Graphic */}
          <div className="w-28 h-28 rounded-2xl bg-stone-800/50 border border-white/10 flex items-center justify-center shrink-0 p-2 shadow-inner">
            <FarmPlantGraphic stage={stage} isOverdue={isOverdue} size="lg" />
          </div>

          {/* Word Details & Sound */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="text-4xl font-black text-amber-100 font-serif tracking-wide">
                {hanzi}
              </span>
              <button
                type="button"
                onClick={handleSpeak}
                className="w-9 h-9 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-sm"
                title="Nghe phát âm chuẩn"
              >
                <Volume2 size={18} />
              </button>
            </div>
            <div className="text-sm font-mono font-bold text-amber-300/90 mt-1">
              {pinyin || 'Chưa có pinyin'}
            </div>
            <div className="text-sm font-semibold text-stone-200 mt-1.5 leading-snug">
              {meaning || 'Chưa có nghĩa'}
            </div>
          </div>
        </div>

        {/* Interactive Mini-Flashcard Preview */}
        <div className="mt-4">
          <div
            onClick={() => setFlipped(!flipped)}
            className="w-full bg-stone-800/60 hover:bg-stone-800/80 border border-emerald-500/20 rounded-2xl p-3.5 cursor-pointer transition-all text-center relative group"
          >
            <div className="absolute top-2.5 right-3 flex items-center gap-1 text-[10px] text-stone-400 font-medium">
              <RotateCw size={11} className="group-hover:rotate-180 transition-transform duration-300" />
              <span>{flipped ? 'Mặt sau' : 'Bấm để lật thẻ'}</span>
            </div>

            {!flipped ? (
              <div className="py-2">
                <span className="text-2xl font-bold text-emerald-300 font-serif block">
                  {hanzi}
                </span>
                <span className="text-xs text-stone-400 mt-1 block">
                  Bạn có nhớ nghĩa của từ này không?
                </span>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <span className="text-xs font-mono font-bold text-amber-300 block">
                  {pinyin}
                </span>
                <span className="text-sm font-bold text-stone-100 block">
                  {meaning}
                </span>
                {exampleHanzi && (
                  <p className="text-[11px] text-stone-400 italic mt-1 font-serif">
                    "{exampleHanzi}" - {exampleMeaning}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Farm & Growth Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs font-medium">
          {/* Stage */}
          <div className="bg-stone-800/40 border border-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px] mb-1">
              <Layers size={13} />
              <span>Giai đoạn</span>
            </div>
            <div className="font-bold text-emerald-300 flex items-center gap-1">
              <span>{stageInfo.icon}</span>
              <span>{stageInfo.name}</span>
            </div>
          </div>

          {/* Interval */}
          <div className="bg-stone-800/40 border border-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px] mb-1">
              <Calendar size={13} />
              <span>Giãn cách ôn</span>
            </div>
            <div className="font-bold text-amber-300">
              {interval} ngày <span className="text-[10px] text-stone-400">({repetitions} lần ôn)</span>
            </div>
          </div>

          {/* Health Status */}
          <div className="col-span-2 bg-stone-800/40 border border-white/5 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-stone-400 mb-0.5">Tình trạng cây</div>
              <div className={`font-bold text-xs ${isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isOverdue ? '🍂 Khát nước (Cần ôn tập hoặc tưới nước)' : '✨ Tươi tốt & Khỏe mạnh'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-stone-400 mb-0.5">Tiến trình cổ thụ</div>
              <div className="font-bold text-xs text-amber-300">
                {growthPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-5 pt-3 border-t border-white/10">
          {/* Water Button */}
          <button
            type="button"
            onClick={() => onWater(id)}
            disabled={waterCount <= 0 || actionLoading}
            className={`h-11 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
              waterCount > 0
                ? 'bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white shadow-sky-600/20 active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
          >
            <Droplet size={14} className="fill-current" />
            <span>Tưới nước (+5 XP)</span>
          </button>

          {/* Fertilize Button */}
          <button
            type="button"
            onClick={() => onFertilize(id)}
            disabled={fertilizerCount <= 0 || actionLoading}
            className={`h-11 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
              fertilizerCount > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/20 active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
          >
            <Sparkles size={14} />
            <span>Bón phân (+15 XP)</span>
          </button>

          {/* Write Practice Shortcut */}
          <Link
            to={`/write?word=${encodeURIComponent(hanzi)}`}
            className="col-span-2 h-10 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <PenTool size={14} />
            <span>Luyện viết chữ Hán này</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
