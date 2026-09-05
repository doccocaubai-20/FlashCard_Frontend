import { safeLocalGet, safeLocalSet } from './storage';
import { statsApi } from '../services/statsApi';

/**
 * Get the current progress count for a given quest key, ensuring it's for today.
 */
export const getTodayQuestCount = (storageKey) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDateKey = `${storageKey}_date`;
  const lastDate = safeLocalGet(lastDateKey, '');

  if (lastDate !== todayStr) {
    return 0;
  }
  return Number(safeLocalGet(storageKey, 0)) || 0;
};

/**
 * Track progress for a daily quest.
 * Updates local daily counters and dispatches to backend API.
 * 
 * @param {'DICTIONARY_LOOKUP' | 'WRITE_PRACTICE' | 'PLAY_GAME'} questType
 * @param {number} amount
 */
export const trackQuestProgress = (questType, amount = 1) => {
  if (!questType || amount <= 0) return;

  const todayStr = new Date().toISOString().split('T')[0];

  let storageKey = '';
  if (questType === 'DICTIONARY_LOOKUP') {
    storageKey = 'chongzi_dict_lookups_today';
  } else if (questType === 'WRITE_PRACTICE') {
    storageKey = 'chongzi_write_count_today';
  } else if (questType === 'PLAY_GAME') {
    storageKey = 'chongzi_games_played_today';
  }

  if (storageKey) {
    const lastDateKey = `${storageKey}_date`;
    const lastDate = safeLocalGet(lastDateKey, '');
    let currentVal = safeLocalGet(storageKey, 0);

    // Reset if it's a new day
    if (lastDate !== todayStr) {
      currentVal = 0;
      safeLocalSet(lastDateKey, todayStr);
    }

    const nextVal = currentVal + amount;
    safeLocalSet(storageKey, nextVal);
  }

  // Asynchronously increment on backend
  try {
    statsApi.incrementQuestProgress(questType, amount).catch((err) => {
      console.debug('[questTracker] Background sync failed:', err?.message || err);
    });
  } catch {
    // ignore
  }
};
