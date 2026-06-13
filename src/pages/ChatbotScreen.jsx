import React, { useState, useEffect, useRef } from 'react';
import { chatApi } from '../services/chatApi';
import {
  MessageSquare,
  Send,
  Trash2,
  Loader2,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick suggestions list
  const suggestions = [
    { text: 'Giải thích cấu trúc câu chữ 把 (bǎ)?', label: 'Cấu trúc 把' },
    { text: 'Cho tôi 5 từ vựng HSK 3 chủ đề thời tiết?', label: 'Từ vựng thời tiết' },
    { text: 'ChongZi có những tính năng gì nổi bật?', label: 'Tính năng ChongZi' },
    { text: 'Làm sao để ghi nhớ chữ Hán lâu hơn?', label: 'Mẹo nhớ chữ Hán' },
  ];

  // Fetch history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await chatApi.getHistory();
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsHistoryLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text || !text.trim() || isLoading) return;

    // Add user message locally
    const userMsg = { role: 'user', content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await chatApi.sendMessage(text);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to send message:', err);
      const errMsg = err.response?.data?.message || 'Không thể kết nối đến máy chủ AI.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ **Lỗi:** ${errMsg}`, isError: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatApi.clearHistory();
      setMessages([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Safe markdown-like parser for inline bold, list items, headers and inline code
  const parseInline = (text) => {
    if (!text) return '';
    const parts = [];
    let currentIdx = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const matchIdx = match.index;

      if (matchIdx > currentIdx) {
        parts.push(text.substring(currentIdx, matchIdx));
      }

      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={matchIdx} className="font-bold text-primary dark:text-primary-light">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code key={matchIdx} className="px-1.5 py-0.5 rounded bg-surface-bone dark:bg-surface-dark font-mono text-xs text-rose-500 font-semibold border border-hairline dark:border-divider-dark">
            {matchText.slice(1, -1)}
          </code>
        );
      }
      currentIdx = regex.lastIndex;
    }

    if (currentIdx < text.length) {
      parts.push(text.substring(currentIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  const formatMessageContent = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // List items
      const listMatch = line.match(/^[\s]*[-*][\s]+(.*)/);
      if (listMatch) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm my-1.5 text-ink dark:text-on-dark pl-1">
            {parseInline(listMatch[1])}
          </li>
        );
      }

      // Headers
      const headerMatch = line.match(/^[\s]*(#{1,6})[\s]+(.*)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const headingClass = level === 1 
          ? 'text-lg font-bold mt-3 mb-2 text-primary' 
          : level === 2 
          ? 'text-base font-bold mt-2.5 mb-1.5 text-primary' 
          : 'text-sm font-bold mt-2 mb-1 text-ink dark:text-on-dark';
        return (
          <div key={idx} className={headingClass}>
            {parseInline(headerMatch[2])}
          </div>
        );
      }

      // Default paragraph (supports empty lines as spacers)
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-sm my-1 leading-relaxed text-ink dark:text-on-dark">
          {parseInline(line)}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-40px)] w-full max-w-6xl mx-auto px-4 py-4 select-none">
      
      {/* Header section */}
      <div className="flex items-center justify-between pb-4 border-b border-hairline dark:border-divider-dark">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink dark:text-on-dark tracking-tight leading-none">
              ChongZi AI Assistant
            </h1>
            <span className="text-xs text-mute dark:text-on-dark-mute mt-1 block">
              Gia sư tiếng Trung & Hướng dẫn sử dụng hệ thống
            </span>
          </div>
        </div>

        {/* Clear History Button */}
        {messages.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-mute hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all border border-hairline dark:border-divider-dark cursor-pointer"
            title="Xóa cuộc trò chuyện"
          >
            <Trash2 size={13} />
            <span>Xóa chat</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark p-6 rounded-2xl max-w-sm w-full shadow-lg">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle size={24} />
              <h3 className="font-bold text-ink dark:text-on-dark text-base">Xóa lịch sử trò chuyện?</h3>
            </div>
            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed mb-5">
              Hành động này sẽ xóa toàn bộ nội dung trò chuyện hiện tại và không thể khôi phục lại. Bạn có chắc chắn không?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-surface-bone dark:bg-black/25 text-ink dark:text-on-dark hover:bg-hairline dark:hover:bg-black/40 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-red-500 hover:bg-red-600 text-white cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main chat messages list */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1 custom-scrollbar">
        {isHistoryLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="text-xs text-mute dark:text-on-dark-mute">Đang tải cuộc trò chuyện...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-5">
            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <MessageSquare size={32} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink dark:text-on-dark">Bắt đầu cuộc trò chuyện!</h2>
              <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed mt-2">
                Hãy đặt câu hỏi về ngữ pháp tiếng Trung, nhờ AI soạn đoạn hội thoại mẫu hoặc hỏi về cách sử dụng các tính năng của ChongZi.
              </p>
            </div>

            {/* Suggestions list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full pt-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug.text)}
                  className="flex items-start gap-2.5 p-3 text-left rounded-xl bg-white dark:bg-black/10 border border-hairline dark:border-divider-dark hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary/5 transition-all text-xs text-body dark:text-on-dark cursor-pointer shadow-xs"
                >
                  <HelpCircle size={14} className="text-primary mt-0.5 shrink-0" />
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs border ${
                      isUser
                        ? 'bg-surface-dark dark:bg-black/35 text-white border-transparent rounded-tr-xs'
                        : msg.isError
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200 dark:border-red-900/40 rounded-tl-xs'
                        : 'bg-white dark:bg-black/15 text-ink dark:text-on-dark border-hairline dark:border-divider-dark rounded-tl-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1 border-b border-hairline/10 dark:border-divider-dark/5 pb-1">
                        <Sparkles size={11} className="text-primary" />
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-primary">
                          ChongZi AI
                        </span>
                      </div>
                    )}
                    <div className="space-y-1">
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        formatMessageContent(msg.content)
                      )}
                    </div>
                    <span
                      className={`text-[9px] block text-right mt-1.5 ${
                        isUser ? 'text-white/60' : 'text-mute/60 dark:text-on-dark-mute/40'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Pulsing dots loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-black/15 border border-hairline dark:border-divider-dark rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-hairline/10 dark:border-divider-dark/5">
                    <Sparkles size={11} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-primary">
                      ChongZi AI đang trả lời...
                    </span>
                  </div>
                  <div className="flex items-center gap-1 py-1 px-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input text bar & send button */}
      <div className="pt-3 border-t border-hairline dark:border-divider-dark max-w-4xl w-full mx-auto">
        <div className="relative flex items-center bg-white dark:bg-black/10 border border-hairline dark:border-divider-dark rounded-2xl focus-within:border-primary/50 dark:focus-within:border-primary/50 transition-all p-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Đặt câu hỏi của bạn tại đây... (Nhấn Enter để gửi)"
            className="flex-1 bg-transparent border-0 outline-hidden py-2 px-3 text-sm text-ink dark:text-on-dark resize-none max-h-24 min-h-[40px] focus:ring-0"
            rows={1}
            disabled={isLoading || isHistoryLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || isHistoryLoading}
            className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all cursor-pointer ${
              input.trim() && !isLoading && !isHistoryLoading
                ? 'bg-primary text-white hover:bg-primary-deep shadow-xs'
                : 'bg-surface-bone dark:bg-black/15 text-mute/50 cursor-not-allowed border border-hairline/50'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[10px] text-mute/80 dark:text-on-dark-mute/60 text-center mt-2">
          Hệ thống được vận hành bởi trí tuệ nhân tạo DeepSeek. Các câu trả lời có tính chất hỗ trợ học tập.
        </p>
      </div>
    </div>
  );
}
