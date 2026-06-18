const fs = require('fs');
const path = require('path');

const dataDir = __dirname;
const levels = [1, 2, 3, 4, 5, 6];

// Helper to clean punctuation
function cleanPunctuation(str) {
  if (!str) return '';
  return str.replace(/[。,，？！?!、；：\s]/g, '').trim();
}

// Find target word variant in sentence
function findWordInSentence(wordText, sentence) {
  if (!wordText || !sentence) return null;
  // Split by |, ｜, /, etc.
  const variants = wordText.split(/[|｜/]/).map(v => v.trim()).filter(Boolean);
  for (const v of variants) {
    if (sentence.includes(v)) {
      return v;
    }
  }
  return null;
}

const questionBank = {};

levels.forEach(level => {
  const filePath = path.join(dataDir, `tu_vung_hsk${level}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping level ${level}: File not found`);
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Only keep valid entries with example sentences
  const pool = rawData.filter(w => w && w['Tiếng Trung'] && w.exampleHanzi && w.exampleHanzi.length > 2);
  
  const listening = [];
  const reading = [];
  const writing = [];

  console.log(`Level ${level}: Processing ${pool.length} candidates with examples...`);

  // Helper to get random distractors of the same level (prioritizing same word type if matching)
  function getDistractorWords(correctWordEntry, count = 3) {
    const correctText = correctWordEntry['Tiếng Trung'];
    const targetType = correctWordEntry['Từ loại'];

    let matches = rawData.filter(w => w && w['Tiếng Trung'] && w['Tiếng Trung'] !== correctText && w['Từ loại'] === targetType);
    if (matches.length < count) {
      matches = rawData.filter(w => w && w['Tiếng Trung'] && w['Tiếng Trung'] !== correctText);
    }
    
    // Shuffle
    const shuffled = [...matches].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(w => w['Tiếng Trung'].split(/[|｜/]/)[0].trim());
  }

  // Helper to get random sentence meanings from same level as distractors
  function getMeaningDistractors(correctIdx, count = 3) {
    const distractors = [];
    const tempPool = [...pool];
    tempPool.splice(correctIdx, 1);
    
    const shuffled = tempPool.sort(() => 0.5 - Math.random());
    for (let k = 0; k < Math.min(shuffled.length, count); k++) {
      distractors.push(shuffled[k].exampleMeaning || shuffled[k]['Dịch nghĩa']);
    }
    // Fallback if not enough
    while (distractors.length < count) {
      distractors.push('Không có nghĩa phù hợp.');
    }
    return distractors;
  }

  pool.forEach((wordEntry, index) => {
    const hanzi = wordEntry.exampleHanzi;
    const meaning = wordEntry.exampleMeaning || wordEntry['Dịch nghĩa'];
    const pinyin = wordEntry.examplePinyin || '';

    // --- LISTENING QUESTIONS ---
    // Alternate between True/False and Multiple Choice translation
    if (index % 2 === 0) {
      // True/False
      const isCorrectStatement = Math.random() > 0.5;
      let statementText = meaning;
      if (!isCorrectStatement) {
        // Pick a meaning from another sentence
        const dists = getMeaningDistractors(index, 1);
        statementText = dists[0];
      }

      listening.push({
        id: `hsk${level}-l-tf-${index}`,
        type: 'true-false',
        section: 'listening',
        questionText: 'Nghe phát âm câu tiếng Trung và quyết định nhận định tiếng Việt sau là Đúng (正确) hay Sai (错误):',
        audioText: hanzi,
        pinyin: level <= 2 ? pinyin : undefined, // only show pinyin for HSK 1-2
        statement: statementText,
        options: ['Đúng', 'Sai'],
        correctAnswer: isCorrectStatement ? 'Đúng' : 'Sai'
      });
    } else {
      // Multiple Choice
      const dists = getMeaningDistractors(index, 3);
      const options = [meaning, ...dists].sort(() => 0.5 - Math.random());

      listening.push({
        id: `hsk${level}-l-mc-${index}`,
        type: 'multiple-choice',
        section: 'listening',
        questionText: 'Nghe phát âm câu tiếng Trung và chọn nghĩa tiếng Việt chính xác nhất:',
        audioText: hanzi,
        options,
        correctAnswer: meaning,
        pinyin: level <= 2 ? pinyin : undefined
      });
    }

    // --- READING QUESTIONS ---
    // Alternate between Fill-in-the-blank (Cloze) and Multiple Choice Translation
    const matchedWord = findWordInSentence(wordEntry['Tiếng Trung'], hanzi);
    if (index % 2 === 0 && matchedWord) {
      // Cloze (Fill-in-the-blank)
      const clozeSentence = hanzi.replace(matchedWord, ' ____ ');
      let clozePinyin = pinyin;
      
      // Attempt to blank pinyin too
      const pinyinWord = wordEntry['Pinyin'].split(/[|｜/]/)[0].trim().toLowerCase();
      if (pinyinWord && pinyin) {
        // simple case insensitive replace
        const regex = new RegExp(pinyinWord, 'gi');
        clozePinyin = pinyin.replace(regex, ' ____ ');
      }

      const correctWordText = matchedWord;
      const dists = getDistractorWords(wordEntry, 3);
      const options = [correctWordText, ...dists].sort(() => 0.5 - Math.random());

      reading.push({
        id: `hsk${level}-r-cloze-${index}`,
        type: 'fill-in-the-blank',
        section: 'reading',
        questionText: 'Chọn từ vựng thích hợp nhất điền vào chỗ trống:',
        sentence: clozeSentence,
        pinyin: level <= 2 ? clozePinyin : undefined,
        meaningHint: `Nghĩa gợi ý: ${meaning}`,
        options,
        correctAnswer: correctWordText
      });
    } else {
      // Multiple Choice Translation
      const dists = getMeaningDistractors(index, 3);
      const options = [meaning, ...dists].sort(() => 0.5 - Math.random());

      reading.push({
        id: `hsk${level}-r-trans-${index}`,
        type: 'multiple-choice',
        section: 'reading',
        questionText: `Chọn nghĩa tiếng Việt chính xác của câu chữ Hán sau: "${hanzi}"`,
        pinyin: level <= 2 ? pinyin : undefined,
        options,
        correctAnswer: meaning
      });
    }

    // --- WRITING QUESTIONS ---
    // Only for HSK 3, 4, 5, 6
    if (level >= 3) {
      const clean = cleanPunctuation(hanzi);
      if (clean && clean.length > 2 && clean.length <= 15) {
        // Split into character blocks
        const chars = Array.from(clean);
        // Ensure they aren't already sorted or too simple
        const scrambled = [...chars].sort(() => 0.5 - Math.random());
        
        writing.push({
          id: `hsk${level}-w-arrange-${index}`,
          type: 'arrange',
          section: 'writing',
          questionText: 'Sắp xếp các chữ Hán sau thành câu đúng ngữ pháp:',
          pinyin: `Phiên âm gợi ý: ${pinyin}`,
          meaningHint: `Nghĩa gợi ý: ${meaning}`,
          words: scrambled,
          correctAnswer: clean
        });
      }
    }
  });

  questionBank[level] = {
    listening,
    reading,
    writing
  };

  console.log(`Level ${level} complete! Generated ${listening.length} listening, ${reading.length} reading, ${writing.length} writing questions.`);
});

fs.writeFileSync(path.join(dataDir, 'hskQuestionBank.json'), JSON.stringify(questionBank, null, 2), 'utf8');
console.log('HSK Question Bank generated successfully at hskQuestionBank.json!');
