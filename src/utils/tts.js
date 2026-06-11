/**
 * TTS utility for pronouncing Chinese text.
 * Uses Google Translate TTS as the primary high-quality option,
 * with a fallback to the native browser SpeechSynthesis API.
 */
export const speakChinese = (text) => {
  if (!text) return;

  // 1. Cancel any active native speech synthesis to avoid overlay
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // 2. Build Google Translate TTS audio request
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=tw-ob`;
  const audio = new Audio(googleTtsUrl);

  let fallbackTriggered = false;
  
  const triggerFallback = () => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Bind fallback triggers
  audio.onerror = triggerFallback;
  
  // Set a timeout of 2 seconds in case Google TTS hangs without throwing an error
  const timeoutId = setTimeout(() => {
    if (!fallbackTriggered) {
      audio.pause();
      triggerFallback();
    }
  }, 2000);

  audio.onplay = () => {
    clearTimeout(timeoutId);
  };

  audio.play().catch((err) => {
    clearTimeout(timeoutId);
    triggerFallback();
  });
};
