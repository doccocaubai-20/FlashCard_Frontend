import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Star,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { speakChinese, stopSpeech } from '../../utils/tts';
import { HanziTooltip } from '../common/HoverableText';
import { favoriteWordsApi } from '../../services/favoriteWordsApi';
import { useToast } from '../../context/ToastContext';
import { PERSONAS } from './ChatPersonaSelector';

export default function ChatMessageItem({ message, persona = 'general' }) {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [savedStar, setSavedStar] = useState(false);
  const { showToast } = useToast();

  const isUser = message.role === 'user';
  const personaObj = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

  // Extract all Chinese characters from the text for TTS reading
  const extractChineseText = (text) => {
    if (!text) return '';
    const matches = text.match(/[\u4e00-\u9fa5]+/g);
    return matches ? matches.join(' ') : text;
  };

  const handleSpeak = async (customText) => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = customText || extractChineseText(message.content) || message.content;
    setIsPlayingAudio(true);

    try {
      await speakChinese(textToSpeak, 'zh-CN', 'female', { disableRoboticFallback: true });
    } catch (err) {
      console.warn('Speech error:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    showToast('Đã sao chép nội dung vào bộ nhớ tạm', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to wrap Chinese characters with HanziTooltip
  const renderInteractiveText = (text) => {
    if (!text) return '';
    // Regex matches Chinese characters vs non-Chinese
    const parts = [];
    let lastIdx = 0;
    const regex = /([\u4e00-\u9fa5]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const idx = match.index;
      if (idx > lastIdx) {
        parts.push(text.substring(lastIdx, idx));
      }
      const chineseWord = match[0];
      // Render each character or the whole word with HanziTooltip
      parts.push(
        <span key={idx} className="font-serif font-medium text-emerald-800 dark:text-emerald-300">
          {Array.from(chineseWord).map((char, cIdx) => (
            <HanziTooltip key={cIdx} char={char} noUnderline={false}>
              <span className="hover:text-primary transition-colors cursor-help px-[0.5px]">
                {char}
              </span>
            </HanziTooltip>
          ))}
        </span>
      );
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  // Safe inline markdown parser for bold, inline code, and interactive Hanzi
  const parseInlineMarkdown = (text) => {
    if (!text) return '';
    const parts = [];
    let currentIdx = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const matchIdx = match.index;

      if (matchIdx > currentIdx) {
        parts.push(renderInteractiveText(text.substring(currentIdx, matchIdx)));
      }

      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={matchIdx} className="font-bold text-primary dark:text-teal-300">
            {renderInteractiveText(matchText.slice(2, -2))}
          </strong>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code
            key={matchIdx}
            className="px-1.5 py-0.5 rounded-md bg-surface-bone dark:bg-white/10 font-mono text-xs text-rose-500 dark:text-rose-400 font-semibold border border-hairline dark:border-white/10"
          >
            {matchText.slice(1, -1)}
          </code>
        );
      }
      currentIdx = regex.lastIndex;
    }

    if (currentIdx < text.length) {
      parts.push(renderInteractiveText(text.substring(currentIdx)));
    }

    return parts.length > 0 ? parts : renderInteractiveText(text);
  };

  // Full markdown parser: handles Tables, Headers, Blockquotes, Lists, and Paragraphs
  const renderMarkdownBlocks = (rawContent) => {
    if (!rawContent) return null;

    const lines = rawContent.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Table Detection (| Header 1 | Header 2 |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0]
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          // Skip divider row (e.g. |---|---|)
          const bodyRows = tableLines.slice(2).map((rowStr) =>
            rowStr
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim())
          );

          elements.push(
            <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-hairline dark:border-white/10 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-bone dark:bg-white/5 border-b border-hairline dark:border-white/10">
                    {headerRow.map((col, cIdx) => (
                      <th key={cIdx} className="px-3 py-2 font-bold text-ink dark:text-on-dark">
                        {parseInlineMarkdown(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline dark:divide-white/5">
                  {bodyRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 1 ? 'bg-surface-bone/40 dark:bg-white/5' : 'bg-transparent'}
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-ink/90 dark:text-on-dark/90 leading-relaxed">
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 2. Headers (#, ##, ###)
      const headerMatch = line.match(/^[\s]*(#{1,4})[\s]+(.*)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const headingContent = headerMatch[2];
        const hClass =
          level === 1
            ? 'text-base sm:text-lg font-bold text-primary dark:text-teal-300 mt-3 mb-1.5'
            : level === 2
            ? 'text-sm sm:text-base font-bold text-primary dark:text-teal-300 mt-2.5 mb-1'
            : 'text-xs sm:text-sm font-bold text-ink dark:text-on-dark mt-2 mb-0.5';

        elements.push(
          <div key={`h-${i}`} className={hClass}>
            {parseInlineMarkdown(headingContent)}
          </div>
        );
        i++;
        continue;
      }

      // 3. Blockquotes (> quote)
      const quoteMatch = line.match(/^[\s]*>[\s]*(.*)/);
      if (quoteMatch) {
        elements.push(
          <blockquote
            key={`q-${i}`}
            className="my-2 pl-3 py-1 border-l-3 border-primary/60 bg-primary/5 dark:bg-teal-500/10 rounded-r-xl text-xs sm:text-sm italic text-ink/85 dark:text-on-dark/85"
          >
            {parseInlineMarkdown(quoteMatch[1])}
          </blockquote>
        );
        i++;
        continue;
      }

      // 4. List items (- item or * item)
      const listMatch = line.match(/^[\s]*[-*][\s]+(.*)/);
      if (listMatch) {
        elements.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-xs sm:text-sm my-1 text-ink/90 dark:text-on-dark/90 pl-1 leading-relaxed">
            {parseInlineMarkdown(listMatch[1])}
          </li>
        );
        i++;
        continue;
      }

      // 5. Ordered list items (1. item)
      const orderedMatch = line.match(/^[\s]*(\d+)\.[\s]+(.*)/);
      if (orderedMatch) {
        elements.push(
          <li key={`oli-${i}`} className="ml-4 list-decimal text-xs sm:text-sm my-1 text-ink/90 dark:text-on-dark/90 pl-1 leading-relaxed">
            {parseInlineMarkdown(orderedMatch[2])}
          </li>
        );
        i++;
        continue;
      }

      // 6. Empty spacers
      if (!line.trim()) {
        elements.push(<div key={`sp-${i}`} className="h-2" />);
        i++;
        continue;
      }

      // 7. Regular paragraph
      elements.push(
        <p key={`p-${i}`} className="text-xs sm:text-sm my-1 leading-relaxed text-ink/90 dark:text-on-dark/90">
          {parseInlineMarkdown(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
      {/* Avatar for Assistant */}
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs mt-1">
          <Bot size={16} />
        </div>
      )}

      {/* Main message card */}
      <div
        className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 sm:p-4.5 shadow-xs border transition-all ${
          isUser
            ? 'bg-primary text-white border-primary rounded-tr-xs shadow-primary/10'
            : message.isError
            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 rounded-tl-xs'
            : 'bg-surface dark:bg-card-dark text-ink dark:text-on-dark border-hairline dark:border-white/10 rounded-tl-xs'
        }`}
      >
        {/* Assistant Header: Persona title + TTS Audio button */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-hairline dark:border-white/10">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles size={13} className="text-primary shrink-0" />
              <span className="font-bold text-xs text-primary dark:text-teal-300 truncate">
                {personaObj.name}
              </span>
              <span className="text-[10px] text-mute px-1.5 py-0.2 rounded bg-surface-bone dark:bg-white/5 shrink-0 hidden sm:inline">
                {personaObj.role}
              </span>
            </div>

            {/* Quick Actions (Audio TTS & Copy) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSpeak()}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-primary text-white shadow-xs animate-pulse'
                    : 'text-mute hover:text-primary hover:bg-primary/10'
                }`}
                title={isPlayingAudio ? 'Dừng đọc' : 'Nghe phát âm chuẩn Edge TTS'}
              >
                {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-mute hover:text-ink dark:hover:text-on-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Sao chép nội dung"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className="space-y-1 select-text">
          {isUser ? (
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {message.content}
            </p>
          ) : (
            renderMarkdownBlocks(message.content)
          )}
        </div>

        {/* Footer: Timestamp & Token details */}
        <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-hairline/40 dark:border-white/5 text-[10px]">
          <div className="flex items-center gap-2">
            {!isUser && message.tokensUsed && (
              <span className="text-mute/70 font-mono">
                {message.tokensUsed} tokens
              </span>
            )}
          </div>

          <span className={isUser ? 'text-white/70' : 'text-mute/70'}>
            {message.createdAt
              ? new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </span>
        </div>
      </div>

      {/* Avatar for User */}
      {isUser && (
        <div className="h-8 w-8 rounded-xl bg-surface-bone dark:bg-white/10 text-ink/70 dark:text-on-dark/70 border border-hairline dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs mt-1">
          <User size={16} />
        </div>
      )}
    </div>
  );
}
