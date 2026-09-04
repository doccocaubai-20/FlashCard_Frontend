import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mic,
  PenTool,
  MessageSquare,
  Languages,
  ArrowRight,
  BookOpenText,
  Flame,
  Zap,
  Sparkles,
  Award,
  Video
} from 'lucide-react';
import { statsApi } from '../services/statsApi';

export default function StudyHubScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = typeof statsApi?.getUserStats === 'function'
          ? await statsApi.getUserStats()
          : (typeof statsApi?.getSummary === 'function' ? await statsApi.getSummary() : null);
        if (res && res.data) {
          setStats({
            streak: res.data.currentStreak ?? res.data.streak ?? 0,
            xp: res.data.xp ?? 0,
            level: res.data.level ?? (Math.floor((res.data.xp || 0) / 100) + 1)
          });
        }
      } catch (err) {
        console.warn('Failed to load study hub stats:', err);
      }
    };
    fetchStats();
  }, []);

  const activities = [
    {
      title: 'Học thẻ Flashcards',
      description: 'Học từ vựng qua thuật toán lặp lại ngắt quãng và bộ thẻ ghi nhớ.',
      icon: GraduationCap,
      path: '/study',
      color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-500',
      badge: 'Cơ bản & Từ vựng'
    },
    {
      title: 'Học qua Video YouTube',
      description: 'Xem hoạt hình & podcast tiếng Trung có phụ đề song ngữ đồng bộ, bấm câu tua lại và luyện nói shadowing.',
      icon: Video,
      path: '/video',
      color: 'from-rose-500/10 to-amber-500/10 border-rose-500/30 text-rose-500',
      badge: 'Video & Podcast'
    },
    {
      title: 'Luyện tập Ngữ pháp HSK',
      description: 'Học các cấu trúc ngữ pháp trọng điểm HSK, kết hợp làm bài tập trắc nghiệm và dịch thuật tự đánh giá.',
      icon: BookOpenText,
      path: '/grammar',
      color: 'from-purple-500/10 to-pink-500/10 border-purple-500/30 text-purple-500',
      badge: 'Luyện cấu trúc'
    },
    {
      title: 'Luyện nói phát âm HSK',
      description: 'Luyện phát âm giọng chuẩn, nhận điểm số chính xác và xem tô màu sửa lỗi sai tức thì qua AI micro.',
      icon: Mic,
      path: '/speaking',
      color: 'from-teal-500/10 to-emerald-500/10 border-teal-500/30 text-teal-500',
      badge: 'Luyện nói AI'
    },
    {
      title: 'Luyện viết chữ Hán',
      description: 'Tập viết chữ Hán theo thứ tự nét vẽ chuẩn, giúp cải thiện trí nhớ hình học chữ viết.',
      icon: PenTool,
      path: '/write',
      color: 'from-orange-500/10 to-amber-500/10 border-orange-500/30 text-orange-500',
      badge: 'Luyện viết nét'
    },
    {
      title: 'Hội thoại giao tiếp HSK',
      description: 'Luyện nghe nói giao tiếp và nhập vai qua các ngữ cảnh đàm thoại thực tế theo bài học HSK.',
      icon: MessageSquare,
      path: '/dialogues',
      color: 'from-purple-500/10 to-pink-500/10 border-purple-500/30 text-purple-500',
      badge: 'Luyện nghe & Phản xạ'
    },
    {
      title: 'Luyện dịch câu song ngữ',
      description: 'Dịch câu Hán ngữ sang tiếng Việt, tương tác tooltip xem nghĩa từng từ và chấm điểm từ khóa tự động.',
      icon: Languages,
      path: '/translation',
      color: 'from-red-500/10 to-rose-500/10 border-red-500/30 text-red-500',
      badge: 'Dịch thuật & Cú pháp'
    },
    {
      title: 'Luyện viết tự do HSK',
      description: 'Luyện viết chữ Hán tự do không giới hạn nét vẽ, tự động nhận diện chữ qua nét vẽ và tra nghĩa từ điển.',
      icon: PenTool,
      path: '/scribble-write',
      color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/30 text-amber-500',
      badge: 'Viết tự do nháp'
    },
    {
      title: 'Luyện nói tự do AI',
      description: 'Nói bất kỳ điều gì bằng tiếng Trung, AI sẽ gõ chữ, kiểm tra phiên âm Pinyin và tra nghĩa từ điển.',
      icon: Mic,
      path: '/speaking-sandbox',
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-500',
      badge: 'Luyện nói tự do'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* Header section */}
      <div className="text-left space-y-2 border-b border-hairline dark:border-divider-dark pb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
          <GraduationCap size={28} className="text-primary" />
          Khu vực Học tập HSK
        </h1>
        <p className="text-sm text-mute">
          Tổng hợp các công cụ luyện tập chuyên sâu 4 kỹ năng Nghe - Nói - Đọc - Viết dành cho người học tiếng Trung.
        </p>
      </div>

      {/* Progress & Motivation Summary Widget */}
      {stats && (
        <div className="bg-gradient-to-r from-primary/10 via-teal-500/5 to-transparent border border-primary/20 dark:border-primary/30 rounded-2xl p-5 shadow-xs text-left">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">

              <div>
                <h3 className="text-sm font-bold text-ink dark:text-on-dark font-display">Tiến trình học tập cá nhân</h3>
                <p className="text-xs text-mute">Duy trì thói quen học mỗi ngày để đạt điểm số cao!</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-orange-500 fill-orange-500" />
                <div>
                  <span className="text-[10px] font-mono text-mute block leading-tight">Chuỗi ngày</span>
                  <span className="text-sm font-bold text-ink dark:text-on-dark font-mono">{stats.streak || 0} ngày</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-500 fill-amber-500" />
                <div>
                  <span className="text-[10px] font-mono text-mute block leading-tight">Tổng XP</span>
                  <span className="text-sm font-bold text-ink dark:text-on-dark font-mono">{stats.xp || 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Award size={18} className="text-purple-500" />
                <div>
                  <span className="text-[10px] font-mono text-mute block leading-tight">Level</span>
                  <span className="text-sm font-bold text-ink dark:text-on-dark font-mono">Lv. {stats.level || 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((act, index) => {
          const Icon = act.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(act.path)}
              className="group border border-hairline hover:border-primary/30 dark:border-white/5 dark:hover:border-primary/40 bg-surface-card dark:bg-surface-dark/60 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left"
            >
              <div className="space-y-4">
                {/* Icon & Badge row */}
                <div className="flex justify-between items-center">
                  <div className={`h-11 w-11 rounded-xl border bg-gradient-to-br ${act.color} flex items-center justify-center`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
                    {act.badge}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  <h3 className="font-display text-base font-semibold text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                    {act.title}
                  </h3>
                  <p className="text-xs text-mute leading-relaxed min-h-[44px]">
                    {act.description}
                  </p>
                </div>
              </div>

              {/* Action link */}
              <div className="pt-4 border-t border-hairline dark:border-white/8 mt-4 flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary-deep transition-colors">
                <span>Bắt đầu học</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
