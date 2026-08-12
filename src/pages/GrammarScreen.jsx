import React, { useState, useMemo } from 'react';
import { grammarData } from '../data/grammarData';
import { BookOpenText, Volume2, Sparkles, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import HoverableText from '../components/common/HoverableText';

// Glossary mapping for grammar terminology to help beginners analyze structures
const GRAMMAR_GLOSSARY = {
  'subj': { vn: 'Chủ ngữ (Subject)', desc: 'Chủ thể thực hiện hành động hoặc trạng thái' },
  'verb': { vn: 'Động từ (Verb)', desc: 'Từ chỉ hành động, hoạt động hoặc trạng thái' },
  'adj': { vn: 'Tính từ (Adjective)', desc: 'Từ miêu tả tính chất, đặc điểm hoặc trạng thái' },
  'obj': { vn: 'Tân ngữ (Object)', desc: 'Đối tượng chịu tác động hoặc nhận hành động' },
  'noun': { vn: 'Danh từ (Noun)', desc: 'Từ chỉ người, sự vật, địa điểm, khái niệm' },
  'place': { vn: 'Địa điểm (Place)', desc: 'Từ hoặc cụm từ chỉ nơi chốn, vị trí' },
  'time': { vn: 'Thời gian (Time)', desc: 'Từ chỉ mốc thời gian hoặc khoảng thời gian' },
  'pronoun': { vn: 'Đại từ (Pronoun)', desc: 'Từ dùng để xưng hô hoặc thay thế (tôi, bạn, họ...)' },
  'adverb': { vn: 'Phó từ (Adverb)', desc: 'Từ bổ nghĩa cho động từ, tính từ hoặc cả câu' },
  'prep': { vn: 'Giới từ (Preposition)', desc: 'Từ giới thiệu đối tượng chỉ hướng, thời gian, nơi chốn' },
  'measure': { vn: 'Lượng từ (Measure Word)', desc: 'Từ dùng kèm số từ để đếm đơn vị của danh từ' },
  'number': { vn: 'Số từ (Number)', desc: 'Từ chỉ số lượng, chữ số hoặc thứ tự (一, 二, 三...)' },
  'mental verb': { vn: 'Động từ tâm lý', desc: 'Chỉ hoạt động tâm lý, cảm xúc (như 喜欢, 想, 爱...)' },
  'verb / adj.': { vn: 'Động từ hoặc Tính từ', desc: 'Có thể sử dụng cả động từ hoặc tính từ tại vị trí này' },
  'noun / pronoun': { vn: 'Danh từ hoặc Đại từ', desc: 'Có thể đi kèm cả danh từ hoặc đại từ xưng hô' }
};

// Sub-component to parse and render formulas interactively with color-coded grammar pills
function ParsedFormula({ formula }) {
  // Split formula components by '+'
  const tokens = formula.split('+');

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
      {tokens.map((token, index) => {
        const rawToken = token.trim();
        if (!rawToken) return null;

        // Check if optional: e.g. "(+ Obj.)" or "(Obj.)"
        const isOptional = rawToken.startsWith('(') && rawToken.endsWith(')');
        let cleanToken = isOptional ? rawToken.slice(1, -1).trim() : rawToken;
        
        // Strip leading '+' inside parentheses if any, e.g. "+ Obj." -> "Obj."
        if (cleanToken.startsWith('+')) {
          cleanToken = cleanToken.slice(1).trim();
        }

        // Clean up trailing dots for comparison to dictionary key, e.g. "Subj." -> "subj"
        const key = cleanToken.toLowerCase().replace(/\.$/, '');
        const glossaryInfo = GRAMMAR_GLOSSARY[key];

        // Default badge class (usually for Chinese characters/particles or custom text)
        let badgeStyle = "bg-primary/10 border-primary/20 text-primary dark:text-primary-deep font-bold";
        let hoverTitle = "Trợ từ hoặc từ khóa cố định bắt buộc có trong câu mẫu";

        if (glossaryInfo) {
          hoverTitle = `${glossaryInfo.vn}: ${glossaryInfo.desc}`;
          
          if (key === 'subj' || key === 'subject') {
            badgeStyle = "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-semibold";
          } else if (key === 'verb' || key === 'mental verb') {
            badgeStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-semibold";
          } else if (key === 'adj' || key === 'adjective') {
            badgeStyle = "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 font-semibold";
          } else if (key === 'obj' || key === 'object') {
            badgeStyle = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold";
          } else if (key === 'noun') {
            badgeStyle = "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 font-semibold";
          } else if (key === 'place') {
            badgeStyle = "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60 text-teal-600 dark:text-teal-400 font-semibold";
          } else if (key === 'time') {
            badgeStyle = "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold";
          } else if (key === 'pronoun') {
            badgeStyle = "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 font-semibold";
          } else if (key === 'adverb') {
            badgeStyle = "bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-900/60 text-fuchsia-600 dark:text-fuchsia-400 font-semibold";
          } else if (key === 'prep' || key === 'preposition') {
            badgeStyle = "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/60 text-violet-600 dark:text-violet-400 font-semibold";
          } else if (key === 'measure') {
            badgeStyle = "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 font-semibold";
          } else if (key === 'number') {
            badgeStyle = "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/60 text-yellow-600 dark:text-yellow-400 font-semibold";
          } else if (key === 'verb / adj.' || key === 'noun / pronoun') {
            badgeStyle = "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900/60 text-cyan-600 dark:text-cyan-400 font-semibold";
          }
        } else {
          // If it doesn't match a glossary key, check if it contains Chinese characters
          const hasChinese = /[\u4e00-\u9fa5]/.test(cleanToken);
          if (hasChinese) {
            badgeStyle = "bg-primary border border-primary/20 text-white font-extrabold px-3 py-1 shadow-[0_0_8px_rgba(84,203,212,0.3)]";
            hoverTitle = "Trợ từ / Từ khóa cố định bắt buộc có trong câu mẫu";
          } else {
            // General fallback
            badgeStyle = "bg-surface-bone dark:bg-black/35 border-hairline dark:border-divider-dark text-body dark:text-on-dark-mute font-mono text-[11px]";
          }
        }

        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-mute dark:text-on-dark-mute font-light px-0.5 text-xs select-none">+</span>}
            <span
              title={hoverTitle}
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs border cursor-help transition-all hover:scale-105 select-all ${badgeStyle} ${
                isOptional ? 'border-dashed opacity-75' : ''
              }`}
            >
              {isOptional ? `(${cleanToken})` : cleanToken}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function GrammarScreen() {
  const [filterLevel, setFilterLevel] = useState('All');
  
  // Grouping by title to resolve duplication at runtime
  const groupedGrammar = useMemo(() => {
    const list = filterLevel === 'All' ? grammarData : grammarData.filter((g) => g.level === filterLevel);
    const groups = [];
    const map = new Map();
    
    list.forEach((item) => {
      // Group by level and title to prevent collision across levels
      const key = `${item.level}_${item.title}`;
      if (!map.has(key)) {
        const groupObj = {
          id: item.id, // first item's ID used as group key/expansion identifier
          level: item.level,
          title: item.title,
          url: item.url,
          items: [] // array of all matching raw entries
        };
        map.set(key, groupObj);
        groups.push(groupObj);
      }
      map.get(key).items.push(item);
    });
    return groups;
  }, [filterLevel]);

  const [expandedId, setExpandedId] = useState(groupedGrammar[0]?.id || null);
  const [activeTabs, setActiveTabs] = useState({}); // Tracking active sub-structure tab index per group ID
  const [showLegend, setShowLegend] = useState(false); // Collapsible glossary guide for beginners

  const handleSpeakExample = (e, text) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getActiveTab = (groupId) => activeTabs[groupId] || 0;
  const setActiveTab = (groupId, index) => {
    setActiveTabs((prev) => ({ ...prev, [groupId]: index }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm shrink-0">
          <BookOpenText size={18} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Ngữ pháp HSK</h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-0.5">
            Tổng hợp các cấu trúc ngữ pháp cốt lõi cấp độ HSK 1 - HSK 6 kèm chú giải và phát âm câu ví dụ mẫu.
          </p>
        </div>
      </div>

      {/* Visual Glossary/Legend for Beginners */}
      <div className="bg-surface-card dark:bg-surface-dark/35 border border-hairline dark:border-divider-dark rounded-md overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => setShowLegend(!showLegend)}
          className="w-full px-5 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-surface-bone/20 dark:hover:bg-black/10 select-none"
        >
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles size={14} className="animate-pulse text-primary" />
            <span>💡 Mẹo học: Cách phân tích cấu trúc ngữ pháp</span>
          </div>
          <span className="text-xs text-mute dark:text-on-dark-mute font-medium underline">
            {showLegend ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn ký hiệu'}
          </span>
        </button>
        
        {showLegend && (
          <div className="px-5 pb-5 border-t border-hairline dark:border-divider-dark pt-4 space-y-3 animate-fade-in text-left">
            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed">
              Các công thức ngữ pháp được mã hóa màu giúp người mới học phân tích nhanh cấu trúc câu tiếng Trung (rê chuột lên ký hiệu để xem giải thích chi tiết):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
              {Object.entries(GRAMMAR_GLOSSARY).slice(0, 12).map(([key, info]) => {
                let colorClass = "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400";
                if (key === 'subj') colorClass = "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400";
                if (key === 'verb') colorClass = "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400";
                if (key === 'adj') colorClass = "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-400";
                if (key === 'noun') colorClass = "bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-950/40 dark:border-sky-900/60 dark:text-sky-400";
                if (key === 'place') colorClass = "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/40 dark:border-teal-900/60 dark:text-teal-400";
                if (key === 'time') colorClass = "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400";
                if (key === 'pronoun') colorClass = "bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-400";
                if (key === 'adverb') colorClass = "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:border-fuchsia-900/60 dark:text-fuchsia-400";
                if (key === 'prep') colorClass = "bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950/40 dark:border-violet-900/60 dark:text-violet-400";
                if (key === 'measure') colorClass = "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-400";
                if (key === 'number') colorClass = "bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-950/40 dark:border-yellow-900/60 dark:text-yellow-400";

                const displayKey = key.charAt(0).toUpperCase() + key.slice(1) + (['verb', 'noun', 'place', 'time', 'pronoun', 'adverb', 'number'].includes(key) ? '' : '.');
                
                return (
                  <div key={key} className="border border-hairline dark:border-divider-dark rounded p-2 flex flex-col gap-0.5 bg-surface-bone/25 dark:bg-black/15">
                    <span className={`inline-self-start px-2 py-0.5 rounded text-[10px] border font-bold ${colorClass}`}>
                      {displayKey}
                    </span>
                    <span className="text-[11px] font-bold text-ink dark:text-on-dark">{info.vn}</span>
                    <span className="text-[9px] text-mute dark:text-on-dark-mute leading-normal">{info.desc}</span>
                  </div>
                );
              })}
              <div className="border border-hairline dark:border-divider-dark rounded p-2 flex flex-col gap-0.5 bg-surface-bone/25 dark:bg-black/15">
                <span className="inline-self-start px-2 py-0.5 rounded text-[10px] border font-extrabold bg-primary border-primary/20 text-white shadow-xs">
                  字 (Hán tự)
                </span>
                <span className="text-[11px] font-bold text-ink dark:text-on-dark">Từ cố định</span>
                <span className="text-[9px] text-mute dark:text-on-dark-mute leading-normal">Trợ từ, phó từ cố định bắt buộc có mặt trong câu ngữ pháp</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Level Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline dark:border-divider-dark pb-4">
        <div className="flex items-center gap-2 text-mute dark:text-on-dark-mute text-xs font-semibold uppercase tracking-wider">
          <Filter size={14} />
          Lọc theo cấp độ:
        </div>
        
        <div className="flex gap-1.5 select-none overflow-x-auto no-scrollbar max-w-full pb-1 flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {['All', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setFilterLevel(lvl);
                // Collapse and auto-select first group in new list to ensure clean navigation
                const list = lvl === 'All' ? grammarData : grammarData.filter(g => g.level === lvl);
                if (list.length > 0) {
                  // Find first group key based on level/title grouping
                  const firstItem = list[0];
                  setExpandedId(firstItem.id);
                } else {
                  setExpandedId(null);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                filterLevel === lvl
                  ? 'bg-primary border-transparent text-white shadow-sm'
                  : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
            >
              {lvl === 'All' ? 'Tất cả' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Grammar Points Accordion List */}
      <div className="space-y-4">
        {groupedGrammar.length > 0 ? (
          groupedGrammar.map((group) => {
            const isExpanded = expandedId === group.id;
            const itemsCount = group.items.length;
            const activeIdx = getActiveTab(group.id);
            const activeItem = group.items[activeIdx] || group.items[0];

            return (
              <div
                key={group.id}
                className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md overflow-hidden transition-all shadow-sm"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(group.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-bone/35 dark:hover:bg-black/20 select-none text-left"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded flex-shrink-0">
                        {group.level}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-mute uppercase tracking-widest leading-none">
                        Cấu trúc ngữ pháp
                      </span>
                      {itemsCount > 1 && (
                        <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded flex-shrink-0">
                          {itemsCount} cấu trúc
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-ink dark:text-on-dark truncate font-display">
                      {group.title}
                    </h3>
                  </div>

                  <div className="text-mute dark:text-on-dark-mute flex-shrink-0">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && activeItem && (
                  <div className="px-5 pb-6 border-t border-hairline dark:border-divider-dark pt-5 space-y-5 text-left animate-fade-in">
                    
                    {/* Sub-structures Tab Selector (if duplicate formulas exist under this title) */}
                    {itemsCount > 1 && (
                      <div className="flex flex-wrap gap-1.5 p-1 bg-surface-bone/50 dark:bg-black/30 rounded-md border border-hairline dark:border-divider-dark">
                        {group.items.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(group.id, idx)}
                            className={`flex-1 min-w-[120px] px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer text-center ${
                              activeIdx === idx
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-mute hover:text-ink hover:bg-surface-bone dark:text-on-dark-mute dark:hover:text-on-dark dark:hover:bg-black/40'
                            }`}
                          >
                            Cách dùng {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Formula & Explanation Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      
                      {/* Formula representation (parsed) */}
                      <div className="md:col-span-6 space-y-2">
                        <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
                          Công thức cấu trúc
                        </span>
                        <div className="bg-surface-bone/80 dark:bg-black/35 p-3.5 border border-hairline dark:border-divider-dark rounded-md flex flex-wrap items-center justify-center gap-1 shadow-sm min-h-[52px]">
                          <ParsedFormula formula={activeItem.formula} />
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="md:col-span-6 space-y-2">
                        <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
                          Ý nghĩa & Cách dùng
                        </span>
                        <p className="text-xs font-medium text-body dark:text-on-dark-mute leading-relaxed bg-surface-bone/30 dark:bg-black/10 border border-hairline dark:border-divider-dark rounded-md p-3.5 min-h-[52px] flex items-center">
                          {activeItem.explanation}
                        </p>
                      </div>

                    </div>

                    {/* Tips & Attentions (if exist) */}
                    {(activeItem.tips || activeItem.attentions) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeItem.tips && (
                          <div className="bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-md p-4 space-y-1">
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                              💡 Mẹo học
                            </span>
                            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium">
                              {activeItem.tips}
                            </p>
                          </div>
                        )}
                        {activeItem.attentions && (
                          <div className="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 rounded-md p-4 space-y-1">
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                              ⚠️ Lưu ý quan trọng
                            </span>
                            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium">
                              {activeItem.attentions}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Example Sentences */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
                        <Sparkles size={11} className="text-primary" />
                        Các câu ví dụ thực tế
                      </div>

                      <div className="space-y-3">
                        {activeItem.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => handleSpeakExample(e, ex.hanzi)}
                            className="group bg-surface-bone/30 dark:bg-black/20 hover:bg-surface-bone dark:hover:bg-black border border-hairline dark:border-divider-dark rounded-md p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.005]"
                          >
                            <div className="space-y-1 flex-1 text-left min-w-0">
                              <p className="text-lg font-display font-extrabold text-ink dark:text-on-dark leading-relaxed group-hover:text-primary transition-colors">
                                <HoverableText text={ex.hanzi} />
                              </p>
                              <p className="text-xs font-mono font-semibold text-primary">
                                {ex.pinyin}
                              </p>
                              <p className="text-xs font-medium text-body dark:text-on-dark-mute italic pt-0.5 leading-relaxed">
                                {ex.meaning}
                              </p>
                            </div>

                            <button
                              type="button"
                              className="h-8 w-8 rounded-full bg-surface-card border border-hairline dark:bg-surface-dark dark:border-divider-dark text-primary shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0 cursor-pointer"
                              title="Nghe phát âm ví dụ"
                            >
                              <Volume2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-xs text-mute dark:text-on-dark-mute bg-surface-card border border-hairline rounded-md border-dashed italic">
            Không tìm thấy điểm ngữ pháp nào phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}
