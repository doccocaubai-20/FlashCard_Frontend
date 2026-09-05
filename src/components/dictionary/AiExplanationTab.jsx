import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RotateCw,
  BookOpen,
  Cpu,
  Layers,
  Volume2,
  Lightbulb,
  Search,
  Compass
} from 'lucide-react';
import { dictionaryHistoryApi } from '../../services/dictionaryHistoryApi';
import { speakChinese } from '../../utils/tts';
import { useToast } from '../../context/ToastContext';

// Common radicals dictionary with Sino-Vietnamese names and meanings for genuine offline etymology
const RADICALS_DB = {
  '亻': { name: 'Nhân đứng', hanzi: '人', meaning: 'Người, dáng người đứng thẳng' },
  '人': { name: 'Nhân', hanzi: '人', meaning: 'Con người' },
  '氵': { name: 'Ba chấm thủy', hanzi: '水', meaning: 'Nước, chất lỏng, sông ngòi' },
  '水': { name: 'Thủy', hanzi: '水', meaning: 'Nước' },
  '木': { name: 'Mộc', hanzi: '木', meaning: 'Cây cối, gỗ' },
  '艹': { name: 'Thảo đầu', hanzi: '艸', meaning: 'Cỏ cây, thảo mộc, thực vật' },
  '火': { name: 'Hỏa', hanzi: '火', meaning: 'Lửa, nhiệt độ, thiêu đốt' },
  '灬': { name: 'Bốn chấm hỏa', hanzi: '火', meaning: 'Ngọn lửa đun nấu phía dưới' },
  '口': { name: 'Khẩu', hanzi: '口', meaning: 'Miệng, lời nói, ăn uống' },
  '囗': { name: 'Vi', hanzi: '囗', meaning: 'Vây quanh, tường thành, bao bọc' },
  '心': { name: 'Tâm', hanzi: '心', meaning: 'Trái tim, tình cảm, suy nghĩ' },
  '忄': { name: 'Tâm đứng', hanzi: '心', meaning: 'Tâm tư, cảm xúc nội tâm' },
  '日': { name: 'Nhật', hanzi: '日', meaning: 'Mặt trời, ban ngày, thời gian' },
  '月': { name: 'Nguyệt', hanzi: '月', meaning: 'Mặt trăng, ban đêm, hoặc nhục (thịt/cơ thể)' },
  '手': { name: 'Thủ', hanzi: '手', meaning: 'Bàn tay' },
  '扌': { name: 'Thủ gảy', hanzi: '手', meaning: 'Động tác của bàn tay, cầm nắm' },
  '言': { name: 'Ngôn', hanzi: '言', meaning: 'Lời nói, ngôn ngữ' },
  '讠': { name: 'Ngôn (giản thể)', hanzi: '言', meaning: 'Lời nói, trao đổi, hỏi đáp' },
  '辶': { name: 'Sước', hanzi: '辵', meaning: 'Bước đi, di chuyển, đường đi xa' },
  '走': { name: 'Tẩu', hanzi: '走', meaning: 'Chạy, đi bộ' },
  '门': { name: 'Môn (giản thể)', hanzi: '門', meaning: 'Cánh cửa, lối vào' },
  '門': { name: 'Môn', hanzi: '門', meaning: 'Cánh cổng' },
  '钅': { name: 'Kim (giản thể)', hanzi: '金', meaning: 'Kim loại, sắt thép, vàng bạc' },
  '金': { name: 'Kim', hanzi: '金', meaning: 'Kim loại' },
  '女': { name: 'Nữ', hanzi: '女', meaning: 'Phụ nữ, tính nữ' },
  '子': { name: 'Tử', hanzi: '子', meaning: 'Con cái, trẻ nhỏ' },
  '宀': { name: 'Miên', hanzi: '宀', meaning: 'Mái nhà, gian phòng che chở' },
  '土': { name: 'Thổ', hanzi: '土', meaning: 'Đất cát, mặt đất' },
  '山': { name: 'Sơn', hanzi: '山', meaning: 'Núi non, gò cao' },
  '犭': { name: 'Khuyển', hanzi: '犬', meaning: 'Loài thú, động vật hoang dã' },
  '目': { name: 'Mục', hanzi: '目', meaning: 'Mắt, thị giác, nhìn nhận' },
  '禾': { name: 'Hòa', hanzi: '禾', meaning: 'Cây lúa, hoa màu, nông nghiệp' },
  '米': { name: 'Mễ', hanzi: '米', meaning: 'Hạt gạo, lương thực' },
  '衣': { name: 'Y', hanzi: '衣', meaning: 'Áo quần, trang phục' },
  '衤': { name: 'Y (bộ thủ)', hanzi: '衣', meaning: 'Vải vóc, trang phục may mặc' },
  '礻': { name: 'Kỳ / Thị', hanzi: '示', meaning: 'Thần linh, tế lễ, tâm linh' },
  '食': { name: 'Thực', hanzi: '食', meaning: 'Ăn uống, thức ăn' },
  '饣': { name: 'Thực (giản thể)', hanzi: '食', meaning: 'Đồ ăn thức uống' },
  '力': { name: 'Lực', hanzi: '力', meaning: 'Sức mạnh, cơ bắp, tác động' },
  '足': { name: 'Túc', hanzi: '足', meaning: 'Bàn chân, bước đi' },
  '车': { name: 'Xa (giản thể)', hanzi: '車', meaning: 'Xe cộ, phương tiện' },
  '鸟': { name: 'Điểu (giản thể)', hanzi: '鳥', meaning: 'Loài chim có lông vũ' },
  '鱼': { name: 'Ngư (giản thể)', hanzi: '魚', meaning: 'Cá dưới nước' },
  '虫': { name: 'Trùng', hanzi: '虫', meaning: 'Côn trùng, sâu bọ' },
};

