import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Sparkles,
  BarChart2,
  Award,
  BookOpen
} from 'lucide-react';
import { hskExamApi } from '../services/hskExamApi';

export default function HskExamListScreen() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [examsRes, historyRes] = await Promise.all([
          hskExamApi.getExams(),
          hskExamApi.getResults()
        ]);
        setExams(examsRes.data || []);
        setHistory(historyRes.data || []);
      } catch (err) {
        console.error('Failed to load HSK exam data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getHskColorClass = (level) => {
    switch (level) {
      case 1: return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:border-emerald-500/60';
      case 2: return 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:border-cyan-500/60';
      case 3: return 'border-red-500/30 text-red-400 bg-red-500/5 hover:border-red-500/60';
      case 4: return 'border-amber-500/30 text-amber-400 bg-amber-500/5 hover:border-amber-500/60';
      case 5: return 'border-blue-500/30 text-blue-400 bg-blue-500/5 hover:border-blue-500/60';
      case 6: return 'border-purple-500/30 text-purple-400 bg-purple-500/5 hover:border-purple-500/60';
      default: return 'border-hairline text-mute bg-surface-bone';
    }
  };

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 1: return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 2: return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      case 3: return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 4: return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 5: return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 6: return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-surface-bone text-mute';
    }
  };

  const getHskIconColor = (level) => {
    switch (level) {
      case 1: return 'bg-emerald-500/10 text-emerald-400';
      case 2: return 'bg-cyan-500/10 text-cyan-400';
      case 3: return 'bg-amber-500/10 text-amber-400';
      case 6: return 'bg-red-500/10 text-red-400';
      default: return 'bg-primary/10 text-primary';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-mute">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm font-medium">Đang tải danh sách đề thi HSK...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 select-none animate-fade-in">

      {/* Header Info */}
      <div className="space-y-2">

        <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">

          Luyện đề tổng hợp
        </h1>
        <p className="text-sm text-mute dark:text-on-dark-mute max-w-2xl leading-relaxed">
          Chọn đáp án và nhận chấm chữa tức thì. Kết quả tự động lưu để AI gợi ý đề ôn điểm yếu.
        </p>
      </div>

      {/* Main Standard Mock Exams */}
      <div className="space-y-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            onClick={() => navigate(`/hsk-exams/${exam.id}/play`)}
            className="flex items-center justify-between p-4 bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md hover:border-primary transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${getHskIconColor(exam.hskLevel)}`}>
                <span className="font-bold text-sm font-mono">HSK {exam.hskLevel}</span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-ink dark:text-on-dark flex items-center gap-2">
                  {exam.title}
                </h3>
                <p className="text-xs text-mute dark:text-on-dark-mute">
                  {exam.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-mute hover:text-primary transition-colors">
              <span className="text-[10px] font-mono font-bold">Làm đề</span>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Level-based practice grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-bold text-mute uppercase tracking-widest">
          Luyện đề theo cấp độ
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { level: 1, questions: '~150 câu', templates: '7 mẫu' },
            { level: 2, questions: '~200 câu', templates: '108 mẫu' },
            { level: 3, questions: '~250 câu', templates: '213 mẫu' },
            { level: 4, questions: '~300 câu', templates: '232 mẫu' },
            { level: 5, questions: '~350 câu', templates: '200 mẫu' },
            { level: 6, questions: '~400 câu', templates: '176 mẫu' }
          ].map((item) => (
            <div
              key={item.level}
              onClick={() => navigate(`/hsk-exams/hsk${item.level}-mock-1/play`)}
              className={`p-4 border rounded-md cursor-pointer transition-all duration-300 flex flex-col justify-between h-28 ${getHskColorClass(item.level)}`}
            >
              <div>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${getLevelBadgeColor(item.level)}`}>
                  HSK {item.level}
                </span>
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-xs font-semibold text-ink dark:text-on-dark">{item.questions}</div>
                <div className="text-[10px] text-mute dark:text-on-dark-mute">{item.templates}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats and Adaptive buttons */}
      <div className="flex flex-wrap gap-4 pt-2">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-mono font-bold transition-all cursor-pointer">
          <Sparkles size={14} />
          Ôn điểm yếu (adaptive)
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-mono font-bold transition-all cursor-pointer ${showHistory
            ? 'bg-ink text-white border-ink dark:bg-on-dark dark:text-ink dark:border-on-dark'
            : 'border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark'
            }`}
        >
          <BarChart2 size={14} />
          {showHistory ? 'Ẩn tiến độ' : 'Xem tiến độ'}
        </button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="p-6 bg-surface-card dark:bg-surface-dark/30 border border-hairline dark:border-divider-dark rounded-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-ink dark:text-on-dark flex items-center gap-2">
            <Award size={16} className="text-primary" />
            Lịch sử làm bài thi HSK
          </h3>

          {history.length === 0 ? (
            <p className="text-xs text-mute leading-relaxed text-center py-6">
              Bạn chưa tham gia bài thi mô phỏng nào. Hãy hoàn thành đề thi đầu tiên để ghi nhận tiến độ!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-hairline dark:border-divider-dark text-mute font-mono">
                    <th className="py-2">Tên Đề Thi</th>
                    <th className="py-2">Cấp Độ</th>
                    <th className="py-2 text-center">Đúng/Tổng</th>
                    <th className="py-2 text-center">Điểm Số</th>
                    <th className="py-2 text-center">Thời Gian</th>
                    <th className="py-2 text-right">Ngày Thi</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((res) => (
                    <tr key={res.id} className="border-b border-hairline/40 dark:border-divider-dark/40 font-mono">
                      <td className="py-2.5 font-sans font-bold text-ink dark:text-on-dark">{res.examTitle}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${getLevelBadgeColor(res.hskLevel)}`}>
                          HSK {res.hskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">{res.correctAnswers}/{res.totalQuestions}</td>
                      <td className="py-2.5 text-center font-extrabold text-primary">
                        {res.score}/{res.maxScore}
                      </td>
                      <td className="py-2.5 text-center">
                        {Math.floor(res.duration / 60)}m {res.duration % 60}s
                      </td>
                      <td className="py-2.5 text-right text-mute">
                        {new Date(res.completedAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Test banner card */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-bold text-mute uppercase tracking-widest">
          Bài thi HSK 1 chính thức (Đề chuẩn)
        </h2>
        <div
          onClick={() => navigate('/hsk-exams/hsk1-mock-1/play')}
          className="bg-red-600 rounded-md overflow-hidden text-white cursor-pointer hover:shadow-lg transition-shadow duration-300 relative flex flex-col justify-between"
        >
          {/* Header Banner */}
          <div className="p-6 bg-linear-to-r from-red-600 to-red-500 space-y-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-80">汉语水平考试 • Chinese Proficiency Test</span>
            <h3 className="font-display text-2xl font-extrabold tracking-wide uppercase">HSK 1 模拟试卷</h3>
            <p className="text-xs opacity-90 font-medium">Đề thi mô phỏng HSK 1 — Hoa Ngữ 360</p>
          </div>

          {/* Stats table info */}
          <div className="px-6 pb-6 bg-red-700/40 border-t border-white/10 grid grid-cols-4 gap-4 py-4 text-center">
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono uppercase opacity-75">Cấp độ</div>
              <div className="text-xs font-bold font-mono">HSK 1</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono uppercase opacity-75">Số câu</div>
              <div className="text-xs font-bold font-mono">40 Câu</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono uppercase opacity-75">Thời gian</div>
              <div className="text-xs font-bold font-mono">35 phút</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono uppercase opacity-75">Tổng điểm</div>
              <div className="text-xs font-bold font-mono">200 分</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
