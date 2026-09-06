import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { statsApi } from '../services/statsApi';
import { updateProfile } from '../features/auth/authSlice';
import { speakChinese } from '../utils/tts';
import { SCHOLAR_PATHS, setSavedScholarPath } from '../utils/levelSystem';
import {
  BookOpen,
  CheckCircle2,
  Volume2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Award,
  Zap
} from 'lucide-react';

const HSK_LEVEL_OPTIONS = [
  {
    level: 1,
    label: 'HSK 1',
    name: 'Nhập môn Căn bản',
    words: 150,
    description: 'Làm quen bảng chữ cái Pinyin, các nét bút cơ bản và mẫu câu chào hỏi giao tiếp thông dụng hàng ngày.',
    badge: 'Mới bắt đầu'
  },
  {
    level: 2,
    label: 'HSK 2',
    name: 'Sơ cấp Giao tiếp',
    words: 300,
    description: 'Tự tin giao tiếp trong các tình huống mua sắm, thời tiết, sở thích, hỏi đường và cuộc sống hàng ngày.',
    badge: 'Sơ cấp'
  },
  {
    level: 3,
    label: 'HSK 3',
    name: 'Trung cấp 1',
    words: 600,
    description: 'Giao tiếp du lịch, công việc cơ bản, đọc hiểu các văn bản và hội thoại ngắn độc lập.',
    badge: 'Trung cấp'
  },
  {
    level: 4,
    label: 'HSK 4',
    name: 'Trung cấp 2',
    words: 1200,
    description: 'Thảo luận lưu loát nhiều chủ đề xã hội, văn hóa, xem phim có phụ đề và đọc báo tiếng Trung.',
    badge: 'Bán chuyên'
  },
  {
    level: 5,
    label: 'HSK 5',
    name: 'Cao cấp Học thuật',
    words: 2500,
    description: 'Đọc tiểu thuyết, tạp chí chuyên ngành, xem phim không cần phụ đề và thuyết trình trôi chảy.',
    badge: 'Cao cấp'
  },
  {
    level: 6,
    label: 'HSK 6',
    name: 'Bậc thầy Tinh thông',
    words: 5000,
    description: 'Biểu đạt tinh tế chuẩn như người bản xứ, viết luận văn và nghiên cứu học thuật chuyên sâu.',
    badge: 'Thành thạo'
  }
];

const DAILY_GOAL_OPTIONS = [
  {
    target: 10,
    title: 'Thong thả',
    time: '10 - 15 phút / ngày',
    description: 'Thích hợp cho người bận rộn muốn duy trì thói quen học tập nhẹ nhàng, đều đặn mỗi ngày.',
    badge: 'Nhẹ nhàng'
  },
  {
    target: 20,
    title: 'Tiêu chuẩn',
    time: '20 - 25 phút / ngày',
    description: 'Tốc độ cân bằng và hiệu quả nhất, giúp tiến bộ rõ rệt và củng cố trí nhớ dài hạn vững vàng.',
    badge: 'Khuyên dùng ⭐',
    popular: true
  },
  {
    target: 30,
    title: 'Bứt phá',
    time: '30 - 45 phút / ngày',
    description: 'Cường độ học tập cao dành cho người muốn lấy chứng chỉ cấp tốc trong 1 - 2 tháng tới.',
    badge: 'Cấp tốc'
  }
];

