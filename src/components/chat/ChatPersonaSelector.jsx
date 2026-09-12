import React from 'react';
import { BookOpen, MessagesSquare, Stethoscope, Target, Sparkles, ScrollText } from 'lucide-react';

export const PERSONAS = [
  {
    id: 'general',
    name: 'ChongZi Tiên Sinh',
    role: 'Gia sư toàn năng',
    desc: 'Giải thích ngữ pháp, từ vựng, mẹo học & hướng dẫn tính năng website',
    icon: BookOpen,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
  },
  {
    id: 'roleplay',
    name: 'Luyện Khẩu Ngữ',
    role: 'Đóng vai giao tiếp',
    desc: 'Hội thoại đời thường ngắn gọn, tự nhiên, luôn đặt câu hỏi tương tác',
    icon: MessagesSquare,
    color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  {
    id: 'grammar',
    name: 'Bác Sĩ Ngữ Pháp',
    role: 'Sửa lỗi câu & Ngữ pháp',
    desc: 'Bảng đối chiếu câu đúng/sai, giải thích cặn kẽ nguyên tắc & cấu trúc',
    icon: Stethoscope,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'hsk',
    name: 'Chiến Lược HSK',
    role: 'Huấn luyện thi cử',
    desc: 'Phân tích bẫy đề thi HSK 1-6, mẹo làm bài nghe/đọc/viết đạt điểm cao',
    icon: Target,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'etymology',
    name: 'Chiết Tự & Thành Ngữ',
    role: 'Khám phá văn hóa',
    desc: 'Bóc tách bộ thủ Lục Thư, giải thích ý nghĩa và điển tích thành ngữ',
    icon: ScrollText,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
];

export default function ChatPersonaSelector({ activePersona, onSelectPersona }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1 px-0.5 select-none">
      {PERSONAS.map((p) => {
        const Icon = p.icon;
        const isActive = activePersona === p.id;

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPersona(p.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer shadow-2xs ${
              isActive
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-surface-bone/80 dark:bg-white/5 text-ink/80 dark:text-on-dark/80 border-hairline dark:border-white/10 hover:border-primary/40 hover:bg-surface-card'
            }`}
            title={`${p.name} (${p.role}): ${p.desc}`}
          >
            <Icon size={14} className={isActive ? 'text-white' : 'text-primary'} />
            <span>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
