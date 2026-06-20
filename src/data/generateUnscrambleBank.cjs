const fs = require('fs');
const path = require('path');

const dataDir = __dirname;

// Helper to clean punctuation
function cleanChineseSentence(str) {
  if (!str) return '';
  // Keep only Chinese characters and letters/numbers, strip punctuation
  return str.replace(/[。,，？！?!、；：\s\r\n\t."';:()（）]/g, '').trim();
}

// Clean raw vocabulary word variants (e.g. "爸爸｜爸" -> ["爸爸", "爸"])
function parseWordVariants(wordText) {
  if (!wordText) return [];
  return wordText.split(/[|｜/]/).map(v => v.trim()).filter(Boolean);
}

// Temporary file loader for ES modules in CommonJS
function loadEsModuleAsCommonJS(filePath, exportName) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Replace export statement with CommonJS export
  const cleaned = content.replace(new RegExp(`export\\s+const\\s+${exportName}\\s*=`), 'module.exports =');
  const tempPath = path.join(dataDir, `_temp_${exportName}.cjs`);
  fs.writeFileSync(tempPath, cleaned, 'utf8');
  
  try {
    const data = require(tempPath);
    // Delete temp file immediately
    fs.unlinkSync(tempPath);
    return data;
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error(`Failed to load ${exportName} from ${filePath}:`, err);
    return [];
  }
}

function run() {
  console.log('Building word dictionary database from HSK 1-9 vocabulary files...');
  
  const wordMap = new Map(); // word -> { pinyin, meaning, level }
  const levelVocabLists = {}; // level -> array of words for distractor selection
  
  for (let lvl = 1; lvl <= 7; lvl++) {
    const fileName = lvl === 7 ? 'tu_vung_hsk7_9.json' : `tu_vung_hsk${lvl}.json`;
    const filePath = path.join(dataDir, fileName);
    const levelLabel = lvl === 7 ? 'HSK 7-9' : `HSK ${lvl}`;
    levelVocabLists[levelLabel] = [];

    if (!fs.existsSync(filePath)) {
      console.log(`Warning: Vocabulary file ${fileName} not found. Skipping.`);
      continue;
    }

    try {
      const vocabData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(vocabData)) {
        vocabData.forEach(item => {
          if (!item) return;
          const rawWord = item['Tiếng Trung'] || '';
          const rawPinyin = item['Pinyin'] || '';
          const rawMeaning = item['Dịch nghĩa'] || '';

          const variants = parseWordVariants(rawWord);
          variants.forEach(variant => {
            const cleanWord = variant.trim();
            if (!cleanWord) return;

            // If word is already in map, keep the lower level (first time seen is easier)
            if (!wordMap.has(cleanWord)) {
              wordMap.set(cleanWord, {
                word: cleanWord,
                pinyin: rawPinyin.replace(/\r/g, '').replace(/\n+/g, ' ').trim(),
                meaning: rawMeaning.replace(/\r/g, '').replace(/\n+/g, '; ').trim(),
                level: lvl,
                levelLabel
              });
            }
            levelVocabLists[levelLabel].push(cleanWord);
          });
        });
        console.log(`Loaded ${vocabData.length} entries from HSK level: ${levelLabel}`);
      }
    } catch (err) {
      console.error(`Error parsing ${fileName}:`, err);
    }
  }

  console.log(`Total unique words in dictionary: ${wordMap.size}`);

  // Collect candidate sentences from all sources
  console.log('\nCollecting candidate sentences...');
  const candidates = [];

  // Source 1: Vocabulary files (exampleHanzi)
  for (let lvl = 1; lvl <= 7; lvl++) {
    const fileName = lvl === 7 ? 'tu_vung_hsk7_9.json' : `tu_vung_hsk${lvl}.json`;
    const filePath = path.join(dataDir, fileName);
    const levelLabel = lvl === 7 ? 'HSK 7-9' : `HSK ${lvl}`;

    if (!fs.existsSync(filePath)) continue;

    const vocabData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    vocabData.forEach(item => {
      if (item && item.exampleHanzi && item.exampleMeaning) {
        candidates.push({
          hanzi: item.exampleHanzi.trim(),
          pinyin: item.examplePinyin ? item.examplePinyin.trim() : '',
          meaning: item.exampleMeaning.trim(),
          source: `Từ vựng HSK (${levelLabel})`
        });
      }
    });
  }
  console.log(`Collected ${candidates.length} sentences from HSK vocabulary examples.`);

  // Source 2: grammarData.js
  const grammarPath = path.join(dataDir, 'grammarData.js');
  if (fs.existsSync(grammarPath)) {
    const grammarData = loadEsModuleAsCommonJS(grammarPath, 'grammarData');
    let grammarCount = 0;
    if (Array.isArray(grammarData)) {
      grammarData.forEach(item => {
        const levelLabel = item.level ? item.level.trim() : 'HSK 1';
        if (item.examples && Array.isArray(item.examples)) {
          item.examples.forEach(ex => {
            if (ex && ex.hanzi && ex.meaning) {
              candidates.push({
                hanzi: ex.hanzi.trim(),
                pinyin: ex.pinyin ? ex.pinyin.trim() : '',
                meaning: ex.meaning.trim(),
                source: `Ngữ pháp (${levelLabel})`
              });
              grammarCount++;
            }
          });
        }
      });
    }
    console.log(`Collected ${grammarCount} sentences from HSK grammar data.`);
  }

  // Source 3: dialoguesData.js
  const dialoguesPath = path.join(dataDir, 'dialoguesData.js');
  if (fs.existsSync(dialoguesPath)) {
    const dialoguesData = loadEsModuleAsCommonJS(dialoguesPath, 'dialoguesData');
    let dialogueCount = 0;
    if (Array.isArray(dialoguesData)) {
      dialoguesData.forEach(item => {
        const levelLabel = item.level ? item.level.trim() : 'HSK 1';
        if (item.lines && Array.isArray(item.lines)) {
          item.lines.forEach(line => {
            if (line && line.hanzi && line.meaning) {
              // Strip speaker prefix if any (e.g. "A: 你好" -> "你好")
              const cleanHanzi = line.hanzi.replace(/^[A-Z]\s*[:：]\s*/, '').trim();
              const cleanMeaning = line.meaning.replace(/^[A-Za-z\s]+[:：]\s*/, '').trim();
              candidates.push({
                hanzi: cleanHanzi,
                pinyin: line.pinyin ? line.pinyin.replace(/^[A-Za-z\s]+[:：]\s*/, '').trim() : '',
                meaning: cleanMeaning,
                source: `Hội thoại (${levelLabel})`
              });
              dialogueCount++;
            }
          });
        }
      });
    }
    console.log(`Collected ${dialogueCount} sentences from HSK dialogue data.`);
  }

  console.log(`Total candidates collected: ${candidates.length}`);

  // Deduplicate and process candidates using word segmenter
  const uniqueSentences = new Map(); // cleanHanzi -> processed sentence
  let totalProcessed = 0;
  let discardedTooLong = 0;
  let discardedTooShort = 0;
  let discardedTooManyUnknowns = 0;

  candidates.forEach(cand => {
    const cleanHanzi = cleanChineseSentence(cand.hanzi);
    if (!cleanHanzi) return;

    // Filter by length: 4 to 15 characters is ideal for unscramble game
    if (cleanHanzi.length < 4) {
      discardedTooShort++;
      return;
    }
    if (cleanHanzi.length > 15) {
      discardedTooLong++;
      return;
    }

    if (uniqueSentences.has(cleanHanzi)) return;

    // Run Forward Maximum Matching (FMM)
    let index = 0;
    const tokens = [];
    let maxHskLevel = 1;
    let unknownChars = 0;
    const maxWordLength = 6;

    while (index < cleanHanzi.length) {
      let matched = false;
      for (let len = Math.min(maxWordLength, cleanHanzi.length - index); len > 0; len--) {
        const chunk = cleanHanzi.substring(index, index + len);
        if (wordMap.has(chunk)) {
          const info = wordMap.get(chunk);
          tokens.push({
            word: chunk,
            pinyin: info.pinyin,
            meaning: info.meaning
          });
          if (info.level > maxHskLevel) {
            maxHskLevel = info.level;
          }
          index += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Character not in HSK vocab (could be name, punctuation we missed, or rare word)
        const char = cleanHanzi[index];
        tokens.push({
          word: char,
          pinyin: '',
          meaning: ''
        });
        unknownChars++;
        index++;
      }
    }

    // Quality gate: if more than 30% of the characters are unknown/unmapped, skip the sentence
    if (unknownChars / cleanHanzi.length > 0.3) {
      discardedTooManyUnknowns++;
      return;
    }

    const levelLabel = maxHskLevel === 7 ? 'HSK 7-9' : `HSK ${maxHskLevel}`;

    uniqueSentences.set(cleanHanzi, {
      hanzi: cand.hanzi,
      cleanHanzi,
      pinyin: cand.pinyin,
      meaning: cand.meaning,
      level: levelLabel,
      source: cand.source,
      tokens
    });
    totalProcessed++;
  });

  console.log(`\nProcessed ${totalProcessed} unique sentences.`);
  console.log(`Discarded too short (<4 chars): ${discardedTooShort}`);
  console.log(`Discarded too long (>15 chars): ${discardedTooLong}`);
  console.log(`Discarded due to unknown vocabulary (>30%): ${discardedTooManyUnknowns}`);

  // Group by HSK level
  const grouped = {
    'HSK 1': [],
    'HSK 2': [],
    'HSK 3': [],
    'HSK 4': [],
    'HSK 5': [],
    'HSK 6': [],
    'HSK 7-9': []
  };

  uniqueSentences.forEach(sentence => {
    if (grouped[sentence.level]) {
      grouped[sentence.level].push(sentence);
    }
  });

  // Assign distractors and limit to 200 per level
  const finalQuestionBank = [];

  Object.keys(grouped).forEach(levelLabel => {
    const list = grouped[levelLabel];
    console.log(`Level ${levelLabel}: Found ${list.length} candidate sentences.`);

    // Shuffle candidates
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(200, shuffled.length));

    selected.forEach((sent, idx) => {
      // Pick 2 distractors from the vocabulary of the same HSK level that aren't in the sentence
      const vocabPool = levelVocabLists[levelLabel] || [];
      const eligibleDistractors = vocabPool.filter(word => !sent.cleanHanzi.includes(word));
      
      const distractors = [];
      if (eligibleDistractors.length > 0) {
        const distShuffled = [...eligibleDistractors].sort(() => 0.5 - Math.random());
        // Pick top 2 unique distractors
        const seenDist = new Set();
        for (const word of distShuffled) {
          if (!seenDist.has(word) && word.length >= 1 && word.length <= 4) {
            seenDist.add(word);
            const info = wordMap.get(word);
            distractors.push({
              word: word,
              pinyin: info ? info.pinyin : '',
              meaning: info ? info.meaning : ''
            });
            if (distractors.length >= 2) break;
          }
        }
      }

      // Add unique question ID
      sent.id = `uq_${levelLabel.replace(' ', '_').toLowerCase()}_${idx + 1}`;
      sent.distractors = distractors;
      
      // Clean temporary field cleanHanzi before saving
      delete sent.cleanHanzi;
      
      finalQuestionBank.push(sent);
    });

    console.log(`Level ${levelLabel}: Selected ${selected.length} sentences with distractors.`);
  });

  // Save to JSON file
  const outputPath = path.join(dataDir, 'unscrambleQuestionBank.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalQuestionBank, null, 2), 'utf8');
  console.log(`\nSuccessfully generated ${finalQuestionBank.length} questions inside ${outputPath}!`);
}

run();
