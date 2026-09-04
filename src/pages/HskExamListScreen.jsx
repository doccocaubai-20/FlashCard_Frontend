import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Headphones, 
  BookOpen, 
  PenTool, 
  X, 
  Award, 
  History, 
  ChevronRight,
  ArrowRight,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { hskExamApi } from '../services/hskExamApi';

// Subtitle mapping for HSK levels
const LEVEL_SUBTITLES = {
  1: 'Sơ cấp',
  2: 'Sơ cấp',
  3: 'Sơ trung cấp',
  4: 'Trung cấp',
  5: 'Trung cao cấp',
  6: 'Cao cấp'
};

export default function HskExamListScreen() {
  const navigate = useNavigate();

  // State
  const [levels, setLevels] = useState([]);
  const [activeLevel, setActiveLevel] = useState(1);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(false);

  // Modal State
  const [selectedExam, setSelectedExam] = useState(null);
  const [customDuration, setCustomDuration] = useState(35);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // User History State
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load levels on mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [levelsData, historyRes] = await Promise.allSettled([
          hskExamApi.getLevels(),
          hskExamApi.getResults()
        ]);
        
        if (levelsData.status === 'fulfilled' && levelsData.value) {
          setLevels(levelsData.value);
        }
        if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
          setHistory(historyRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load HSK levels:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Load exams when activeLevel changes
  useEffect(() => {
    async function loadLevelExams() {
      try {
        setExamsLoading(true);
        const items = await hskExamApi.getExamsByLevel(activeLevel);
        setExams(items || []);
      } catch (err) {
        console.error(`Failed to load exams for level ${activeLevel}:`, err);
        setExams([]);
      } finally {
        setExamsLoading(false);
      }
    }
    loadLevelExams();
  }, [activeLevel]);

  // Calculate total tests count
  const totalExamsCount = levels.reduce((acc, curr) => acc + (curr.count || 0), 0) || 79;

  // Open modal
  const handleOpenConfigModal = (exam, index) => {
    setSelectedExam({
      ...exam,
      indexNumber: index + 1
    });
    setCustomDuration(exam.durationMinutes || (activeLevel === 1 ? 35 : activeLevel === 2 ? 50 : 85));
    setIsModalOpen(true);
  };

  // Start exam
  const handleStartExam = () => {
    if (!selectedExam) return;
    const duration = Math.max(1, Math.min(180, parseInt(customDuration, 10) || 35));
    navigate(`/hsk-exams/${selectedExam.testId}/play?duration=${duration}`);
  };

  return (
    <div className="min-h-screen pb-20 animate-fade-in text-ink dark:text-on-dark select-none">
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6">
        
        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Total Tests Ready */}
          <div className="bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-6 shadow-xs flex flex-col justify-center">
            <div className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-ink dark:text-on-dark">
              {totalExamsCount}
            </div>
            <div className="text-xs sm:text-sm font-medium text-mute dark:text-on-dark-mute mt-1">
              Đề thi sẵn sàng
            </div>
          </div>

          {/* HSK Levels */}
          <div className="bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-6 shadow-xs flex flex-col justify-center">
            <div className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-ink dark:text-on-dark">
              {levels.length || 6}
            </div>
            <div className="text-xs sm:text-sm font-medium text-mute dark:text-on-dark-mute mt-1">
              Cấp độ HSK
            </div>
          </div>
        </div>

        {/* CHOOSE LEVEL SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-ink dark:text-on-dark">
              Chọn cấp độ
            </h2>
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-deep transition-colors cursor-pointer"
              >
                <History size={15} />
                <span>{showHistory ? 'Ẩn lịch sử thi' : `Lịch sử thi (${history.length})`}</span>
              </button>
            )}
          </div>

          {/* LEVEL TABS */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const lvlInfo = levels.find((l) => l.level === lvl) || { count: 0 };
              const isActive = activeLevel === lvl;

              return (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(lvl)}
                  className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border transition-all duration-200 shrink-0 min-w-[130px] cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#c53030] dark:bg-[#b91c1c] border-[#c53030] text-white shadow-sm'
                      : 'bg-white dark:bg-surface-dark border-hairline dark:border-divider-dark hover:border-hairline-dark text-ink dark:text-on-dark'
                  }`}
                >
                  <div>
                    <div className={`font-bold text-sm leading-tight ${isActive ? 'text-white' : 'text-ink dark:text-on-dark'}`}>
                      HSK {lvl}
                    </div>
                    <div className={`text-[11px] font-medium leading-tight mt-0.5 ${isActive ? 'text-white/80' : 'text-mute dark:text-on-dark-mute'}`}>
                      {LEVEL_SUBTITLES[lvl]}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-[#c53030] dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                    }`}
                  >
                    {lvlInfo.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* EXAM LIST GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink dark:text-on-dark">
              Đề thi thử HSK {activeLevel}
            </h3>
            <span className="text-xs font-medium text-mute dark:text-on-dark-mute">
              {exams.length} đề thi
            </span>
          </div>

          {examsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-mute">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-medium">Đang tải danh sách đề thi HSK {activeLevel}...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="py-16 text-center text-mute dark:text-on-dark-mute border border-dashed border-hairline dark:border-divider-dark rounded-2xl">
              Chưa có đề thi nào cho cấp độ này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {exams.map((exam, index) => {
                const padIndex = String(index + 1).padStart(2, '0');
                const duration = exam.durationMinutes || (activeLevel === 1 ? 35 : activeLevel === 2 ? 50 : 85);
                const listeningCount = exam.listeningQuestionCount || (activeLevel === 1 ? 20 : activeLevel === 2 ? 35 : 40);
                const readingCount = exam.readingQuestionCount || (activeLevel === 1 ? 20 : activeLevel === 2 ? 25 : 30);
                const writingCount = exam.writingQuestionCount || 0;

                return (
                  <div
                    key={exam.testId}
                    onClick={() => handleOpenConfigModal(exam, index)}
                    className="relative overflow-hidden bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-5 hover:shadow-md hover:border-[#c53030]/40 dark:hover:border-red-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[175px] group"
                  >
                    {/* Watermark Number */}
                    <div className="absolute right-3 bottom-0 text-7xl font-extrabold font-sans text-red-500/5 dark:text-red-400/5 select-none pointer-events-none transition-transform group-hover:scale-105">
                      {padIndex}
                    </div>

                    {/* Card Header: Title & Duration */}
                    <div className="flex items-start justify-between gap-2 z-10">
                      <div>
                        <h4 className="font-bold text-base text-ink dark:text-on-dark leading-snug group-hover:text-[#c53030] dark:group-hover:text-red-400 transition-colors">
                          HSK {activeLevel} – Đề {index + 1}
                        </h4>
                        <div className="text-[11px] text-mute dark:text-on-dark-mute font-mono mt-0.5">
                          {exam.title.replace(`HSK ${activeLevel} Test `, '')}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#c53030] dark:text-red-400 shrink-0">
                        {duration} phút
                        <Clock size={13} className="text-[#c53030] dark:text-red-400" />
                      </span>
                    </div>

                    {/* Card Body: Question Breakdown */}
                    <div className="space-y-1.5 pt-6 z-10">
                      <div className="flex items-center gap-2 text-xs font-medium text-ink/80 dark:text-on-dark/80">
                        <Headphones size={14} className="text-red-500/80 dark:text-red-400/80 shrink-0" />
                        <span>{listeningCount} câu nghe</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-ink/80 dark:text-on-dark/80">
                        <BookOpen size={14} className="text-red-500/80 dark:text-red-400/80 shrink-0" />
                        <span>{readingCount} câu đọc</span>
                      </div>
                      {writingCount > 0 && (
                        <div className="flex items-center gap-2 text-xs font-medium text-ink/80 dark:text-on-dark/80">
                          <PenTool size={14} className="text-red-500/80 dark:text-red-400/80 shrink-0" />
                          <span>{writingCount} câu viết</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RECENT HISTORY DRAWER / ACCORDION */}
        {showHistory && history.length > 0 && (
          <div className="bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold tracking-tight text-ink dark:text-on-dark flex items-center gap-2">
              <History size={18} className="text-primary" />
              Lịch sử các lần làm bài
            </h3>
            <div className="divide-y divide-hairline dark:divide-divider-dark">
              {history.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-ink dark:text-on-dark">
                      {item.examTitle || `HSK ${item.hskLevel}`}
                    </div>
                    <div className="text-xs text-mute flex items-center gap-3">
                      <span>{new Date(item.completedAt).toLocaleDateString('vi-VN')}</span>
                      <span>Thời gian: {Math.round(item.duration / 60)} phút</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {item.correctAnswers}/{item.totalQuestions} ({item.score}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* EXAM CONFIGURATION MODAL (Screenshot 2) */}
      {isModalOpen && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-6 shadow-xl space-y-5 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink dark:text-on-dark">
                HSK {activeLevel} – Đề {selectedExam.indexNumber}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-mute hover:text-ink dark:hover:text-on-dark hover:bg-surface-bone dark:hover:bg-black/20 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Time Input Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink/80 dark:text-on-dark/80 block">
                Thời gian (phút)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-hairline dark:border-divider-dark bg-white dark:bg-black/20 text-ink dark:text-on-dark text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 transition-all"
              />
              <p className="text-[11px] text-mute dark:text-on-dark-mute">
                Từ 1 đến 180 phút
              </p>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={handleStartExam}
              className="w-full py-3 px-4 rounded-xl bg-[#1e3a5f] hover:bg-[#162c48] text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              Bắt đầu làm bài
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
