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

// Set of all valid Chinese Pinyin syllables to allow smart syllable segmentation
const VALID_SYLLABLES = new Set([
  'a', 'ai', 'an', 'ang', 'ao', 'ba', 'bai', 'ban', 'bang', 'bao', 'bei', 'ben', 'beng', 'bi', 'bian', 'biao', 'bie', 'bin', 'bing', 'bo', 'bu', 'ca', 'cai', 'can', 'cang', 'cao', 'ce', 'cei', 'cen', 'ceng', 'cha', 'chai', 'chan', 'chang', 'chao', 'che', 'chen', 'cheng', 'chi', 'chong', 'chou', 'chu', 'chua', 'chuai', 'chuan', 'chuang', 'chui', 'chun', 'chuo', 'ci', 'cong', 'cou', 'cu', 'cuan', 'cui', 'cun', 'cuo', 'da', 'dai', 'dan', 'dang', 'dao', 'de', 'dei', 'den', 'deng', 'di', 'dia', 'dian', 'diao', 'die', 'ding', 'diu', 'dong', 'dou', 'du', 'duan', 'dui', 'dun', 'duo', 'e', 'ei', 'en', 'eng', 'er', 'fa', 'fan', 'fang', 'fei', 'fen', 'feng', 'fo', 'fou', 'fu', 'ga', 'gai', 'gan', 'gang', 'gao', 'ge', 'gei', 'gen', 'geng', 'gong', 'gou', 'gu', 'gua', 'guai', 'guan', 'guang', 'gui', 'gun', 'guo', 'ha', 'hai', 'han', 'hang', 'hao', 'he', 'hei', 'hen', 'heng', 'hong', 'hou', 'hu', 'hua', 'huai', 'huan', 'huang', 'hui', 'hun', 'huo', 'ji', 'jia', 'jian', 'jiang', 'jiao', 'jie', 'jin', 'jing', 'jiong', 'jiu', 'ju', 'juan', 'jue', 'jun', 'ka', 'kai', 'kan', 'kang', 'kao', 'ke', 'kei', 'ken', 'keng', 'kong', 'kou', 'ku', 'kua', 'kuai', 'kuan', 'kuang', 'kui', 'kun', 'kuo', 'la', 'lai', 'lan', 'lang', 'lao', 'le', 'lei', 'leng', 'li', 'lia', 'lian', 'liang', 'liao', 'lie', 'lin', 'ling', 'liu', 'lo', 'long', 'lou', 'lu', 'luan', 'lue', 'lun', 'luo', 'lv', 'lve', 'ma', 'mai', 'man', 'mang', 'mao', 'me', 'mei', 'men', 'meng', 'mi', 'mian', 'miao', 'mie', 'min', 'ming', 'miu', 'mo', 'mou', 'mu', 'na', 'nai', 'nan', 'nang', 'nao', 'ne', 'nei', 'nen', 'neng', 'ni', 'nian', 'niang', 'niao', 'nie', 'nin', 'ning', 'niu', 'nong', 'nou', 'nu', 'nuan', 'nue', 'nun', 'nuo', 'nv', 'nve', 'o', 'ou', 'pa', 'pai', 'pan', 'pang', 'pao', 'pei', 'pen', 'peng', 'pi', 'pian', 'piao', 'pie', 'pin', 'ping', 'po', 'pou', 'pu', 'qi', 'qia', 'qian', 'qiang', 'qiao', 'qie', 'qin', 'qing', 'qiong', 'qiu', 'qu', 'quan', 'que', 'qun', 'ran', 'rang', 'rao', 're', 'ren', 'reng', 'ri', 'rong', 'rou', 'ru', 'rua', 'ruan', 'rui', 'run', 'ruo', 'sa', 'sai', 'san', 'sang', 'sao', 'se', 'sen', 'seng', 'sha', 'shai', 'shan', 'shang', 'shao', 'she', 'shei', 'shen', 'sheng', 'shi', 'shou', 'shu', 'shua', 'shuai', 'shuan', 'shuang', 'shui', 'shun', 'shuo', 'si', 'song', 'sou', 'su', 'suan', 'sui', 'sun', 'suo', 'ta', 'tai', 'tan', 'tang', 'tao', 'te', 'teng', 'ti', 'tian', 'tiao', 'tie', 'ting', 'tong', 'tou', 'tu', 'tuan', 'tui', 'tun', 'tuo', 'u', 'va', 'van', 've', 'wa', 'wai', 'wan', 'wang', 'wei', 'wen', 'weng', 'wo', 'wu', 'xi', 'xia', 'xian', 'xiang', 'xiao', 'xie', 'xin', 'xing', 'xiong', 'xiu', 'xu', 'xuan', 'xue', 'xun', 'ya', 'yan', 'yang', 'yao', 'ye', 'yi', 'yin', 'ying', 'yo', 'yong', 'you', 'yu', 'yuan', 'yue', 'yun', 'za', 'zai', 'zan', 'zang', 'zao', 'ze', 'zei', 'zen', 'zeng', 'zha', 'zhai', 'zhan', 'zhang', 'zhao', 'zhe', 'zhei', 'zhen', 'zheng', 'zhi', 'zhong', 'zhou', 'zhu', 'zhua', 'zhuai', 'zhuan', 'zhuang', 'jui', 'zhun', 'zhuo', 'zi', 'zong', 'zou', 'zu', 'zuan', 'zui', 'zun', 'zuo'
]);

