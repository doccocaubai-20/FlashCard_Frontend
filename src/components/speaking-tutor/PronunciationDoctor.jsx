import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronRight,
  BookOpen,
  RotateCcw,
  Loader2,
  Award,
} from 'lucide-react';
import AudioRecorderVisualizer from './AudioRecorderVisualizer';
import { speakingTutorApi } from '../../services/speakingTutorApi';
import { useToast } from '../../context/ToastContext';

const HSK_SENTENCE_BANK = [
  {
    id: 1,
    level: 1,
    hanzi: '你好，很高兴认识你。',
    pinyin: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ.',
    meaning: 'Xin chào, rất vui được quen biết bạn.',
  },
  {
    id: 2,
    level: 1,
    hanzi: '我是越南人，我在学中文。',
    pinyin: 'Wǒ shì Yuènán rén, wǒ zài xué Zhōngwén.',
    meaning: 'Tôi là người Việt Nam, tôi đang học tiếng Trung.',
  },
  {
    id: 3,
    level: 2,
    hanzi: '今天天气真好，我们一起去喝咖啡吧。',
    pinyin: 'Jīntiān tiānqì zhēn hǎo, wǒmen yìqǐ qù hē kāfēi ba.',
    meaning: 'Hôm nay thời tiết thật đẹp, chúng ta cùng đi uống cà phê nhé.',
  },
  {
    id: 4,
    level: 2,
    hanzi: '这件衣服多少钱？可以便宜一点吗？',
    pinyin: 'Zhè jiàn yīfu duōshao qián? Kěyǐ piányi yìdiǎn ma?',
    meaning: 'Bộ quần áo này bao nhiêu tiền? Có thể rẻ hơn một chút được không?',
  },
  {
    id: 5,
    level: 3,
    hanzi: '虽然工作很累，但他每天都坚持练习汉语。',
    pinyin: 'Suīrán gōngzuò hěn lèi, dàn tā měi tiān dōu jiānchí liànxí Hànyǔ.',
    meaning: 'Tuy công việc rất mệt, nhưng anh ấy ngày nào cũng kiên trì luyện tiếng Trung.',
  },
  {
    id: 6,
    level: 3,
    hanzi: '遇到困难的时候，千万不要轻易放弃。',
    pinyin: 'Yùdào kùnnan de shíhou, qiānwàn bú yào qīngyì fàngqì.',
    meaning: 'Khi gặp khó khăn, tuyệt đối đừng dễ dàng bỏ cuộc.',
  },
  {
    id: 7,
    level: 4,
    hanzi: '无论遇到什么挑战，我们都要勇敢面对。',
    pinyin: 'Wúlùn yùdào shénme tiǎozhàn, wǒmen dōu yào yǒnggǎn miànduì.',
    meaning: 'Bất kể đối mặt với thử thách nào, chúng ta đều phải dũng cảm đối mặt.',
  },
  {
    id: 8,
    level: 5,
    hanzi: '千里之行，始于足下，每天进步一点点。',
    pinyin: 'Qiān lǐ zhī xíng, shǐ yú zú xià, měitiān jìnbù yì diǎndiǎn.',
    meaning: 'Hành trình ngàn dặm bắt đầu từ một bước chân, mỗi ngày tiến bộ một chút.',
  },
];

