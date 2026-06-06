import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Star, 
  BookOpenText, 
  Library, 
  Grid, 
  ArrowRight
} from 'lucide-react';

export default function ReferenceHubScreen() {
  const navigate = useNavigate();

  const resources = [
    {
      title: 'Tra từ điển Hán - Việt',
      description: 'Tra cứu đa năng chữ Hán giản thể/phồn thể, phiên âm bính âm, Hán Việt và nghĩa tiếng Việt chi tiết của hơn 20.000 từ.',
      icon: Search,
      path: '/dictionary',
      color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-500',
      badge: 'Công cụ tra cứu'
    },
    {
      title: 'Sổ tay từ vựng đã lưu',
      description: 'Nơi quản lý từ vựng yêu thích, tạo ghi nhớ mnemonic cá nhân, hỗ trợ xuất file Anki (CSV) và in ấn tài liệu học offline.',
      icon: Star,
      path: '/notebook',
      color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/30 text-amber-500',
      badge: 'Bộ nhớ cá nhân'
    },
    {
      title: 'Ngữ pháp HSK trọng điểm',
      description: 'Hệ thống các cấu trúc ngữ pháp quan trọng nhất trong cấp độ HSK 1 - 3, đi kèm giải thích và ví dụ cụ thể.',
      icon: BookOpenText,
      path: '/grammar',
      color: 'from-purple-500/10 to-pink-500/10 border-purple-500/30 text-purple-500',
      badge: 'Lý thuyết ngữ pháp'
    },
    {
      title: 'Thư viện Bộ thủ chữ Hán',
      description: 'Tìm hiểu danh sách 214 bộ thủ tiếng Trung chuẩn xác, hiểu bản chất cấu tạo hình ảnh và ý nghĩa chữ Hán.',
      icon: Library,
      path: '/radicals',
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-500',
      badge: 'Bản chất chữ Hán'
    },
    {
      title: 'Bảng phát âm Pinyin',
      description: 'Hệ thống bảng âm bính âm đầy đủ, nghe audio chuẩn cách ghép âm thanh mẫu, vận mẫu và 4 thanh điệu tiếng Trung.',
      icon: Grid,
      path: '/pinyin',
      color: 'from-teal-500/10 to-cyan-500/10 border-teal-500/30 text-teal-500',
      badge: 'Hệ thống bính âm'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      {/* Header section */}
      <div className="text-left space-y-2 border-b border-hairline dark:border-divider-dark pb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
          <Library size={28} className="text-primary" />
          Thư viện & Công cụ Tra cứu
        </h1>
        <p className="text-sm text-mute">
          Tra từ nhanh chóng, quản lý sổ tay học tập cá nhân và tra cứu toàn diện lý thuyết nền tảng tiếng Trung.
        </p>
      </div>

      {/* Grid activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res, index) => {
          const Icon = res.icon;
          return (
            <div 
              key={index}
              onClick={() => navigate(res.path)}
              className="group border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone/30 dark:bg-surface-dark/40 dark:hover:bg-black/35 rounded-lg p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left"
            >
              <div className="space-y-4">
                {/* Icon & Badge row */}
                <div className="flex justify-between items-center">
                  <div className={`h-12 w-12 rounded-full border bg-gradient-to-r ${res.color} flex items-center justify-center`}>
                    <Icon size={22} />
                  </div>
                  <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-mute border border-hairline dark:border-divider-dark px-2.5 py-1 rounded-full bg-surface-bone dark:bg-black/20">
                    {res.badge}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold text-ink dark:text-on-dark group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {res.title}
                  </h3>
                  <p className="text-xs text-mute leading-relaxed min-h-[50px]">
                    {res.description}
                  </p>
                </div>
              </div>

              {/* Action link */}
              <div className="pt-4 border-t border-hairline dark:border-divider-dark mt-4 flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary-deep transition-colors">
                <span>Tra cứu ngay</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
