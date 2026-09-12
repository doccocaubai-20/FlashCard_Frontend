import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
  Send,
  Loader2,
  PhoneCall,
  User,
  Bot,
  MessageSquare,
} from 'lucide-react';
import AudioRecorderVisualizer from './AudioRecorderVisualizer';
import { speakingTutorApi } from '../../services/speakingTutorApi';
import { useToast } from '../../context/ToastContext';

const DEFAULT_SCENARIOS = [
  {
    id: 'free_chat',
    title: 'Tán Gẫu Tự Do (自由闲聊)',
    level: 'Mọi trình độ',
    avatar: '👋',
    roleName: 'Bạn thân bản xứ Tiểu Lệ (小丽)',
    context: 'Nói chuyện phiếm, chém gió tự do bất cứ chuyện gì: hỏi han, than thở, kể chuyện hôm nay, thời tiết, sở thích...',
    initialGreeting: '哈喽！今天过得怎么样？在忙什么呢，有什么好玩的事想和我聊聊吗？',
    initialPinyin: 'Hālou! Jīntiān guò de zěnmeyàng? Zài máng shénme ne, yǒu shénme hǎowán de shì xiǎng hé wǒ liáoliao ma?',
    initialMeaning: 'Hê-lô! Hôm nay của bạn thế nào rồi? Đang bận gì đấy, có chuyện gì vui muốn tám với tôi không?',
  },
  {
    id: 'restaurant',
    title: 'Nhà Hàng Bắc Kinh (北京餐馆)',
    level: 'HSK 2-3',
    avatar: '🍲',
    roleName: 'Phục vụ bàn Tiểu Vương (小王)',
    context: 'Bạn bước vào một nhà hàng món Bắc Kinh truyền thống vào giờ ăn trưa.',
    initialGreeting: '您好！欢迎光临，请问几位？今天想吃点什么特色菜？',
    initialPinyin: 'Nín hǎo! Huānyíng guānglín, qǐngwèn jǐ wèi? Jīntiān xiǎng chī diǎn shénme tèsè cài?',
    initialMeaning: 'Xin chào! Hoan nghênh quý khách, xin hỏi đi mấy người? Hôm nay quý khách muốn dùng món đặc sản gì ạ?',
  },
  {
    id: 'airport',
    title: 'Thủ Tục Sân Bay & Hải Quan (机场海关)',
    level: 'HSK 3-4',
    avatar: '✈️',
    roleName: 'Nhân viên Hải quan (海关人员)',
    context: 'Bạn đang làm thủ tục nhập cảnh tại Sân bay Quốc tế Thủ đô Bắc Kinh.',
    initialGreeting: '你好，请出示您的护照和入境卡。您来中国的主要目的是什么？',
    initialPinyin: 'Nǐ hǎo, qǐng chūshì nín de hùzhào hé rùjìng kǎ. Nín lái Zhōngguó de zhǔyào mùdì shì shénme?',
    initialMeaning: 'Chào bạn, vui lòng xuất trình hộ chiếu và tờ khai nhập cảnh. Mục đích chính đến Trung Quốc của bạn là gì?',
  },
  {
    id: 'shopping',
    title: 'Mua Sắm & Mặc Cả Chợ Lụa (秀水街购物)',
    level: 'HSK 2-4',
    avatar: '🛍️',
    roleName: 'Chủ tiệm Lý Tỷ (李姐)',
    context: 'Bạn đang chọn mua một chiếc áo khoác truyền thống hoặc quà lưu niệm tại Chợ Tú Thủy.',
    initialGreeting: '帅哥/美女，来看一下吧！这件衣服质量特别好，喜欢可以试穿，给你优惠价！',
    initialPinyin: 'Shuàigē/Měinǚ, lái kàn yíxià ba! Zhè jiàn yīfu zhìliàng tèbié hǎo, xǐhuan kěyǐ shìchuān, gěi nǐ yōuhuì jià!',
    initialMeaning: 'Bạn ơi, vào xem đồ đi nào! Chiếc áo này chất liệu cực tốt, thích thì có thể thử, chị sẽ để giá ưu đãi cho!',
  },
  {
    id: 'taxi',
    title: 'Đi Taxi & Hỏi Đường Thượng Hải (打车与问路)',
    level: 'HSK 1-3',
    avatar: '🚕',
    roleName: 'Bác tài xế Trương (张师傅)',
    context: 'Bạn vừa lên taxi ở Thượng Hải để đến Bến Thượng Hải (The Bund).',
    initialGreeting: '你好，去哪里？请系好安全带。今天路上有点堵，走高架桥可以吗？',
    initialPinyin: 'Nǐ hǎo, qù nǎlǐ? Qǐng jì hǎo ānquándài. Jīntiān lùshang yǒudiǎn dǔ, zǒu gāojiàqiáo kěyǐ ma?',
    initialMeaning: 'Chào bạn, đi đâu thế? Vui lòng thắt dây an toàn. Hôm nay đường hơi tắc, đi cầu cạn trên cao nhé?',
  },
  {
    id: 'job_interview',
    title: 'Phỏng Vấn Xin Việc Công Ty Trung (外企求职面试)',
    level: 'HSK 4-6',
    avatar: '💼',
    roleName: 'Giám đốc Nhân sự Trần (陈经理)',
    context: 'Bạn đang tham gia buổi phỏng vấn trực tiếp cho vị trí chuyên viên kinh doanh/thương mại.',
    initialGreeting: '请坐！我看过你的简历，很不错。请你先用中文做个简短的自我介绍吧。',
    initialPinyin: 'Qǐng zuò! Wǒ kànguò nǐ de jiǎnlì, hěn bùcuò. Qǐng nǐ xiān yòng Zhōngwén zuò gè jiǎnduǎn de zìwǒ jièshào ba.',
    initialMeaning: 'Mời ngồi! Tôi đã xem qua CV của bạn, rất ấn tượng. Hãy giới thiệu ngắn gọn về bản thân bằng tiếng Trung nhé.',
  },
  {
    id: 'coffee_chat',
    title: 'Cà Phê Tán Gẫu Đời Thường (日常闲聊)',
    level: 'HSK 1-6',
    avatar: '☕',
    roleName: 'Bạn du học sinh Bắc Kinh An Na (安娜)',
    context: 'Bạn và một người bạn Trung Quốc đang ngồi thưởng thức cà phê vào chiều cuối tuần.',
    initialGreeting: '嗨！好久不见，最近学习和工作忙不忙？周末有什么打算吗？',
    initialPinyin: 'Hāi! Hǎojiǔ bú jiàn, zuìjìn xuéxí hé gōngzuò máng bu máng? Zhōumò yǒu shénme dǎsuàn ma?',
    initialMeaning: 'Chào bạn! Lâu ngày không gặp, dạo này việc học và làm có bận không? Cuối tuần có dự định gì chưa?',
  },
];

