/**
 * Unified storage layer for ChongZi flashcard application
 * Handles IndexedDB, localStorage, in-memory fallback, and migration between them.
 */

import { openDB, setItem as idbSetItem, getItem as idbGetItem, removeItem as idbRemoveItem } from './indexedDB.js';

// Re-export IndexedDB functions
export { openDB, idbSetItem as setItem, idbGetItem as getItem, idbRemoveItem as removeItem };

// In-memory fallback cache to ensure immediate synchronous access even on QuotaExceededError
const memoryFallbackCache = new Map();

// Track keys that failed to persist to localStorage due to quota exhaustion
const quotaExceededKeys = new Set();

// Scalar UI preferences and authentication keys that must NEVER be evicted or removed from localStorage
export const PRESERVED_KEYS = [
  'chongzi_sidebar_collapsed',
  'theme',
  'gamified_theme',
  'sound_enabled',
  'selected_language',
  'chongzi_dashboard_mode',
  'token',
  'user',
  'falling_words_highscore',
  'i18nextLng',
  'chongzi_recent_studied_decks',
];
const originalPreservedIncludes = PRESERVED_KEYS.includes.bind(PRESERVED_KEYS);
PRESERVED_KEYS.includes = (key) => originalPreservedIncludes(key) || key === 'chongzi_tts_voice';
PRESERVED_KEYS.has = (key) => PRESERVED_KEYS.includes(key);

// Keys that are currently read synchronously from localStorage by active screens
// During migration to IndexedDB, copies must be made to IDB without deleting from localStorage
export const ACTIVE_SYNC_KEYS = [
  'chongzi_word_notes',
  'chongzi_daily_quiz_completed',
  'chongzi_synonym_history',
  'chongzi_tts_trigger',
  'chongzi_pending_reviews',
];
ACTIVE_SYNC_KEYS.has = (key) => ACTIVE_SYNC_KEYS.includes(key);

const NON_ESSENTIAL_PREFIXES = [
  'offline_dict_',
  'temp_search_',
  'cached_quiz_',
  'offline_',
  'temp_',
  'cache_',
];

const NON_ESSENTIAL_EXACT_KEYS = [
  'wotd_word',
  'wotd_date',
  'chongzi_synonym_history',
  'chongzi_daily_quiz_completed',
];

export const isQuotaExceededError = (error) => {
  if (!error) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014 ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('quota'))
  );
};

export const isNonEssentialKey = (key) => {
  if (!key || PRESERVED_KEYS.includes(key) || ACTIVE_SYNC_KEYS.includes(key) || key.startsWith('floating_dict_')) return false;
  if (NON_ESSENTIAL_EXACT_KEYS.includes(key)) return true;
  return NON_ESSENTIAL_PREFIXES.some((prefix) => key.startsWith(prefix));
};

export const evictNonEssentialCaches = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && isNonEssentialKey(key)) {
        keysToRemove.push(key);
      }
    }

    // 1. Evict from localStorage and synchronously mirror removal in memoryFallbackCache
    for (const key of keysToRemove) {
      try {
        const rawVal = window.localStorage.getItem(key);
        if (rawVal !== null) {
          let parsed;
          try {
            parsed = JSON.parse(rawVal);
          } catch {
            parsed = rawVal;
          }
          // Asynchronously backup to IndexedDB before removal
          idbSetItem(key, parsed).catch(() => {});
        }
        memoryFallbackCache.delete(key);
        window.localStorage.removeItem(key);
      } catch {
        // Continue evicting other keys
      }
    }

    // 2. Evict non-essential items that only exist in memoryFallbackCache to prevent in-memory desync
    for (const memKey of Array.from(memoryFallbackCache.keys())) {
      if (isNonEssentialKey(memKey)) {
        const rawVal = memoryFallbackCache.get(memKey);
        let parsed;
        try {
          parsed = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
        } catch {
          parsed = rawVal;
        }
        idbSetItem(memKey, parsed).catch(() => {});
        memoryFallbackCache.delete(memKey);
      }
    }

    return keysToRemove.length;
  } catch (err) {
    console.warn('[storage] Error during cache eviction:', err);
    return 0;
  }
};

// --- Safe localStorage wrappers ---

export const safeLocalGet = (key, fallback = null) => {
  let item = null;
  let hasLocalError = false;

  // 1. Query window.localStorage first
  try {
    item = window.localStorage.getItem(key);
  } catch (error) {
    hasLocalError = true;
    console.error(`Error reading ${key} from localStorage:`, error);
  }

  // 2. If localStorage returns null or throws, OR if quotaExceededKeys.has(key),
  // fall back to memoryFallbackCache
  if (item === null || hasLocalError || quotaExceededKeys.has(key)) {
    if (memoryFallbackCache.has(key)) {
      const memItem = memoryFallbackCache.get(key);
      if (typeof memItem === 'string') {
        try {
          return JSON.parse(memItem);
        } catch {
          return memItem;
        }
      }
      return memItem !== undefined ? memItem : fallback;
    }
  }

  if (item !== null) {
    try {
      return JSON.parse(item);
    } catch {
      return item; // Return as string if not JSON
    }
  }

  return fallback;
};

