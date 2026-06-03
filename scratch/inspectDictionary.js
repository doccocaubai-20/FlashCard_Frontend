// inspectDictionary.js – run with `node inspectDictionary.js`
const fs = require('fs');
const path = require('path');

// Resolve path to dictionary.json (relative to this script)
const dictPath = path.resolve(__dirname, '../data/dictionary.json');

function loadDictionary() {
  const raw = fs.readFileSync(dictPath, 'utf8');
  return JSON.parse(raw);
}

function buildMaps(dictArray) {
  const hMap = new Map();
  const pMap = new Map();
  const mMap = new Map();

  for (let i = 0; i < dictArray.length; i++) {
    const entry = dictArray[i];
    if (!entry) continue;

    // Hanzi (simplified & traditional)
    if (entry.s) {
      const s = entry.s.trim();
      if (!hMap.has(s)) hMap.set(s, []);
      hMap.get(s).push(entry);
    }
    if (entry.t && entry.t.trim() !== entry.s?.trim()) {
      const t = entry.t.trim();
      if (!hMap.has(t)) hMap.set(t, []);
      hMap.get(t).push(entry);
    }

    // Pinyin (p, pt, sp)
    const addPinyin = (key) => {
      if (!key) return;
      const k = key.toLowerCase().trim();
      if (!pMap.has(k)) pMap.set(k, []);
      const bucket = pMap.get(k);
      if (bucket.length === 0 || bucket[bucket.length - 1] !== entry) {
        bucket.push(entry);
      }
    };
    addPinyin(entry.p);
    addPinyin(entry.pt);
    addPinyin(entry.sp);

    // Meaning – Hán‑Việt (sv)
    if (entry.sv) {
      const sv = entry.sv.toLowerCase().trim();
      if (!mMap.has(sv)) mMap.set(sv, []);
      mMap.get(sv).push(entry);
    }
  }
  return { hMap, pMap, mMap };
}

function main() {
  const dictArray = loadDictionary();
  const { hMap, pMap, mMap } = buildMaps(dictArray);
  console.log('Dictionary loaded, size:', dictArray.length);
  console.log('hMap size (unique hanzi keys):', hMap.size);
  console.log('pMap size (unique pinyin keys):', pMap.size);
  console.log('mMap size (unique meaning keys):', mMap.size);

  // Show sample entries
  const getSample = (map) => {
    const it = map.entries().next();
    if (it.done) return null;
    const [key, arr] = it.value;
    return { key, entry: arr[0] };
  };
  console.log('\nSample hMap entry:', getSample(hMap));
  console.log('Sample pMap entry:', getSample(pMap));
  console.log('Sample mMap entry:', getSample(mMap));
}

main();
