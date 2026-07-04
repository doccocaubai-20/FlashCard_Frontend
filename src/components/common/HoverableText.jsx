import React, { useState, useEffect, useRef } from 'react';
import { useDictionary } from '../../hooks/useDictionary';

const cleanDefinition = (vi) => {
  if (!vi) return '';
  const trimmed = vi.trim();
  if (trimmed.length < 50) return trimmed;
  // Split by semicolon and take first 2 parts to keep popup concise
  const parts = trimmed.split(';');
  if (parts.length > 2) {
    return parts.slice(0, 2).map((p) => p.trim()).join('; ') + '...';
  }
  return trimmed;
};

export function HanziTooltip({ char, children, hideMeaning = false, className = "" }) {
  const [isHovered, setIsHovered] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { lookupMultiple } = useDictionary();
  const writerContainerRef = useRef(null);
  const triggerRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const [alignClass, setAlignClass] = useState('left-1/2 -translate-x-1/2');

  // Reset states when character changes to prevent state leakage from React component reuse
  useEffect(() => {
    setData(null);
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(false);
  }, [char]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isHovered && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      const tooltipWidth = hideMeaning ? 176 : 288;
      const halfWidth = tooltipWidth / 2;

      if (spaceLeft < halfWidth + 16) {
        setAlignClass('left-0 translate-x-0');
      } else if (spaceRight < halfWidth + 16) {
        setAlignClass('right-0 left-auto translate-x-0');
      } else {
        setAlignClass('left-1/2 -translate-x-1/2');
      }
    }
  }, [isHovered, hideMeaning]);

  useEffect(() => {
    if (isHovered && !data && !loading) {
      setLoading(true);
      lookupMultiple('hanzi', char)
        .then((matches) => {
          const exactMatches = matches.filter((m) => m.s === char || m.t === char);
          if (exactMatches.length > 0) {
            exactMatches.sort((a, b) => {
              const aHsk = a.hsk ? 1 : 0;
              const bHsk = b.hsk ? 1 : 0;
              if (aHsk !== bHsk) return bHsk - aHsk;

              const aIsSurname = /^(họ\b|họ\s*\[)/i.test(a.vi || '');
              const bIsSurname = /^(họ\b|họ\s*\[)/i.test(b.vi || '');
              if (aIsSurname !== bIsSurname) return aIsSurname ? 1 : -1;

              return (b.vi || '').length - (a.vi || '').length;
            });
            setData(exactMatches[0]);
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
        showCharacter: true,
        strokeAnimationSpeed: 1.25,
        delayBetweenStrokes: 180,
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

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150); // 150ms debounce window
  };

    const triggerClass = className || "relative group/tooltip inline-block cursor-help border-b border-dashed border-primary/40 hover:text-primary transition-colors px-[1px]";
    return (
      <span 
        ref={triggerRef}
        className={triggerClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}

      {isHovered && (
        <span 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute bottom-full pb-2 z-[999] pointer-events-auto transition-all duration-200 ${alignClass}`}
        >
          <span 
            onClick={(e) => e.stopPropagation()}
            className={`p-4 bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl shadow-xl flex gap-3 text-left font-sans normal-case tracking-normal text-slate-800 dark:text-slate-200 ${
              hideMeaning ? 'w-44' : 'w-72'
            }`}
          >
            {/* Text definition part */}
            <span className="flex-1 min-w-0 flex flex-col justify-between">
              <span>
                <span className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-xl font-bold font-display text-primary">{char}</span>
                  {data?.p && <span className="text-xs font-mono font-bold text-ink dark:text-on-dark">{data.p}</span>}
                  {data?.sv && <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">{data.sv}</span>}
                </span>
                {!hideMeaning && (
                  <span className="block text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium line-clamp-3">
                    {loading ? 'Đang tải...' : cleanDefinition(data?.vi || '...')}
                  </span>
                )}
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
        </span>
      )}
    </span>
  );
}

export default function HoverableText({ text, hideMeaning = false, className = "" }) {
  if (!text) return null;
  const chars = Array.from(text);
  return (
    <span>
      {chars.map((char, index) => {
        const isChinese = /[\u4e00-\u9fa5]/.test(char);
        if (isChinese) {
          return (
            <HanziTooltip key={`${char}_${index}`} char={char} hideMeaning={hideMeaning} className={className}>
              {char}
            </HanziTooltip>
          );
        }
        return <span key={index}>{char}</span>;
      })}
    </span>
  );
}
