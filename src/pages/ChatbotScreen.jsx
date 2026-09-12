import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu,
  Sparkles,
  Bot,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { chatApi } from '../services/chatApi';
import { fetchAllDecks } from '../features/deck/deckSlice';
import { useToast } from '../context/ToastContext';

// Chat Components
import ChatSessionSidebar from '../components/chat/ChatSessionSidebar';
import ChatPersonaSelector, { PERSONAS } from '../components/chat/ChatPersonaSelector';
import ChatMessageItem from '../components/chat/ChatMessageItem';
import ChatInputBar from '../components/chat/ChatInputBar';
import ChatTokenBadge from '../components/chat/ChatTokenBadge';

export default function ChatbotScreen() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const decks = useSelector((state) => state.deck.decks || []);

  // Sessions & Messages State
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Active Persona & Deck Context
  const [activePersona, setActivePersona] = useState('general');
  const [selectedDeckId, setSelectedDeckId] = useState(null);

  // Quota state
  const [quota, setQuota] = useState(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // 1. Tải danh sách Bộ bài từ Redux
  useEffect(() => {
    dispatch(fetchAllDecks());
  }, [dispatch]);

  // 2. Tải hạn mức Tokens Quota
  const fetchQuota = async () => {
    try {
      const res = await chatApi.getQuota();
      if (res?.data) {
        setQuota(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch chat token quota:', err);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  // 3. Tải danh sách các phiên trò chuyện (Sessions)
  const fetchSessions = async (autoSelectFirst = true) => {
    try {
      const res = await chatApi.getSessions();
      const sessionList = res.data || [];
      setSessions(sessionList);

      if (autoSelectFirst && sessionList.length > 0) {
        const firstSession = sessionList[0];
        setActiveSessionId(firstSession.id);
        setActivePersona(firstSession.persona || 'general');
        setSelectedDeckId(firstSession.deckId || null);
      } else if (sessionList.length === 0) {
        // Chưa có phiên nào -> Tự động tạo phiên đầu tiên
        handleCreateSession();
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // 4. Tải tin nhắn của phiên đang chọn
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await chatApi.getSessionMessages(activeSessionId);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load session messages:', err);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeSessionId]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // 5. Chọn phiên khác
  const handleSelectSession = (sessionId) => {
    if (sessionId === activeSessionId) return;
    const found = sessions.find((s) => s.id === sessionId);
    setActiveSessionId(sessionId);
    if (found) {
      setActivePersona(found.persona || 'general');
      setSelectedDeckId(found.deckId || null);
    }
  };

  // 6. Tạo phiên trò chuyện mới
  const handleCreateSession = async () => {
    try {
      const personaObj = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[0];
      const res = await chatApi.createSession({
        title: `Học cùng ${personaObj.name}`,
        persona: activePersona,
        deckId: selectedDeckId,
      });

      const newSession = res.data;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
      showToast('Đã tạo cuộc trò chuyện mới', 'info');
    } catch (err) {
      console.error('Failed to create session:', err);
      showToast('Không thể tạo phiên mới lúc này', 'error');
    }
  };

  // 7. Cập nhật phiên (đổi tên, ghim)
  const handleUpdateSession = async (sessionId, data) => {
    try {
      const res = await chatApi.updateSession(sessionId, data);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...res.data } : s))
      );
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  // 8. Xóa phiên
  const handleDeleteSession = async (sessionId) => {
    try {
      await chatApi.deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          setActivePersona(remaining[0].persona || 'general');
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
      showToast('Đã xóa cuộc trò chuyện', 'info');
    } catch (err) {
      console.error('Failed to delete session:', err);
      showToast('Không thể xóa cuộc trò chuyện', 'error');
    }
  };

  // 9. Đổi chế độ Persona
  const handleSelectPersona = async (personaId) => {
    setActivePersona(personaId);
    if (activeSessionId) {
      await handleUpdateSession(activeSessionId, { persona: personaId });
    }
  };

  // 10. Gửi tin nhắn
  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text || !text.trim() || isSending) return;

    // Kiểm tra quota trước khi gửi
    if (quota && quota.remaining <= 0) {
      showToast('Bạn đã hết hạn mức tokens hôm nay. Hãy đổi Xu để nạp thêm nhé!', 'warning');
      return;
    }

    const trimmedText = text.trim();
    if (!textToSend) setInput('');

    // Đẩy tạm tin nhắn user vào UI ngay lập tức
    const tempUserMsg = {
      role: 'user',
      content: trimmedText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const res = await chatApi.sendMessage(
        trimmedText,
        activeSessionId,
        activePersona,
        selectedDeckId
      );

      const aiReply = res.data;
      setMessages((prev) => [...prev, aiReply]);

      // Cập nhật session id nếu server tự cấp
      if (aiReply.sessionId && aiReply.sessionId !== activeSessionId) {
        setActiveSessionId(aiReply.sessionId);
        fetchSessions(false);
      } else {
        // Cập nhật title trong sidebar nếu được tự động đổi
        fetchSessions(false);
      }

      // Cập nhật quota mới nhất từ backend
      if (aiReply.quota) {
        setQuota(aiReply.quota);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const errMsg =
        err.response?.data?.message || 'Không thể kết nối đến máy chủ AI.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Lỗi:** ${errMsg}`,
          isError: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // 11. Đổi Xu lấy thêm Tokens
  const handleRefillQuota = async () => {
    const res = await chatApi.refillQuota();
    if (res?.data) {
      await fetchQuota();
    }
  };

  const activePersonaObj = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[0];
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-50px)] w-full max-w-7xl mx-auto rounded-3xl bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 shadow-sm overflow-hidden select-none">
      {/* CỘT TRÁI: Multi-Sessions Sidebar */}
      <ChatSessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onUpdateSession={handleUpdateSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* CỘT PHẢI: Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-white/60 dark:bg-[#1a2332]/60">
        
        {/* Top Header: Session title, Persona info, Token Badge & Controls */}
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-hairline dark:border-white/10 bg-white dark:bg-[#1a2332]">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Hamburger toggle for session sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-xl text-mute hover:text-ink dark:hover:text-on-dark hover:bg-black/5 dark:hover:bg-white/5 md:hidden cursor-pointer"
              title="Mở danh sách cuộc trò chuyện"
            >
              <Menu size={20} />
            </button>

            {/* Persona Avatar & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
                <Bot size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-xs sm:text-sm text-ink dark:text-on-dark truncate leading-tight">
                    {activeSession?.title || 'ChongZi AI Assistant'}
                  </h1>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-mute mt-0.5 truncate">
                  <span className="font-semibold text-primary">{activePersonaObj.name}</span>
                  <span>•</span>
                  <span className="truncate">{activePersonaObj.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Actions: Token Badge & New Chat */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Token Quota Badge */}
            <ChatTokenBadge quota={quota} onRefillSuccess={handleRefillQuota} />

            <button
              type="button"
              onClick={handleCreateSession}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-surface-bone dark:bg-white/5 text-ink dark:text-on-dark hover:bg-primary/10 hover:text-primary transition-all border border-hairline dark:border-white/10 cursor-pointer"
              title="Bắt đầu cuộc trò chuyện mới"
            >
              <Plus size={14} />
              <span>Đoạn chat mới</span>
            </button>
          </div>
        </header>

        {/* Persona Selector Bar (5 chế độ gia sư) */}
        <div className="px-4 py-2 bg-surface-bone/40 dark:bg-white/2 border-b border-hairline/60 dark:border-white/5">
          <ChatPersonaSelector
            activePersona={activePersona}
            onSelectPersona={handleSelectPersona}
          />
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {isLoadingMessages ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-mute">
              <div className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs font-semibold">Đang tải cuộc trò chuyện...</span>
            </div>
          ) : messages.length === 0 ? (
            /* Welcome / Empty State */
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-4 py-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
                <Sparkles size={32} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-ink dark:text-on-dark">
                  Xin chào! Tôi là {activePersonaObj.name}
                </h2>
                <p className="text-xs text-mute mt-1.5 leading-relaxed">
                  {activePersonaObj.desc}. Hãy đặt câu hỏi hoặc chọn một gợi ý bên dưới để bắt đầu bài học nhé!
                </p>
              </div>

              {/* Persona highlights */}
              <div className="p-3.5 rounded-2xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/10 text-left w-full space-y-1.5 text-xs">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Tính năng hỗ trợ học tập:</span>
                </div>
                <ul className="space-y-1 text-ink/80 dark:text-on-dark/80 text-[11px] list-disc list-inside">
                  <li>Rê chuột vào bất kỳ chữ Hán nào để tra Pinyin, nghĩa và xem thứ tự nét vẽ.</li>
                  <li>Bấm nút loa bên cạnh câu trả lời để nghe phát âm giọng chuẩn Microsoft Edge.</li>
                  <li>Nhập liệu bằng giọng nói tiếng Trung qua biểu tượng Micro ở góc dưới.</li>
                  <li>Gắn bộ thẻ từ vựng bạn đang học để AI ưu tiên dạy các từ vựng đó.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Message List */
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg, idx) => (
                <ChatMessageItem
                  key={msg.id || idx}
                  message={msg}
                  persona={activePersona}
                />
              ))}

              {/* Sending / Loading Indicator */}
              {isSending && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs mt-1">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-2xl rounded-tl-xs p-4 bg-white dark:bg-[#1a2332] border border-hairline dark:border-white/10 shadow-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                      <Sparkles size={13} className="animate-pulse" />
                      <span>{activePersonaObj.name} đang suy nghĩ...</span>
                    </div>
                    <div className="flex items-center gap-1 py-1">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Deck Bar */}
        <div className="px-4 pb-3 sm:px-5">
          <div className="max-w-4xl mx-auto">
            <ChatInputBar
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isLoading={isSending}
              selectedDeckId={selectedDeckId}
              onSelectDeck={setSelectedDeckId}
              decks={decks}
              quota={quota}
              activePersona={activePersona}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
