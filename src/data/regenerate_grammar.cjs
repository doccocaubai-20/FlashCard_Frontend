const fs = require('fs');
const path = require('path');

const levels = [1, 2, 3, 4, 5, 6];
const repoUrl = 'https://raw.githubusercontent.com/krmanik/Chinese-Grammar/master/CSV%20Files%20HSK1%20-%20HSK6/';

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function parseCsv(csvText) {
  const lines = csvText.split('\n');
  const headers = ['split', 'chinese', 'pinyin', 'translation', 'sound', 'structure', 'usedFor', 'title', 'url'];
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseCsvLine(line);

    if (row.length < 8) {
      // console.log('Skipping line due to short length:', line);
      continue;
    }
    
    const item = {};
    headers.forEach((h, idx) => {
      let val = row[idx] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      item[h] = val.replace(/""/g, '"');
    });

    results.push(item);
  }

  return results;
}

const replacements = [
  { from: /\bwith zai\b/gi, to: "với 'In' / '在' (zài)" },
  { from: /\bwith mei\b/gi, to: "với '没' (méi)" },
  { from: /\bwith bu\b/gi, to: "với '不' (bù)" },
  { from: /\bwith dou\b/gi, to: "với '都' (dōu)" },
  { from: /\bwith ye\b/gi, to: "với '也' (yě)" },
  { from: /\bwith duo\b/gi, to: "với '多' (duō)" },
  { from: /\bwith bu tai\b/gi, to: "với '不太' (bù tài)" },
  { from: /\bwith he\b/gi, to: "với '和' (hé)" },
  { from: /\bwith yihou\b/gi, to: "với '以后' (yǐhòu)" },
  { from: /\bwith yiqian\b/gi, to: "với '以前' (yǐqián)" },
  { from: /\bwith sui\b/gi, to: "với '岁' (suì)" },
  { from: /\bmeasure word ge\b/gi, to: "lượng từ '个' (gè)" },
  { from: /\bwith de\b/gi, to: "với '的' (de)" },
  { from: /\bwith le ma\b/gi, to: "với '了吗' (le ma)" },
  { from: /\bwith le\b/gi, to: "với '了' (le)" },
  { from: /\bwith ne\b/gi, to: "với '呢' (ne)" },
  { from: /\bwith ba\b/gi, to: "với '吧' (ba)" },
  { from: /\bwith lai and qu\b/gi, to: "với '来' (lái) và '去' (qù)" },
  { from: /\bwith qing\b/gi, to: "với '请' (qǐng)" },
  { from: /\bwith jiao\b/gi, to: "với '叫' (jiào)" },
  { from: /\bwith qu\b/gi, to: "với '去' (qù)" },
  { from: /\bwith neng\b/gi, to: "với '能' (néng)" },
  { from: /\bwith hui\b/gi, to: "với '会' (huì)" },
  { from: /\bwith xiang\b/gi, to: "với '想' (xiǎng)" },
  { from: /\bwith zenme\b/gi, to: "với '怎么' (zěnme)" },
  { from: /\bwith zenmeyang\b/gi, to: "với '怎么样' (zěnmeyàng)" },
  { from: /\bwith yixie\b/gi, to: "với '一些' (yìxiē)" },
  { from: /\bwith tai\b/gi, to: "với '太' (tài)" },
  { from: /\bbetween bu and mei\b/gi, to: "giữa '不' (bù) và '没' (méi)" },
  { from: /\bwith hai\b/gi, to: "với '还' (hái)" },
  { from: /\bwith jiushi\b/gi, to: "với '就是' (jiùshì)" },
  { from: /\bwith jiuyao\b/gi, to: "với '就要' (jiùyào)" },
  { from: /\bwith yijing\b/gi, to: "với '已经' (yǐjīng)" },
  { from: /\bwith jiu\b/gi, to: "với '就' (jiù)" },
  { from: /\bwith bie\b/gi, to: "với '别' (bié)" },
  { from: /\bwith yizhi\b/gi, to: "với '一直' (yìzhí)" },
  { from: /\bwith zongshi\b/gi, to: "với '总是' (zǒngshì)" },
  { from: /\bwith zhongyu\b/gi, to: "với '终于' (zhongyú)" },
  { from: /\bwith cai\b/gi, to: "với '才' (cái)" },
  { from: /\bwith zhi\b/gi, to: "với '只' (zhǐ)" },
  { from: /\bwith yibian\b/gi, to: "với '一边' (yībiān)" },
  { from: /\bwith quan\b/gi, to: "với '全' (quán)" },
  { from: /\bwith chabuduo\b/gi, to: "với '差不多' (chàbùduō)" },
  { from: /\bwith kanlai\b/gi, to: "với '看来' (kànlái)" },
  { from: /\bwith zhenghao\b/gi, to: "với '正好' (zhènghǎo)" },
  { from: /\bwith ke\b/gi, to: "với '可' (kě)" },
  { from: /\bwith yuanlai\b/gi, to: "với '原来' (yuánlái)" },
  { from: /\bwith chadian\b/gi, to: "với '差点' (chàdiǎn)" },
  { from: /\bwith conglai\b/gi, to: "với '从来' (cónglái)" },
  { from: /\bwith jieguo\b/gi, to: "với '结果' (jiéguǒ)" },
  { from: /\bwith kongpa\b/gi, to: "với '恐怕' (kǒngpà)" },
  { from: /\bwith shenme\b/gi, to: "với '什么' (shénme)" },
  { from: /\bwith youdeshi\b/gi, to: "với '有的是' (yǒudeshì)" },
  { from: /\bwith zong\b/gi, to: "với '总' (zǒng)" },
  { from: /\bwith jin yi bu\b/gi, to: "với '进一步' (jìnyíbù)" },
  { from: /\bwith zhihao\b/gi, to: "với '只好' (zhǐhǎo)" },
  { from: /\bwith bijing\b/gi, to: "với '毕竟' (bìjìng)" },
  { from: /\bwith dao\b/gi, to: "với '倒' (dào)" },
  { from: /\bwith henshi\b/gi, to: "với '很是' (hěnshì)" },
  { from: /\bwith zuzu\b/gi, to: "với '足足' (zúzú)" },
  { from: /\bwith yizai\b/gi, to: "với '一再' (yízài)" },
  { from: /\bwith xianglai\b/gi, to: "với '向来' (xiànglái)" },
  { from: /\bwith guoran\b/gi, to: "với '果然' (guǒrán)" },
  { from: /\bwith sihu\b/gi, to: "với '似乎' (sìhū)" },
  { from: /\bwith fanshi\b/gi, to: "với '凡 là' (fánshì)" },
  { from: /\bwith pianpian\b/gi, to: "với '偏偏' (piānpiān)" },
  { from: /\bwith yilu\b/gi, to: "với '一路' (yílù)" },
  { from: /\bwith wufei\b/gi, to: "với '无非' (wúfēi)" },
  { from: /\bwith dao shihou\b/gi, to: "với '到时候' (dào shíhòu)" }
];

