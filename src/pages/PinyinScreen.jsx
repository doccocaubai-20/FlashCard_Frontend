import React, { useState, useEffect, useMemo } from 'react';
import { dictionaryApi } from '../services/dictionaryApi';
import { Grid, Volume2, Sparkles } from 'lucide-react';

export default function PinyinScreen() {
  const [allSyllables, setAllSyllables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInitial, setSelectedInitial] = useState('b');
  const [selectedSyllable, setSelectedSyllable] = useState(null);
  const [syllableDetails, setSyllableDetails] = useState(null);
  const [_detailsLoading, setDetailsLoading] = useState(false);

  const initials = [
    { key: 'b', label: 'B' },
    { key: 'p', label: 'P' },
    { key: 'm', label: 'M' },
    { key: 'f', label: 'F' },
    { key: 'd', label: 'D' },
    { key: 't', label: 'T' },
    { key: 'n', label: 'N' },
    { key: 'l', label: 'L' },
    { key: 'g', label: 'G' },
    { key: 'k', label: 'K' },
    { key: 'h', label: 'H' },
    { key: 'j', label: 'J' },
    { key: 'q', label: 'Q' },
    { key: 'x', label: 'X' },
    { key: 'zh', label: 'ZH' },
    { key: 'ch', label: 'CH' },
    { key: 'sh', label: 'SH' },
    { key: 'r', label: 'R' },
    { key: 'z', label: 'Z' },
    { key: 'c', label: 'C' },
    { key: 's', label: 'S' },
    { key: 'y', label: 'Y' },
    { key: 'w', label: 'W' },
    { key: 'zero', label: 'Nguyên âm (a, o, e...)' },
  ];

  // Fetch unique syllables on mount
  useEffect(() => {
    const fetchSyllables = async () => {
      setLoading(true);
      try {
        const res = await dictionaryApi.getSyllables();
        setAllSyllables(res.data || []);
      } catch (err) {
        console.error('Failed to fetch syllables:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSyllables();
  }, []);

  // Filter syllables that start with the selected initial
  const filteredSyllables = useMemo(() => {
    return allSyllables.filter((syl) => {
      if (selectedInitial === 'zero') {
        return /^[aeo]/.test(syl);
      }
      
      if (selectedInitial === 'zh') return syl.startsWith('zh');
      if (selectedInitial === 'ch') return syl.startsWith('ch');
      if (selectedInitial === 'sh') return syl.startsWith('sh');
      
      if (selectedInitial === 'z') return syl.startsWith('z') && !syl.startsWith('zh');
      if (selectedInitial === 'c') return syl.startsWith('c') && !syl.startsWith('ch');
      if (selectedInitial === 's') return syl.startsWith('s') && !syl.startsWith('sh');

      return syl.startsWith(selectedInitial);
    });
  }, [allSyllables, selectedInitial]);

  // Fetch details when selected syllable changes
  useEffect(() => {
    if (!selectedSyllable) {
      setSyllableDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await dictionaryApi.getSyllableDetails(selectedSyllable);
        const entries = res.data || [];

        const tones = {
          1: { display: '', chars: [], pinyin: '' },
          2: { display: '', chars: [], pinyin: '' },
          3: { display: '', chars: [], pinyin: '' },
          4: { display: '', chars: [], pinyin: '' },
          5: { display: '', chars: [], pinyin: '' },
        };

        entries.forEach((e) => {
          const pt = e.pt || '';
          const match = pt.match(/\d/);
          const toneNum = match ? parseInt(match[0]) : 5;

          const bucket = tones[toneNum] || tones[5];
          bucket.pinyin = e.p;
          
          if (bucket.chars.length < 8 && !bucket.chars.some(c => c.s === e.s)) {
            bucket.chars.push(e);
          }
        });

        const toneMarkers = {
          a: ['ā', 'á', 'ǎ', 'à', 'a'],
          o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
          e: ['ē', 'é', 'ě', 'è', 'e'],
          i: ['ī', 'í', 'ǐ', 'ì', 'i'],
          u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
          v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
        };

        const getPinyinWithTone = (base, tone) => {
          if (tone === 5) return base;
          
          let vowel = 'a';
          if (base.includes('a')) vowel = 'a';
          else if (base.includes('o')) vowel = 'o';
          else if (base.includes('e')) vowel = 'e';
          else if (base.includes('ui')) vowel = 'i';
          else if (base.includes('iu')) vowel = 'u';
          else if (base.includes('i')) vowel = 'i';
          else if (base.includes('u')) vowel = 'u';
          else if (base.includes('v') || base.includes('ü')) vowel = 'v';

          const replacement = toneMarkers[vowel][tone - 1];
          const normalizedBase = base.replace('ü', 'v');
          return normalizedBase.replace(vowel, replacement).replace('v', 'ü');
        };

        [1, 2, 3, 4, 5].forEach((t) => {
          if (!tones[t].pinyin) {
            tones[t].pinyin = getPinyinWithTone(selectedSyllable, t);
          }
        });

        setSyllableDetails({
          syllable: selectedSyllable,
          tones: Object.keys(tones)
            .map((t) => ({ tone: Number(t), ...tones[t] }))
            .filter((t) => t.tone !== 5 || t.chars.length > 0),
        });
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedSyllable]);

  const handleSpeakTone = (pinyin) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(pinyin);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  };

  const handleSyllableClick = (syl) => {
    setSelectedSyllable(syl);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm shrink-0">
          <Grid size={18} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Bảng âm Pinyin tương tác</h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-0.5">
            Luyện phát âm chuẩn 4 thanh điệu tiếng Trung bằng cách kết hợp Thanh mẫu và Vận mẫu.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Columns (Initials Selector) */}
        <div className="lg:col-span-3 bg-surface-card dark:bg-surface-dark/50 p-4 md:p-5 rounded-md border border-hairline dark:border-divider-dark shadow-sm flex flex-col gap-3 lg:max-h-[750px] transition-colors">
          <h3 className="text-[10px] font-mono font-bold text-primary dark:text-primary uppercase tracking-widest border-b border-hairline dark:border-divider-dark pb-2 text-left hidden lg:block">
            Thanh mẫu (Initials)
          </h3>
          
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-1 lg:pb-0 select-none">
            {initials.map((ini) => (
              <button
                key={ini.key}
                type="button"
                onClick={() => {
                  setSelectedInitial(ini.key);
                  setSelectedSyllable(null);
                }}
                className={`px-3 py-2 lg:px-4 lg:py-2.5 rounded-full text-xs font-bold transition-all text-left flex items-center justify-between shrink-0 cursor-pointer ${
                  selectedInitial === ini.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-bone/50 hover:bg-surface-bone dark:bg-black/25 dark:hover:bg-black text-ink dark:text-on-dark border border-hairline dark:border-divider-dark lg:border-transparent'
                }`}
              >
                <span>{ini.label}</span>
                <span className={`text-[9px] font-mono font-bold ml-2 hidden lg:inline ${selectedInitial === ini.key ? 'text-white/80' : 'text-mute'}`}>
                  {selectedInitial === ini.key ? 'Đang chọn' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right Columns (Syllables & Tones Grid) */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Syllables list */}
          <div className="md:col-span-5 bg-surface-card dark:bg-surface-dark/50 p-4 md:p-5 rounded-md border border-hairline dark:border-divider-dark shadow-sm flex flex-col gap-3 lg:max-h-[750px] transition-colors">
            <h3 className="text-[10px] font-mono font-bold text-primary dark:text-primary uppercase tracking-widest border-b border-hairline dark:border-divider-dark pb-2 text-left">
              Âm tiết ghép vần ({filteredSyllables.length} âm)
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar max-h-[200px] lg:max-h-none">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-mute gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span className="text-xs font-medium">Đang đồng bộ Pinyin...</span>
                </div>
              ) : filteredSyllables.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-3 gap-1.5">
                  {filteredSyllables.map((syl) => (
                    <button
                      key={syl}
                      type="button"
                      onClick={() => handleSyllableClick(syl)}
                      className={`py-2.5 border rounded-md font-mono font-bold text-xs text-center transition-all cursor-pointer shadow-sm ${
                        selectedSyllable === syl
                          ? 'bg-primary border-transparent text-white scale-95'
                          : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                      }`}
                    >
                      {syl}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-mute dark:text-on-dark-mute italic">
                  Không có âm tiết nào phù hợp.
                </div>
              )}
            </div>
          </div>

          {/* Tone detail details panel */}
          <div className="md:col-span-7 bg-surface-card dark:bg-surface-dark/50 p-4 md:p-6 rounded-md border border-hairline dark:border-divider-dark shadow-sm flex flex-col gap-4 lg:max-h-[750px] transition-colors overflow-hidden">
            
            {selectedSyllable && syllableDetails ? (
              <div className="flex flex-col gap-5 flex-1 overflow-hidden text-left">
                
                {/* Header info */}
                <div className="border-b border-hairline dark:border-divider-dark pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-primary dark:text-primary uppercase tracking-widest">
                      Âm tiết chọn
                    </span>
                    <h2 className="text-3xl font-extrabold font-mono text-ink dark:text-on-dark mt-0.5">
                      {selectedSyllable}
                    </h2>
                  </div>
                  <span className="text-xs text-mute dark:text-on-dark-mute font-medium bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark px-3 py-1.5 rounded-full">
                    Nhấp thanh loa bên dưới để nghe phát âm
                  </span>
                </div>

                {/* Tones List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
                  {syllableDetails.tones.map((t) => (
                    <div
                      key={t.tone}
                      onClick={() => handleSpeakTone(t.pinyin)}
                      className="group bg-surface-bone/40 dark:bg-surface-dark/40 hover:bg-surface-bone dark:hover:bg-black border border-hairline dark:border-divider-dark rounded-md p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      {/* Tone text & sound */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-extrabold font-mono text-base group-hover:text-primary group-hover:border-primary/50 transition-all shadow-sm">
                          {t.tone}
                        </div>
                        <div>
                          <div className="text-lg font-mono font-extrabold text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                            {t.pinyin}
                          </div>
                          <span className="text-[10px] font-semibold text-mute">
                            {t.tone === 1 && 'Thanh 1 (Ngang)'}
                            {t.tone === 2 && 'Thanh 2 (Sắc)'}
                            {t.tone === 3 && 'Thanh 3 (Hỏi)'}
                            {t.tone === 4 && 'Thanh 4 (Nặng)'}
                            {t.tone === 5 && 'Thanh nhẹ'}
                          </span>
                        </div>
                      </div>

                      {/* Character examples list */}
                      <div className="flex-1 flex flex-wrap gap-1 justify-end max-w-[200px] md:max-w-[240px]">
                        {t.chars.length > 0 ? (
                          t.chars.map((char) => (
                            <span
                              key={char.s}
                              className="px-1.5 py-0.5 text-xs font-bold bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded text-ink dark:text-on-dark font-display shadow-sm"
                              title={char.vi}
                            >
                              {char.s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-mute dark:text-on-dark-mute italic">Không có chữ mẫu</span>
                        )}
                      </div>

                      {/* Speaker trigger */}
                      <div className="h-8 w-8 rounded-full bg-surface-card border border-hairline dark:bg-surface-dark dark:border-divider-dark text-primary shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <Volume2 size={13} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-mute bg-surface-bone/20 dark:bg-surface-dark/20 rounded-md border border-dashed border-hairline dark:border-divider-dark animate-fade-in flex-1">
                <Sparkles size={48} className="stroke-1 text-mute dark:text-on-dark-mute mb-3" />
                <p className="text-sm font-medium text-body dark:text-on-dark-mute max-w-sm text-center leading-relaxed">
                  Chọn một Thanh mẫu bên trái, nhấp vào một âm ghép vần ở trung tâm để kiểm tra cách phát âm của 4 thanh điệu Pinyin tương ứng.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
