import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dictionaryApi } from '../services/dictionaryApi';
import { radicalData } from '../data/radicalData';
import { Search, Library, Volume2, ArrowRight, Sparkles } from 'lucide-react';

export default function RadicalScreen() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRadical, setSelectedRadical] = useState(radicalData[0]);
  const [matchingWords, setMatchingWords] = useState([]);
  const [searchingWords, setSearchingWords] = useState(false);

  // Group radicals by stroke count
  const groupedRadicals = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const filtered = radicalData.filter((r) => {
      if (!cleanSearch) return true;
      return (
        r.char.includes(cleanSearch) ||
        r.sv.toLowerCase().includes(cleanSearch) ||
        r.vi.toLowerCase().includes(cleanSearch) ||
        r.pinyin.toLowerCase().includes(cleanSearch)
      );
    });

    const groups = {};
    filtered.forEach((r) => {
      if (!groups[r.stroke]) {
        groups[r.stroke] = [];
      }
      groups[r.stroke].push(r);
    });
    return groups;
  }, [searchTerm]);

  // Search words in dictionary containing the selected radical
  useEffect(() => {
    if (!selectedRadical) return;

    setSearchingWords(true);
    const fetchMatchingWords = async () => {
      try {
        const res = await dictionaryApi.getWordsByRadical(selectedRadical.char);
        setMatchingWords(res.data || []);
      } catch (err) {
        console.error('Failed to fetch words by radical:', err);
      } finally {
        setSearchingWords(false);
      }
    };

    fetchMatchingWords();
  }, [selectedRadical]);

  const handleSpeakRadical = (e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(selectedRadical.char);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleWordClick = (word) => {
    navigate(`/dictionary?word=${encodeURIComponent(word)}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm shrink-0">
          <Library size={18} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Khám phá 214 Bộ thủ</h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-0.5">
            Tìm hiểu các bộ thủ cốt lõi cấu thành chữ Hán và ôn tập các từ vựng liên quan.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Side: Radical Directory */}
        <div className="lg:col-span-1 bg-surface-card dark:bg-surface-dark/50 p-5 rounded-md border border-hairline dark:border-divider-dark shadow-sm flex flex-col gap-4 min-h-[580px] max-h-[750px] transition-colors">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm bộ thủ... (ví dụ: khẩu, kǒu, 口)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-xs text-ink dark:text-on-dark shadow-sm"
            />
            <Search className="absolute left-3.5 top-3.5 text-mute" size={14} />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
            {Object.keys(groupedRadicals).length > 0 ? (
              Object.keys(groupedRadicals)
                .sort((a, b) => Number(a) - Number(b))
                .map((stroke) => (
                  <div key={stroke} className="space-y-2">
                    <h3 className="text-[10px] font-mono font-bold text-primary dark:text-primary uppercase tracking-widest border-b border-hairline dark:border-divider-dark pb-1">
                      {stroke} Nét ({groupedRadicals[stroke].length} bộ thủ)
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {groupedRadicals[stroke].map((r) => (
                        <button
                          key={r.char}
                          type="button"
                          onClick={() => setSelectedRadical(r)}
                          className={`flex flex-col items-center justify-center p-2 rounded-md border text-center transition-all cursor-pointer aspect-square ${
                            selectedRadical.char === r.char
                              ? 'bg-primary border-transparent text-white shadow-sm'
                              : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:border-primary/50'
                          }`}
                        >
                          <span className="text-lg font-bold">{r.char}</span>
                          <span className={`text-[8px] font-medium leading-none truncate w-full ${selectedRadical.char === r.char ? 'text-white/80' : 'text-mute'}`}>
                            {r.sv}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-10 text-center text-xs text-mute dark:text-on-dark-mute italic">
                Không tìm thấy bộ thủ nào phù hợp.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Details & Associated Words */}
        <div className="lg:col-span-2 bg-surface-card dark:bg-surface-dark/50 p-6 rounded-md border border-hairline dark:border-divider-dark shadow-sm flex flex-col gap-6 min-h-[580px] max-h-[750px] transition-colors">
          
          {selectedRadical ? (
            <div className="flex flex-col gap-6 flex-1 overflow-hidden text-left">
              
              {/* Premium Radical Card */}
              <div className="bg-surface-bone dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md p-6 flex flex-col md:flex-row items-center gap-6 relative shadow-inner">
                {/* Big Char */}
                <div className="w-24 h-24 bg-surface-card dark:bg-black/30 border border-hairline dark:border-divider-dark rounded-md flex items-center justify-center text-5xl font-extrabold text-ink dark:text-on-dark shadow-sm relative shrink-0">
                  {selectedRadical.char}
                  
                  <button
                    type="button"
                    onClick={handleSpeakRadical}
                    className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-sm transition-all cursor-pointer text-xs"
                    title="Nghe phát âm bộ thủ"
                  >
                    <Volume2 size={11} />
                  </button>
                </div>

                {/* Info details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-3xl font-extrabold text-ink dark:text-on-dark font-display">
                      Bộ {selectedRadical.sv}
                    </h2>
                    <span className="text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                      Pinyin: {selectedRadical.pinyin}
                    </span>
                    <span className="text-[10px] font-bold bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark text-mute px-2.5 py-0.5 rounded-full">
                      Số nét: {selectedRadical.stroke}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-body dark:text-on-dark-mute leading-relaxed pt-1">
                    Ý nghĩa bộ thủ: <span className="text-ink dark:text-on-dark font-bold">{selectedRadical.vi}</span>
                  </p>
                </div>
              </div>

              {/* Matching Words Table */}
              <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-2">
                  <h3 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" />
                    Từ vựng HSK tiêu biểu chứa bộ thủ này
                  </h3>
                  <span className="text-[10px] text-mute dark:text-on-dark-mute font-mono">
                    Tìm thấy {searchingWords ? '...' : matchingWords.length} từ thông dụng
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 divide-y divide-hairline dark:divide-divider-dark no-scrollbar">
                  {loading || searchingWords ? (
                    <div className="flex flex-col items-center justify-center py-20 text-mute gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-xs font-medium">Đang tìm các từ vựng liên quan...</span>
                    </div>
                  ) : matchingWords.length > 0 ? (
                    matchingWords.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleWordClick(item.s)}
                        className="flex gap-5 py-3.5 items-center hover:bg-surface-bone/50 dark:hover:bg-surface-dark/30 px-3 rounded-md transition-all border border-transparent hover:border-hairline dark:hover:border-divider-dark cursor-pointer group bg-transparent"
                      >
                        {/* Character display */}
                        <div className="flex-shrink-0 w-12 min-h-12 h-auto py-1.5 bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md flex flex-col items-center justify-center shadow-sm font-display group-hover:bg-surface-card dark:group-hover:bg-black group-hover:border-primary/50 group-hover:text-primary dark:group-hover:text-primary transition-all">
                          <div className={`flex flex-col items-center justify-center gap-0.5 leading-none font-semibold text-ink dark:text-on-dark ${item.s.length > 3 ? 'text-xs' : item.s.length > 1 ? 'text-sm' : 'text-lg'}`}>
                            {Array.from(item.s).map((char, index) => (
                              <span key={index}>{char}</span>
                            ))}
                          </div>
                        </div>

                        {/* Details columns */}
                        <div className="flex-1 space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            {item.sv && (
                              <span className="text-sm font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-primary transition-colors">
                                {item.sv.toUpperCase()}
                              </span>
                            )}
                            {item.p && (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                {item.p}
                              </span>
                            )}
                            {item.hsk && (
                              <span className="text-[9px] font-bold text-mute bg-surface-bone dark:bg-surface-dark px-1.5 py-0.5 rounded-full border border-hairline dark:border-divider-dark">
                                HSK {item.hsk}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-body dark:text-on-dark-mute line-clamp-1 leading-relaxed">
                            {item.vi}
                          </p>
                        </div>

                        {/* Arrow link */}
                        <div className="text-mute group-hover:text-primary transition-all pr-2">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center text-xs text-mute dark:text-on-dark-mute italic">
                      Không tìm thấy từ vựng HSK nào chứa bộ thủ này trong cơ sở dữ liệu từ điển của bạn.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-mute bg-surface-bone/20 dark:bg-surface-dark/20 rounded-md border border-dashed border-hairline dark:border-divider-dark animate-fade-in flex-1">
              <Library size={48} className="stroke-1 text-mute dark:text-on-dark-mute mb-3" />
              <p className="text-sm font-medium text-body dark:text-on-dark-mute max-w-sm text-center leading-relaxed">
                Chọn một bộ thủ ở danh sách bên trái để khám phá nét viết, ngữ nghĩa và tra cứu toàn bộ từ vựng HSK liên quan.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
