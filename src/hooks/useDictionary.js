import { useState, useEffect, useCallback } from 'react';

// Module-level variables to cache the dictionary data so it loads and parses exactly once
let dictionaryMap = null; // s/t -> Array of entries
let pinyinMap = null;     // p/pt/sp -> Array of entries
let meaningMap = null;    // sv/vi -> Array of entries
let dictArrayRef = null;  // raw array for fallback linear searches
let loadPromise = null;

// IndexedDB Caching configuration to persist the parsed array across reloads
const DB_NAME = 'DictionaryCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'dictionary_store';
const CACHE_KEY = 'dictionary_data';

function getCachedDictionary() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CACHE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

function saveCachedDictionary(data) {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, CACHE_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    };
    request.onerror = () => resolve(false);
  });
}

export function useDictionary() {
  const [loading, setLoading] = useState(!dictionaryMap);

  useEffect(() => {
    if (dictionaryMap) {
      setLoading(false);
      return;
    }

    if (!loadPromise) {
      loadPromise = (async () => {
        try {
          // 1. Try reading the 35MB array from local IndexedDB cache
          let dictArray = await getCachedDictionary();

          if (!dictArray) {
            console.log('Dictionary Cache Miss. Downloading 35MB from server...');
            const module = await import('../data/dictionary.json');
            dictArray = module.default;

            // Save downloaded array in IndexedDB background thread
            saveCachedDictionary(dictArray).catch((err) => {
              console.error('Failed to cache dictionary in IndexedDB:', err);
            });
          } else {
            console.log('Dictionary Cache Hit. Loaded from browser IndexedDB.');
          }

          dictArrayRef = dictArray;

          // 2. Build fast lookup maps
          const hMap = new Map();
          const pMap = new Map();
          const mMap = new Map();

          for (let i = 0; i < dictArray.length; i++) {
            const entry = dictArray[i];
            if (!entry) continue;

            // Index Hanzi (Simplified & Traditional)
            if (entry.s) {
              const sClean = entry.s.trim();
              if (!hMap.has(sClean)) hMap.set(sClean, []);
              hMap.get(sClean).push(entry);
            }
            if (entry.t && entry.t.trim() !== entry.s?.trim()) {
              const tClean = entry.t.trim();
              if (!hMap.has(tClean)) hMap.set(tClean, []);
              hMap.get(tClean).push(entry);
            }

            // Index Pinyin (p, pt, sp)
            const addPinyin = (key) => {
              if (!key) return;
              const cleanKey = key.toLowerCase().trim();
              if (!pMap.has(cleanKey)) pMap.set(cleanKey, []);
              const bucket = pMap.get(cleanKey);
              if (bucket.length === 0 || bucket[bucket.length - 1] !== entry) {
                bucket.push(entry);
              }
            };
            addPinyin(entry.p);
            addPinyin(entry.pt);
            addPinyin(entry.sp);

            // Index Sino-Vietnamese / Hán Việt (sv)
            if (entry.sv) {
              const svClean = entry.sv.toLowerCase().trim();
              if (!mMap.has(svClean)) mMap.set(svClean, []);
              mMap.get(svClean).push(entry);
            }
          }

          dictionaryMap = hMap;
          pinyinMap = pMap;
          meaningMap = mMap;
          setLoading(false);
        } catch (err) {
          console.error('Failed to load dictionary:', err);
          setLoading(false);
        }
      })();
    } else {
      loadPromise.then(() => {
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, []);

  const lookup = useCallback((type, value) => {
    if (!value) return null;
    const cleanValue = value.toLowerCase().trim();

    if (type === 'hanzi') {
      if (!dictionaryMap) return null;
      const matches = dictionaryMap.get(value.trim());
      return matches && matches.length > 0 ? matches[0] : null;
    }

    if (type === 'pinyin') {
      if (!pinyinMap) return null;
      const matches = pinyinMap.get(cleanValue);
      return matches && matches.length > 0 ? matches[0] : null;
    }

    if (type === 'meaning') {
      if (!meaningMap) return null;
      const matches = meaningMap.get(cleanValue);
      if (matches && matches.length > 0) return matches[0];

      if (dictArrayRef) {
        const found = dictArrayRef.find((entry) => {
          const sv = entry.sv ? entry.sv.toLowerCase() : '';
          const vi = entry.vi ? entry.vi.toLowerCase() : '';
          return sv.includes(cleanValue) || vi.includes(cleanValue);
        });
        return found || null;
      }
    }

    return null;
  }, []);

  const lookupMultiple = useCallback((type, value) => {
    if (!value) return [];
    const cleanValue = value.toLowerCase().trim();
    if (!dictArrayRef) return [];

    if (type === 'hanzi') {
      const q = value.trim();
      // 1. Exact matches (O(1))
      if (dictionaryMap) {
        const exact = dictionaryMap.get(q);
        if (exact && exact.length > 0) return exact;
      }

      // 2. Prefix matches (only if query contains Chinese characters)
      const isHanzi = /[\u4e00-\u9fa5]/.test(q);
      if (isHanzi && dictionaryMap) {
        const matches = [];
        for (const [key, entries] of dictionaryMap.entries()) {
          if (key.startsWith(q) && key !== q) {
            matches.push(...entries);
            if (matches.length >= 30) break;
          }
        }
        return matches.slice(0, 30);
      }
      return [];
    }

    if (type === 'pinyin') {
      if (!pinyinMap) return [];
      
      // 1. Exact pinyin match (O(1))
      const exact = pinyinMap.get(cleanValue);
      if (exact && exact.length > 0) {
        return exact.slice(0, 30);
      }

      // 2. Prefix pinyin match (O(1500) keys)
      const matches = [];
      const keysSeen = new Set();
      
      for (const key of pinyinMap.keys()) {
        if (key.startsWith(cleanValue)) {
          const entries = pinyinMap.get(key);
          for (const entry of entries) {
            if (!keysSeen.has(entry)) {
              keysSeen.add(entry);
              matches.push(entry);
            }
          }
          if (matches.length >= 50) break;
        }
      }
      return matches.slice(0, 30);
    }

    if (type === 'meaning') {
      if (!meaningMap) return [];
      
      // 1. Check Hán-Việt exact match (O(1))
      const exactSv = meaningMap.get(cleanValue);
      if (exactSv && exactSv.length > 0) {
        return exactSv.slice(0, 30);
      }

      // 2. Check Hán-Việt prefix match (O(2000) keys)
      const matches = [];
      const seenEntries = new Set();
      
      for (const key of meaningMap.keys()) {
        if (key.startsWith(cleanValue)) {
          const entries = meaningMap.get(key);
          for (const entry of entries) {
            if (!seenEntries.has(entry)) {
              seenEntries.add(entry);
              matches.push(entry);
            }
          }
          if (matches.length >= 50) break;
        }
      }

      if (matches.length >= 20) {
        return matches.slice(0, 30);
      }

      // 3. Substring matching on Vietnamese translation (linear scan, but limited to 30)
      if (cleanValue.length > 1) {
        for (let i = 0; i < dictArrayRef.length; i++) {
          const e = dictArrayRef[i];
          if (!e || !e.vi) continue;
          if (e.vi.toLowerCase().includes(cleanValue)) {
            if (!seenEntries.has(e)) {
              seenEntries.add(e);
              matches.push(e);
            }
            if (matches.length >= 30) break;
          }
        }
      }
      return matches.slice(0, 30);
    }

    return [];
  }, []);

  return { lookup, lookupMultiple, loading };
}
