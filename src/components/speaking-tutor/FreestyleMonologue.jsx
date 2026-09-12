import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import AudioRecorderVisualizer from './AudioRecorderVisualizer';
import { speakingTutorApi } from '../../services/speakingTutorApi';
import { useToast } from '../../context/ToastContext';

const TOPIC_SUGGESTIONS = [
  {
    title: 'Giới thiệu bản thân & Nghề nghiệp',
    chineseTitle: '自我介绍与工作',
    hint: 'Nói về tên, tuổi, quê quán, công việc hiện tại và sở thích.',
  },
  {
    title: 'Một ngày làm việc của bạn',
    chineseTitle: '我的一天',
    hint: 'Kể từ lúc thức dậy, đi làm bằng phương tiện gì, ăn trưa với ai.',
  },
  {
    title: 'Món ăn Trung/Việt bạn thích nhất',
    chineseTitle: '我最喜欢的美食',
    hint: 'Mô tả hương vị (chua, cay, mặn, ngọt), nguyên liệu và cảm nhận.',
  },
  {
    title: 'Kế hoạch du lịch Trung Quốc',
    chineseTitle: '未来的中国旅行计划',
    hint: 'Bạn muốn đi Bắc Kinh, Thượng Hải hay Tây An? Muốn thăm địa danh nào?',
  },
  {
    title: 'Lý do bạn học tiếng Trung',
    chineseTitle: '我为什么学汉语',
    hint: 'Học vì công việc, du học, xem phim hay vì yêu thích văn hóa Hán ngữ?',
  },
];

