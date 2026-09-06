import React from 'react';
import { X, BookOpen, Droplet, Sparkles, Award, Check } from 'lucide-react';

export default function FarmGuideModal({ onClose }) {
  const steps = [
    {
      step: '1',
      title: 'Gieo Mầm Tri Thức',
      desc: 'Mỗi khi bạn học hoặc ôn tập một từ vựng mới trong flashcard, một mầm xanh sẽ tự động xuất hiện trên luống đất nông trại của bạn.',
      icon: '🌱',
      badge: 'Tự động gieo mầm',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      step: '2',
      title: 'Tưới Nước & Chăm Sóc',
      desc: 'Mỗi buổi ôn tập thành công sẽ thưởng cho bạn 💧 Bình nước. Khi từ vựng đến hạn ôn bài, cây sẽ "khát nước". Hãy tưới nước hoặc ôn lại thẻ để giữ cho vườn luôn xanh tươi!',
      icon: '💧',
      badge: '+1 Bình nước mỗi thẻ ôn',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
    {
      step: '3',
      title: 'Đơm Hoa & Thu Hoạch',
      desc: 'Từ vựng trải qua 4 giai đoạn: Hạt giống ➔ Mầm non ➔ Ra hoa ➔ Cổ thụ hoàng kim. Cây càng thuần thục, bạn càng thu hoạch được nhiều Xu ChongZi mỗi ngày!',
      icon: '🪙',
      badge: 'Thu hoạch Xu hàng ngày',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl select-none text-white my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
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

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center text-xl shadow-lg shrink-0">
            📖
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-sans">
              Cẩm Nang Nông Trại Tri Thức
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Cách chăm sóc cây và thu hoạch thành quả học tập
            </p>
          </div>
        </div>

        {/* 3 Step List */}
        <div className="space-y-4 my-5">
          {steps.map((s) => (
            <div
              key={s.step}
              className="flex items-start gap-3.5 bg-stone-800/40 border border-white/5 p-3.5 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-800 border border-white/10 flex items-center justify-center text-xl shrink-0">
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-stone-100">
                    {s.step}. {s.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>
                <p className="text-xs text-stone-300/80 mt-1 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tip Box */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed mb-5">
          <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-0.5">Mẹo của Nông Gia:</strong>
            Cây đạt cấp độ <strong>Cổ thụ hoàng kim</strong> (khoảng cách ôn tập từ 30 ngày trở lên) sẽ không bao giờ bị héo và luôn mang lại nhiều Xu nhất khi thu hoạch mỗi sáng!
          </div>
        </div>

        {/* Got it Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-98 transition-all"
        >
          <Check size={16} />
          <span>Đã hiểu, vào chăm sóc vườn ngay!</span>
        </button>
      </div>
    </div>
  );
}
