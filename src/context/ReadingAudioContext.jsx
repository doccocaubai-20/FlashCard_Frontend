import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { speakChinese, stopSpeech, prefetchAudio } from '../utils/tts';

const ReadingAudioContext = createContext(null);

export function ReadingAudioProvider({ children }) {
  const [currentPassage, setCurrentPassage] = useState(null);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Refs for tracking state inside async loops without closure stale values
  const runIdRef = useRef(0);
  const currentPassageRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    currentPassageRef.current = currentPassage;
  }, [currentPassage]);

  useEffect(() => {
    currentIndexRef.current = currentParagraphIndex;
  }, [currentParagraphIndex]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Core runner function that sequentially plays paragraphs
  const startPlaybackLoop = useCallback(async (passage, startIndex, runId) => {
    const paragraphs = passage.paragraphs || [];
    if (!paragraphs.length) return;

    for (let i = startIndex; i < paragraphs.length; i++) {
      if (runIdRef.current !== runId || isCancelledRef.current) {
        break;
      }

      // Update index
      currentIndexRef.current = i;
      setCurrentParagraphIndex(i);
      setIsPlaying(true);
      setIsPaused(false);

      // Prefetch the NEXT paragraph in background so Edge TTS is already primed
      if (i + 1 < paragraphs.length) {
        prefetchAudio(paragraphs[i + 1].hanzi, 'zh-CN');
      }

      try {
        await speakChinese(paragraphs[i].hanzi, 'zh-CN', 'female', { disableRoboticFallback: true });
      } catch (err) {
        console.warn('Audio playback error on paragraph', i, err);
        break;
      }

      // If cancelled or runId changed during speech, stop immediately
      if (runIdRef.current !== runId || isCancelledRef.current || isPausedRef.current) {
        break;
      }

      // Small pause between paragraphs (300ms) for natural reading rhythm
      await new Promise((r) => setTimeout(r, 300));
    }

    // Finished entire passage
    if (runIdRef.current === runId && !isCancelledRef.current && !isPausedRef.current) {
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  // Parse raw passage into structured paragraphs
  const formatPassageData = useCallback((passage) => {
    if (!passage) return null;
    const hzList = (passage.content?.hanzi || '')
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);
    const pyList = (passage.content?.pinyin || '')
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);
    const viList = (passage.content?.meaning || '')
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const paragraphs = hzList.map((hz, idx) => ({
      index: idx,
      hanzi: hz,
      pinyin: pyList[idx] || '',
      meaning: viList[idx] || '',
    }));

    return {
      id: passage.id,
      title: passage.title?.hanzi || passage.title || 'Bài đọc',
      meaning: passage.title?.meaning || '',
      hskLevel: passage.hskLevel || 1,
      paragraphs,
    };
  }, []);

  // Public: Play an entire passage from a given index
  const playPassage = useCallback(
    (rawPassage, startIndex = 0) => {
      const formatted = formatPassageData(rawPassage);
      if (!formatted || !formatted.paragraphs.length) return;

      // Invalidate any previous run
      const newRunId = ++runIdRef.current;
      isCancelledRef.current = false;
      isPausedRef.current = false;

      stopSpeech();

      setCurrentPassage(formatted);
      setCurrentParagraphIndex(startIndex);
      currentIndexRef.current = startIndex;
      setIsPlaying(true);
      setIsPaused(false);

      startPlaybackLoop(formatted, startIndex, newRunId);
    },
    [formatPassageData, startPlaybackLoop],
  );

  // Public: Pause audio
  const pauseAudio = useCallback(() => {
    isPausedRef.current = true;
    isCancelledRef.current = true;
    runIdRef.current++;
    stopSpeech();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  // Public: Resume audio from current paragraph
  const resumeAudio = useCallback(() => {
    if (!currentPassageRef.current) return;
    const newRunId = ++runIdRef.current;
    isCancelledRef.current = false;
    isPausedRef.current = false;

    setIsPaused(false);
    setIsPlaying(true);

    startPlaybackLoop(currentPassageRef.current, currentIndexRef.current, newRunId);
  }, [startPlaybackLoop]);

  // Public: Next paragraph
  const nextParagraph = useCallback(() => {
    if (!currentPassageRef.current) return;
    const total = currentPassageRef.current.paragraphs.length;
    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx < total) {
      const newRunId = ++runIdRef.current;
      isCancelledRef.current = false;
      isPausedRef.current = false;
      stopSpeech();
      setCurrentParagraphIndex(nextIdx);
      currentIndexRef.current = nextIdx;
      setIsPlaying(true);
      setIsPaused(false);
      startPlaybackLoop(currentPassageRef.current, nextIdx, newRunId);
    }
  }, [startPlaybackLoop]);

  // Public: Previous paragraph
  const prevParagraph = useCallback(() => {
    if (!currentPassageRef.current) return;
    const prevIdx = Math.max(0, currentIndexRef.current - 1);
    const newRunId = ++runIdRef.current;
    isCancelledRef.current = false;
    isPausedRef.current = false;
    stopSpeech();
    setCurrentParagraphIndex(prevIdx);
    currentIndexRef.current = prevIdx;
    setIsPlaying(true);
    setIsPaused(false);
    startPlaybackLoop(currentPassageRef.current, prevIdx, newRunId);
  }, [startPlaybackLoop]);

  // Public: Stop audio and close bar
  const stopAudio = useCallback(() => {
    runIdRef.current++;
    isCancelledRef.current = true;
    isPausedRef.current = false;
    stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPassage(null);
    setCurrentParagraphIndex(0);
  }, []);

  // Public: Toggle between play and pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
    } else if (isPaused) {
      resumeAudio();
    }
  }, [isPlaying, isPaused, pauseAudio, resumeAudio]);

  const value = {
    currentPassage,
    currentParagraphIndex,
    isPlaying,
    isPaused,
    playPassage,
    pauseAudio,
    resumeAudio,
    togglePlayPause,
    nextParagraph,
    prevParagraph,
    stopAudio,
  };

  return (
    <ReadingAudioContext.Provider value={value}>
      {children}
    </ReadingAudioContext.Provider>
  );
}

export function useReadingAudio() {
  const context = useContext(ReadingAudioContext);
  if (!context) {
    throw new Error('useReadingAudio must be used within a ReadingAudioProvider');
  }
  return context;
}
