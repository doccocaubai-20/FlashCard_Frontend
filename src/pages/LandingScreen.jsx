import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { speakChinese } from '../utils/tts';
import {
  Volume2,
  Sparkles,
  Brain,
  Flame,
  Sprout,
  PenTool,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  RotateCcw,
  ChevronRight,
  Layers
} from 'lucide-react';

const SAMPLE_FLASHCARDS = [
  {
    hanzi: '学',
    pinyin: 'xué',
    sinoViet: 'HỌC',
    meaning: 'Học tập, nghiên cứu, bắt chước',
    radical: '子 (Tử - Đứa trẻ)',
    strokes: 8,
    category: 'Hội ý (会意)',
    etymology: 'Bộ Miên 宀 che chở, ở dưới là bộ Tử 子 (đứa trẻ) đang được truyền dạy tri thức.',
    example: '我们在学校学习汉语。',
    examplePinyin: 'Wǒmen zài xuéxiào xuéxí hànyǔ.',
    exampleMeaning: 'Chúng tôi học tiếng Trung ở trường học.',
    compoundWords: '学习 (Học tập) • 学生 (Học sinh) • 学校 (Trường học)'
  },
  {
    hanzi: '爱',
    pinyin: 'ài',
    sinoViet: 'ÁI',
    meaning: 'Yêu thương, yêu thích, quý mến',
    radical: '心 / 夂 (Tâm / Tuy)',
    strokes: 10,
    category: 'Hình thanh & Hội ý',
    etymology: 'Trái tim (心) nâng niu, chân bước chầm chậm (夂) bên người mình yêu thương tha thiết.',
    example: '我非常爱你和我们的家。',
    examplePinyin: 'Wǒ fēicháng ài nǐ hé wǒmen de jiā.',
    exampleMeaning: 'Tôi rất yêu bạn và gia đình của chúng ta.',
    compoundWords: '爱情 (Tình yêu) • 爱好 (Sở thích) • 可爱 (Đáng yêu)'
  },
  {
    hanzi: '道',
    pinyin: 'dào',
    sinoViet: 'ĐẠO',
    meaning: 'Con đường, chân lý, đạo lý, nói',
    radical: '辵 / 辶 (Sước - Bước đi)',
    strokes: 12,
    category: 'Hình thanh (形声)',
    etymology: 'Bộ Thủ 首 (đầu óc, tư tưởng) kết hợp bộ Sước 辶 (hành động, bước đi): tư tưởng dẫn dắt lối đi.',
    example: '千里之行，始于足下。',
    examplePinyin: 'Qiān lǐ zhī xíng, shǐ yú zú xià.',
    exampleMeaning: 'Hành trình ngàn dặm bắt đầu từ bước chân đầu tiên.',
    compoundWords: '道理 (Đạo lý) • 道路 (Đường đi) • 知道 (Biết)'
  }
];

const HSK_LEVELS = [
  {
    level: 'HSK 1',
    words: '150 từ vựng',
    title: 'Nhập môn Căn bản',
    description: 'Làm quen bảng chữ cái Pinyin, các nét bút cơ bản và mẫu câu chào hỏi giao tiếp thông thường.',
    duration: '2 - 4 tuần',
    samples: ['你好', '谢谢', '爸爸', '中国', '再见']
  },
  {
    level: 'HSK 2',
    words: '300 từ vựng',
    title: 'Sơ cấp Giao tiếp',
    description: 'Nắm vững các đoạn hội thoại thường nhật về mua sắm, thời tiết, sở thích và phương hướng.',
    duration: '1 - 2 tháng',
    samples: ['时间', '天气', '朋友', '买东西', '准备']
  },
  {
    level: 'HSK 3',
    words: '600 từ vựng',
    title: 'Trung cấp 1',
    description: 'Tự tin du lịch, giao dịch công việc đơn giản và đọc hiểu các bài khóa ngắn độc lập.',
    duration: '2 - 3 tháng',
    samples: ['经理', '健康', '解决', '环境', '相信']
  },
  {
    level: 'HSK 4',
    words: '1,200 từ vựng',
    title: 'Trung cấp 2',
    description: 'Thảo luận lưu loát nhiều chủ đề xã hội, văn hóa, xem phim có phụ đề và đọc báo tiếng Trung.',
    duration: '3 - 5 tháng',
    samples: ['成功', '法律', '经济', '积极', '坚持']
  },
  {
    level: 'HSK 5',
    words: '2,500 từ vựng',
    title: 'Cao cấp Học thuật',
    description: 'Đọc tiểu thuyết, báo chí chuyên ngành, xem phim không phụ đề và thuyết trình chuyên nghiệp.',
    duration: '6 - 9 tháng',
    samples: ['深刻', '逻辑', '独特', '究竟', '坦率']
  },
  {
    level: 'HSK 6',
    words: '5,000+ từ vựng',
    title: 'Bậc thầy Tinh thông',
    description: 'Sử dụng tiếng Trung chuẩn xác như người bản xứ, biểu đạt tinh tế trong môi trường học thuật cao cấp.',
    duration: '10 - 14 tháng',
    samples: ['卓越', '含蓄', '渊博', '斟酌', '沧桑']
  }
];