export default function FreestyleMonologue() {
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_SUGGESTIONS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isPlayingRephraseAudio, setIsPlayingRephraseAudio] = useState(false);

  const { showToast } = useToast();

  const handleRecordingComplete = async ({ audioBase64 }) => {
    if (!audioBase64) return;

    setIsAnalyzing(true);
    try {
      const data = await speakingTutorApi.analyzeMonologue({
        audioBase64,
        promptTitle: selectedTopic.title,
      });

      setAnalysisResult(data);
      showToast('Đã phân tích xong đoạn nói! Nhận +20 XP', 'success');

      // If audio returned for native rephrase, auto-play or prepare it
      if (data.rephraseAudioDataUri) {
        // Ready for user to play
      }
    } catch (err) {
      console.error('Monologue analysis error:', err);
      showToast('Chưa phân tích được đoạn nói. Vui lòng thử lại!', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playRephraseAudio = () => {
    if (!analysisResult?.rephraseAudioDataUri) return;
    setIsPlayingRephraseAudio(true);
    const audio = new Audio(analysisResult.rephraseAudioDataUri);
    audio.onended = () => setIsPlayingRephraseAudio(false);
    audio.onerror = () => setIsPlayingRephraseAudio(false);
    audio.play().catch(() => setIsPlayingRephraseAudio(false));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Topic Suggestions Carousel */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-mute uppercase tracking-wider block">
          Gợi ý chủ đề luyện nói tự do (hoặc nói bất kỳ điều gì bạn muốn):
        </label>
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {TOPIC_SUGGESTIONS.map((topic, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedTopic(topic);
                setAnalysisResult(null);
              }}
              className={`px-4 py-2.5 rounded-2xl border transition-all cursor-pointer whitespace-nowrap text-left shrink-0 ${
                selectedTopic.title === topic.title
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white dark:bg-[#1a2332] text-ink dark:text-on-dark border-hairline dark:border-white/10 hover:bg-surface-bone'
              }`}
            >
              <span className="font-bold text-xs block">{topic.title}</span>
              <span className="text-[10px] opacity-75 font-medium">{topic.chineseTitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Topic Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 shadow-sm text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
          <BookOpen size={13} />
          <span>Chủ đề: {selectedTopic.chineseTitle}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-on-dark">
          {selectedTopic.title}
        </h2>

        <p className="text-xs text-mute max-w-lg mx-auto leading-relaxed">
          Gợi ý nội dung: {selectedTopic.hint} Hãy nói từ 3 - 5 câu liên tục trong tối đa 60 giây.
        </p>
      </div>

      {/* Audio Recorder Visualizer */}
      <div className="bg-white dark:bg-[#1a2332] p-6 rounded-3xl border border-hairline dark:border-white/10 shadow-sm">
        <AudioRecorderVisualizer
          onRecordingComplete={handleRecordingComplete}
          isProcessing={isAnalyzing}
          maxDuration={60}
          label="Chạm micro và bắt đầu thuyết trình tự do (tối đa 60 giây)"
        />
      </div>

      {/* Analysis & Native Rephrasing Results */}
      {analysisResult && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 shadow-md space-y-6 animate-fade-in">
          {/* Header Metric Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-primary text-white flex flex-col items-center justify-center font-extrabold shadow-sm">
                <span className="text-xl leading-none">{analysisResult.score || 85}</span>
                <span className="text-[9px] opacity-85 uppercase">Điểm</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-ink dark:text-on-dark">
                  Đánh giá Khẩu ngữ & Độ tự nhiên
                </h3>
                <p className="text-xs text-mute mt-0.5">
                  {analysisResult.fluency || 'Độ lưu loát khá tốt, ý tứ rõ ràng.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              <span className="text-xs font-bold text-primary">+20 XP đã cộng</span>
            </div>
          </div>

          {/* User's Original Words */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-surface-bone/70 dark:bg-white/5 border border-hairline dark:border-white/5">
            <span className="text-[11px] font-bold text-mute uppercase tracking-wider block">
              Nội dung bạn vừa nói (AI nhận diện):
            </span>
            <p className="text-sm font-medium text-ink dark:text-on-dark leading-relaxed hanzi-text">
              "{analysisResult.originalText}"
            </p>
          </div>

          {/* Native Rephrase Golden Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-teal-500/5 to-primary/10 border border-amber-500/30 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <span className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Bản sửa chuẩn của Người bản xứ (Native Rephrase):
                </span>
              </div>

              {/* Listen to Native Audio of the rephrase */}
              {analysisResult.rephraseAudioDataUri && (
                <button
                  type="button"
                  onClick={playRephraseAudio}
                  disabled={isPlayingRephraseAudio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-deep transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Nghe giọng bản xứ đọc mẫu câu sửa"
                >
                  {isPlayingRephraseAudio ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  <span>Nghe đọc mẫu</span>
                </button>
              )}
            </div>

            <p className="text-lg sm:text-xl font-extrabold text-ink dark:text-on-dark leading-relaxed hanzi-text pt-1">
              {analysisResult.nativeRephrase}
            </p>

            {analysisResult.rephrasePinyin && (
              <p className="font-mono text-xs text-primary font-semibold tracking-wider">
                {analysisResult.rephrasePinyin}
              </p>
            )}

            {analysisResult.rephraseTranslation && (
              <p className="text-xs text-mute leading-relaxed pt-1 border-t border-hairline/60 dark:border-white/10">
                {analysisResult.rephraseTranslation}
              </p>
            )}
          </div>

          {/* Granular Improvements List */}
          {analysisResult.improvements && analysisResult.improvements.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-mute uppercase tracking-wider block">
                Các điểm ngữ pháp & từ vựng cần nâng cấp:
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {analysisResult.improvements.map((imp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 space-y-1.5 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-rose-600 dark:text-rose-400 line-through">
                        {imp.original}
                      </span>
                      <ArrowRight size={13} className="text-mute" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {imp.better}
                      </span>
                    </div>
                    <p className="text-ink/80 dark:text-on-dark/80 text-[11px] leading-relaxed">
                      {imp.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Advice */}
          {analysisResult.overallAdvice && (
            <div className="p-4 rounded-2xl bg-surface-bone/80 dark:bg-white/5 border border-hairline dark:border-white/10 space-y-1 text-xs">
              <span className="font-bold text-primary block">
                Tổng kết lời khuyên:
              </span>
              <p className="text-ink/85 dark:text-on-dark/85 leading-relaxed">
                {analysisResult.overallAdvice}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
