/**
 * TTS utility for pronouncing Chinese (and other languages) text.
 * 
 * Priority chain:
 * 1. Backend Edge TTS API (highest quality, server-side Microsoft Neural voices)
 * 2. Browser SpeechSynthesis with best available online/neural voice
 * 3. Google Translate TTS URL (fallback)
 * 4. Browser SpeechSynthesis with any available voice (last resort)
 */

// Detect backend API base URL (same origin in production, localhost:3000 in dev)
const getApiBase = () => {
  if (typeof window === 'undefined') return '';
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};


// Client-side audio cache to avoid re-fetching the same word
const audioCache = new Map();
const MAX_AUDIO_CACHE = 300;

// Global audio reference to ensure only 1 audio stream plays at a time
let currentAudio = null;
let currentTimeoutId = null;
let currentSessionId = 0;

/**
 * Stop any ongoing audio playback and browser speech synthesis.
 */
export const stopSpeech = () => {
  currentSessionId++; // Invalidate any pending callbacks/fallbacks from previous speech calls

  if (currentTimeoutId) {
    clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
  }

  if (currentAudio) {
    try {
      currentAudio._aborted = true;
      currentAudio.oncanplaythrough = null;
      currentAudio.onerror = null;
      currentAudio.onended = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Main TTS function. Plays high-quality audio from backend API.
 * Falls back to browser SpeechSynthesis if backend is unavailable.
 */
export const speakChinese = (text, lang = 'zh-CN', gender = null) => {
  if (!text) return;

  // Stop any currently playing audio or speech synthesis and increment session ID
  stopSpeech();

  const thisSessionId = currentSessionId;
  const cacheKey = `${text}|${lang}|${gender || 'female'}`;

  // Check if we already have a cached audio URL for this text
  if (audioCache.has(cacheKey)) {
    const cachedUrl = audioCache.get(cacheKey);
    const audio = new Audio(cachedUrl);
    currentAudio = audio;

    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
    };

    audio.onerror = () => {
      if (currentSessionId !== thisSessionId || audio._aborted) return;
      speakWithBrowserTTS(text, lang, gender);
    };

    audio.play().catch((err) => {
      // If play was aborted or replaced by a new speech request, do NOT fallback
      if (currentSessionId !== thisSessionId || audio._aborted || err?.name === 'AbortError') {
        return;
      }
      speakWithBrowserTTS(text, lang, gender);
    });
    return;
  }

  // Build the backend TTS API URL
  const apiBase = getApiBase();
  const params = new URLSearchParams({ text, lang });
  if (gender) params.set('gender', gender);
  const ttsUrl = `${apiBase}/api/tts/speak?${params.toString()}`;

  const audio = new Audio(ttsUrl);
  currentAudio = audio;

  let fallbackTriggered = false;

  const triggerFallback = () => {
    if (fallbackTriggered || currentSessionId !== thisSessionId || audio._aborted) return;
    fallbackTriggered = true;
    speakWithBrowserTTS(text, lang, gender);
  };

  // Set a timeout — if audio doesn't start playing within 8s, use fallback
  const timeoutId = setTimeout(() => {
    if (currentSessionId !== thisSessionId || audio._aborted) return;
    if (!fallbackTriggered) {
      if (currentAudio === audio) {
        audio.pause();
        audio.src = '';
      }
      triggerFallback();
    }
  }, 8000);
  currentTimeoutId = timeoutId;

  audio.oncanplaythrough = () => {
    if (currentSessionId !== thisSessionId || audio._aborted) return;
    clearTimeout(timeoutId);

    // Cache the URL for future use
    if (audioCache.size >= MAX_AUDIO_CACHE) {
      const firstKey = audioCache.keys().next().value;
      const oldUrl = audioCache.get(firstKey);
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, ttsUrl);
  };

  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null;
  };

  audio.onerror = () => {
    if (currentSessionId !== thisSessionId || audio._aborted) return;
    clearTimeout(timeoutId);
    triggerFallback();
  };

  audio.play().catch((err) => {
    if (currentSessionId !== thisSessionId || audio._aborted || err?.name === 'AbortError') {
      return;
    }
    clearTimeout(timeoutId);
    triggerFallback();
  });
};

// ─── Browser SpeechSynthesis fallback ──────────────────────────────────

/** Helper to select the best available browser voice */
export const getBestVoice = (lang = 'zh-CN', gender = null) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const langKey = lang.toLowerCase().split('-')[0];
  const matchingVoices = voices.filter(v =>
    v.lang.toLowerCase().replace('_', '-').startsWith(langKey)
  );
  if (matchingVoices.length === 0) return null;

  const scoreVoice = (voice) => {
    const name = voice.name.toLowerCase();
    let score = 0;
    if (name.includes('online') || name.includes('natural')) score += 100;
    if (name.includes('google') && !name.includes('local')) score += 80;
    if (gender === 'female') {
      if (name.includes('xiaoxiao') || name.includes('female')) score += 50;
      if (name.includes('yunxi') || name.includes('male')) score -= 50;
    } else if (gender === 'male') {
      if (name.includes('yunxi') || name.includes('male')) score += 50;
      if (name.includes('xiaoxiao') || name.includes('female')) score -= 50;
    }
    if (langKey === 'zh' && name.includes('xiaoxiao') && gender !== 'male') score += 40;
    if (langKey === 'zh' && name.includes('yunxi') && gender !== 'female') score += 35;
    if (voice.localService === false) score += 20;
    return score;
  };

  matchingVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return { voice: matchingVoices[0], score: scoreVoice(matchingVoices[0]) };
};

/** Fallback: use browser's built-in SpeechSynthesis */
const speakWithBrowserTTS = (text, lang = 'zh-CN', gender = null) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const langKey = lang.toLowerCase().split('-')[0];
  const rate = langKey === 'en' ? 0.9 : 0.85;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;

  const voiceInfo = getBestVoice(lang, gender);
  if (voiceInfo && voiceInfo.voice) {
    utterance.voice = voiceInfo.voice;
  }

  window.speechSynthesis.speak(utterance);
};

// Pre-fetch browser voices list early
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  }
}
