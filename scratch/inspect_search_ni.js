const fs = require('fs');

const dictPath = 'c:/Users/admin/Documents/flashcard/flashcard-frontend/src/data/dictionary.json';
const dictArrayRef = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

// Recreate search logic
const lookupMultiple = (type, value) => {
  if (!value) return [];
  const cleanValue = value.toLowerCase().trim();

  if (type === 'hanzi') {
    const q = value.trim();
    const matches = [];
    for (let i = 0; i < dictArrayRef.length; i++) {
      const e = dictArrayRef[i];
      if (!e) continue;
      
      let score = 0;
      if (e.s === q || e.t === q) {
        score = 100;
      } else if ((e.s && e.s.includes(q)) || (e.t && e.t.includes(q))) {
        score = 50;
      }

      if (score > 0) {
        matches.push({ entry: e, score });
      }
    }
    return matches
      .sort((a, b) => b.score - a.score)
      .map((m) => m.entry)
      .slice(0, 30);
  }

  if (type === 'pinyin') {
    const matches = [];
    const isShort = cleanValue.length <= 1;

    for (let i = 0; i < dictArrayRef.length; i++) {
      const e = dictArrayRef[i];
      if (!e) continue;
      const p = e.p ? e.p.toLowerCase() : '';
      const pt = e.pt ? e.pt.toLowerCase() : '';
      const sp = e.sp ? e.sp.toLowerCase() : '';

      let score = 0;
      if (p === cleanValue || pt === cleanValue || sp === cleanValue) {
        score = 100;
      } else if (p.startsWith(cleanValue) || pt.startsWith(cleanValue) || sp.startsWith(cleanValue)) {
        score = 50;
      } else if (!isShort && (p.includes(cleanValue) || pt.includes(cleanValue) || sp.includes(cleanValue))) {
        score = 10;
      }

      if (score > 0) {
        matches.push({ entry: e, score });
      }
    }
    return matches
      .sort((a, b) => b.score - a.score)
      .map((m) => m.entry)
      .slice(0, 30);
  }

  if (type === 'meaning') {
    const matches = [];
    const isShort = cleanValue.length <= 1;

    for (let i = 0; i < dictArrayRef.length; i++) {
      const e = dictArrayRef[i];
      if (!e) continue;
      const sv = e.sv ? e.sv.toLowerCase() : '';
      const vi = e.vi ? e.vi.toLowerCase() : '';

      let score = 0;
      if (sv === cleanValue) {
        score = 100;
      } else if (sv.startsWith(cleanValue)) {
        score = 80;
      } else if (!isShort && sv.includes(cleanValue)) {
        score = 60;
      } else if (vi === cleanValue) {
        score = 50;
      } else if (vi.startsWith(cleanValue)) {
        score = 30;
      } else if (!isShort && vi.includes(cleanValue)) {
        score = 10;
      }

      if (score > 0) {
        matches.push({ entry: e, score });
      }
    }
    return matches
      .sort((a, b) => b.score - a.score)
      .map((m) => m.entry)
      .slice(0, 30);
  }

  return [];
};

const trimmedQuery = 'ni';

const hanziMatches = lookupMultiple('hanzi', trimmedQuery);
const pinyinMatches = lookupMultiple('pinyin', trimmedQuery);
const meaningMatches = lookupMultiple('meaning', trimmedQuery);

console.log(`hanziMatches: ${hanziMatches.length}`);
console.log(`pinyinMatches: ${pinyinMatches.length}`);
console.log(`meaningMatches: ${meaningMatches.length}`);

const seen = new Set();
const combined = [...hanziMatches, ...pinyinMatches, ...meaningMatches];
const searchResults = [];

for (const item of combined) {
  if (!item) continue;
  const key = `${item.s}-${item.p}-${item.vi}`;
  if (!seen.has(key)) {
    seen.add(key);
    searchResults.push(item);
  }
}

// Sort matches: Exact matches first
const qLower = trimmedQuery.toLowerCase();
searchResults.sort((a, b) => {
  // Exact Hanzi matches
  const aHanziExact = a.s?.toLowerCase() === qLower || a.t?.toLowerCase() === qLower;
  const bHanziExact = b.s?.toLowerCase() === qLower || b.t?.toLowerCase() === qLower;
  if (aHanziExact && !bHanziExact) return -1;
  if (!aHanziExact && bHanziExact) return 1;

  // Exact Hán Việt matches
  const aSvExact = a.sv?.toLowerCase() === qLower;
  const bSvExact = b.sv?.toLowerCase() === qLower;
  if (aSvExact && !bSvExact) return -1;
  if (!aSvExact && bSvExact) return 1;

  return 0;
});

const finalResults = searchResults.slice(0, 30);
console.log(`Final results length: ${finalResults.length}`);
console.log('Final results items:');
finalResults.forEach((item, idx) => {
  console.log(`${idx + 1}. s: ${item.s}, p: ${item.p}, pt: ${item.pt}, vi: ${item.vi.substring(0, 40)}`);
});
