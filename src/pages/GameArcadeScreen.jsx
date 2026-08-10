import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Puzzle,
  Zap,
  ArrowRight,
  Trophy
} from 'lucide-react';

export default function GameArcadeScreen() {
  const navigate = useNavigate();

  const games = [
    {
      title: 'Nối từ chữ Hán',
      description: 'Lật và ghép đôi 12 thẻ bài tương ứng giữa chữ Hán và Pinyin/Ý nghĩa dưới áp lực thời gian. Rèn phản xạ nhận diện mặt chữ.',
      icon: Gamepad2,
      path: '/games/matching',
      color: 'from-pink-500/10 to-rose-500/10 border-pink-500/30 text-pink-500',
      badge: 'Luyện Nhớ Nhanh',
      level: 'Mọi cấp độ'
    },
    {
      title: 'Xếp câu tiếng Trung',
      description: 'Sắp xếp các mảnh ghép từ vựng tiếng Trung xáo trộn thành câu hoàn chỉnh theo ngữ pháp chuẩn dựa trên đề bài dịch nghĩa.',
      icon: Puzzle,
      path: '/games/unscramble',
      color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-500',
      badge: 'Cú pháp & Ngữ pháp',
      level: 'Mọi cấp độ'
    },
    {
      title: 'Gõ từ vựng rơi',
      description: 'Đấu trường phản xạ gõ nhanh. Nhập Pinyin không dấu hoặc dịch nghĩa tiếng Việt của từ rơi xuống để bắn hạ bong bóng trước khi chạm đáy.',
      icon: Zap,
      path: '/games/falling',
      color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-500',
      badge: 'Gõ nhanh phản xạ',
      level: 'Mọi cấp độ'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* Header section */}
      <div className="text-left space-y-2 border-b border-hairline dark:border-divider-dark pb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
          <Gamepad2 size={28} className="text-primary" />
          Đấu trường Trò chơi HSK
        </h1>
        <p className="text-sm text-mute">
          Học mà chơi, chơi mà học! Ôn tập từ vựng, ngữ pháp và rèn phản xạ nhận diện chữ Hán qua các trò chơi tương tác.
        </p>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game, index) => {
          const Icon = game.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(game.path)}
              className="group border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/60 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left relative overflow-hidden"
            >
              {/* Top accent on hover */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-hero-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="space-y-4">
                {/* Icon & Badge row */}
                <div className="flex justify-between items-center">
                  <div className={`h-11 w-11 rounded-xl border bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                    {game.level}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-mute">
                    {game.badge}
                  </span>
                  <h3 className="font-display text-base font-semibold text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-mute leading-relaxed min-h-[52px]">
                    {game.description}
                  </p>
                </div>
              </div>

              {/* Action link */}
              <div className="pt-4 border-t border-hairline dark:border-white/8 mt-4 flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary-deep transition-colors">
                <span className="flex items-center gap-1">
                  <Trophy size={11} className="text-amber-500" />
                  Bắt đầu chơi
                </span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>

          );
        })}
      </div>

    </div>
  );
}