const SAMPLE_TUTORIAL_CARDS = [
  {
    hanzi: '学',
    pinyin: 'xué',
    sinoViet: 'HỌC',
    meaning: 'Học tập, nghiên cứu, bắt chước',
    radical: '子 (Tử - Đứa trẻ)',
    strokes: 8,
    etymology: 'Chữ Hội ý: Bộ Miên 宀 che chở mái nhà, bên dưới là đứa trẻ 子 đang được rèn luyện học hành.',
    example: '我们在学校学习汉语。',
    examplePinyin: 'Wǒmen zài xuéxiào xuéxí hànyǔ.',
    exampleMeaning: 'Chúng tôi học tiếng Trung ở trường học.'
  },
  {
    hanzi: '好',
    pinyin: 'hǎo',
    sinoViet: 'HẢO',
    meaning: 'Tốt, đẹp, hay, lành, thân thiện',
    radical: '女 (Nữ - Phụ nữ)',
    strokes: 6,
    etymology: 'Chữ Hội ý: Kết hợp giữa người mẹ (女) và đứa con (子), biểu trưng cho sự tốt đẹp, mỹ mãn và yêu thương.',
    example: '今天天气非常好。',
    examplePinyin: 'Jīntiān tiānqì fēicháng hǎo.',
    exampleMeaning: 'Hôm nay thời tiết rất đẹp.'
  }
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  // Steps: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedHsk, setSelectedHsk] = useState(1);
  const [dailyTarget, setDailyTarget] = useState(20);
  const [selectedScholarPath, setSelectedScholarPath] = useState(user?.scholarPath || 'imperial');
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [deckConfirmed, setDeckConfirmed] = useState(true);

  // Step 4 Tutorial card state
  const [tutorialCardIdx, setTutorialCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [hasInteractedSRS, setHasInteractedSRS] = useState(false);
  const [srsActionNotice, setSrsActionNotice] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const activeTutorialCard = SAMPLE_TUTORIAL_CARDS[tutorialCardIdx];
  const activeHskInfo = HSK_LEVEL_OPTIONS.find((h) => h.level === selectedHsk) || HSK_LEVEL_OPTIONS[0];

  const handlePlayAudio = (e, text) => {
    e?.stopPropagation();
    setIsPlayingAudio(true);
    speakChinese(text);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      // Synchronize daily goal and scholar path with backend
      setIsSavingGoal(true);
      setSavedScholarPath(selectedScholarPath);
      if (user?.id) {
        dispatch(updateProfile({ id: user.id, data: { scholarPath: selectedScholarPath } }));
      }
      try {
        await statsApi.updateGoals({ dailyTarget });
      } catch (err) {
        console.warn('Backend updateGoals non-blocking warning:', err);
      } finally {
        try {
          localStorage.setItem('chongzi_daily_target', dailyTarget.toString());
        } catch {
          // ignore
        }
        setIsSavingGoal(false);
        setCurrentStep(3);
      }
      return;
    }

    if (currentStep === 3) {
      // Save starter deck activation record
      try {
        localStorage.setItem(
          'chongzi_starter_deck_assigned',
          JSON.stringify({
            hskLevel: selectedHsk,
            assignedAt: new Date().toISOString(),
            confirmed: deckConfirmed
          })
        );
      } catch {
        // ignore
      }
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      handleCompleteOnboarding();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSrsAction = (label, days) => {
    setHasInteractedSRS(true);
    setSrsActionNotice(`Thuật toán SRS ghi nhận: Ôn lại sau ${days}!`);
    setTimeout(() => {
      setSrsActionNotice(null);
    }, 3000);
  };

  const handleCompleteOnboarding = () => {
    try {
      const userKey = user?.id ? `onboarding_completed_${user.id}` : 'onboarding_completed_default';
      localStorage.setItem(userKey, 'true');
      localStorage.setItem('chongzi_onboarding_done', 'true');
      setSavedScholarPath(selectedScholarPath);
      if (user?.id) {
        dispatch(updateProfile({ id: user.id, data: { scholarPath: selectedScholarPath } }));
      }
    } catch (e) {
      console.warn('Failed to record onboarding completion:', e);
    }
    navigate('/dashboard', { replace: true });
  };

  const stepTitles = [
    'Chọn cấp độ HSK',
    'Đặt mục tiêu ngày',
    'Gán bộ thẻ đầu tiên',
    'Luyện tập mẫu'
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0b0f19] text-[#1a2332] dark:text-[#f0f4f8] py-8 sm:py-12 px-4 transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* ── Brand Header & Progress Indicator ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl overflow-hidden shadow-md mb-3 ring-2 ring-[#0F5257]/20 border border-[#1a2332]/10 dark:border-white/10">
            <img src="/ap2.png" alt="ChongZi" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1a2332] dark:text-white">
            Chào mừng bạn đến với ChongZi
          </h1>
          <p className="text-xs sm:text-sm text-[#718096] dark:text-[#a0aec0] mt-1">
            Thiết lập lộ trình học cá nhân hóa trong 4 bước đơn giản
          </p>

          {/* Stepper Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="flex items-center justify-between relative">
              {/* Background connecting line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-[#1a2332]/10 dark:bg-white/10 -z-0" />
              {/* Active progress fill line */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#0F5257] transition-all duration-300 -z-0"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {stepTitles.map((title, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum < currentStep;
                const isActive = stepNum === currentStep;

                return (
                  <div key={title} className="flex flex-col items-center relative z-10">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isActive
                          ? 'bg-[#0F5257] text-white ring-4 ring-[#0F5257]/20 shadow-md scale-110'
                          : isCompleted
                          ? 'bg-[#0F5257] text-white shadow-xs'
                          : 'bg-white dark:bg-[#111827] text-[#718096] dark:text-[#a0aec0] border border-[#1a2332]/15 dark:border-white/15'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : stepNum}
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                        isActive
                          ? 'text-[#0F5257] dark:text-[#2dd4bf] font-bold'
                          : 'text-[#718096] dark:text-[#a0aec0]'
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Main Wizard Container ── */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-10 border border-[#1a2332]/10 dark:border-white/10 shadow-xl transition-all">
          {/* STEP 1: Chọn cấp độ HSK mục tiêu */}
          {currentStep === 1 && (
            <div>
              <div className="text-center sm:text-left mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F5257] dark:text-[#2dd4bf]">
                  Bước 1 / 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1a2332] dark:text-white mt-1">
                  Chọn cấp độ HSK mục tiêu của bạn
                </h2>
                <p className="text-xs sm:text-sm text-[#718096] dark:text-[#a0aec0] mt-1">
                  Hệ thống sẽ gợi ý bộ từ vựng và lộ trình ôn tập tương ứng với năng lực của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {HSK_LEVEL_OPTIONS.map((item) => {
                  const isSelected = selectedHsk === item.level;
                  return (
                    <div
                      key={item.level}
                      onClick={() => setSelectedHsk(item.level)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0F5257] bg-[#0F5257]/5 dark:bg-[#0F5257]/15 shadow-sm'
                          : 'border-[#1a2332]/8 dark:border-white/10 hover:border-[#0F5257]/40 bg-white dark:bg-[#111827]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-[#0F5257] dark:text-[#2dd4bf]">
                              {item.label}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F5257]/10 dark:bg-[#0F5257]/30 text-[#0F5257] dark:text-[#d4eef0]">
                              {item.badge}
                            </span>
                          </div>
                          <div
                            className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#0F5257] border-[#0F5257] text-white'
                                : 'border-[#1a2332]/20 dark:border-white/20'
                            }`}
                          >
                            {isSelected && <CheckCircle2 size={13} />}
                          </div>
                        </div>

                        <div className="text-xs font-bold text-[#1a2332] dark:text-white mb-1">
                          {item.name} • {item.words} từ
                        </div>
                        <p className="text-[12px] text-[#718096] dark:text-[#a0aec0] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Đặt mục tiêu học mỗi ngày */}
          {currentStep === 2 && (
            <div>
              <div className="text-center sm:text-left mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F5257] dark:text-[#2dd4bf]">
                  Bước 2 / 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1a2332] dark:text-white mt-1">
                  Bạn muốn học bao nhiêu từ mỗi ngày?
                </h2>
                <p className="text-xs sm:text-sm text-[#718096] dark:text-[#a0aec0] mt-1">
                  Mục tiêu sẽ được đồng bộ vào hệ thống nhiệm vụ và tính toán nhắc nhở tự động.
                </p>
              </div>

              <div className="space-y-3.5 mb-6">
                {DAILY_GOAL_OPTIONS.map((item) => {
                  const isSelected = dailyTarget === item.target;
                  return (
                    <div
                      key={item.target}
                      onClick={() => setDailyTarget(item.target)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-center justify-between ${
                        isSelected
                          ? 'border-[#0F5257] bg-[#0F5257]/5 dark:bg-[#0F5257]/15 shadow-sm'
                          : 'border-[#1a2332]/8 dark:border-white/10 hover:border-[#0F5257]/40 bg-white dark:bg-[#111827]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg font-black text-[#1a2332] dark:text-white">
                            {item.target} từ / ngày
                          </span>
                          <span className="text-xs font-bold text-[#0F5257] dark:text-[#2dd4bf]">
                            ({item.title})
                          </span>
                          {item.popular && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-[#4a5568] dark:text-[#cbd5e0]">
                          Thời gian dự kiến: {item.time}
                        </div>
                        <p className="text-xs text-[#718096] dark:text-[#a0aec0]">
                          {item.description}
                        </p>
                      </div>

                      <div
                        className={`h-6 w-6 rounded-full border shrink-0 ml-4 flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#0F5257] border-[#0F5257] text-white'
                            : 'border-[#1a2332]/20 dark:border-white/20'
                        }`}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Estimated calculation projection */}
              <div className="p-4 rounded-2xl bg-[#0F5257]/10 dark:bg-[#0F5257]/20 border border-[#0F5257]/20 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0F5257] text-white">
                  <Zap size={18} />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#1a2332] dark:text-white block">
                    Ước tính tiến độ:
                  </span>
                  <span className="text-[#4a5568] dark:text-[#cbd5e0]">
                    Với mục tiêu <strong>{dailyTarget} từ/ngày</strong>, bạn sẽ chinh phục toàn bộ <strong>{activeHskInfo.words} từ vựng {activeHskInfo.label}</strong> trong khoảng <strong>{Math.ceil(activeHskInfo.words / dailyTarget)} ngày</strong> học kiên trì!
                  </span>
                </div>
              </div>

              {/* Scholar Path Selection */}
              <div className="mt-6 pt-6 border-t border-[#1a2332]/10 dark:border-white/10 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1a2332] dark:text-white flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Chọn Đạo Lộ Danh Hiệu của bạn</span>
                  </h3>
                  <p className="text-xs text-[#718096] dark:text-[#a0aec0]">
                    Phong cách danh xưng xuất hiện trong suốt quá trình cày cấp học tập (có thể đổi bất cứ lúc nào trong Cài đặt).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(SCHOLAR_PATHS).map((path) => {
                    const isSelected = selectedScholarPath === path.id;
                    return (
                      <div
                        key={path.id}
                        onClick={() => setSelectedScholarPath(path.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0F5257] bg-[#0F5257]/10 dark:bg-[#0F5257]/20 shadow-xs'
                            : 'border-[#1a2332]/8 dark:border-white/10 hover:border-[#0F5257]/30 bg-white dark:bg-[#111827]'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="text-2xl block">{path.icon}</span>
                          <span className="text-xs font-bold text-[#1a2332] dark:text-white block">{path.name}</span>
                          <span className="text-[10px] font-mono text-[#0F5257] dark:text-[#2dd4bf] block">{path.concept}</span>
                          <p className="text-[11px] text-[#718096] dark:text-[#a0aec0] line-clamp-2 leading-relaxed mt-1">{path.description}</p>
                        </div>
                        {isSelected && (
                          <div className="mt-2 text-[10px] font-bold text-[#0F5257] dark:text-[#2dd4bf] flex items-center gap-1">
                            <CheckCircle2 size={12} /> Đang chọn
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Tự động gán bộ thẻ đầu tiên */}
          {currentStep === 3 && (
            <div>
              <div className="text-center sm:text-left mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F5257] dark:text-[#2dd4bf]">
                  Bước 3 / 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1a2332] dark:text-white mt-1">
                  Khởi tạo bộ thẻ HSK {selectedHsk} của bạn
                </h2>
                <p className="text-xs sm:text-sm text-[#718096] dark:text-[#a0aec0] mt-1">
                  ChongZi đã tự động chọn lọc bộ flashcard chuẩn hóa phù hợp nhất với cấp độ của bạn.
                </p>
              </div>

              {/* Starter Deck Preview Box */}
              <div className="p-6 rounded-3xl bg-black/2 dark:bg-white/[0.03] border border-[#1a2332]/10 dark:border-white/10 mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0F5257]/10 text-[#0F5257] dark:text-[#2dd4bf] text-xs font-bold mb-2">
                      <BookOpen size={13} />
                      <span>Bộ thẻ chính thức ChongZi</span>
                    </div>
                    <h3 className="text-lg font-black text-[#1a2332] dark:text-white">
                      Bộ từ vựng chuẩn {activeHskInfo.label} Toàn diện
                    </h3>
                    <p className="text-xs text-[#718096] dark:text-[#a0aec0] mt-0.5">
                      Bao quát {activeHskInfo.words} từ vựng trọng tâm với đầy đủ Chiết tự, Nét bút & Ví dụ hội thoại
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-[#0F5257] dark:text-[#2dd4bf]">
                      {activeHskInfo.words}
                    </span>
                    <span className="block text-[10px] text-[#718096] dark:text-[#a0aec0] uppercase font-bold">
                      Thẻ học
                    </span>
                  </div>
                </div>

                {/* Deck Features Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-y border-[#1a2332]/8 dark:border-white/10 my-4 text-xs font-semibold text-[#4a5568] dark:text-[#cbd5e0]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                    <span>Pinyin chuẩn</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                    <span>Audio giọng Bắc Kinh</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                    <span>Chiết tự Lục thư</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                    <span>Thuật toán SRS</span>
                  </div>
                </div>

                {/* Sample Cards Preview */}
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#718096] dark:text-[#a0aec0] block mb-2">
                    Một số thẻ tiêu biểu trong bộ:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['爱 (ài)', '学 (xué)', '好 (hǎo)', '中国 (zhōngguó)', '朋友 (péngyou)', '谢谢 (xièxie)'].map((sample) => (
                      <span
                        key={sample}
                        className="px-3 py-1 rounded-xl bg-white dark:bg-[#111827] text-xs font-serif font-bold text-[#1a2332] dark:text-white border border-[#1a2332]/10 dark:border-white/10"
                      >
                        {sample}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#111827] border border-[#1a2332]/10 dark:border-white/10 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deckConfirmed}
                  onChange={(e) => setDeckConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#0F5257] cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-semibold text-[#1a2332] dark:text-white">
                  Tự động gán bộ thẻ này vào Thư viện học tập của tôi ngay khi hoàn tất
                </span>
              </label>
            </div>
          )}

          {/* STEP 4: Hướng dẫn lật thẻ mẫu tương tác */}
          {currentStep === 4 && (
            <div>
              <div className="text-center sm:text-left mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F5257] dark:text-[#2dd4bf]">
                  Bước 4 / 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1a2332] dark:text-white mt-1">
                  Trải nghiệm thẻ Flashcard SRS thông minh
                </h2>
                <p className="text-xs sm:text-sm text-[#718096] dark:text-[#a0aec0] mt-1">
                  Thử chạm vào thẻ để lật mặt sau, nghe phát âm và chọn mức độ ghi nhớ mẫu.
                </p>
              </div>

              {/* Card Switcher for sample test */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-[#718096] dark:text-[#a0aec0]">
                  Thẻ thực hành mẫu:
                </span>
                <div className="flex gap-1.5">
                  {SAMPLE_TUTORIAL_CARDS.map((card, idx) => (
                    <button
                      key={card.hanzi}
                      onClick={() => {
                        setTutorialCardIdx(idx);
                        setIsCardFlipped(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tutorialCardIdx === idx
                          ? 'bg-[#0F5257] text-white'
                          : 'bg-black/5 dark:bg-white/5 text-[#4a5568] dark:text-[#cbd5e0]'
                      }`}
                    >
                      {card.hanzi} ({card.pinyin})
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Flashcard Presentation Box */}
              <div className="relative w-full min-h-[360px] bg-[#f8f9fa] dark:bg-[#0b0f19] rounded-3xl p-6 border border-[#1a2332]/10 dark:border-white/10 flex flex-col justify-between shadow-inner">
                {/* Top header on card */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1a2332]/8 dark:border-white/10">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0F5257]/10 text-[#0F5257] dark:text-[#2dd4bf]">
                    Thẻ mẫu tương tác
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handlePlayAudio(e, activeTutorialCard.hanzi)}
                      className="p-1.5 rounded-full bg-[#0F5257]/10 hover:bg-[#0F5257]/20 text-[#0F5257] dark:text-[#2dd4bf] transition-colors cursor-pointer"
                      title="Phát âm tiếng Trung"
                    >
                      <Volume2 size={16} className={isPlayingAudio ? 'animate-bounce' : ''} />
                    </button>

                    <button
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#4a5568] dark:text-[#cbd5e0] transition-colors cursor-pointer"
                      title="Lật mặt thẻ"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                {/* Card Content Front vs Back */}
                {!isCardFlipped ? (
                  /* Front side */
                  <div
                    onClick={() => setIsCardFlipped(true)}
                    className="py-8 text-center cursor-pointer select-none group my-auto"
                  >
                    <div className="text-7xl sm:text-8xl font-serif font-black text-[#0F5257] dark:text-[#2dd4bf] my-2 transition-transform group-hover:scale-105">
                      {activeTutorialCard.hanzi}
                    </div>
                    <div className="text-2xl font-bold text-[#1a2332] dark:text-white">
                      {activeTutorialCard.pinyin}
                    </div>
                    <div className="text-xs text-[#718096] dark:text-[#a0aec0] mt-1">
                      Bộ thủ: {activeTutorialCard.radical} • {activeTutorialCard.strokes} nét
                    </div>
                    <div className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0F5257]/10 text-[#0F5257] dark:text-[#2dd4bf] text-xs font-bold group-hover:bg-[#0F5257]/20 transition-colors">
                      <span>Bấm vào đây để lật mặt sau</span>
                      <RotateCcw size={12} />
                    </div>
                  </div>
                ) : (
                  /* Back side */
                  <div
                    onClick={() => setIsCardFlipped(false)}
                    className="py-4 cursor-pointer select-none space-y-3 my-auto"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#718096] dark:text-[#a0aec0]">
                        Âm Hán Việt
                      </span>
                      <div className="text-xl font-black text-[#0F5257] dark:text-[#2dd4bf]">
                        {activeTutorialCard.sinoViet}
                      </div>
                      <div className="text-sm font-semibold text-[#1a2332] dark:text-white">
                        {activeTutorialCard.meaning}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10 text-xs">
                      <div className="font-bold text-[#0F5257] dark:text-[#2dd4bf] mb-1 flex items-center gap-1">
                        <Sparkles size={13} /> Phân tích Chiết tự
                      </div>
                      <p className="text-[#4a5568] dark:text-[#cbd5e0] leading-relaxed">
                        {activeTutorialCard.etymology}
                      </p>
                    </div>

                    <div className="text-xs">
                      <div className="font-bold text-[#1a2332] dark:text-white flex items-center justify-between mb-0.5">
                        <span>Ví dụ ngữ cảnh:</span>
                        <button
                          onClick={(e) => handlePlayAudio(e, activeTutorialCard.example)}
                          className="text-[#0F5257] dark:text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 size={12} /> Nghe
                        </button>
                      </div>
                      <p className="text-sm font-medium text-[#1a2332] dark:text-white">
                        {activeTutorialCard.example}
                      </p>
                      <p className="text-[11px] text-[#718096] dark:text-[#a0aec0]">
                        {activeTutorialCard.exampleMeaning}
                      </p>
                    </div>
                  </div>
                )}

                {/* SRS Interactive Rating Buttons */}
                <div className="pt-3 border-t border-[#1a2332]/8 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#718096] dark:text-[#a0aec0]">
                      Chọn mức độ nhớ của bạn:
                    </span>
                    {srsActionNotice && (
                      <span className="text-[11px] font-bold text-[#0F5257] dark:text-[#2dd4bf] animate-fade-in">
                        {srsActionNotice}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleSrsAction('Quên', '1 ngày')}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer text-center"
                    >
                      Quên
                      <span className="block text-[9px] font-normal opacity-75">Ôn sau 1 ngày</span>
                    </button>
                    <button
                      onClick={() => handleSrsAction('Nhớ', '3 ngày')}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer text-center"
                    >
                      Nhớ
                      <span className="block text-[9px] font-normal opacity-75">Ôn sau 3 ngày</span>
                    </button>
                    <button
                      onClick={() => handleSrsAction('Thuần thục', '7 ngày')}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer text-center"
                    >
                      Thuần thục
                      <span className="block text-[9px] font-normal opacity-75">Ôn sau 7 ngày</span>
                    </button>
                  </div>
                </div>
              </div>

              {hasInteractedSRS && (
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
                  <Award size={18} className="shrink-0" />
                  <span>
                    Tuyệt vời! Bạn đã hoàn toàn làm quen với phương pháp ôn thẻ SRS. Sẵn sàng bắt đầu hành trình học tập!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Wizard Footer Buttons ── */}
          <div className="mt-8 pt-6 border-t border-[#1a2332]/10 dark:border-white/10 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                onClick={handlePrevStep}
                disabled={isSavingGoal}
                className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border border-[#1a2332]/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 text-[#1a2332] dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Quay lại</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNextStep}
              disabled={isSavingGoal}
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-[#0F5257] hover:bg-[#0a3b3f] text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>
                {currentStep === 4
                  ? 'Hoàn tất & Vào bảng tin'
                  : isSavingGoal
                  ? 'Đang lưu thiết lập...'
                  : 'Tiếp tục'}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