export const safeLocalSet = (key, value) => {
  const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);

  // Always update in-memory fallback cache so reading immediately after writing never breaks
  memoryFallbackCache.set(key, valueToStore);

  try {
    window.localStorage.setItem(key, valueToStore);
    quotaExceededKeys.delete(key);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn(`[storage] QuotaExceededError detected for key "${key}". Evicting non-essential caches...`);
      evictNonEssentialCaches();

      // Retry saving to localStorage after eviction
      try {
        window.localStorage.setItem(key, valueToStore);
        quotaExceededKeys.delete(key);
      } catch {
        quotaExceededKeys.add(key);
        console.warn(`[storage] localStorage still full after eviction for "${key}". Preserving in-memory & IndexedDB.`);
        // Only remove from localStorage if not preserved or active sync
        if (!PRESERVED_KEYS.includes(key) && !ACTIVE_SYNC_KEYS.includes(key)) {
          try {
            window.localStorage.removeItem(key);
          } catch {
            // ignore
          }
        }
      }

      // Fall back to asynchronously saving payload into IndexedDB
      let parsedValue;
      try {
        parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        parsedValue = value;
      }
      idbSetItem(key, parsedValue).catch((idbErr) => {
        console.error(`[storage] Failed to save "${key}" to IndexedDB fallback:`, idbErr);
      });
    } else {
      console.error(`Error setting ${key} in localStorage:`, error);
      let parsedValue;
      try {
        parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        parsedValue = value;
      }
      idbSetItem(key, parsedValue).catch(() => {});
    }
  }
};

export const safeLocalRemove = (key) => {
  quotaExceededKeys.delete(key);
  try {
    memoryFallbackCache.delete(key);
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
  // Also clean up from IndexedDB if present
  idbRemoveItem(key).catch(() => {});
};

export const recordDeckStudy = (deckId) => {
  if (!deckId || deckId === 'all') return;
  try {
    const key = 'chongzi_recent_studied_decks';
    const recent = safeLocalGet(key, {});
    recent[String(deckId)] = Date.now();
    safeLocalSet(key, recent);
  } catch {
    // ignore
  }
};

export const safeLocalClear = () => {
  quotaExceededKeys.clear();
  memoryFallbackCache.clear();
  try {
    window.localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// --- Migration ---

const HEAVY_MIGRATION_KEYS = [
  'wotd_word',
  'wotd_date',
  'chongzi_daily_quiz_completed',
  'chongzi_tts_trigger',
  'chongzi_synonym_history',
  'chongzi_word_notes',
];

const MIGRATION_FLAG = 'chongzi_migrated_v1';

export const migrateLocalStorageToIDB = async () => {
  if (safeLocalGet(MIGRATION_FLAG)) {
    return; // Already migrated
  }

  console.log('[storage] Starting migration from localStorage to IndexedDB...');
  let migratedCount = 0;

  const keysToMigrate = new Set(HEAVY_MIGRATION_KEYS);

  // Dynamically detect any existing heavy cache keys in localStorage
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && isNonEssentialKey(key)) {
        keysToMigrate.add(key);
      }
    }
  } catch {
    // Window or localStorage not accessible
  }

  for (const key of keysToMigrate) {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }

        // idbSetItem resolves to boolean (true on success, false on error)
        const success = await idbSetItem(key, parsedValue);

        // ONLY remove from localStorage if:
        // 1. IndexedDB write succeeded (prevent data loss)
        // 2. The key is NOT in ACTIVE_SYNC_KEYS (screens like VocabularyNotebookScreen, DashboardScreen, SynonymComparisonScreen still read synchronously from localStorage)
        // 3. The key is NOT in PRESERVED_KEYS
        const isPreserved = PRESERVED_KEYS.includes(key);
        const isActiveSync = ACTIVE_SYNC_KEYS.includes(key);
        const isFloatingDict = typeof key === 'string' && key.startsWith('floating_dict_');

        if (success && !isPreserved && !isActiveSync && !isFloatingDict) {
          window.localStorage.removeItem(key);
          memoryFallbackCache.delete(key);
        } else if (!success) {
          console.warn(`[storage] IndexedDB write failed for "${key}"; keeping in localStorage.`);
        }

        migratedCount++;
      }
    } catch (error) {
      console.error(`[storage] Failed to migrate key "${key}":`, error);
    }
  }

  safeLocalSet(MIGRATION_FLAG, true);
  console.log(`[storage] Migration complete. Processed ${migratedCount} cache items to IndexedDB.`);
};

// --- Hybrid Get/Set Helpers ---

export const hybridGet = async (key, fallback = null) => {
  const localVal = safeLocalGet(key, null);
  if (localVal !== null && localVal !== undefined) {
    return localVal;
  }

  try {
    const idbValue = await idbGetItem(key);
    if (idbValue !== undefined && idbValue !== null) {
      return idbValue;
    }
  } catch (error) {
    console.warn(`Error reading ${key} from IDB:`, error);
  }

  return fallback;
};

export const hybridSet = async (key, value) => {
  try {
    await idbSetItem(key, value);
  } catch (error) {
    console.warn(`Error setting ${key} in IDB, falling back to localStorage:`, error);
    safeLocalSet(key, value);
  }
};
