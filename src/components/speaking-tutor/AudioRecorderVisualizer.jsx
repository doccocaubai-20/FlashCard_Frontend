import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Loader2, Volume2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AudioRecorderVisualizer({
  onRecordingComplete,
  isProcessing = false,
  maxDuration = 60,
  label = 'Bấm để ghi âm giọng nói',
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const recordedAudioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const { showToast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const cleanupAudio = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
    }
  };

  // Start recording audio and drawing real-time visualizer
  const startRecording = async () => {
    if (isProcessing) return;

    try {
      cleanupAudio();
      setAudioUrl(null);
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup Web Audio Analyser
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start drawing canvas waveform
      drawVisualizer();

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result;
          if (onRecordingComplete) {
            onRecordingComplete({
              audioBlob,
              audioBase64: base64Data,
              mimeType,
              duration: recordingTime,
            });
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      showToast('Vui lòng cấp quyền truy cập Microphone cho trình duyệt để luyện nói.', 'error');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  // Reset recording
  const resetRecording = () => {
    cleanupAudio();
    setIsRecording(false);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlayingRecorded(false);
  };

  // Draw real-time audio wave onto canvas
  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Modern Asian Minimalist Jade teal wave gradient
        ctx.fillStyle = `rgba(15, 82, 87, ${Math.max(0.2, dataArray[i] / 255)})`;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, Math.max(3, barHeight));

        x += barWidth + 1;
      }
    };

    render();
  };

  // Playback recorded audio
  const togglePlayRecorded = () => {
    if (!audioUrl) return;
    if (!recordedAudioRef.current) {
      recordedAudioRef.current = new Audio(audioUrl);
      recordedAudioRef.current.onended = () => setIsPlayingRecorded(false);
    }

    if (isPlayingRecorded) {
      recordedAudioRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      recordedAudioRef.current.src = audioUrl;
      recordedAudioRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full max-w-md mx-auto py-2">
      {/* Audio Wave Visualizer Canvas */}
      <div className="relative w-full h-14 bg-surface-bone/60 dark:bg-white/5 rounded-2xl border border-hairline dark:border-white/10 overflow-hidden flex items-center justify-center">
        {isRecording ? (
          <canvas ref={canvasRef} width={380} height={56} className="w-full h-full" />
        ) : audioUrl ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Volume2 size={16} />
            <span>Đã ghi âm ({formatTime(recordingTime)})</span>
          </div>
        ) : (
          <span className="text-xs text-mute font-medium select-none">{label}</span>
        )}

        {/* Live Pulse Dot while recording */}
        {isRecording && (
          <div className="absolute top-2.5 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>REC {formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-center gap-3">
        {/* Reset button (visible when recording exists) */}
        {audioUrl && !isRecording && (
          <button
            type="button"
            onClick={resetRecording}
            disabled={isProcessing}
            className="p-3 rounded-2xl bg-surface-bone dark:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark transition-all border border-hairline dark:border-white/10 cursor-pointer active:scale-95 disabled:opacity-40"
            title="Thu âm lại"
          >
            <RotateCcw size={18} />
          </button>
        )}

        {/* Main Record / Stop Action Button */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isProcessing}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-deep text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none"
            title="Bấm để bắt đầu nói"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Gia sư đang lắng nghe...</span>
              </>
            ) : (
              <>
                <Mic size={18} />
                <span>{audioUrl ? 'Thu âm lại' : 'Bắt đầu nói'}</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95 animate-pulse select-none"
            title="Bấm để hoàn tất câu nói"
          >
            <Square size={16} className="fill-white" />
            <span>Dừng & Phân tích ({formatTime(recordingTime)})</span>
          </button>
        )}

        {/* Playback recorded preview button */}
        {audioUrl && !isRecording && (
          <button
            type="button"
            onClick={togglePlayRecorded}
            disabled={isProcessing}
            className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer active:scale-95 disabled:opacity-40"
            title={isPlayingRecorded ? 'Tạm dừng nghe lại' : 'Nghe lại giọng của bạn'}
          >
            {isPlayingRecorded ? <Pause size={18} /> : <Play size={18} className="fill-primary" />}
          </button>
        )}
      </div>
    </div>
  );
}