export default function PronunciationDoctor() {
  const [selectedSentence, setSelectedSentence] = useState(HSK_SENTENCE_BANK[0]);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('ALL');
  const [customInput, setCustomInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Audio evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState(false);

  const { showToast } = useToast();

  const filteredSentences =
    selectedLevelFilter === 'ALL'
      ? HSK_SENTENCE_BANK
      : HSK_SENTENCE_BANK.filter((s) => s.level === Number(selectedLevelFilter));

  const currentSentence = isCustomMode
    ? {
        hanzi: customInput || '你好',
        pinyin: 'Custom Pinyin',
        meaning: 'Câu luyện phát âm tùy chọn',
        level: 0,
      }
    : selectedSentence;

  // Play native model audio
  const handlePlayModelAudio = async () => {
    try {
      setIsPlayingModelAudio(true);
      // Call backend Edge TTS / Gemini speech synthesis
      const res = await speakingTutorApi.synthesizeSpeech(currentSentence.hanzi);
      if (res && res.audioDataUri) {
        const audio = new Audio(res.audioDataUri);
        audio.onended = () => setIsPlayingModelAudio(false);
        audio.onerror = () => setIsPlayingModelAudio(false);
        await audio.play();
      } else {
        // Fallback to browser SpeechSynthesis
        const utter = new SpeechSynthesisUtterance(currentSentence.hanzi);
        utter.lang = 'zh-CN';
        utter.onend = () => setIsPlayingModelAudio(false);
        utter.onerror = () => setIsPlayingModelAudio(false);
        window.speechSynthesis.speak(utter);
      }
    } catch (err) {
      console.warn('Model audio playback failed:', err);
      setIsPlayingModelAudio(false);
    }
  };

  // Handle recorded audio from AudioRecorderVisualizer
  const handleRecordingComplete = async ({ audioBase64, mimeType }) => {
    if (!audioBase64) return;

    setIsEvaluating(true);
    try {
      const data = await speakingTutorApi.evaluatePronunciation({
        targetText: currentSentence.hanzi,
        targetPinyin: currentSentence.pinyin,
        targetMeaning: currentSentence.meaning,
        audioBase64,
        mimeType,
        level: currentSentence.level || 1,
      });

      setEvaluationResult(data);
      if (data.score >= 80) {
        showToast(`Xuất sắc! Điểm phát âm: ${data.score}/100 (+15 XP)`, 'success');
      } else {
        showToast(`Điểm phát âm: ${data.score}/100. Hãy xem lời khuyên sửa lỗi bên dưới!`, 'info');
      }
    } catch (err) {
      console.error('Pronunciation evaluation error:', err);
      showToast('Không thể phân tích âm thanh lúc này. Vui lòng thử lại.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Level filter & Sentence selector pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1a2332] p-3 rounded-2xl border border-hairline dark:border-white/10 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
          {['ALL', '1', '2', '3', '4', '5'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setSelectedLevelFilter(lvl);
                setIsCustomMode(false);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isCustomMode && selectedLevelFilter === lvl
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả' : `HSK ${lvl}`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCustomMode
                ? 'bg-primary text-white shadow-2xs'
                : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark'
            }`}
          >
            Tự nhập câu
          </button>
        </div>

        {/* Sentence counter */}
        <span className="text-xs text-mute font-medium hidden sm:inline">
          {filteredSentences.length} câu luyện mẫu
        </span>
      </div>

      {/* Main Target Sentence Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 shadow-sm text-center space-y-4">
        {isCustomMode ? (
          <div className="space-y-2 max-w-md mx-auto">
            <label className="text-xs font-bold text-mute uppercase tracking-wider block">
              Nhập câu tiếng Trung bạn muốn luyện phát âm:
            </label>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="VD: 我很喜欢学汉语。"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/10 text-ink dark:text-on-dark text-center font-medium text-lg outline-hidden focus:border-primary"
            />
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-3 border border-primary/20">
              <BookOpen size={13} />
              <span>Câu mẫu HSK {selectedSentence.level}</span>
            </div>

            {/* Target Chinese characters */}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink dark:text-on-dark tracking-wide hanzi-text leading-relaxed">
              {selectedSentence.hanzi}
            </h2>

            {/* Target Pinyin */}
            <p className="text-sm sm:text-base font-semibold text-primary/90 tracking-wider mt-2 font-mono">
              {selectedSentence.pinyin}
            </p>

            {/* Vietnamese meaning */}
            <p className="text-xs sm:text-sm text-mute mt-1 font-medium">
              {selectedSentence.meaning}
            </p>
          </div>
        )}

        {/* Native Audio Listen Button */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={handlePlayModelAudio}
            disabled={isPlayingModelAudio}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-bone dark:bg-white/5 hover:bg-primary/10 hover:text-primary text-ink dark:text-on-dark font-bold text-xs border border-hairline dark:border-white/10 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Nghe phát âm chuẩn Bắc Kinh từ Gemini Live / Edge TTS"
          >
            {isPlayingModelAudio ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <Volume2 size={16} className="text-primary" />
            )}
            <span>Nghe giọng đọc chuẩn mẫu</span>
          </button>
        </div>

        {/* Next/Prev Sentence Buttons */}
        {!isCustomMode && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {filteredSentences.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSentence(s);
                  setEvaluationResult(null);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  selectedSentence.id === s.id
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-hairline dark:bg-white/10 hover:bg-primary/40'
                }`}
                title={`Câu ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Audio Recorder Visualizer */}
      <div className="bg-white dark:bg-[#1a2332] p-6 rounded-3xl border border-hairline dark:border-white/10 shadow-sm">
        <AudioRecorderVisualizer
          onRecordingComplete={handleRecordingComplete}
          isProcessing={isEvaluating}
          label="Bấm giữ hoặc chạm micro để đọc câu mẫu trên"
        />
      </div>

      {/* Evaluation Results Card */}
      {evaluationResult && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 shadow-md space-y-5 animate-fade-in">
          {/* Header Score Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline dark:border-white/10">
            <div className="flex items-center gap-3">
              {/* Circular Score Badge */}
              <div
                className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center font-extrabold text-white shadow-sm ${
                  evaluationResult.score >= 80
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : evaluationResult.score >= 60
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-rose-500 to-red-600'
                }`}
              >
                <span className="text-xl leading-none">{evaluationResult.score}</span>
                <span className="text-[9px] opacity-85 uppercase">Điểm</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base text-ink dark:text-on-dark">
                    {evaluationResult.score >= 80
                      ? 'Phát âm rất chuẩn xác!'
                      : evaluationResult.score >= 60
                      ? 'Khá tốt, cần sửa thanh điệu'
                      : 'Cần luyện tập thêm khẩu hình'}
                  </h3>
                  {evaluationResult.score >= 80 && (
                    <Award size={18} className="text-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-mute mt-0.5">
                  Đánh giá ngữ âm thời gian thực bởi AI Gemini
                </p>
              </div>
            </div>

            {/* Score Breakdown Metrics */}
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5 text-center">
                <span className="text-[10px] text-mute block">Độ chuẩn thanh điệu</span>
                <span className="font-bold text-primary text-sm">
                  {evaluationResult.tonesScore || evaluationResult.score}%
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5 text-center">
                <span className="text-[10px] text-mute block">Độ lưu loát</span>
                <span className="font-bold text-primary text-sm">
                  {evaluationResult.fluencyScore || evaluationResult.score}%
                </span>
              </div>
            </div>
          </div>

          {/* Word-by-word Tone Breakdown Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-mute">
              <span>Chi tiết phát âm từng từ:</span>
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Đúng chuẩn
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Sai thanh điệu
                </span>
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Sai âm đầu/vần
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(evaluationResult.words || []).map((w, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center px-3 py-2 rounded-2xl border transition-all ${
                    w.status === 'correct'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                      : w.status === 'wrong_tone'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                  }`}
                  title={w.feedback || w.status}
                >
                  <span className="text-[11px] font-mono font-semibold opacity-80">
                    {w.targetPinyin || w.detectedPinyin || ''}
                  </span>
                  <span className="text-xl font-extrabold hanzi-char my-0.5">{w.char}</span>
                  <span className="text-[10px] font-medium opacity-75">
                    {w.status === 'correct'
                      ? 'Chuẩn'
                      : w.status === 'wrong_tone'
                      ? 'Lệch thanh'
                      : 'Sai âm'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Vietnamese Advice from AI Tutor */}
          {evaluationResult.advice && (
            <div className="p-4 rounded-2xl bg-surface-bone/80 dark:bg-white/5 border border-hairline dark:border-white/10 space-y-1 text-xs">
              <div className="font-bold text-primary flex items-center gap-1.5 text-xs">
                <Sparkles size={14} />
                <span>Lời khuyên từ Gia sư AI:</span>
              </div>
              <p className="text-ink/85 dark:text-on-dark/85 leading-relaxed">
                {evaluationResult.advice}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