// Segments a plain ASCII pinyin search string into individual syllables
const segmentPinyinQuery = (queryStr) => {
  const s = queryStr.toLowerCase().replace(/[^a-z]/g, '').replace(/v/g, 'u');
  const result = [];
  let i = 0;
  while (i < s.length) {
    let matched = false;
    for (let len = Math.min(6, s.length - i); len >= 1; len--) {
      const part = s.substring(i, i + len);
      if (VALID_SYLLABLES.has(part) || (i + len === s.length && len <= 3)) {
        result.push(part);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result.push(s[i]);
      i++;
    }
  }
  return result;
};

// Verifies if a Pinyin string matches the query syllable-by-syllable (smart boundary matching)
const pinyinMatchesQuery = (itemP, queryStr) => {
  if (!itemP || !queryStr) return false;
  const cleanQ = queryStr.toLowerCase().trim();
  const queryParts = cleanQ.includes(' ') 
    ? cleanQ.split(/\s+/).map(p => p.replace(/[^a-z]/g, '')) 
    : segmentPinyinQuery(cleanQ);
    
  if (queryParts.length === 0) return false;

  const wordSylls = itemP
    .split(/[\u200b\s·'-]+/)
    .filter(Boolean)
    .map(s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ü/g, 'v').replace(/[^a-z]/g, ''));

  if (wordSylls.length < queryParts.length) return false;

  for (let i = 0; i < queryParts.length; i++) {
    const qPart = queryParts[i];
    const wPart = wordSylls[i];
    if (!wPart) return false;

    if (i < queryParts.length - 1) {
      if (wPart !== qPart) return false;
    } else {
      if (VALID_SYLLABLES.has(qPart)) {
        if (wPart !== qPart) return false;
      } else {
        if (!wPart.startsWith(qPart)) return false;
      }
    }
  }
  return true;
};

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
          let dictArray = await getCachedDictionary();

          if (!dictArray) {
            console.log('Dictionary Cache Miss. Downloading DICTIONARY from server...');
            // Dynamic import of the 35MB JSON so it is not in the initial page bundle
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

  const lookup = useCallback(async (type, value) => {
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

  const lookupMultiple = useCallback(async (type, value) => {
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

      // 2. Prefix pinyin match with syllable-boundary checks
      const matches = [];
      const keysSeen = new Set();

      for (const key of pinyinMap.keys()) {
        if (key.startsWith(cleanValue)) {
          const entries = pinyinMap.get(key);
          for (const entry of entries) {
            if (!keysSeen.has(entry)) {
              // Check if entry's pinyin matches query's syllables
              const isMatch = pinyinMatchesQuery(entry.p, cleanValue) || 
                              pinyinMatchesQuery(entry.pt, cleanValue) || 
                              pinyinMatchesQuery(entry.sp, cleanValue);
              if (isMatch) {
                keysSeen.add(entry);
                matches.push(entry);
              }
            }
          }
          if (matches.length >= 100) break; // Fetch slightly more candidate matches for filtering
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

      // 3. Substring matching on Vietnamese translation (linear scan)
      // Skip substring search for short queries (length <= 2) to avoid false matches on "niệm", "ninh", etc.
      if (cleanValue.length > 2) {
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

  return { lookup, lookupMultiple, loading, dictArray: dictArrayRef };
}
