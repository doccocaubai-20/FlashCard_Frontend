import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Volume2, 
  Trash2, 
  Sparkles, 
  Info, 
  AlertCircle,
  BookOpen,
  HelpCircle,
  Play
} from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';
import { useToast } from '../context/ToastContext';
import { statsApi } from '../services/statsApi';

export default function FreestyleSpeakingScreen() {
  const navigate = useNavigate();
  const { lookupMultiple } = useDictionary();
  const { showToast } = useToast();

  // Speech Recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [spokenText, setSpokenText] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Dictionary lookup states
  const [detectedWords, setDetectedWords] = useState([]);
  const [loadingDictionary, setLoadingDictionary] = useState(false);

  // Initialize Web Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      return;
    }

    const startRecordingMedia = async () => {
      if (!window.MediaRecorder) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(audioBlob);
          });
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.error('Failed to start media recorder:', err);
      }
    };

    const stopRecordingMedia = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
    };

    const rec = new SpeechRecognition();
    rec.lang = 'zh-CN'; // Recognize Chinese Mandarin
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
      setAudioUrl(null); // Clear previous voice recording url
      startRecordingMedia();
    };

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpokenText((prev) => {
        const spacer = prev ? ' ' : '';
        return prev + spacer + transcript;
      });
      statsApi.incrementQuestProgress('SPEAK_PRACTICE', 1).catch(err => console.error(err));
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setSpeechError('Quyền truy cập Microphone bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.');
      } else if (event.error === 'no-speech') {
        setSpeechError('Không nghe thấy tiếng nói. Hãy nói to và rõ ràng hơn.');
      } else {
        setSpeechError(`Lỗi ghi âm: ${event.error}. Vui lòng thử lại.`);
      }
      setIsListening(false);
      stopRecordingMedia();
    };

    rec.onend = () => {
      setIsListening(false);
      stopRecordingMedia();
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Revoke object URL on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Split and resolve dictionary words from the transcribed Chinese text
  useEffect(() => {
    const resolveWords = async () => {
      const text = spokenText.replace(/[。？！，、；：.,/#!$%^&*;:{}=_`~()?-]/g, '').replace(/\s+/g, '').trim();
      if (!text) {
        setDetectedWords([]);
        return;
      }

      setLoadingDictionary(true);
      try {
        const found = [];
        const chars = Array.from(text);
        
        // 1. Try finding multi-character words using scanning (longest match first)
        let i = 0;
        while (i < chars.length) {
          let matched = false;
          // Look up phrases from length 4 down to 2
          for (let len = Math.min(4, chars.length - i); len >= 2; len--) {
            const word = chars.slice(i, i + len).join('');
            const matches = await lookupMultiple('hanzi', word);
            const exact = matches.find(m => m.s === word || m.t === word);
            if (exact) {
              found.push(exact);
              i += len;
              matched = true;
              break;
            }
          }
          if (!matched) {
            // Check if single character exists in dictionary
            const singleWord = chars[i];
            const matches = await lookupMultiple('hanzi', singleWord);
            const exact = matches.find(m => m.s === singleWord || m.t === singleWord);
            if (exact) {
              found.push(exact);
            } else {
              found.push({ s: singleWord, t: singleWord, p: '', sv: '', vi: 'Ký tự đơn lẻ' });
            }
            i++;
          }
        }

        // Deduplicate words list by character string
        const uniqueFound = [];
        const seen = new Set();
        for (const item of found) {
          if (!seen.has(item.s)) {
            seen.add(item.s);
            uniqueFound.push(item);
          }
        }

        setDetectedWords(uniqueFound);
      } catch (e) {
        console.error('Failed to resolve dictionary words from speech:', e);
      } finally {
        setLoadingDictionary(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      resolveWords();
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [spokenText, lookupMultiple]);

  const toggleListening = () => {
    if (!browserSupported || !recognitionRef.current) {
      showToast('Ghi âm không được hỗ trợ trên trình duyệt này.', 'error');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSpeakSample = () => {
    if (!spokenText || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const playRecordedAudio = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error("Failed to play recorded voice:", e));
  };

  const clearAll = () => {
    setSpokenText('');
    setDetectedWords([]);
    setSpeechError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Compile full Pinyin for the recognized sentence dynamically
  const sentencePinyin = detectedWords
    .map(w => w.p)
    .filter(Boolean)
    .join(' ');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/study-hub')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-black text-mute cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Sparkles size={22} className="text-primary animate-pulse" />
              Luyện nói tự do AI
            </h1>
            <p className="text-xs text-mute mt-0.5">Nói bất kỳ điều gì bằng tiếng Trung, AI sẽ lắng nghe, gõ chữ và tra nghĩa từ điển.</p>
          </div>
        </div>
      </div>

      {/* Browser Support Alert */}
      {!browserSupported && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-5 text-left flex gap-3 max-w-lg mx-auto">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">Trình duyệt không hỗ trợ nhận dạng giọng nói</h4>
            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed">
              Vui lòng chuyển sang sử dụng <strong>Google Chrome, Microsoft Edge, hoặc Safari</strong> để có thể sử dụng micro nhận diện giọng nói tiếng Trung.
            </p>
          </div>
        </div>
      )}

      {browserSupported && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Side: Speech Input Panel (8/12 grid) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/40 p-6 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[420px]">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-3">
                <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-widest flex items-center gap-1">
                  🎙️ Nhận diện giọng nói tiếng Trung
                </span>

                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-mute hover:text-red-550 transition-colors cursor-pointer"
                  title="Xóa hết bản ghi"
                >
                  <Trash2 size={12} />
                  <span>Xóa hết</span>
                </button>
              </div>

              {/* Display transcription result */}
              <div className="py-8 text-center space-y-5 flex-1 flex flex-col justify-center">
                {spokenText ? (
                  <div className="space-y-4">
                    {/* Sentence Pinyin */}
                    {sentencePinyin && (
                      <p className="text-xs font-mono font-bold text-primary tracking-wide max-w-md mx-auto leading-relaxed">
                        {sentencePinyin}
                      </p>
                    )}

                    {/* Sentence Hanzi */}
                    <div className="flex items-center justify-center gap-3 py-2 text-2xl md:text-3xl font-display font-extrabold select-all leading-normal text-ink dark:text-on-dark flex-wrap">
                      <span>{spokenText}</span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSpeakSample}
                          className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-sm flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                          title="Nghe phát âm chuẩn (TTS)"
                        >
                          <Volume2 size={14} />
                        </button>

                        {audioUrl && (
                          <button
                            onClick={playRecordedAudio}
                            className="h-8 w-8 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 shadow-sm flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                            title="Nghe lại giọng nói của tôi"
                          >
                            <Play size={14} fill="currentColor" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-mute dark:text-on-dark-mute italic">
                    <HelpCircle size={44} className="stroke-1 text-mute mb-2 animate-bounce" />
                    <p className="text-sm font-semibold max-w-[220px] leading-relaxed">
                      Micro đang rảnh rỗi. Hãy kích hoạt ghi âm ở dưới và nói linh tinh gì đó nhé!
                    </p>
                  </div>
                )}
              </div>

              {/* Recording Action Button */}
              <div className="pt-5 border-t border-hairline dark:border-divider-dark text-center space-y-3">
                <div className="flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`h-16 w-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-650 text-white animate-pulse scale-105'
                        : 'bg-primary hover:bg-primary-deep text-white hover:shadow-primary/25'
                    }`}
                  >
                    {isListening ? <MicOff size={26} /> : <Mic size={26} />}
                  </button>
                  
                  <span className="text-xs font-bold text-ink dark:text-on-dark">
                    {isListening ? 'AI đang lắng nghe... Hãy nói ngay!' : 'Nhấn nút để bắt đầu nói tự do'}
                  </span>
                </div>

                {/* Error Box */}
                {speechError && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200/40 rounded-lg p-2.5 max-w-md mx-auto">
                    {speechError}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Right Side: Tips and Speech Guide (4/12 grid) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/40 p-5 shadow-sm min-h-[420px] flex flex-col justify-between">
              
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-3">
                  <Info size={14} className="text-primary" />
                  Mẹo luyện nói tự do
                </h3>
                
                <div className="text-xs text-body dark:text-on-dark-mute leading-relaxed space-y-3">
                  <p className="font-semibold text-ink dark:text-on-dark">
                    💡 Bạn có thể thử nói các câu giao tiếp cơ bản:
                  </p>
                  <ul className="list-disc pl-4 space-y-2 font-mono">
                    <li>"你好吗？" (nǐ hǎo ma - Bạn khỏe không?)</li>
                    <li>"我是一个学生。" (wǒ shì yī gè xué shēng - Tôi là học sinh.)</li>
                    <li>"今天天气很好。" (jīn tiān tiān qì hěn hǎo - Hôm nay thời tiết rất đẹp.)</li>
                    <li>"我想喝一杯茶。" (wǒ xiǎng hē yī bēi chá - Tôi muốn uống một cốc trà.)</li>
                  </ul>
                  
                  <p className="pt-2">
                    1. Nói ở tốc độ bình thường, rõ âm, không nói quá nhanh.
                  </p>
                  <p>
                    2. AI sẽ tự động phân tách văn bản nói thành các từ vựng cụ thể để tra cứu nghĩa.
                  </p>
                  <p>
                    3. Bấm biểu tượng loa 🔊 ở phần kết quả để nghe lại giọng TTS tiêu chuẩn giúp điều chỉnh lại khẩu hình.
                  </p>
                </div>
              </div>

              <div className="bg-surface-bone dark:bg-black/20 p-3.5 rounded-lg border border-hairline dark:border-divider-dark text-[10px] text-mute leading-relaxed font-mono">
                ℹ️ Web Speech API sử dụng giọng nói trực tiếp để chuyển sang văn bản. Đảm bảo môi trường xung quanh yên tĩnh.
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Dictionary Definitions of Speech Words */}
      {spokenText.trim() && (
        <div className="bg-surface-card dark:bg-surface-dark/40 p-6 rounded-xl border border-hairline dark:border-white/5 shadow-sm text-left space-y-4">
          <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-2.5">
            <BookOpen size={14} className="text-primary" />
            Các từ vựng phát hiện trong lời nói ({detectedWords.length})
          </h3>
          
          {loadingDictionary ? (
            <div className="text-xs text-mute italic flex items-center gap-2">
              <span className="animate-pulse">Đang nạp định nghĩa từ vựng...</span>
            </div>
          ) : detectedWords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detectedWords.map((item, index) => (
                <div 
                  key={index}
                  className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-4 rounded-xl flex gap-3 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <span className="text-4xl font-display font-black text-primary shrink-0 leading-none py-1">
                    {item.s}
                  </span>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-xs font-mono font-bold text-ink dark:text-on-dark">{item.p}</span>
                      {item.sv && (
                        <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">
                          {item.sv}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-semibold line-clamp-3">
                      {item.vi}
                    </p>
                    {item.hsk && (
                      <span className="inline-block px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[8px] font-mono font-bold rounded">
                        HSK {item.hsk}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mute italic">Không tìm thấy định nghĩa từ vựng tiếng Trung tương ứng trong cơ sở dữ liệu.</p>
          )}
        </div>
      )}

    </div>
  );
}
