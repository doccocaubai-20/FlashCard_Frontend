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
  const loc = window.location;
  // In dev mode (Vite), frontend runs on 5173, backend on 3000
  if (loc.port === '5173' || loc.port === '5174') {
    return 'http://localhost:3000';
  }
  // In production, same origin
  return '';
};

// Client-side audio cache to avoid re-fetching the same word
const audioCache = new Map();
const MAX_AUDIO_CACHE = 300;

/**
 * Main TTS function. Plays high-quality audio from backend API.
 * Falls back to browser SpeechSynthesis if backend is unavailable.
 */
export const speakChinese = (text, lang = 'zh-CN', gender = null) => {
  if (!text) return;

  // Cancel any active browser speech synthesis
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  const cacheKey = `${text}|${lang}|${gender || 'female'}`;

  // Check if we already have a cached audio URL for this text
  if (audioCache.has(cacheKey)) {
    const cachedUrl = audioCache.get(cacheKey);
    const audio = new Audio(cachedUrl);
    audio.play().catch(() => {
      // If cached URL fails, fall back to browser TTS
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

  let fallbackTriggered = false;

  const triggerFallback = () => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    speakWithBrowserTTS(text, lang, gender);
  };

  // Set a timeout — if audio doesn't start playing within 8s, use fallback
  const timeoutId = setTimeout(() => {
    if (!fallbackTriggered) {
      audio.pause();
      audio.src = '';
      triggerFallback();
    }
  }, 8000);

  audio.oncanplaythrough = () => {
    clearTimeout(timeoutId);

    // Cache the URL for future use
    if (audioCache.size >= MAX_AUDIO_CACHE) {
      const firstKey = audioCache.keys().next().value;
      // Revoke old blob URL if applicable
      const oldUrl = audioCache.get(firstKey);
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, ttsUrl);
  };

  audio.onerror = () => {
    clearTimeout(timeoutId);
    triggerFallback();
  };

  audio.play().catch(() => {
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