// Character Etymology knowledge base for representative characters
const ETYMOLOGY_SHOWCASE = [
  {
    char: '休',
    pinyin: 'xiū',
    sv: 'HƯU',
    meaning: 'Nghỉ ngơi, thôi, ngừng',
    lucThu: 'Hội ý (會意)',
    lucThuDesc: 'Chữ ghép từ bộ Nhân (亻- người) và bộ Mộc (木 - cây cối). Hình ảnh một người tựa lưng vào gốc cây râm mát để nghỉ ngơi sau buổi lao động vất vả, từ đó mang nghĩa "nghỉ ngơi, an dưỡng".',
    radicals: ['亻 (Nhân đứng - Người)', '木 (Mộc - Cây cối)'],
    example: '劳累了一天，快坐下休息一下吧。',
    examplePinyin: 'Láolèi le yì tiān, kuài zuòxià xiūxi yíxià ba.',
    exampleVi: 'Mệt mỏi cả ngày rồi, mau ngồi xuống nghỉ ngơi một chút đi.',
  },
  {
    char: '明',
    pinyin: 'míng',
    sv: 'MINH',
    meaning: 'Sáng sủa, thông minh, minh bạch',
    lucThu: 'Hội ý (會意)',
    lucThuDesc: 'Chữ kết hợp giữa Nhật (日 - mặt trời tỏa sáng rực rỡ ban ngày) và Nguyệt (月 - mặt trăng tỏa sáng dịu mát ban đêm). Hai nguồn sáng lớn nhất trong vũ trụ hội tụ tạo nên ánh sáng quang minh, sáng rõ tuyệt đối.',
    radicals: ['日 (Nhật - Mặt trời)', '月 (Nguyệt - Mặt trăng)'],
    example: '明月照高楼，夜色多么美。',
    examplePinyin: 'Míngyuè zhào gāolóu, yèsè duōme měi.',
    exampleVi: 'Trăng sáng soi lầu cao, màn đêm thật đẹp biết bao.',
  },
  {
    char: '家',
    pinyin: 'jiā',
    sv: 'GIA',
    meaning: 'Nhà, gia đình, quê hương',
    lucThu: 'Hội ý (會意)',
    lucThuDesc: 'Phía trên là bộ Miên (宀 - mái nhà kiên cố che chở), phía dưới là chữ Thỉ (豕 - con lợn). Thời cổ đại Trung Hoa, dưới mái nhà có gia súc (lợn) tượng trưng cho cuộc sống định cư, no ấm, tài sản ổn định và mái ấm gia đình.',
    radicals: ['宀 (Miên - Mái nhà)', '豕 (Thỉ - Con lợn, gia súc)'],
    example: '无论走到哪里，家永远是温暖的港湾。',
    examplePinyin: 'Wúlùn zǒu dào nǎlǐ, jiā yǒngyuǎn shì wēnnuǎn de gǎngwān.',
    exampleVi: 'Dù có đi đến đâu, nhà vẫn luôn là bến đỗ ấm áp.',
  },
  {
    char: '爱',
    pinyin: 'ài',
    sv: 'ÁI',
    meaning: 'Yêu thương, quý mến, ái tình',
    lucThu: 'Hội ý & Hình thanh',
    lucThuDesc: 'Chữ phồn thể (愛) có bộ Tâm (心 - trái tim) ở chính giữa, thể hiện tình yêu đích thực phải xuất phát từ đáy lòng. Phía trên là bộ Trảo (爪 - đón nhận) và phía dưới là chữ Tuy (夂 - chậm rãi đi theo). Yêu là trao trọn trái tim và cùng nhau đồng hành suốt cuộc đời.',
    radicals: ['爫 (Trảo)', '冖 (Mịch)', '友/心 (Tâm / Bạn)'],
    example: '父母对孩子的爱是最无私的。',
    examplePinyin: 'Fùmǔ duì háizi de ài shì zuì wúsī de.',
    exampleVi: 'Tình yêu thương cha mẹ dành cho con cái là vô tư nhất.',
  },
  {
    char: '学',
    pinyin: 'xué',
    sv: 'HỌC',
    meaning: 'Học tập, tiếp thu tri thức, bắt chước',
    lucThu: 'Hội ý (會意)',
    lucThuDesc: 'Phía trên là hai bàn tay nâng đỡ các thanh toán quẻ tính toán tri thức, ở giữa là mái trường che chở, phía dưới là chữ Tử (子 - đứa trẻ). Ý nghĩa đứa trẻ ngồi dưới mái hiên dùng hai tay tiếp nhận kiến thức từ người đi trước.',
    radicals: ['⺍ (Tiểu biến thể)', '冖 (Mịch - Mái che)', '子 (Tử - Đứa trẻ)'],
    example: '学如逆水行舟，不进则退。',
    examplePinyin: 'Xué rú nìshuǐ xíngzhōu, bù jìn zé tuì.',
    exampleVi: 'Học như chèo thuyền ngược nước, không tiến ắt sẽ lùi.',
  },
  {
    char: '森',
    pinyin: 'sēn',
    sv: 'SÂM',
    meaning: 'Rừng rậm rạp, um tùm, cây cối che khuất',
    lucThu: 'Hội ý (會意)',
    lucThuDesc: 'Gồm ba chữ Mộc (木 - cây cối) xếp chồng lên nhau tạo thành cấu trúc tam giác vững chãi. Một cây là Mộc, hai cây là Lâm (林 - rừng thưa), ba cây là Sâm (森 - rừng đại ngàn rậm rạp bạt ngàn).',
    radicals: ['木 (Mộc - Cây)', '木', '木'],
    example: '大森林里空气清新，鸟语花香。',
    examplePinyin: 'Dà sēnlín lǐ kōngqì qīngxīn, niǎoyǔ huāxiāng.',
    exampleVi: 'Trong cánh rừng lớn không khí trong lành, chim hót hoa thơm.',
  },
  {
    char: '看',
    pinyin: 'kàn',
    sv: 'KHÁN',
    meaning: 'Nhìn, xem, trông nom, quan sát',
    lucThu: 'Hội ý (會意)',
    lucThuDesc: 'Chữ trên là Thủ (手 - bàn tay, nét cong đè lên), chữ dưới là Mục (目 - con mắt). Mô tả sinh động động tác đưa bàn tay lên che trên trán phía trên mắt để nhìn ra xa xăm không bị ánh nắng làm chói mắt.',
    radicals: ['手 (Thủ - Bàn tay)', '目 (Mục - Con mắt)'],
    example: '站得高才能看得远。',
    examplePinyin: 'Zhàn de gāo cái néng kàn de yuǎn.',
    exampleVi: 'Đứng có cao mới nhìn được xa.',
  },
  {
    char: '信',
    pinyin: 'xìn',
    sv: 'TÍN',
    meaning: 'Thư từ, niềm tin, uy tín, đáng tin',
    lucThu: 'Hội ý (會意)',
    lucThuDesc: 'Ghép từ Nhân (亻- con người) và Ngôn (言 - lời nói). Lời của con người nói ra phải giữ đúng lời hứa và chân thật thì mới tạo dựng được chữ Tín giữa nhân gian.',
    radicals: ['亻 (Nhân đứng - Người)', '言 (Ngôn - Lời nói)'],
    example: '言必信，行必果。',
    examplePinyin: 'Yán bì xìn, xíng bì guǒ.',
    exampleVi: 'Nói thì phải giữ chữ tín, làm thì phải có kết quả.',
  },
];

