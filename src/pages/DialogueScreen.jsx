import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Play, Square, Volume2, ArrowRight, ExternalLink } from 'lucide-react';
import { dialoguesData } from '../data/dialoguesData';
import HoverableText from '../components/common/HoverableText';

export default function DialogueScreen() {
  const navigate = useNavigate();
  const [selectedDialogue, setSelectedDialogue] = useState(dialoguesData[0]);
  const [activeTab, setActiveTab] = useState('chat'); // chat, vocab
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.8);
  const [showMobileList, setShowMobileList] = useState(false);
  
  const timerRef = useRef(null);
  const speechRef = useRef(null);

  const stopAutoPlay = () => {
    setIsPlayingAuto(false);
    setPlayingIndex(-1);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Stop TTS and auto play when switching dialogues
  useEffect(() => {
    stopAutoPlay();
    return () => {
      stopAutoPlay();
    };
  }, [selectedDialogue]);

  const handleSpeakLine = (text, index) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    setPlayingIndex(index);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = speechRate;

    utterance.onend = () => {
      setPlayingIndex(-1);
    };

    utterance.onerror = () => {
      setPlayingIndex(-1);
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startAutoPlay = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlayingAuto(true);
    playNext(0);
  };

  const playNext = (index) => {
    if (index >= selectedDialogue.lines.length) {
      stopAutoPlay();
      return;
    }

    setPlayingIndex(index);
    const line = selectedDialogue.lines[index];
    const utterance = new SpeechSynthesisUtterance(line.hanzi);
    utterance.lang = 'zh-CN';
    utterance.rate = speechRate;

    utterance.onend = () => {
      // Small pause between turns
      timerRef.current = setTimeout(() => {
        playNext(index + 1);
      }, 1500);
    };

    utterance.onerror = () => {
      stopAutoPlay();
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm shrink-0">
          <MessageSquare size={18} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Hội thoại giao tiếp</h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-0.5">
            Luyện nghe, phát âm và phân tích ngữ pháp qua các đoạn hội thoại thực tế trình độ HSK.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Topic List */}
        <div className={`${showMobileList ? 'flex' : 'hidden'} lg:flex lg:col-span-4 flex-col gap-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Danh sách bài học</h3>
            {showMobileList && (
              <button
                type="button"
                onClick={() => setShowMobileList(false)}
                className="lg:hidden text-xs font-bold text-primary dark:text-primary-deep underline cursor-pointer"
              >
                Quay lại
              </button>
            )}
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
            {dialoguesData.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDialogue(d);
                  setShowMobileList(false); // Auto-hide on mobile selection
                }}
                className={`w-full text-left p-4 rounded-md border transition-all cursor-pointer ${
                  selectedDialogue.id === d.id
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-sm'
                    : 'bg-surface-card dark:bg-surface-dark border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                    {d.level}
                  </span>
                </div>
                <h4 className="font-display font-bold text-base text-ink dark:text-on-dark mt-2.5 leading-tight">
                  {d.title}
                </h4>
                <p className="text-xs text-mute dark:text-on-dark-mute mt-1.5 line-clamp-2 leading-relaxed">
                  {d.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {d.topics.map((t, idx) => (
                    <span key={idx} className="text-[9px] font-mono px-2 py-0.5 bg-surface-bone dark:bg-black/50 border border-hairline dark:border-divider-dark rounded-full text-mute dark:text-on-dark-mute">
                      #{t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Dialogue Player */}
        <div className={`${showMobileList ? 'hidden' : 'flex'} lg:flex lg:col-span-8 bg-surface-card dark:bg-surface-dark/50 rounded-md border border-hairline dark:border-divider-dark shadow-sm flex-col min-h-[600px] overflow-hidden`}>
          
          {/* Header Info */}
          <div className="p-6 border-b border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark text-left">
            {/* Mobile lesson selector trigger */}
            <button
              type="button"
              onClick={() => setShowMobileList(true)}
              className="lg:hidden mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-bone hover:bg-surface-bone/85 dark:bg-black/45 dark:hover:bg-black border border-hairline dark:border-divider-dark rounded-full text-xs font-bold text-primary dark:text-primary-deep cursor-pointer"
            >
              📖 Xem bài học khác (Đổi chủ đề)
            </button>
            <h2 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display">
              {selectedDialogue.title}
            </h2>
            <p className="text-sm text-mute dark:text-on-dark-mute mt-1">
              {selectedDialogue.description}
            </p>

            {/* Tabs & Controls */}
            <div className="flex flex-wrap justify-between items-center gap-4 mt-6">
              <div className="flex border border-hairline dark:border-divider-dark rounded-full p-0.5 bg-surface-bone dark:bg-black/30">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-mute hover:text-ink dark:hover:text-on-dark'
                  }`}
                >
                  Hội thoại
                </button>
                <button
                  onClick={() => setActiveTab('vocab')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'vocab'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-mute hover:text-ink dark:hover:text-on-dark'
                  }`}
                >
                  Từ vựng & Ngữ pháp
                </button>
              </div>

              {/* Speach speed rate */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase">Tốc độ đọc:</span>
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark text-xs font-semibold py-1 px-2.5 rounded-full outline-none text-ink dark:text-on-dark focus:ring-1 focus:ring-primary"
                >
                  <option value="0.5">0.5x (Chậm)</option>
                  <option value="0.7">0.7x</option>
                  <option value="0.8">0.8x (Chuẩn học)</option>
                  <option value="1.0">1.0x (Tự nhiên)</option>
                  <option value="1.2">1.2x</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active View Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[450px]">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {selectedDialogue.lines.map((line, idx) => {
                  const isActive = playingIndex === idx;
                  const isSpeakerA = line.speaker.startsWith('A:');
                  
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[85%] ${
                        isSpeakerA ? 'mr-auto items-start' : 'ml-auto items-end'
                      }`}
                    >
                      {/* Speaker Name Tag */}
                      <span className="text-[10px] font-bold text-mute dark:text-on-dark-mute mb-1 px-1">
                        {line.speaker}
                      </span>
                      
                      {/* Bubble */}
                      <div
                        className={`p-4 rounded-md border text-left transition-all duration-300 relative group ${
                          isActive
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/20 scale-101'
                            : isSpeakerA
                            ? 'bg-surface-card dark:bg-surface-dark border-hairline dark:border-divider-dark'
                            : 'bg-primary/5 dark:bg-primary/5 border-primary/20 dark:border-primary/25'
                        }`}
                      >
                        {/* Pronounce single button */}
                        <button
                          onClick={() => handleSpeakLine(line.hanzi, idx)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                          title="Đọc câu này"
                        >
                          <Volume2 size={12} />
                        </button>

                        {/* Hanzi */}
                        <div className="text-xl font-extrabold text-ink dark:text-on-dark font-display tracking-wide mb-1 pr-6">
                          <HoverableText text={line.hanzi} />
                        </div>
                        {/* Pinyin */}
                        <div className="text-xs font-mono font-bold text-primary mb-2">
                          {line.pinyin}
                        </div>
                        {/* Translation */}
                        <div className="text-sm text-body dark:text-on-dark-mute border-t border-hairline dark:border-divider-dark/50 pt-1.5 leading-relaxed">
                          {line.meaning}
                        </div>

                        {/* Metadata Tag */}
                        {line.highlight && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-mute dark:text-on-dark-mute">
                            <span className="px-1.5 py-0.5 bg-surface-bone dark:bg-black/45 border border-hairline dark:border-divider-dark rounded-full">
                              Từ khóa: <strong className="text-ink dark:text-on-dark">{line.highlight}</strong>
                            </span>
                            <button
                              onClick={() => {
                                const cleanWord = line.highlight.split(' ')[0];
                                navigate(`/dictionary?word=${encodeURIComponent(cleanWord)}`);
                              }}
                              className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                            >
                              Tra từ <ExternalLink size={8} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Vocabulary & Grammar breakdown */
              <div className="space-y-8 text-left">
                {/* Vocabulary card list */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-4 border-b border-hairline dark:border-divider-dark pb-2">Từ vựng trọng tâm</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDialogue.vocabulary.map((vocab, idx) => (
                      <div key={idx} className="bg-surface-bone/50 dark:bg-black/20 p-4 rounded-md border border-hairline dark:border-divider-dark flex justify-between items-start">
                        <div>
                          <div className="text-lg font-extrabold text-ink dark:text-on-dark font-display">
                            <HoverableText text={vocab.word} />
                          </div>
                          <div className="text-xs font-mono font-bold text-primary mt-0.5">{vocab.pinyin}</div>
                          <div className="text-sm text-body dark:text-on-dark-mute mt-1.5 font-medium">{vocab.definition}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => navigate(`/dictionary?word=${encodeURIComponent(vocab.word)}`)}
                            className="text-[10px] font-bold px-2.5 py-1 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark rounded-full transition-colors cursor-pointer"
                          >
                            Tra từ
                          </button>
                          <button
                            onClick={() => navigate(`/write?word=${encodeURIComponent(vocab.word)}`)}
                            className="text-[10px] font-bold px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors cursor-pointer"
                          >
                            Luyện viết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grammar links */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-4 border-b border-hairline dark:border-divider-dark pb-2 font-display">Các điểm ngữ pháp liên quan</h3>
                  <div className="space-y-3">
                    {selectedDialogue.lines
                      .filter(l => l.grammarLink)
                      .reduce((acc, curr) => {
                        // Remove duplicates
                        if (!acc.some(x => x.grammarLink === curr.grammarLink)) {
                          acc.push(curr);
                        }
                        return acc;
                      }, [])
                      .map((line, idx) => (
                        <div key={idx} className="bg-surface-bone/30 dark:bg-black/10 p-4 rounded-md border border-hairline dark:border-divider-dark flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <div>
                              <p className="text-sm font-semibold text-ink dark:text-on-dark">Cấu trúc xuất hiện trong dòng: </p>
                              <p className="text-xs text-mute dark:text-on-dark-mute italic mt-0.5">
                                "<HoverableText text={line.hanzi} />"
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/grammar`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full cursor-pointer transition-all shrink-0 active:scale-95"
                          >
                            Xem ngữ pháp HSK
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Audio player panel at bottom */}
          {activeTab === 'chat' && (
            <div className="p-4 border-t border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/35 flex items-center justify-between gap-4">
              
              {/* Play state indicator */}
              <div className="text-xs font-semibold text-mute dark:text-on-dark-mute">
                {isPlayingAuto ? (
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Đang phát tự động: Câu {playingIndex + 1}/{selectedDialogue.lines.length}
                  </span>
                ) : (
                  <span>Chế độ đọc tự động</span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {!isPlayingAuto ? (
                  <button
                    onClick={startAutoPlay}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full cursor-pointer transition-all shadow-sm hover:shadow active:scale-95"
                  >
                    <Play size={12} fill="currentColor" />
                    Phát hội thoại
                  </button>
                ) : (
                  <button
                    onClick={stopAutoPlay}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-mono font-bold text-xs rounded-full cursor-pointer transition-all shadow-sm active:scale-95"
                  >
                    <Square size={12} fill="currentColor" />
                    Dừng lại
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