function preprocessTitle(title) {
  let res = title;
  replacements.forEach(rep => {
    res = res.replace(rep.from, rep.to);
  });
  return res;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function translateText(text, from = 'en', to = 'vi') {
  if (!text) return '';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    const json = await res.json();
    return json[0].map(x => x[0]).join('').trim();
  } catch (err) {
    console.error(`Failed to translate "${text}":`, err.message);
    return text;
  }
}

async function run() {
  const allGrammarPoints = {};

  for (const lvl of levels) {
    console.log(`Fetching HSK ${lvl}...`);
    try {
      const url = `${repoUrl}hsk${lvl}.csv`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const rows = await parseCsv(text);
      console.log(`Parsed ${rows.length} rows for HSK ${lvl}`);

      rows.forEach(row => {
        const title = row.title;
        if (!title) return;

        // Group by title AND structure to prevent mixing different grammar structures that happen to have similar titles!
        // E.g., Questions with "ne" and Softening speech with "ba" must be separate!
        const key = `${lvl}_${title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${(row.structure || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        if (!allGrammarPoints[key]) {
          allGrammarPoints[key] = {
            title: title,
            formula: (row.structure || '').replace(/^::\s*|\s*::$/g, ''),
            level: `HSK ${lvl}`,
            usedFor: row.usedFor,
            url: row.url,
            examples: []
          };
        }

        // Only add example if the sentence actually matches the structure!
        // Check if the sentence has the target particle (e.g., if title contains 'ne', it should have 呢, if 'ba', it should have 吧)
        const hasNe = row.chinese.includes('呢');
        const hasBa = row.chinese.includes('吧');
        const titleLower = title.toLowerCase();

        if (titleLower.includes('ne') && !hasNe && hasBa) {
          // Mismatched row! Skip it.
          return;
        }
        if (titleLower.includes('ba') && !hasBa && hasNe) {
          // Mismatched row! Skip it.
          return;
        }

        if (allGrammarPoints[key].examples.length < 4) {
          allGrammarPoints[key].examples.push({
            hanzi: row.chinese,
            pinyin: row.pinyin,
            english: row.translation
          });
        }
      });
    } catch (err) {
      console.error(`Error on HSK ${lvl}:`, err.message);
    }
  }

  const grouped = {};
  Object.values(allGrammarPoints).forEach(item => {
    const lvl = item.level;
    if (!grouped[lvl]) grouped[lvl] = [];
    grouped[lvl].push(item);
  });

  const selectedItems = [];
  selectedItems.push(...(grouped['HSK 1'] || [])); // All HSK 1 items
  selectedItems.push(...(grouped['HSK 2'] || []).slice(0, 30)); // 30 HSK 2 items
  selectedItems.push(...(grouped['HSK 3'] || []).slice(0, 30)); // 30 HSK 3 items
  selectedItems.push(...(grouped['HSK 4'] || []).slice(0, 20)); // 20 HSK 4 items
  selectedItems.push(...(grouped['HSK 5'] || []).slice(0, 15)); // 15 HSK 5 items
  selectedItems.push(...(grouped['HSK 6'] || []).slice(0, 15)); // 15 HSK 6 items

  console.log(`Translating ${selectedItems.length} correctly-grouped items...`);

  const result = [];
  let count = 0;

  for (const item of selectedItems) {
    count++;
    const preprocessed = preprocessTitle(item.title);
    console.log(`Translating ${count}/${selectedItems.length}: ${preprocessed}...`);

    const translatedTitle = await translateText(preprocessed);
    await delay(100);

    const explanationSource = item.usedFor || item.title;
    const translatedExplanation = await translateText(explanationSource);
    await delay(100);

    const translatedExamples = [];
    for (const ex of item.examples) {
      const translatedMeaning = await translateText(ex.english);
      translatedExamples.push({
        hanzi: ex.hanzi,
        pinyin: ex.pinyin,
        meaning: translatedMeaning
      });
      await delay(100);
    }

    result.push({
      id: `g${count}`,
      level: item.level,
      title: translatedTitle,
      formula: item.formula,
      explanation: translatedExplanation,
      examples: translatedExamples,
      url: item.url
    });
  }

  const jsContent = `export const grammarData = ${JSON.stringify(result, null, 2)};\n`;
  const outputPath = path.join(__dirname, 'grammarData.js');
  fs.writeFileSync(outputPath, jsContent, 'utf8');
  console.log(`Successfully wrote ${result.length} grammar points to ${outputPath}`);
}

run();
