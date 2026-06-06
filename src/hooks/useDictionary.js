import { useState, useCallback } from 'react';
import { dictionaryApi } from '../services/dictionaryApi';

export function useDictionary() {
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (type, value) => {
    if (!value) return null;
    setLoading(true);
    try {
      const res = await dictionaryApi.search(type, value, false);
      return res.data;
    } catch (err) {
      console.error('Failed to lookup dictionary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupMultiple = useCallback(async (type, value) => {
    if (!value) return [];
    setLoading(true);
    try {
      const res = await dictionaryApi.search(type, value, true);
      return res.data || [];
    } catch (err) {
      console.error('Failed to lookupMultiple dictionary:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, lookupMultiple, loading, dictArray: null };
}
