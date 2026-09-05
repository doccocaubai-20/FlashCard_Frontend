import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  PenTool,
  Swords,
  Layers,
  ChevronRight,
  GraduationCap,
  MessageSquare,
  BookMarked,
  Sparkles,
} from 'lucide-react';

export default function QuickLinksGrid({ onNavigate }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const hubs = [
    {
      id: 'decks',
      title: 'Bộ thẻ ghi nhớ',
      subtitle: 'Flashcard SRS thông minh',
      badge: 'Cốt lõi',
      path: '/decks',
      icon: Layers,
      accent: 'emerald',
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderHover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'dictionary',
      title: 'Từ điển AI',
      subtitle: 'Tra cứu & phân tích chiết tự',
      badge: 'Tra cứu',
      path: '/dictionary',
      icon: Search,
      accent: 'teal',
      gradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
      borderHover: 'hover:border-teal-500/40 hover:shadow-teal-500/10',
      iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    },
    {
      id: 'writing',
      title: 'Luyện viết chữ Hán',
      subtitle: 'Tập viết theo thứ tự nét chuẩn',
      badge: 'Thủ công',
      path: '/write',
      icon: PenTool,
      accent: 'indigo',
      gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      borderHover: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
      iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'grammar',
      title: 'Ngữ pháp HSK',
      subtitle: 'Cấu trúc câu & mẫu đối thoại',
      badge: 'Hệ thống',
      path: '/grammar',
      icon: BookOpen,
      accent: 'blue',
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      borderHover: 'hover:border-blue-500/40 hover:shadow-blue-500/10',
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'notebook',
      title: 'Sổ tay từ vựng',
      subtitle: 'Từ vựng đã lưu & ghi chú cá nhân',
      badge: 'Ôn tập',
      path: '/notebook',
      icon: BookMarked,
      accent: 'purple',
      gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
      borderHover: 'hover:border-purple-500/40 hover:shadow-purple-500/10',
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'arcade',
      title: 'Đấu trường phản xạ',
      subtitle: 'Falling words & thử thách tốc độ',
      badge: 'Mini-game',
      path: '/game-arcade',
      icon: Swords,
      accent: 'rose',
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderHover: 'hover:border-rose-500/40 hover:shadow-rose-500/10',
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    },
    {
      id: 'hsk-exams',
      title: 'Luyện đề HSK',
      subtitle: 'Mô phỏng thi thực tế HSK 1-6',
      badge: 'Chứng chỉ',
      path: '/hsk-exams',
      icon: GraduationCap,
      accent: 'amber',
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderHover: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'ai-chat',
      title: 'Trợ lý AI Đàm thoại',
      subtitle: 'Luyện giao tiếp ngữ cảnh thực',
      badge: 'AI Smart',
      path: '/chat',
      icon: MessageSquare,
      accent: 'cyan',
      gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      borderHover: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10',
      iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    },
  ];

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-ink dark:text-on-dark flex items-center gap-2">
          <Sparkles size={16} className="text-primary dark:text-hero-glow" />
          <span>Trung tâm học tập &amp; Tính năng chính</span>
        </h2>
      </div>

      {/* Balanced 4-column Grid on desktop, 2-column on mobile/tablet */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {hubs.map((hub) => {
          const Icon = hub.icon;

          return (
            <button
              key={hub.id}
              onClick={() => handleNavigate(hub.path)}
              className={`group relative flex flex-col justify-between p-4 sm:p-4.5 rounded-2xl bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 ${hub.borderHover} shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer text-left overflow-hidden active:scale-[0.98]`}
            >
              {/* Distinctive cell gradient background tint */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${hub.gradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              {/* Card Top: Icon & Badge */}
              <div className="relative flex items-center justify-between mb-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${hub.iconBg} shadow-xs group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-mute dark:text-ash bg-surface-bone/80 dark:bg-white/5 border border-hairline dark:border-white/10 px-2 py-0.5 rounded-full">
                  {hub.badge}
                </span>
              </div>

              {/* Card Bottom: Text Details & Chevron */}
              <div className="relative flex items-end justify-between gap-2 mt-auto">
                <div className="min-w-0 pr-2">
                  <h3 className="text-xs sm:text-sm font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-hero-glow transition-colors truncate">
                    {hub.title}
                  </h3>
                  <p className="text-[11px] text-mute dark:text-ash mt-0.5 line-clamp-1">
                    {hub.subtitle}
                  </p>
                </div>

                <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-surface-bone/60 dark:bg-white/5 text-mute group-hover:text-primary dark:group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  <ChevronRight size={13} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