export default function LandingScreen() {
  const { classicTheme, setClassicTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedHskIndex, setSelectedHskIndex] = useState(0);
  const [srsFeedback, setSrsFeedback] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentCard = SAMPLE_FLASHCARDS[activeCardIndex];

  const handlePlayAudio = (e, text) => {
    e?.stopPropagation();
    setIsPlayingAudio(true);
    speakChinese(text);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  const handleSrsFeedback = (intervalText) => {
    setSrsFeedback(intervalText);
    setTimeout(() => {
      setSrsFeedback(null);
    }, 2800);
  };

  const toggleTheme = () => {
    setClassicTheme(classicTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0b0f19] text-[#1a2332] dark:text-[#f0f4f8] transition-colors selection:bg-[#0F5257]/20">
      {/* ── 1. Header & Public Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#f8f9fa]/85 dark:bg-[#0b0f19]/85 border-b border-[#1a2332]/10 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-[#0F5257] text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
              虫
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#1a2332] dark:text-white flex items-center gap-1">
                ChongZi
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#0F5257]/10 dark:bg-[#0F5257]/30 text-[#0F5257] dark:text-[#d4eef0]">
                  Tiếng Trung
                </span>
              </span>
              <span className="text-[10px] block text-[#718096] dark:text-[#a0aec0] font-medium tracking-wide">
                Hán tự thông minh & SRS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#4a5568] dark:text-[#cbd5e0]">
            <a href="#features" className="hover:text-[#0F5257] dark:hover:text-[#d4eef0] transition-colors">
              Tính năng cốt lõi
            </a>
            <a href="#demo-preview" className="hover:text-[#0F5257] dark:hover:text-[#d4eef0] transition-colors">
              Trải nghiệm thẻ SRS
            </a>
            <a href="#hsk-levels" className="hover:text-[#0F5257] dark:hover:text-[#d4eef0] transition-colors">
              Lộ trình HSK 1-6
            </a>
            <a href="#methodology" className="hover:text-[#0F5257] dark:hover:text-[#d4eef0] transition-colors">
              Phương pháp Lục thư
            </a>
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-[#4a5568] dark:text-[#cbd5e0] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title={classicTheme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
              aria-label="Toggle theme"
            >
              {classicTheme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
            </button>

            <Link
              to="/login"
              className="px-4 py-2 rounded-full text-sm font-bold text-[#1a2332] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Đăng nhập
            </Link>

            <Link
              to="/register"
              className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#0F5257] hover:bg-[#0a3b3f] text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>Bắt đầu học miễn phí</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[#4a5568] dark:text-[#cbd5e0]"
              aria-label="Toggle theme"
            >
              {classicTheme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#4a5568] dark:text-[#cbd5e0] hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1a2332]/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#0b0f19] px-4 pt-3 pb-5 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#4a5568] dark:text-[#cbd5e0]"
            >
              Tính năng cốt lõi
            </a>
            <a
              href="#demo-preview"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#4a5568] dark:text-[#cbd5e0]"
            >
              Trải nghiệm thẻ SRS
            </a>
            <a
              href="#hsk-levels"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#4a5568] dark:text-[#cbd5e0]"
            >
              Lộ trình HSK 1-6
            </a>
            <a
              href="#methodology"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#4a5568] dark:text-[#cbd5e0]"
            >
              Phương pháp Lục thư
            </a>
            <div className="pt-3 border-t border-[#1a2332]/10 dark:border-white/10 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-full text-sm font-bold border border-[#1a2332]/20 dark:border-white/20 text-[#1a2332] dark:text-white"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 rounded-full text-sm font-bold bg-[#0F5257] text-white shadow-sm"
              >
                Bắt đầu học miễn phí
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Background atmospheric tints */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-[#0F5257]/10 via-[#0F5257]/3 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5257]/10 dark:bg-[#0F5257]/25 text-[#0F5257] dark:text-[#d4eef0] text-xs font-bold mb-6 border border-[#0F5257]/20">
                <Sparkles size={14} className="text-[#0F5257] dark:text-[#d4eef0]" />
                <span>Nền tảng Hán tự Thông minh • SRS & AI Etymology</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-[#1a2332] dark:text-white mb-6">
                Làm chủ Hán tự & Tiếng Trung qua{' '}
                <span className="text-[#0F5257] dark:text-[#2dd4bf] underline decoration-[#0F5257]/30 dark:decoration-[#2dd4bf]/30 underline-offset-8">
                  Đường cong Trí nhớ
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#4a5568] dark:text-[#a0aec0] leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8">
                Tối ưu hoá khả năng ghi nhớ chữ Hán gấp 4 lần bằng thuật toán lặp lại ngắt quãng SRS,
                phân tích chiết tự Lục thư bằng AI và luyện viết từng nét bút chuẩn mực. Học sâu, nhớ lâu, không còn nỗi sợ quên từ.
              </p>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-base font-bold bg-[#0F5257] hover:bg-[#0a3b3f] text-white shadow-lg shadow-[#0F5257]/25 hover:shadow-xl hover:shadow-[#0F5257]/35 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>Bắt đầu học miễn phí</span>
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full text-base font-bold border border-[#1a2332]/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 text-[#1a2332] dark:text-white transition-all text-center"
                >
                  Đăng nhập
                </Link>
              </div>

              {/* Quick Trust Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#1a2332]/10 dark:border-white/10 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#0F5257] dark:text-[#2dd4bf]">5,000+</div>
                  <div className="text-xs text-[#718096] dark:text-[#a0aec0] font-medium">Chữ Hán & Chiết tự</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#0F5257] dark:text-[#2dd4bf]">HSK 1 - 6</div>
                  <div className="text-xs text-[#718096] dark:text-[#a0aec0] font-medium">Lộ trình chuẩn hóa</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#0F5257] dark:text-[#2dd4bf]">98.7%</div>
                  <div className="text-xs text-[#718096] dark:text-[#a0aec0] font-medium">Ghi nhớ dài hạn</div>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Flashcard Widget */}
            <div id="demo-preview" className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-md">
                {/* Character Picker Tabs */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#718096] dark:text-[#a0aec0]">
                    Trải nghiệm thẻ học tương tác
                  </span>
                  <div className="flex gap-1 bg-[#1a2332]/5 dark:bg-white/5 p-1 rounded-lg">
                    {SAMPLE_FLASHCARDS.map((card, idx) => (
                      <button
                        key={card.hanzi}
                        onClick={() => {
                          setActiveCardIndex(idx);
                          setIsFlipped(false);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          activeCardIndex === idx
                            ? 'bg-[#0F5257] text-white shadow-xs'
                            : 'text-[#4a5568] dark:text-[#cbd5e0] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {card.hanzi}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3D Flashcard Box */}
                <div
                  className="relative w-full min-h-[380px] bg-white dark:bg-[#111827] rounded-2xl shadow-xl border border-[#1a2332]/10 dark:border-white/10 p-6 flex flex-col justify-between transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-[#1a2332]/8 dark:border-white/10 pb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#0F5257]/10 dark:bg-[#0F5257]/30 text-[#0F5257] dark:text-[#d4eef0]">
                      {currentCard.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handlePlayAudio(e, currentCard.hanzi)}
                        className="p-1.5 rounded-full bg-[#0F5257]/10 hover:bg-[#0F5257]/20 text-[#0F5257] dark:text-[#2dd4bf] transition-colors cursor-pointer"
                        title="Phát âm tiếng Bắc Kinh"
                      >
                        <Volume2 size={16} className={isPlayingAudio ? 'animate-bounce' : ''} />
                      </button>

                      <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[#4a5568] dark:text-[#cbd5e0] transition-colors cursor-pointer"
                        title="Lật mặt thẻ"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body Front vs Back */}
                  {!isFlipped ? (
                    /* Front View */
                    <div
                      onClick={() => setIsFlipped(true)}
                      className="my-auto py-6 text-center cursor-pointer select-none group"
                    >
                      <div className="text-7xl sm:text-8xl font-serif font-black text-[#0F5257] dark:text-[#2dd4bf] my-2 transition-transform group-hover:scale-105">
                        {currentCard.hanzi}
                      </div>
                      <div className="text-2xl font-bold tracking-wide text-[#1a2332] dark:text-white">
                        {currentCard.pinyin}
                      </div>
                      <div className="text-xs text-[#718096] dark:text-[#a0aec0] font-medium mt-1">
                        Bộ thủ: <span className="font-semibold text-[#1a2332] dark:text-white">{currentCard.radical}</span> • {currentCard.strokes} nét
                      </div>

                      <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F5257] dark:text-[#2dd4bf] bg-[#0F5257]/8 dark:bg-[#0F5257]/20 px-3 py-1.5 rounded-full group-hover:bg-[#0F5257]/15">
                        <span>Chạm để lật xem chiết tự & nghĩa</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  ) : (
                    /* Back View */
                    <div
                      onClick={() => setIsFlipped(false)}
                      className="my-auto py-3 cursor-pointer select-none space-y-3"
                    >
                      <div>
                        <span className="text-[11px] uppercase font-bold tracking-wider text-[#718096] dark:text-[#a0aec0]">
                          Âm Hán Việt
                        </span>
                        <div className="text-lg font-black text-[#0F5257] dark:text-[#2dd4bf]">
                          {currentCard.sinoViet}
                        </div>
                        <div className="text-sm font-semibold text-[#1a2332] dark:text-white mt-0.5">
                          {currentCard.meaning}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/3 dark:bg-white/5 text-xs text-[#4a5568] dark:text-[#cbd5e0] border border-[#1a2332]/5 dark:border-white/5">
                        <div className="font-bold text-[#0F5257] dark:text-[#2dd4bf] mb-0.5 flex items-center gap-1">
                          <Sparkles size={12} /> Chiết tự Lục thư AI
                        </div>
                        <p className="text-[12px] leading-relaxed">{currentCard.etymology}</p>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-bold text-[#1a2332] dark:text-white flex items-center justify-between">
                          <span>Ví dụ ngữ cảnh:</span>
                          <button
                            onClick={(e) => handlePlayAudio(e, currentCard.example)}
                            className="text-[#0F5257] dark:text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Volume2 size={13} /> Nghe
                          </button>
                        </div>
                        <p className="text-sm font-medium text-[#1a2332] dark:text-white">{currentCard.example}</p>
                        <p className="text-[11px] text-[#718096] dark:text-[#a0aec0]">{currentCard.exampleMeaning}</p>
                      </div>
                    </div>
                  )}

                  {/* SRS Reaction Buttons Footer */}
                  <div className="pt-3 border-t border-[#1a2332]/8 dark:border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#718096] dark:text-[#a0aec0]">
                        Chu kỳ nhắc lại SRS:
                      </span>
                      {srsFeedback && (
                        <span className="text-[11px] font-bold text-[#0F5257] dark:text-[#2dd4bf] animate-fade-in">
                          {srsFeedback}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleSrsFeedback('Đã lên lịch ôn: Sau 12 giờ')}
                        className="py-1.5 px-2 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer text-center"
                      >
                        Quên
                        <span className="block text-[9px] font-normal opacity-75">{"< 1 ngày"}</span>
                      </button>
                      <button
                        onClick={() => handleSrsFeedback('Đã lên lịch ôn: Sau 1.5 ngày')}
                        className="py-1.5 px-2 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer text-center"
                      >
                        Khó
                        <span className="block text-[9px] font-normal opacity-75">1.5 ngày</span>
                      </button>
                      <button
                        onClick={() => handleSrsFeedback('Đã lên lịch ôn: Sau 4 ngày')}
                        className="py-1.5 px-2 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer text-center"
                      >
                        Nhớ
                        <span className="block text-[9px] font-normal opacity-75">4 ngày</span>
                      </button>
                      <button
                        onClick={() => handleSrsFeedback('Đã lên lịch ôn: Sau 10 ngày')}
                        className="py-1.5 px-2 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer text-center"
                      >
                        Dễ
                        <span className="block text-[9px] font-normal opacity-75">10 ngày</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. 4 Core Features Showcase ── */}
      <section id="features" className="py-20 bg-black/2 dark:bg-white/[0.02] border-y border-[#1a2332]/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F5257] dark:text-[#2dd4bf] px-3 py-1 rounded-full bg-[#0F5257]/10 dark:bg-[#0F5257]/20">
              Công nghệ & Trải nghiệm
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a2332] dark:text-white mt-4 tracking-tight">
              4 Trụ cột Đột phá Giúp Bạn Chinh phục Chữ Hán
            </h2>
            <p className="text-sm sm:text-base text-[#718096] dark:text-[#a0aec0] mt-3">
              Không học vẹt, không ghi chép cơ học. Mọi tính năng được thiết kế xoay quanh cơ chế nhận thức não bộ và văn hóa Hán tự sâu sắc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Flashcard SRS */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-[#0F5257]/10 dark:bg-[#0F5257]/25 text-[#0F5257] dark:text-[#2dd4bf] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain size={26} />
              </div>
              <h3 className="text-xl font-black text-[#1a2332] dark:text-white mb-3">
                1. Flashcard SRS Thông minh
              </h3>
              <p className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed mb-6">
                Hệ thống lặp lại ngắt quãng (Spaced Repetition System) tính toán chính xác thời điểm bạn chuẩn bị quên một từ để nhắc ôn tập. Tiết kiệm 70% thời gian học mà vẫn ghi nhớ bền bỉ vào trí nhớ dài hạn.
              </p>
              <div className="space-y-2.5 text-xs font-semibold text-[#4a5568] dark:text-[#cbd5e0]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Thuật toán tối ưu hóa đường cong lãng quên Ebbinghaus</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Phân tích độ khó cá nhân hóa cho từng ký tự</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Thao tác phím tắt nhanh và cử chỉ vuốt linh hoạt</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Từ điển AI & Chiết tự Lục thư */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-[#0F5257]/10 dark:bg-[#0F5257]/25 text-[#0F5257] dark:text-[#2dd4bf] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers size={26} />
              </div>
              <h3 className="text-xl font-black text-[#1a2332] dark:text-white mb-3">
                2. Từ điển AI & Chiết tự Lục thư
              </h3>
              <p className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed mb-6">
                Phân tích cấu trúc 6 phép tạo chữ Hán (Tượng hình, Chỉ sự, Hội ý, Hình thanh, Chuyển chú, Giả tá), giải mã 214 bộ thủ và ngữ cảnh sử dụng sống động trong đời sống hiện đại.
              </p>
              <div className="space-y-2.5 text-xs font-semibold text-[#4a5568] dark:text-[#cbd5e0]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Giải mã nguồn gốc cổ văn từ Giáp cốt đến Chân thư</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Cây liên tưởng bộ thủ giúp học 1 chữ nhớ 10 chữ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Ví dụ thực tế kèm phân tích thành phần ngữ pháp</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Luyện viết & Phát âm */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-[#0F5257]/10 dark:bg-[#0F5257]/25 text-[#0F5257] dark:text-[#2dd4bf] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PenTool size={26} />
              </div>
              <h3 className="text-xl font-black text-[#1a2332] dark:text-white mb-3">
                3. Luyện viết Thư pháp & Phát âm Chuẩn
              </h3>
              <p className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed mb-6">
                Vẽ nét chữ Hán chuẩn xác từng quy tắc thuận bút (trên trước dưới sau, trái trước phải sau) với bảng vẽ tương tác, đồng thời luyện nghe giọng Bắc Kinh chuẩn xác với Microsoft Neural TTS.
              </p>
              <div className="space-y-2.5 text-xs font-semibold text-[#4a5568] dark:text-[#cbd5e0]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Mô phỏng động nét chữ Hán (Stroke Order Animation)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Nhận diện chữ viết tay trực tiếp trên canvas di động & desktop</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Phát âm AI tự nhiên chuẩn giọng phổ thông tiêu chuẩn</span>
                </div>
              </div>
            </div>

            {/* Feature 4: Gamification Nông trại */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-[#0F5257]/10 dark:bg-[#0F5257]/25 text-[#0F5257] dark:text-[#2dd4bf] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sprout size={26} />
              </div>
              <h3 className="text-xl font-black text-[#1a2332] dark:text-white mb-3">
                4. Gamification Nông trại Tri thức
              </h3>
              <p className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed mb-6">
                Biến hành trình học ngôn ngữ thành trò chơi nhập vai thú vị. Tích lũy điểm kinh nghiệm (XP), bảo vệ ngọn lửa chuỗi ngày (Streak), tưới nước cho cây kiến thức lớn mạnh từng ngày.
              </p>
              <div className="space-y-2.5 text-xs font-semibold text-[#4a5568] dark:text-[#cbd5e0]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Chuỗi ngày học liên tục (Streak Flame) tạo phản xạ kỷ luật</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Khu vườn nông sản lớn lên dựa trên số từ vựng ôn tập</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0F5257] dark:text-[#2dd4bf]" />
                  <span>Huy hiệu thành tựu và bảng xếp hạng vinh danh cộng đồng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Methodology & HSK 1 - 6 Levels ── */}
      <section id="hsk-levels" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F5257] dark:text-[#2dd4bf] px-3 py-1 rounded-full bg-[#0F5257]/10 dark:bg-[#0F5257]/20">
              Lộ trình Chuẩn hóa
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a2332] dark:text-white mt-4 tracking-tight">
              Bao phủ Toàn diện Khung Năng lực HSK 1 Đến HSK 6
            </h2>
            <p className="text-sm sm:text-base text-[#718096] dark:text-[#a0aec0] mt-3">
              Mỗi cấp độ được biên soạn kỹ lưỡng với đầy đủ flashcard, âm thanh chuẩn, bài tập phản xạ và đề thi thử mô phỏng thực tế.
            </p>
          </div>

          {/* Level Switcher */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8 max-w-3xl mx-auto">
            {HSK_LEVELS.map((item, index) => (
              <button
                key={item.level}
                onClick={() => setSelectedHskIndex(index)}
                className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer border ${
                  selectedHskIndex === index
                    ? 'bg-[#0F5257] text-white border-[#0F5257] shadow-md scale-105'
                    : 'bg-white dark:bg-[#111827] text-[#4a5568] dark:text-[#cbd5e0] border-[#1a2332]/10 dark:border-white/10 hover:border-[#0F5257]/40'
                }`}
              >
                {item.level}
              </button>
            ))}
          </div>

          {/* Selected Level Display Card */}
          {HSK_LEVELS[selectedHskIndex] && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-[#111827] rounded-3xl p-8 border border-[#1a2332]/10 dark:border-white/10 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2332]/10 dark:border-white/10 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-[#0F5257] dark:text-[#2dd4bf]">
                      {HSK_LEVELS[selectedHskIndex].level}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0F5257]/10 dark:bg-[#0F5257]/20 text-[#0F5257] dark:text-[#d4eef0]">
                      {HSK_LEVELS[selectedHskIndex].words}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#1a2332] dark:text-white mt-1">
                    {HSK_LEVELS[selectedHskIndex].title}
                  </h4>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-[#718096] dark:text-[#a0aec0] font-medium block">
                    Thời gian học ước tính:
                  </span>
                  <span className="text-sm font-bold text-[#1a2332] dark:text-white">
                    {HSK_LEVELS[selectedHskIndex].duration} (20 từ/ngày)
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#4a5568] dark:text-[#cbd5e0] leading-relaxed mb-6">
                {HSK_LEVELS[selectedHskIndex].description}
              </p>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#718096] dark:text-[#a0aec0] block mb-3">
                  Từ vựng tiêu biểu trong bộ thẻ:
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {HSK_LEVELS[selectedHskIndex].samples.map((word) => (
                    <button
                      key={word}
                      onClick={() => handlePlayAudio(null, word)}
                      className="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#0F5257]/10 dark:hover:bg-[#0F5257]/30 text-sm font-serif font-bold text-[#1a2332] dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-[#1a2332]/5 dark:border-white/5"
                      title="Bấm để nghe phát âm"
                    >
                      <span>{word}</span>
                      <Volume2 size={12} className="opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#1a2332]/10 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-[#718096] dark:text-[#a0aec0]">
                  Sẵn sàng nâng cấp năng lực Hán tự của bạn?
                </span>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F5257] dark:text-[#2dd4bf] hover:underline"
                >
                  <span>Bắt đầu với {HSK_LEVELS[selectedHskIndex].level}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Methodology Scientific Framework ── */}
      <section id="methodology" className="py-20 bg-black/2 dark:bg-white/[0.02] border-t border-[#1a2332]/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F5257] dark:text-[#2dd4bf] px-3 py-1 rounded-full bg-[#0F5257]/10 dark:bg-[#0F5257]/20">
              Cơ sở Phương pháp luận
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a2332] dark:text-white mt-4 tracking-tight">
              Quy trình 4 Bước Biến Ký Tự Lạ Thành Phản Xạ Tự Nhiên
            </h2>
            <p className="text-sm sm:text-base text-[#718096] dark:text-[#a0aec0] mt-3">
              Áp dụng mô hình kết hợp Chiết tự hình thanh học và thuật toán lặp lại ngắt quãng khoa học.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10">
              <div className="text-3xl font-black text-[#0F5257]/30 dark:text-[#2dd4bf]/30 mb-3">01</div>
              <h4 className="text-base font-bold text-[#1a2332] dark:text-white mb-2">
                Tiếp nhận & Chiết tự
              </h4>
              <p className="text-xs text-[#718096] dark:text-[#a0aec0] leading-relaxed">
                Khám phá câu chuyện hình thành và bộ thủ cốt lõi của chữ Hán qua AI etymology, biến ký tự vô hồn thành hình ảnh sống động.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10">
              <div className="text-3xl font-black text-[#0F5257]/30 dark:text-[#2dd4bf]/30 mb-3">02</div>
              <h4 className="text-base font-bold text-[#1a2332] dark:text-white mb-2">
                Khắc sâu Nét bút
              </h4>
              <p className="text-xs text-[#718096] dark:text-[#a0aec0] leading-relaxed">
                Tập viết trực tiếp trên canvas theo đúng quy tắc thuận bút, kết hợp nghe phát âm chuẩn để kích hoạt trí nhớ cơ bắp và thính giác.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10">
              <div className="text-3xl font-black text-[#0F5257]/30 dark:text-[#2dd4bf]/30 mb-3">03</div>
              <h4 className="text-base font-bold text-[#1a2332] dark:text-white mb-2">
                Củng cố Ngắt quãng
              </h4>
              <p className="text-xs text-[#718096] dark:text-[#a0aec0] leading-relaxed">
                Hệ thống SRS tự động tính toán điểm rơi trí nhớ, chỉ gọi lại từ vựng khi bạn sắp quên để tối ưu hóa sự ghi nhớ vĩnh viễn.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#1a2332]/8 dark:border-white/10">
              <div className="text-3xl font-black text-[#0F5257]/30 dark:text-[#2dd4bf]/30 mb-3">04</div>
              <h4 className="text-base font-bold text-[#1a2332] dark:text-white mb-2">
                Thực chiến Đời sống
              </h4>
              <p className="text-xs text-[#718096] dark:text-[#a0aec0] leading-relaxed">
                Vận dụng từ vựng vào đề thi thử HSK, minigame đuổi hình bắt chữ và giao tiếp tương tác với trợ lý AI ChongZi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Final Call to Action ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-[#0F5257] text-white shadow-2xl relative overflow-hidden">
            {/* Background embellishment */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-black/15 blur-2xl pointer-events-none" />

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold mb-4 backdrop-blur-sm">
              <Flame size={14} className="text-amber-300" />
              <span>Khởi đầu hành trình ngay hôm nay</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Làm chủ Hán tự không khó khi bạn có phương pháp đúng
            </h2>

            <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Gia nhập cộng đồng hơn 15,000 người học tiếng Trung thông minh với ChongZi. Đăng ký tài khoản miễn phí trong 30 giây.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-black bg-white text-[#0F5257] hover:bg-white/90 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Tạo tài khoản học thử miễn phí</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-4 rounded-full text-base font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all text-center"
              >
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Public Footer ── */}
      <footer className="border-t border-[#1a2332]/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#0b0f19] py-14 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand column */}
            <div className="md:col-span-1 space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#0F5257] text-white flex items-center justify-center font-bold text-lg">
                  虫
                </div>
                <span className="text-lg font-black tracking-tight text-[#1a2332] dark:text-white">
                  ChongZi 虫子
                </span>
              </Link>
              <p className="text-xs text-[#718096] dark:text-[#a0aec0] leading-relaxed">
                Nền tảng học Hán tự và Tiếng Trung thông minh thế hệ mới, ứng dụng Spaced Repetition và phân tích Lục thư AI.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-[#1a2332]/15 dark:border-white/15 text-[#4a5568] dark:text-[#cbd5e0] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {classicTheme === 'dark' ? (
                    <>
                      <Sun size={13} className="text-amber-400" />
                      <span>Chế độ Sáng</span>
                    </>
                  ) : (
                    <>
                      <Moon size={13} />
                      <span>Chế độ Tối</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Links: Học tập */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#1a2332] dark:text-white mb-3">
                Học tập & Tính năng
              </h5>
              <ul className="space-y-2 text-xs text-[#718096] dark:text-[#a0aec0]">
                <li>
                  <a href="#demo-preview" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    Flashcard SRS thông minh
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    Chiết tự Lục thư AI
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    Tập viết chuẩn nét bút
                  </a>
                </li>
                <li>
                  <a href="#hsk-levels" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    Bộ đề thi HSK 1 - 6
                  </a>
                </li>
              </ul>
            </div>

            {/* Links: Tài nguyên */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#1a2332] dark:text-white mb-3">
                Khung HSK
              </h5>
              <ul className="space-y-2 text-xs text-[#718096] dark:text-[#a0aec0]">
                <li>
                  <a href="#hsk-levels" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    HSK 1 - Căn bản 150 từ
                  </a>
                </li>
                <li>
                  <a href="#hsk-levels" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    HSK 2 - Sơ cấp 300 từ
                  </a>
                </li>
                <li>
                  <a href="#hsk-levels" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    HSK 3 - Trung cấp 600 từ
                  </a>
                </li>
                <li>
                  <a href="#hsk-levels" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    HSK 4, 5, 6 - Nâng cao
                  </a>
                </li>
              </ul>
            </div>

            {/* Links: ChongZi & Hỗ trợ */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#1a2332] dark:text-white mb-3">
                ChongZi Tiếng Trung
              </h5>
              <ul className="space-y-2 text-xs text-[#718096] dark:text-[#a0aec0]">
                <li>
                  <Link to="/login" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    Đăng nhập tài khoản
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#0F5257] dark:hover:text-white transition-colors">
                    Tạo tài khoản mới
                  </Link>
                </li>
                <li>
                  <span className="text-[#a0aec0] dark:text-[#718096]">
                    Hỗ trợ: support@chongzi.app
                  </span>
                </li>
                <li>
                  <span className="text-[#a0aec0] dark:text-[#718096]">
                    Phiên bản web v2.0.0
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1a2332]/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#718096] dark:text-[#a0aec0] gap-4">
            <div>
              © 2026 ChongZi (虫子). Bản quyền thuộc về đội ngũ phát triển ChongZi.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:underline cursor-pointer">Điều khoản dịch vụ</span>
              <span className="hover:underline cursor-pointer">Chính sách bảo mật</span>
              <span className="hover:underline cursor-pointer">Cộng đồng</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
