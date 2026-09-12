import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  HelpCircle,
  Loader2,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ChatInputBar({
  input,
  setInput,
  onSend,
  isLoading,
  selectedDeckId,
  onSelectDeck,
  decks = [],
  quota,
  activePersona = 'general',
}) {
  const [isListening, setIsListening] = useState(false);
  const [micLang, setMicLang] = useState('zh-CN'); // 'zh-CN' or 'vi-VN'
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const deckPickerRef = useRef(null);
  const { showToast } = useToast();

  // Close deck picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deckPickerRef.current && !deckPickerRef.current.contains(event.target)) {
        setShowDeckPicker(false);
      }
    };
    if (showDeckPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeckPicker]);

  const isExhausted = quota && quota.remaining <= 0;

  // Persona-specific smart prompt suggestions
  const PROMPT_CHIPS = {
    general: [
      'Giải thích cấu trúc câu chữ 把 (bǎ)?',
      'Phân biệt cách dùng 二 (èr) và 两 (liǎng)?',
      'Cho tôi 5 từ vựng HSK 3 chủ đề thời tiết?',
      'Cách dùng trợ từ ngữ khí 吧 và 吗?',
    ],
    roleplay: [
      'Chào bạn! Hôm nay chúng ta nói về chủ đề sở thích nhé.',
      'Tôi đang ở sân bay Bắc Kinh, hãy đóng vai nhân viên hải quan hỏi tôi.',
      'Hãy đóng vai bồi bàn nhà hàng Trung Quốc và gợi ý món ăn cho tôi.',
      'Chúng ta hãy luyện tập mặc cả khi mua quần áo ở chợ nhé.',
    ],
    grammar: [
      'Sửa lỗi giúp tôi câu này: 我把苹果吃了昨天。',
      'Câu này dùng 不 hay 没 đúng hơn: 我明天没去学校。',
      'Phân tích lỗi sai: 他很高兴地说了。',
      'Kiểm tra giúp tôi thứ tự từ trong câu này nhé.',
    ],
    hsk: [
      'Phân biệt cặp từ HSK dễ nhầm: 突然 (tūrán) vs 忽然 (hūrán)?',
      'Mẹo làm bài Đọc hiểu HSK 4 phần chọn từ điền vào chỗ trống?',
      'Cho tôi 1 bài tập mô phỏng viết câu HSK 3 kèm đáp án?',
      'Cần lưu ý những bẫy gì trong phần thi Nghe HSK 5?',
    ],
    etymology: [
      'Phân tích chiết tự và ý nghĩa của chữ "爱" (Tình yêu)?',
      'Kể cho tôi điển tích thành ngữ "画蛇添足" (Vẽ rắn thêm chân)?',
      'Ý nghĩa tượng hình cổ xưa của bộ "Thủy" (氵) là gì?',
      'Nguồn gốc và cách nhớ chữ "家" (Nhà)?',
    ],
  };

  const currentChips = PROMPT_CHIPS[activePersona] || PROMPT_CHIPS.general;

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Speech Recognition (STT) setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = micLang;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        showToast(`Đã nhận diện: "${transcript}"`, 'info');
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        showToast('Vui lòng cấp quyền truy cập Microphone cho trình duyệt.', 'error');
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [micLang, setInput, showToast]);

  const handleToggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech.', 'warning');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = micLang;
          recognitionRef.current.start();
        }
      } catch (err) {
        console.warn('Cannot start recognition:', err);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isExhausted && input.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const selectedDeck = decks.find((d) => d.id === selectedDeckId);

  return (
    <div className="space-y-2 pt-2 border-t border-hairline dark:border-white/10 select-none">
      {/* Quick Prompt Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
        {currentChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSend(chip)}
            disabled={isLoading || isExhausted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-surface-bone/90 dark:bg-white/5 border border-hairline dark:border-white/10 text-ink/80 dark:text-on-dark/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs active:scale-98"
          >
            <Sparkles size={11} className="text-primary shrink-0" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 focus-within:border-primary/60 dark:focus-within:border-primary/60 shadow-xs transition-all p-2">
        {/* Top bar inside input: Deck Context Selector & Mic Lang */}
        <div className="flex items-center justify-between gap-2 px-1 pb-1.5 border-b border-hairline/60 dark:border-white/5 text-xs text-mute">
          {/* Deck Context Badge */}
          <div className="relative" ref={deckPickerRef}>
            <button
              type="button"
              onClick={() => setShowDeckPicker((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all cursor-pointer text-[11px] ${
                selectedDeck
                  ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                  : 'bg-transparent text-mute border-transparent hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Chọn bộ thẻ từ vựng để AI dạy theo ngữ cảnh"
            >
              <BookOpen size={12} className={selectedDeck ? 'text-primary' : 'text-mute'} />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">
                {selectedDeck ? `Bộ thẻ: ${selectedDeck.title}` : 'Gắn bộ thẻ học tập...'}
              </span>
              <ChevronDown size={11} />
            </button>

            {/* Deck Picker Dropdown */}
            {showDeckPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/15 rounded-2xl shadow-2xl p-2.5 z-50 animate-slide-down space-y-1.5 ring-1 ring-black/5 dark:ring-white/10">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-mute">
                  <span>Chọn bộ thẻ học</span>
                  <button
                    onClick={() => setShowDeckPicker(false)}
                    className="p-0.5 hover:text-ink cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectDeck(null);
                    setShowDeckPicker(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                    !selectedDeckId
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-white/5'
                  }`}
                >
                  Không gắn bộ thẻ (Hỏi đáp tự do)
                </button>

                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                  {decks.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        onSelectDeck(d.id);
                        setShowDeckPicker(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs truncate transition-all cursor-pointer ${
                        selectedDeckId === d.id
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-white/5'
                      }`}
                    >
                      {d.title} ({d.cardCount || d._count?.flashcards || 0} từ)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Microphone Language Toggle (Trung / Việt) */}
          <button
            type="button"
            onClick={() => setMicLang((v) => (v === 'zh-CN' ? 'vi-VN' : 'zh-CN'))}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-bone dark:bg-white/5 text-mute hover:text-primary transition-colors cursor-pointer border border-hairline dark:border-white/5"
            title="Đổi ngôn ngữ nhận diện giọng nói"
          >
            Mic: {micLang === 'zh-CN' ? '🇨🇳 Tiếng Trung' : '🇻🇳 Tiếng Việt'}
          </button>
        </div>

        {/* Textarea & Actions row */}
        <div className="flex items-end gap-2 pt-1.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isExhausted}
            placeholder={
              isExhausted
                ? 'Đã hết hạn mức tokens hôm nay. Hãy đổi Xu để nạp thêm!'
                : 'Đặt câu hỏi hoặc nhập nội dung tiếng Trung... (Enter để gửi)'
            }
            className="flex-1 bg-transparent border-0 outline-hidden py-1 px-2 text-xs sm:text-sm text-ink dark:text-on-dark resize-none max-h-32 min-h-[36px] placeholder:text-mute focus:ring-0 leading-relaxed"
          />

          {/* Microphone STT button */}
          <button
            type="button"
            onClick={handleToggleMic}
            disabled={isLoading || isExhausted}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                : 'text-mute hover:text-primary hover:bg-primary/10'
            }`}
            title={isListening ? 'Đang lắng nghe... Bấm để dừng' : 'Bấm để nói bằng Microphone'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={() => onSend()}
            disabled={!input.trim() || isLoading || isExhausted}
            className={`flex items-center justify-center h-9 w-9 rounded-xl transition-all cursor-pointer shrink-0 ${
              input.trim() && !isLoading && !isExhausted
                ? 'bg-primary text-white hover:bg-primary-deep shadow-xs active:scale-95'
                : 'bg-surface-bone dark:bg-white/5 text-mute/40 cursor-not-allowed border border-hairline/40 dark:border-white/5'
            }`}
            title="Gửi câu hỏi"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-mute px-1">
        <span>Gõ <strong>Enter</strong> để gửi, <strong>Shift + Enter</strong> để xuống dòng</span>
        <span>Hệ thống AI DeepSeek V3 tiếng Trung</span>
      </div>
    </div>
  );
}