export default function AiExplanationTab({
  selectedWord,
  onSelectWord,
  history = [],
  lookupMultiple,
}) {
  const toast = useToast();

  // Active word to analyze: defaults to selectedWord if exists, otherwise first showcase character
  const [activeInput, setActiveInput] = useState('');
  const [currentWordObj, setCurrentWordObj] = useState(null);

  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLimit, setAiLimit] = useState({ count: 0, limit: 10 });
  const [copied, setCopied] = useState(false);
  const [explanationMode, setExplanationMode] = useState('none'); // 'ai' | 'offline' | 'none'

  // Load token limits on mount
  useEffect(() => {
    dictionaryHistoryApi
      .getTodayCount()
      .then((res) => {
        if (res?.data) {
          setAiLimit({ count: res.data.count, limit: res.data.limit });
        }
      })
      .catch((err) => console.error('Failed to load AI token limit:', err));
  }, []);

  // Sync selectedWord from parent if provided
  useEffect(() => {
    if (selectedWord?.s) {
      setActiveInput(selectedWord.s);
      setCurrentWordObj(selectedWord);

      if (selectedWord.aiExplanation) {
        setAiExplanation(selectedWord.aiExplanation);
        setExplanationMode('ai');
      } else {
        setAiExplanation('');
        setExplanationMode('none');
      }
    } else if (!currentWordObj) {
      // Default initial showcase word
      const defaultShowcase = ETYMOLOGY_SHOWCASE[0];
      setActiveInput(defaultShowcase.char);
      setCurrentWordObj({
        s: defaultShowcase.char,
        t: defaultShowcase.char,
        p: defaultShowcase.pinyin,
        sv: defaultShowcase.sv,
        vi: defaultShowcase.meaning,
      });
    }
  }, [selectedWord, currentWordObj]);

  // Find radical in character
  const detectRadicals = useCallback((char) => {
    const found = [];
    for (const [rad, info] of Object.entries(RADICALS_DB)) {
      if (char.includes(rad) || char === rad) {
        found.push({ char: rad, ...info });
      }
    }
    return found;
  }, []);

  // Offline breakdown engine
  const runOfflineEtymology = useCallback(
    async (wordToAnalyze) => {
      const target = wordToAnalyze || currentWordObj;
      if (!target?.s) return;

      setAiLoading(true);
      const chars = Array.from(target.s);
      const parts = [];

      // Check if word is in showcase
      const showcaseMatch = ETYMOLOGY_SHOWCASE.find((e) => e.char === target.s);

      for (const char of chars) {
        let charData = null;
        if (lookupMultiple) {
          try {
            const matches = await lookupMultiple('hanzi', char);
            charData = matches?.find((m) => m.s === char || m.t === char);
          } catch {
            charData = null;
          }
        }

        const radicals = detectRadicals(char);
        parts.push({
          char,
          p: charData?.p || '',
          sv: charData?.sv || '',
          vi: charData?.vi || 'Từ tố chữ Hán',
          b: charData?.b || '',
          radicals,
        });
      }

      // Format rich offline HTML/JSX
      const htmlOutput = `
<div class="space-y-4 text-xs sm:text-sm text-body dark:text-on-dark-mute">
  <div class="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4">
    <div class="flex items-center gap-2 font-bold text-primary dark:text-link text-sm mb-1">
      <span>📚 Phân tích Từ nguyên &amp; Cấu tạo chữ: "${target.s}"</span>
      <span class="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full uppercase font-mono">
        ${target.s.length === 1 ? 'Chữ đơn' : 'Từ ghép'}
      </span>
    </div>
    <p class="text-ink dark:text-on-dark font-medium leading-relaxed">
      ${
        showcaseMatch
          ? showcaseMatch.lucThuDesc
          : target.s.length === 1
          ? `Chữ <strong>"${target.s}"</strong> (${target.sv ? target.sv.toUpperCase() : ''}) là chữ đơn trong chữ Hán, thể hiện khái niệm: <em>"${target.vi || ''}"</em>.`
          : `Từ ghép <strong>"${target.s}"</strong> được cấu thành từ ${chars.length} chữ đơn, mỗi từ tố mang một hàm ý riêng biệt kết hợp thành nghĩa khái niệm tổng hợp.`
      }
    </p>
  </div>

  <div class="space-y-3">
    <h5 class="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">
      1. Phân rã từng từ tố &amp; Bộ thủ cấu thành:
    </h5>
    ${parts
      .map(
        (p) => `
      <div class="bg-surface-card dark:bg-black/20 border border-hairline dark:border-divider-dark rounded-xl p-3.5 space-y-1.5 shadow-2xs">
        <div class="flex items-center gap-2">
          <span class="text-xl font-display font-extrabold text-primary">${p.char}</span>
          <span class="font-mono text-xs font-bold text-ink dark:text-on-dark">
            ${p.p ? `[${p.p}]` : ''} ${p.sv ? `(${p.sv.toUpperCase()})` : ''}
          </span>
          ${p.b ? `<span class="text-[10px] text-mute font-mono">(${p.b} nét)</span>` : ''}
        </div>
        <p class="text-xs text-body dark:text-on-dark-mute font-medium leading-relaxed">
          Nghĩa từ điển: ${p.vi}
        </p>
        ${
          p.radicals.length > 0
            ? `<div class="text-[11px] text-mute border-t border-hairline dark:border-divider-dark pt-1.5 flex flex-wrap gap-1.5 items-center">
                <span class="font-bold text-primary">Bộ thủ nhận diện:</span>
                ${p.radicals
                  .map(
                    (r) =>
                      `<span class="bg-surface-bone dark:bg-surface-dark px-2 py-0.5 rounded border border-hairline dark:border-divider-dark font-mono">
                        ${r.char} - Bộ ${r.name} (${r.meaning})
                      </span>`
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>`
      )
      .join('')}
  </div>

  ${
    showcaseMatch
      ? `
  <div class="border-t border-hairline dark:border-divider-dark pt-3 space-y-2">
    <h5 class="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">
      2. Phân loại theo Lục thư (六书):
    </h5>
    <div class="bg-surface-bone/60 dark:bg-surface-dark/30 p-3 rounded-xl border border-hairline dark:border-divider-dark">
      <span class="font-bold text-amber-600 dark:text-amber-400 font-mono text-xs">${showcaseMatch.lucThu}</span>
      <p class="text-xs mt-1 leading-relaxed">${showcaseMatch.lucThuDesc}</p>
    </div>
  </div>

  <div class="border-t border-hairline dark:border-divider-dark pt-3 space-y-2">
    <h5 class="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">
      3. Ví dụ thực tế giao tiếp:
    </h5>
    <div class="bg-surface-card dark:bg-black/20 p-3.5 rounded-xl border border-hairline dark:border-divider-dark space-y-1 shadow-2xs">
      <div class="font-display font-bold text-sm text-ink dark:text-on-dark">${showcaseMatch.example}</div>
      <div class="text-xs font-mono font-semibold text-primary">${showcaseMatch.examplePinyin}</div>
      <div class="text-xs text-body dark:text-on-dark-mute italic">${showcaseMatch.exampleVi}</div>
    </div>
  </div>`
      : `
  <div class="border-t border-hairline dark:border-divider-dark pt-3 space-y-2">
    <h5 class="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">
      2. Ý nghĩa tổng hợp:
    </h5>
    <div class="bg-surface-bone/50 dark:bg-surface-dark/30 p-3 rounded-xl border border-hairline dark:border-divider-dark">
      <p class="text-xs text-ink dark:text-on-dark font-medium leading-relaxed">
        Sự kết hợp các từ tố trên tạo nên ngữ nghĩa hoàn chỉnh: <em>"${target.vi || 'Khái niệm trong từ điển'}"</em>.
      </p>
    </div>
  </div>`
  }
</div>
      `;

      setAiExplanation(htmlOutput);
      setExplanationMode('offline');
      setAiLoading(false);
      toast?.addToast('Đã tạo phân tích từ nguyên thành công (Chế độ Ngoại tuyến)', 'info');
    },
    [currentWordObj, lookupMultiple, detectRadicals, toast]
  );

  // DeepSeek AI Explanation Call
  const handleGenerateAi = async (refresh = false) => {
    if (!currentWordObj?.s) return;

    setAiLoading(true);
    setAiExplanation('');

    try {
      const response = await dictionaryHistoryApi.explain({
        hanzi: currentWordObj.s,
        traditional: currentWordObj.t || currentWordObj.s,
        pinyin: currentWordObj.p || '',
        sv: currentWordObj.sv || '',
        vi: currentWordObj.vi || '',
        en: currentWordObj.en || '',
        refresh,
      });

      if (response?.data?.aiExplanation) {
        setAiExplanation(response.data.aiExplanation);
        setExplanationMode('ai');
        if (response.data.todayCount !== undefined) {
          setAiLimit({ count: response.data.todayCount, limit: response.data.limit });
        }
        toast?.addToast('Đã tạo giải thích AI thành công!', 'success');
      } else {
        await runOfflineEtymology(currentWordObj);
      }
    } catch (err) {
      console.warn('AI explain API failed, falling back to offline etymology:', err);
      if (err.response?.status === 429) {
        toast?.addToast('Đã hết hạn mức AI hôm nay. Chuyển sang chế độ Ngoại tuyến.', 'warning');
      }
      await runOfflineEtymology(currentWordObj);
    } finally {
      setAiLoading(false);
    }
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = () => {
    if (!currentWordObj?.s) return;

    const isSingleChar = currentWordObj.s.length === 1;
    const promptText = `Bạn là một giáo sư ngôn ngữ học tiếng Trung chuyên sâu về Từ nguyên học (Etymology) và Văn tự học (文字学).
Hãy phân tích chi tiết chữ Hán sau:
- Chữ: "${currentWordObj.s}" (Phồn thể: ${currentWordObj.t || currentWordObj.s})
- Phiên âm Bính âm (Pinyin): ${currentWordObj.p || '---'}
- Âm Hán-Việt: ${currentWordObj.sv || '---'}
- Nghĩa khái quát: ${currentWordObj.vi || '---'}

Yêu cầu xuất ra định dạng mã HTML chuẩn nằm trong thẻ <div>:
1. Phân loại theo Lục thư (象形 Tượng hình, 指事 Chỉ sự, 會意 Hội ý, 形聲 Hình thanh, 轉注 Chuyển chú, 假借 Giả tá).
2. Phân tích thành phần bộ thủ (trong 214 bộ thủ Khang Hy) và triết lý tạo chữ.
${isSingleChar ? '3. Diễn tiến nét nghĩa từ cổ đại đến hiện đại.' : '3. Cách ghép nghĩa giữa các chữ đơn để tạo nên nghĩa từ ghép.'}
4. 3 ví dụ câu giao tiếp thực tế ngắn gọn (kèm chữ Hán, Pinyin và dịch nghĩa tiếng Việt).`;

    navigator.clipboard
      ?.writeText(promptText)
      .then(() => {
        setCopied(true);
        toast?.addToast('Đã sao chép prompt chi tiết vào Clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Failed to copy prompt:', err));
  };

  // Handle free input search & analyze
  const handleInputSubmit = async (e) => {
    e?.preventDefault();
    const clean = activeInput.trim();
    if (!clean) return;

    let targetData = null;
    if (lookupMultiple) {
      try {
        const matches = await lookupMultiple('hanzi', clean);
        targetData = matches?.find((m) => m.s === clean || m.t === clean);
      } catch {
        targetData = null;
      }
    }

    const nextWord = targetData || {
      s: clean,
      t: clean,
      p: '',
      sv: '',
      vi: 'Từ nhập tự do',
    };

    setCurrentWordObj(nextWord);
    if (onSelectWord) onSelectWord(nextWord);

    // Run offline first or generate AI
    runOfflineEtymology(nextWord);
  };

  const handlePickShowcase = (item) => {
    setActiveInput(item.char);
    const nextWord = {
      s: item.char,
      t: item.char,
      p: item.pinyin,
      sv: item.sv,
      vi: item.meaning,
    };
    setCurrentWordObj(nextWord);
    if (onSelectWord) onSelectWord(nextWord);
    runOfflineEtymology(nextWord);
  };

  const remainingTokens = Math.max(0, aiLimit.limit - aiLimit.count);

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in">
      {/* Header & Token usage tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline dark:border-divider-dark pb-4">
        <div>
          <h3 className="font-display font-extrabold text-ink dark:text-on-dark text-lg tracking-tight flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            AI Giải thích Từ nguyên &amp; Cấu tạo chữ Hán
          </h3>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-0.5">
            Phân tích chuyên sâu Lục thư (六书), 214 Bộ thủ, thành phần cấu tạo và ngữ cảnh sử dụng thực tế.
          </p>
        </div>

        {/* Token Tracker Card */}
        <div className="flex items-center gap-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark px-3 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
          <Cpu size={14} className="text-primary" />
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-mute">Hạn mức AI:</span>
            <span
              className={`font-bold ${
                remainingTokens > 3
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : remainingTokens > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {remainingTokens}/{aiLimit.limit} lượt
            </span>
          </div>
        </div>
      </div>

      {/* Free Hanzi Input & Quick Select Bar */}
      <div className="flex flex-col gap-3">
        <form onSubmit={handleInputSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Nhập bất kỳ chữ Hán hoặc từ ghép nào để phân tích (Ví dụ: 休, 明, 家, 爱, 学习)..."
              value={activeInput}
              onChange={(e) => setActiveInput(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark shadow-xs"
            />
            <Compass className="absolute left-3.5 top-3.5 text-mute" size={16} />
            {activeInput && (
              <button
                type="button"
                onClick={() => setActiveInput('')}
                className="absolute right-3 top-3 text-mute hover:text-ink cursor-pointer p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-3 rounded-full bg-primary hover:bg-primary-deep text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-98"
          >
            <Search size={14} />
            <span>Phân tích</span>
          </button>
        </form>

        {/* Showcase Chips of Popular Etymological Hanzi */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-mute font-medium flex items-center gap-1">
            <Lightbulb size={13} className="text-amber-500" />
            Chữ Hán mẫu điển hình:
          </span>
          {ETYMOLOGY_SHOWCASE.map((item) => (
            <button
              key={item.char}
              type="button"
              onClick={() => handlePickShowcase(item)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-2xs ${
                currentWordObj?.s === item.char
                  ? 'bg-primary border-primary text-white font-bold'
                  : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:border-primary/40'
              }`}
            >
              <span className="font-display font-bold mr-1">{item.char}</span>
              <span className="text-[10px] opacity-80">({item.sv})</span>
            </button>
          ))}
        </div>

        {/* Recent Search History Chips */}
        {history && history.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
            <span className="text-mute font-medium">Từ vừa tra gần đây:</span>
            {history.slice(0, 8).map((h, hIdx) => (
              <button
                key={hIdx}
                type="button"
                onClick={() => {
                  const nextWord = {
                    s: h.hanzi,
                    t: h.traditional || h.hanzi,
                    p: h.pinyin || '',
                    sv: h.sv || '',
                    vi: h.vi || '',
                  };
                  setActiveInput(h.hanzi);
                  setCurrentWordObj(nextWord);
                  if (onSelectWord) onSelectWord(nextWord);
                  runOfflineEtymology(nextWord);
                }}
                className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentWordObj?.s === h.hanzi
                    ? 'bg-primary border-primary text-white shadow-2xs'
                    : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                }`}
              >
                {h.hanzi}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Target Word Hero Summary Card */}
      {currentWordObj?.s && (
        <div className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Big character preview box */}
            <div className="w-16 h-16 bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl flex items-center justify-center font-display font-extrabold text-3xl text-primary shadow-xs">
              {currentWordObj.s}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-display font-extrabold text-ink dark:text-on-dark">
                  {currentWordObj.s}
                </h4>
                {currentWordObj.p && (
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {currentWordObj.p}
                  </span>
                )}
                {currentWordObj.sv && (
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {currentWordObj.sv.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-body dark:text-on-dark-mute mt-1 line-clamp-1 font-medium">
                {currentWordObj.vi || 'Đang chuẩn bị phân tích từ nguyên'}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => speakChinese(currentWordObj.s)}
              className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-bone hover:bg-surface-card dark:bg-surface-dark text-primary cursor-pointer active:scale-95 transition-all"
              title="Nghe phát âm"
            >
              <Volume2 size={16} />
            </button>

            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark text-ink dark:text-on-dark text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Sao chép prompt đầy đủ để dán vào ChatGPT / Claude"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Đã sao chép' : 'Copy prompt'}</span>
            </button>

            <button
              type="button"
              onClick={() => runOfflineEtymology(currentWordObj)}
              disabled={aiLoading}
              className="flex items-center gap-1 px-3 py-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark text-ink dark:text-on-dark text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Chế độ phân tích bằng từ điển ngoại tuyến (không tốn lượt AI)"
            >
              <BookOpen size={13} className="text-primary" />
              <span>Ngoại tuyến</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerateAi(!!aiExplanation)}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-deep disabled:bg-stone text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
            >
              {aiLoading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : aiExplanation && explanationMode === 'ai' ? (
                <RotateCw size={13} />
              ) : (
                <Sparkles size={13} />
              )}
              <span>{aiExplanation && explanationMode === 'ai' ? 'Phân tích lại AI' : 'Phân tích AI'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Explanation Render Area */}
      <div className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-2xl p-6 min-h-[360px] shadow-xs">
        {aiLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-mute gap-3 animate-fade-in">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-ink dark:text-on-dark">
              Đang phân tích cấu trúc Lục thư &amp; Từ nguyên chữ Hán...
            </p>
            <p className="text-xs text-mute">
              Bóc tách các bộ thủ Khang Hy và ngữ nghĩa cấu thành
            </p>
          </div>
        ) : aiExplanation ? (
          <div className="space-y-4 animate-fade-in">
            {/* Status Pill */}
            <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-mute flex items-center gap-1.5">
                {explanationMode === 'ai' ? (
                  <>
                    <Sparkles size={12} className="text-primary" />
                    Kết quả phân tích từ DeepSeek AI
                  </>
                ) : (
                  <>
                    <BookOpen size={12} className="text-primary" />
                    Kết quả phân tích Ngoại tuyến (Offline Breakdown)
                  </>
                )}
              </span>
              <span className="text-[10px] text-mute font-mono">
                {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>

            {/* Injected HTML breakdown */}
            <div
              className="text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: aiExplanation }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-mute gap-3 animate-fade-in">
            <Layers size={44} className="stroke-1 text-mute opacity-60" />
            <h4 className="text-base font-bold text-ink dark:text-on-dark">
              Sẵn sàng phân tích chữ Hán
            </h4>
            <p className="text-xs text-mute dark:text-on-dark-mute max-w-md leading-relaxed">
              Bấm nút <strong>"Phân tích AI"</strong> để phân tích sâu theo phương pháp Lục thư cổ đại hoặc bấm <strong>"Ngoại tuyến"</strong> để tra cứu cấu trúc bộ thủ tức thì.
            </p>
          </div>
        )}
      </div>

      {/* Six Categories (Lục Thư) Reference Panel */}
      <div className="bg-surface-bone/40 dark:bg-surface-dark/20 border border-hairline dark:border-divider-dark rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen size={14} className="text-primary" />
          Kiến thức nhập môn: Lục thư (六书) trong chữ Hán
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-surface-card dark:bg-surface-dark rounded-xl border border-hairline dark:border-divider-dark shadow-2xs space-y-1">
            <span className="font-bold text-primary font-mono">1. Tượng hình (象形)</span>
            <p className="text-[11px] text-body dark:text-on-dark-mute">
              Vẽ mô phỏng hình dáng cụ thể của sự vật (Ví dụ: 日 - mặt trời, 月 - trăng, 山 - núi, 木 - cây).
            </p>
          </div>
          <div className="p-3 bg-surface-card dark:bg-surface-dark rounded-xl border border-hairline dark:border-divider-dark shadow-2xs space-y-1">
            <span className="font-bold text-primary font-mono">2. Chỉ sự (指事)</span>
            <p className="text-[11px] text-body dark:text-on-dark-mute">
              Dùng ký hiệu hoặc nét chỉ điểm thể hiện ý niệm trừu tượng (Ví dụ: 上 - trên, 下 - dưới, 本 - gốc cây).
            </p>
          </div>
          <div className="p-3 bg-surface-card dark:bg-surface-dark rounded-xl border border-hairline dark:border-divider-dark shadow-2xs space-y-1">
            <span className="font-bold text-primary font-mono">3. Hội ý (會意)</span>
            <p className="text-[11px] text-body dark:text-on-dark-mute">
              Ghép các chữ đơn lẻ tạo nên ý nghĩa liên tưởng mới (Ví dụ: 休 - người tựa gốc cây nghỉ ngơi, 明 - nhật + nguyệt sáng).
            </p>
          </div>
          <div className="p-3 bg-surface-card dark:bg-surface-dark rounded-xl border border-hairline dark:border-divider-dark shadow-2xs space-y-1">
            <span className="font-bold text-primary font-mono">4. Hình thanh (形聲)</span>
            <p className="text-[11px] text-body dark:text-on-dark-mute">
              Hơn 80% chữ Hán: Một phần chỉ ý nghĩa (hình bàng/bộ thủ) và một phần chỉ âm đọc (thanh bàng).
            </p>
          </div>
          <div className="p-3 bg-surface-card dark:bg-surface-dark rounded-xl border border-hairline dark:border-divider-dark shadow-2xs space-y-1">
            <span className="font-bold text-primary font-mono">5. Chuyển chú (轉注)</span>
            <p className="text-[11px] text-body dark:text-on-dark-mute">
              Các chữ cùng gốc nghĩa hoặc tương đồng nhau dùng để chú thích qua lại (Ví dụ: 考 và 老 đều chỉ người già).
            </p>
          </div>
          <div className="p-3 bg-surface-card dark:bg-surface-dark rounded-xl border border-hairline dark:border-divider-dark shadow-2xs space-y-1">
            <span className="font-bold text-primary font-mono">6. Giả tá (假借)</span>
            <p className="text-[11px] text-body dark:text-on-dark-mute">
              Mượn chữ đồng âm sẵn có để biểu thị một từ mới chưa có chữ viết riêng (Ví dụ: 来 mượn bông lúa thành "đến").
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
