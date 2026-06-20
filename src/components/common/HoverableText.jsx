import React, { useState, useEffect, useRef } from 'react';
import { useDictionary } from '../../hooks/useDictionary';

export function HanziTooltip({ char, children }) {
  const [isHovered, setIsHovered] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { lookupMultiple } = useDictionary();
  const writerContainerRef = useRef(null);

  useEffect(() => {
    if (isHovered && !data && !loading) {
      setLoading(true);
      lookupMultiple('hanzi', char)
        .then((matches) => {
          const exact = matches.find((m) => m.s === char || m.t === char);
          if (exact) {
            setData(exact);
          } else {
            setData({ s: char, p: '---', sv: '---', vi: 'Không có dữ liệu định nghĩa.' });
          }
        })
        .catch((err) => {
          console.error(err);
          setData({ s: char, p: '---', sv: '---', vi: 'Lỗi tải từ điển.' });
        })
        .finally(() => setLoading(false));
    }
  }, [isHovered, char, data, loading, lookupMultiple]);

  useEffect(() => {
    if (isHovered && writerContainerRef.current && window.HanziWriter) {
      writerContainerRef.current.innerHTML = '';
      const isDark = document.documentElement.classList.contains('dark');
      const writer = window.HanziWriter.create(writerContainerRef.current, char, {
        width: 70,
        height: 70,
        padding: 2,
        showOutline: true,
        strokeColor: '#54cbd4',
        outlineColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(32, 32, 32, 0.12)',
        drawingColor: '#87ecf2',
        highlightColor: '#ff6a3d',
        showCharacter: true
      });
      writer.animateCharacter();
    }
  }, [isHovered, char, data]);

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(char);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <span 
      className="relative group/tooltip inline-block cursor-help border-b border-dashed border-primary/40 hover:text-primary transition-colors px-[1px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {isHovered && (
        <span 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl shadow-xl z-[999] pointer-events-auto transition-all duration-200 flex gap-3 text-left font-sans normal-case tracking-normal"
        >
          
          {/* Text definition part */}
          <span className="flex-1 min-w-0 flex flex-col justify-between">
            <span>
              <span className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                <span className="text-xl font-bold font-display text-primary">{char}</span>
                {data?.p && <span className="text-xs font-mono font-bold text-ink dark:text-on-dark">{data.p}</span>}
                {data?.sv && <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">{data.sv}</span>}
              </span>
              <span className="block text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium line-clamp-3">
                {loading ? 'Đang tải...' : data?.vi || '...'}
              </span>
            </span>
            
            <span className="mt-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSpeak}
                className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-mono font-bold hover:bg-primary/20 transition cursor-pointer"
              >
                🔊 Đọc
              </button>
              {data?.hsk && (
                <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded font-mono font-bold">
                  HSK {data.hsk}
                </span>
              )}
            </span>
          </span>

          {/* Handwriting practice box */}
          <span className="w-[74px] h-[74px] shrink-0 border border-hairline dark:border-divider-dark bg-surface-bone/35 dark:bg-black/25 rounded-lg flex items-center justify-center p-0.5 relative overflow-hidden select-none">
            <span ref={writerContainerRef} className="w-[70px] h-[70px]" />
          </span>

        </span>
      )}
    </span>
  );
}

export default function HoverableText({ text }) {
  if (!text) return null;
  const chars = Array.from(text);
  return (
    <span>
      {chars.map((char, index) => {
        const isChinese = /[\u4e00-\u9fa5]/.test(char);
        if (isChinese) {
          return (
            <HanziTooltip key={index} char={char}>
              {char}
            </HanziTooltip>
          );
        }
        return <span key={index}>{char}</span>;
      })}
    </span>
  );
}