export default function VoiceConversation() {
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState(DEFAULT_SCENARIOS[0].id);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showPinyinAndTranslation, setShowPinyinAndTranslation] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [currentlyPlayingAudioUrl, setCurrentlyPlayingAudioUrl] = useState(null);

  // Fallback text input
  const [textInput, setTextInput] = useState('');

  const audioPlayerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { showToast } = useToast();

  // Load scenarios on mount
  useEffect(() => {
    initScenario(DEFAULT_SCENARIOS[0]);
    const fetchScenarios = async () => {
      try {
        const list = await speakingTutorApi.getScenarios();
        if (list && list.length > 0) {
          setScenarios(list);
        }
      } catch (err) {
        console.warn('Using local fallback scenarios:', err);
      }
    };
    fetchScenarios();
  }, []);

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  // Initialize a scenario with AI greeting
  const initScenario = (scenario) => {
    if (!scenario) return;
    const initialAiMsg = {
      role: 'assistant',
      content: scenario.initialGreeting,
      pinyin: scenario.initialPinyin,
      vietnamese: scenario.initialMeaning,
      audioDataUri: null,
      id: Date.now(),
    };
    setMessages([initialAiMsg]);

    // Synthesize audio for the opening greeting
    speakingTutorApi
      .synthesizeSpeech(scenario.initialGreeting)
      .then((res) => {
        if (res?.audioDataUri) {
          initialAiMsg.audioDataUri = res.audioDataUri;
          setMessages([initialAiMsg]);
          if (autoPlayAudio) {
            playAudio(res.audioDataUri);
          }
        }
      })
      .catch(() => {});
  };

  // Switch scenario
  const handleSelectScenario = (scId) => {
    if (scId === selectedScenarioId) return;
    setSelectedScenarioId(scId);
    const found = scenarios.find((s) => s.id === scId);
    if (found) {
      initScenario(found);
    }
  };

  // Play audio
  const playAudio = (audioUri) => {
    if (!audioUri) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(audioUri);
    audioPlayerRef.current = audio;
    setCurrentlyPlayingAudioUrl(audioUri);

    audio.onended = () => setCurrentlyPlayingAudioUrl(null);
    audio.onerror = () => setCurrentlyPlayingAudioUrl(null);
    audio.play().catch(() => setCurrentlyPlayingAudioUrl(null));
  };

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle recorded voice from student
  const handleRecordingComplete = async ({ audioBase64, mimeType }) => {
    if (!audioBase64 || isSending) return;

    setIsSending(true);
    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await speakingTutorApi.sendConversationTurn({
        scenarioId: selectedScenarioId,
        history,
        audioBase64,
        mimeType,
      });

      // Append student message
      const userMsg = {
        role: 'user',
        content: res.userTranscript,
        id: Date.now(),
      };

      // Append AI response
      const aiMsg = {
        role: 'assistant',
        content: res.aiResponse.chinese,
        pinyin: res.aiResponse.pinyin,
        vietnamese: res.aiResponse.vietnamese,
        feedback: res.aiResponse.feedback,
        audioDataUri: res.aiResponse.audioDataUri,
        id: Date.now() + 1,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      // Auto-play AI native voice response
      if (autoPlayAudio && res.aiResponse.audioDataUri) {
        playAudio(res.aiResponse.audioDataUri);
      }
    } catch (err) {
      console.error('Conversation turn error:', err);
      showToast('Gia sư chưa nghe rõ câu nói. Hãy thử thu âm lại nhé!', 'warning');
    } finally {
      setIsSending(false);
    }
  };

  // Handle text input fallback
  const handleSendText = async () => {
    if (!textInput.trim() || isSending) return;

    const textToSend = textInput.trim();
    setTextInput('');
    setIsSending(true);

    try {
      const userMsg = {
        role: 'user',
        content: textToSend,
        id: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await speakingTutorApi.sendConversationTurn({
        scenarioId: selectedScenarioId,
        history,
        userSpeechText: textToSend,
      });

      const aiMsg = {
        role: 'assistant',
        content: res.aiResponse.chinese,
        pinyin: res.aiResponse.pinyin,
        vietnamese: res.aiResponse.vietnamese,
        feedback: res.aiResponse.feedback,
        audioDataUri: res.aiResponse.audioDataUri,
        id: Date.now() + 1,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (autoPlayAudio && res.aiResponse.audioDataUri) {
        playAudio(res.aiResponse.audioDataUri);
      }
    } catch (err) {
      console.error('Send text turn error:', err);
      showToast('Không thể gửi tin nhắn lúc này.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto select-none">
      {/* Scenario Selector Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => handleSelectScenario(sc.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 ${
              selectedScenarioId === sc.id
                ? 'bg-primary text-white border-primary shadow-sm font-bold'
                : 'bg-white dark:bg-[#1a2332] text-ink dark:text-on-dark border-hairline dark:border-white/10 hover:bg-surface-bone'
            }`}
          >
            <span className="text-base">{sc.avatar}</span>
            <span>{sc.title}</span>
            <span className="text-[10px] opacity-75 px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
              {sc.level}
            </span>
          </button>
        ))}
      </div>

      {/* Main Conversation Container */}
      <div className="flex flex-col h-[520px] rounded-3xl bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 shadow-sm overflow-hidden">
        {/* Top Header of the Voice Call */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline dark:border-white/10 bg-surface-bone/40 dark:bg-white/2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xl shadow-2xs">
              {activeScenario?.avatar || '🎧'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-ink dark:text-on-dark">
                  {activeScenario?.roleName || 'Gia sư AI'}
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-mute truncate max-w-[240px] sm:max-w-md">
                {activeScenario?.context}
              </p>
            </div>
          </div>

          {/* Quick controls (Pinyin visibility, Auto-play audio) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPinyinAndTranslation((v) => !v)}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showPinyinAndTranslation
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface-bone dark:bg-white/5 text-mute border-hairline dark:border-white/10'
              }`}
              title={showPinyinAndTranslation ? 'Ẩn Pinyin & Nghĩa để luyện nghe' : 'Hiện Pinyin & Bản dịch'}
            >
              {showPinyinAndTranslation ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            <button
              type="button"
              onClick={() => setAutoPlayAudio((v) => !v)}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                autoPlayAudio
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface-bone dark:bg-white/5 text-mute border-hairline dark:border-white/10'
              }`}
              title={autoPlayAudio ? 'Tự động phát giọng nói AI khi đối đáp' : 'Bấm thủ công để nghe'}
            >
              {autoPlayAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              type="button"
              onClick={() => initScenario(activeScenario)}
              className="p-2 rounded-xl text-mute hover:text-ink dark:hover:text-on-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer border border-hairline dark:border-white/10"
              title="Bắt đầu lại cuộc trò chuyện này"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            const isAudioPlaying = currentlyPlayingAudioUrl === msg.audioDataUri;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-1 text-sm ${
                    isAI
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                  }`}
                >
                  {isAI ? activeScenario?.avatar || <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl p-4 space-y-2 text-xs sm:text-sm shadow-2xs ${
                    isAI
                      ? 'bg-surface-bone/80 dark:bg-white/5 border border-hairline dark:border-white/10 rounded-tl-xs text-ink dark:text-on-dark'
                      : 'bg-primary text-white rounded-tr-xs ml-auto'
                  }`}
                >
                  {/* Chinese Text */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-extrabold text-sm sm:text-base leading-relaxed hanzi-text">
                      {msg.content}
                    </p>

                    {/* Audio Playback button for AI */}
                    {isAI && msg.audioDataUri && (
                      <button
                        type="button"
                        onClick={() => playAudio(msg.audioDataUri)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                          isAudioPlaying
                            ? 'bg-primary text-white border-primary animate-pulse'
                            : 'bg-white dark:bg-surface-dark text-primary hover:bg-primary/10 border-hairline dark:border-white/10'
                        }`}
                        title="Nghe lại giọng nói của gia sư"
                      >
                        <Volume2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Pinyin and Translation (if enabled) */}
                  {isAI && showPinyinAndTranslation && (
                    <div className="pt-2 border-t border-hairline/60 dark:border-white/5 space-y-1 text-xs">
                      {msg.pinyin && (
                        <p className="font-mono text-primary font-semibold tracking-wide text-[11px]">
                          {msg.pinyin}
                        </p>
                      )}
                      {msg.vietnamese && (
                        <p className="text-mute text-[11px] leading-relaxed">
                          {msg.vietnamese}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Feedback on student turn */}
                  {isAI && msg.feedback && (
                    <div className="mt-2 pt-2 border-t border-hairline/60 dark:border-white/5 text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                      <Sparkles size={12} className="shrink-0 text-amber-500" />
                      <span>{msg.feedback}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Thinking Indicator */}
          {isSending && (
            <div className="flex gap-3 mr-auto animate-fade-in">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs mt-1">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl rounded-tl-xs p-3.5 bg-surface-bone/80 dark:bg-white/5 border border-hairline dark:border-white/10 flex items-center gap-2 text-xs text-primary font-bold">
                <Loader2 size={14} className="animate-spin" />
                <span>Gia sư đang nghe và chuẩn bị đối đáp...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Speaking Bar */}
        <div className="p-3 sm:p-4 border-t border-hairline dark:border-white/10 bg-white dark:bg-[#1a2332] space-y-3">
          {/* Audio Recorder Visualizer */}
          <AudioRecorderVisualizer
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isSending}
            label="Chạm micro và đối đáp bằng giọng nói tiếng Trung với gia sư"
          />

          {/* Optional Text Input Fallback */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Hoặc gõ câu trả lời nếu đang ở nơi ồn ào..."
              disabled={isSending}
              className="flex-1 px-3 py-2 rounded-xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/10 text-xs text-ink dark:text-on-dark outline-hidden focus:border-primary"
            />
            <button
              type="button"
              onClick={handleSendText}
              disabled={!textInput.trim() || isSending}
              className="px-3.5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-deep transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Gửi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
