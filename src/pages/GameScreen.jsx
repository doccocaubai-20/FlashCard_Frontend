import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trophy, Clock, CheckCircle } from 'lucide-react';
import { studyApi } from '../services/studyApi';
import { statsApi } from '../services/statsApi';
import { fetchDeckDetails } from '../features/deck/deckSlice';
import { useDispatch } from 'react-redux';

export default function GameScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Game Board States
  const [boardItems, setBoardItems] = useState([]); // Array of 10 items (5 Hanzi, 5 Definitions)
  const [selectedItem, setSelectedItem] = useState(null); // Active selection
  const [matchedIds, setMatchedIds] = useState(new Set()); // IDs of matched cards
  const [wrongItems, setWrongItems] = useState(new Set()); // Items currently displaying error shakes
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Timer Effect
  useEffect(() => {
    if (!startTime || isFinished) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  // Load cards on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchDeckDetails(id));
    }
    const loadDeckCards = async () => {
      try {
        setLoading(true);
        const res = await studyApi.getAllCards();
        const deckCards = (res.data || []).filter((c) => c.deckId === Number(id));
        setCards(deckCards);
        initializeGame(deckCards);
      } catch (err) {
        console.error('Failed to load cards for game:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDeckCards();
  }, [id, dispatch]);

  // Initialize a new round
  function initializeGame(cardList = cards) {
    if (cardList.length < 3) return; // Need at least 3 cards to play

    // Select up to 5 random cards
    const pool = [...cardList];
    const selected = [];
    const count = Math.min(5, pool.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }

    // Double the items (5 Hanzi cards, 5 Definition cards)
    const items = [];
    selected.forEach((card) => {
      items.push({
        id: `hanzi-${card.id}`,
        cardId: card.id,
        type: 'hanzi',
        content: card.character || card.hanzi,
      });
      items.push({
        id: `def-${card.id}`,
        cardId: card.id,
        type: 'def',
        content: card.pinyin && card.meaning ? `${card.pinyin}\n${card.meaning}` : (card.meaning || card.pinyin || ''),
      });
    });

    // Shuffle board items using Fisher-Yates
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    setBoardItems(items);
    setSelectedItem(null);
    setMatchedIds(new Set());
    setWrongItems(new Set());
    setMoves(0);
    setElapsedTime(0);
    setStartTime(Date.now());
    setIsFinished(false);
  }

  // Card select click handler
  const handleItemClick = (item) => {
    if (matchedIds.has(item.cardId) || wrongItems.has(item.id)) return;

    // First selection
    if (!selectedItem) {
      setSelectedItem(item);
      return;
    }

    // Clicked the same item again -> deselect
    if (selectedItem.id === item.id) {
      setSelectedItem(null);
      return;
    }

    // Clicked item of the same type -> switch selection
    if (selectedItem.type === item.type) {
      setSelectedItem(item);
      return;
    }

    // Match validation check
    setMoves((prev) => prev + 1);

    if (selectedItem.cardId === item.cardId) {
      // SUCCESS match!
      const newMatched = new Set(matchedIds);
      newMatched.add(item.cardId);
      setMatchedIds(newMatched);
      setSelectedItem(null);

      // Check if all are matched
      if (newMatched.size === boardItems.length / 2) {
        setIsFinished(true);
        statsApi.incrementQuestProgress('PLAY_GAME', 1).catch(err => console.error(err));
      }
    } else {
      // MISMATCH error
      const errorPair = new Set([selectedItem.id, item.id]);
      setWrongItems(errorPair);
      setSelectedItem(null);

      // Clear shake animations after 600ms
      setTimeout(() => {
        setWrongItems(new Set());
      }, 600);
    }
  };

  // Format stopwatch/elapsed seconds
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-mute">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm font-medium">Đang chuẩn bị màn chơi...</span>
      </div>
    );
  }

  if (cards.length < 3) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="p-8 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md shadow-sm">
          <Trophy size={48} className="mx-auto text-primary opacity-30 mb-4" />
          <h2 className="font-display text-lg font-bold text-ink dark:text-on-dark tracking-tight">Số lượng thẻ không đủ</h2>
          <p className="text-sm text-body dark:text-on-dark-mute mt-2 leading-relaxed">
            Màn chơi ghép thẻ yêu cầu bộ bài có tối thiểu **3 thẻ**. Vui lòng thêm từ vựng mới vào bộ bài trước khi chơi.
          </p>
          <button
            onClick={() => navigate(`/decks/${id}`)}
            className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full cursor-pointer transition-all"
          >
            Quay lại bộ bài
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      
      {/* Top action header bar */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-4">
        <button
          onClick={() => navigate(`/decks/${id}`)}
          className="flex items-center gap-2 text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark font-mono font-bold text-xs cursor-pointer"
        >
          <ArrowLeft size={14} />
          Quay lại bộ bài
        </button>
        <div className="flex items-center gap-4 text-xs font-mono font-bold text-mute dark:text-on-dark-mute bg-surface-bone dark:bg-black/30 px-4 py-2 rounded-full border border-hairline dark:border-divider-dark">
          <div className="flex items-center gap-1">
            <Clock size={13} className="text-primary" />
            <span>Thời gian: {formatTime(elapsedTime)}</span>
          </div>
          <span>•</span>
          <span>Lượt thử: {moves}</span>
        </div>
        <button
          onClick={() => initializeGame()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline dark:border-divider-dark text-xs font-mono font-semibold text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer bg-surface-card dark:bg-surface-dark shadow-sm"
          title="Chơi lại từ đầu"
        >
          <RefreshCw size={12} />
          Trộn lại
        </button>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">Game Nối Từ Tiếng Trung</h1>
        <p className="text-xs text-mute dark:text-on-dark-mute mt-1">
          Nối ô chữ Hán với nghĩa hoặc phiên âm tương ứng.
        </p>
      </div>

      {/* Game board grid */}
      {!isFinished ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto pt-4">
          {boardItems.map((item) => {
            const isMatched = matchedIds.has(item.cardId);
            const isSelected = selectedItem?.id === item.id;
            const isWrong = wrongItems.has(item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={isMatched}
                className={`min-h-[110px] flex items-center justify-center p-4 text-center rounded-md border text-sm transition-all duration-200 shadow-sm cursor-pointer ${
                  isMatched
                    ? 'opacity-0 scale-90 pointer-events-none'
                    : isWrong
                    ? 'border-red-500 bg-red-500/10 text-red-500 animate-shake'
                    : isSelected
                    ? 'border-primary bg-primary/15 text-primary ring-2 ring-primary/40 shadow-[0_0_12px_rgba(15,82,87,0.3)] dark:shadow-[0_0_15px_rgba(15,82,87,0.55)]'
                    : 'bg-surface-card dark:bg-surface-dark hover:bg-surface-bone dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:-translate-y-0.5'
                }`}
              >
                <span className={`whitespace-pre-wrap leading-relaxed ${
                  item.type === 'hanzi' ? 'text-3xl font-display font-extrabold' : 'text-xs font-semibold'
                }`}>
                  {item.content}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Victory Screen */
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-10 text-center shadow-lg animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6 animate-bounce">
              <CheckCircle size={36} />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">Chiến thắng! 🎉</h2>
            <p className="text-sm text-body dark:text-on-dark-mute mt-3 leading-relaxed">
              Tuyệt vời! Bạn đã hoàn thành việc ghép tất cả các cặp thẻ trong thời gian **{formatTime(elapsedTime)}** với tổng số **{moves} lượt thử**.
            </p>
            
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => initializeGame()}
                className="w-full py-3 bg-primary hover:bg-primary-deep text-white font-mono font-bold rounded-full transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              >
                Chơi màn tiếp theo
              </button>
              <button
                onClick={() => navigate(`/decks/${id}`)}
                className="w-full py-3 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold rounded-full transition-colors cursor-pointer"
              >
                Quay lại bộ bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
