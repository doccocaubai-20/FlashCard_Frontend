import { useState, useCallback } from 'react';
import { dictionaryApi } from '../services/dictionaryApi';
import { trackQuestProgress } from '../utils/questTracker';

// Client-side RAM cache to completely eliminate duplicate network requests
const clientSearchCache = new Map();

export function useDictionary() {
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (type, value) => {
    if (!value) return null;
    const cleanValue = value.toLowerCase().trim();
    const cacheKey = `single:${type}:${cleanValue}`;
    if (clientSearchCache.has(cacheKey)) {
      return clientSearchCache.get(cacheKey);
    }

    setLoading(true);
    try {
      const res = await dictionaryApi.search(type, value, false);
      const data = res.data;
      if (data) {
        trackQuestProgress('DICTIONARY_LOOKUP', 1);
      }
      clientSearchCache.set(cacheKey, data);
      return data;
    } catch (err) {
      console.error('Failed to lookup dictionary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupMultiple = useCallback(async (type, value) => {
    if (!value) return [];
    const cleanValue = value.toLowerCase().trim();
    const cacheKey = `multi:${type}:${cleanValue}`;
    if (clientSearchCache.has(cacheKey)) {
      return clientSearchCache.get(cacheKey);
    }

    setLoading(true);
    try {
      const res = await dictionaryApi.search(type, value, true);
      const data = res.data || [];
      if (data.length > 0) {
        trackQuestProgress('DICTIONARY_LOOKUP', 1);
      }
      clientSearchCache.set(cacheKey, data);
      return data;
    } catch (err) {
      console.error('Failed to lookupMultiple dictionary:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, lookupMultiple, loading, dictArray: null };
}
