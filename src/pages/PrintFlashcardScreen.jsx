import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Printer, 
  BookOpen, 
  Star, 
  CheckSquare, 
  Square, 
  Eye, 
  Grid, 
  Check, 
  Settings,
  Sparkles,
  Info
} from 'lucide-react';
import { deckApi } from '../services/deckApi';
import { flashcardApi } from '../services/flashcardApi';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { useToast } from '../context/ToastContext';
import HoverableText from '../components/common/HoverableText';

// SVG Mi-character grid for writing practice
function PracticeGrid({ char }) {
  return (
    <div className="relative w-16 h-16 border border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center bg-white rounded-xs">
      <svg className="absolute inset-0 w-full h-full text-zinc-200" viewBox="0 0 100 100">
        <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
      </svg>
      <span className="text-4xl font-normal text-zinc-200 select-none font-display hanzi-text">
        {char}
      </span>
    </div>
  );
}

export default function PrintFlashcardScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState([]);
  const [source, setSource] = useState('notebook'); // 'notebook' or 'deck'
  const [selectedDeckId, setSelectedDeckId] = useState('');
  
  const [allCards, setAllCards] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  
  const [layout, setLayout] = useState('a4-8'); // 'a4-8', 'a5-16', 'a6-2'
  const [backType, setBackType] = useState('meaning-pinyin'); // 'meaning-pinyin', 'writing-grid', 'split'
  const [showCardNumber, setShowCardNumber] = useState(true);
  const [showSinoVietnamese, setShowSinoVietnamese] = useState(true);
  
  const [activePreviewTab, setActivePreviewTab] = useState('front'); // 'front' or 'back'

  // Fetch initial decks
  useEffect(() => {
    deckApi.getDecks()
      .then((res) => {
        const deckList = res.data || [];
        setDecks(deckList);
        if (deckList.length > 0) {
          setSelectedDeckId(deckList[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load decks:', err);
      });
  }, []);

  // Fetch cards based on source selection
  useEffect(() => {
    setLoading(true);
    if (source === 'notebook') {
      favoriteWordsApi.getFavorites()
        .then((res) => {
          const list = (res.data || []).map((f) => ({
            id: f.id,
            hanzi: f.hanzi,
            pinyin: f.pinyin || '',
            meaning: f.vi || '',
            hsk: f.hsk || null,
            sinoVietnamese: f.sv || ''
          }));
          setAllCards(list);
          setSelectedCardIds(new Set(list.map(c => c.id)));
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load favorite words:', err);
          toast.showToast('Không thể tải từ vựng từ sổ tay', 'error');
          setLoading(false);
        });
    } else if (source === 'deck' && selectedDeckId) {
      flashcardApi.getByDeck(selectedDeckId)
        .then((res) => {
          const list = (res.data || []).map((c) => ({
            id: c.id,
            hanzi: c.hanzi,
            pinyin: c.pinyin || '',
            meaning: c.meaning || '',
            hsk: c.hsk || null,
            sinoVietnamese: c.sinoVietnamese || ''
          }));
          setAllCards(list);
          setSelectedCardIds(new Set(list.map(c => c.id)));
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load deck cards:', err);
          toast.showToast('Không thể tải danh sách thẻ bài', 'error');
          setLoading(false);
        });
    } else {
      setAllCards([]);
      setSelectedCardIds(new Set());
      setLoading(false);
    }
  }, [source, selectedDeckId]);

  const toggleSelectCard = (id) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedCardIds(new Set(allCards.map(c => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedCardIds(new Set());
  };

  const handlePrint = () => {
    if (selectedCardIds.size === 0) {
      toast.showToast('Hãy chọn ít nhất 1 thẻ để in', 'warning');
      return;
    }
    window.print();
  };

  // Helper to chunk cards into printable sheets based on A4 layouts
  const getCardsPerPage = () => {
    if (layout === 'a5-16') return 16;
    if (layout === 'a6-2') return 2;
    return 8; // a4-8 default
  };

  const selectedCards = allCards.filter(c => selectedCardIds.has(c.id));
  const cardsPerPage = getCardsPerPage();
  const totalPages = Math.ceil(selectedCards.length / cardsPerPage);

  // Split selected cards into sheet pages
  const pages = [];
  for (let i = 0; i < selectedCards.length; i += cardsPerPage) {
    pages.push(selectedCards.slice(i, i + cardsPerPage));
  }

  // Get index mapping for mirrored back faces
  const getMirroredPageCards = (pageCards) => {
    const cols = layout === 'a5-16' ? 4 : layout === 'a6-2' ? 1 : 2;
    const mirrored = [...pageCards];
    
    // Fill the empty cells to make a full grid so mirror swaps match layout locations
    while (mirrored.length < cardsPerPage) {
      mirrored.push(null);
    }

    const result = [];
    for (let row = 0; row < 4; row++) {
      const rowStartIndex = row * cols;
      const rowCards = mirrored.slice(rowStartIndex, rowStartIndex + cols);
      
      if (cols === 2) {
        // Swap [A, B] -> [B, A]
        result.push(rowCards[1], rowCards[0]);
      } else if (cols === 4) {
        // Swap [C0, C1, C2, C3] -> [C3, C2, C1, C0]
        result.push(rowCards[3], rowCards[2], rowCards[1], rowCards[0]);
      } else {
        // cols = 1, keep as is
        result.push(...rowCards);
      }
    }
    return result;
  };

  // Render a single card element
  const renderCard = (card, isBackSide, globalIndex) => {
    if (!card) {
      return <div className="border border-dashed border-zinc-200 dark:border-zinc-800 bg-transparent flex items-center justify-center h-full text-zinc-300 dark:text-zinc-700 italic text-xs">Trống</div>;
    }

    const { hanzi, pinyin, meaning, sinoVietnamese } = card;

    // Determine font sizes based on layout
    const getFrontFontSize = () => {
      if (layout === 'a5-16') return 'text-3xl';
      if (layout === 'a6-2') return 'text-7xl';
      return 'text-5xl'; // standard 8 cards
    };

    if (!isBackSide) {
      // Front face
      return (
        <div className="relative border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-4 h-full text-ink dark:text-on-dark transition-colors">
          {showCardNumber && (
            <div className="absolute top-2 left-2 text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-600">
              #{globalIndex + 1}
            </div>
          )}
          
          <div className={`${getFrontFontSize()} font-display font-bold tracking-tight text-center leading-none text-zinc-900 dark:text-zinc-100 hanzi-text`}>
            {hanzi}
          </div>
        </div>
      );
    } else {
      // Back face
      return (
        <div className="relative border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-3 h-full text-zinc-800 dark:text-zinc-200 transition-colors text-center overflow-hidden">
          {showCardNumber && (
            <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-600">
              #{globalIndex + 1}
            </div>
          )}

          {backType === 'meaning-pinyin' && (
            <div className="flex flex-col items-center justify-center h-full w-full px-1">
              <div className="text-sm font-mono font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-0.5 break-all">
                {pinyin}
              </div>
              {showSinoVietnamese && sinoVietnamese && (
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
                  {sinoVietnamese}
                </div>
              )}
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-snug">
                {meaning}
              </div>
            </div>
          )}

          {backType === 'writing-grid' && (
            <div className="flex items-center justify-center h-full w-full">
              <PracticeGrid char={hanzi} />
            </div>
          )}

          {backType === 'split' && (
            <div className={`flex items-center justify-between w-full h-full px-1 gap-2 ${layout === 'a5-16' ? 'flex-col justify-center' : 'flex-row'}`}>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-xs font-mono font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-0.5 break-all">
                  {pinyin}
                </div>
                {showSinoVietnamese && sinoVietnamese && (
                  <div className="text-[8px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                    {sinoVietnamese}
                  </div>
                )}
                <div className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-tight">
                  {meaning}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center">
                <PracticeGrid char={hanzi} />
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  // CSS Class grids based on selected layout
  const getGridClass = () => {
    if (layout === 'a5-16') return 'grid grid-cols-4 grid-rows-4 h-full w-full';
    if (layout === 'a6-2') return 'grid grid-cols-1 grid-rows-2 h-full w-full';
    return 'grid grid-cols-2 grid-rows-4 h-full w-full'; // standard A4-8
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20">
      
      {/* Header (Hidden when printing) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-surface-bone dark:hover:bg-black border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">
              In thẻ Flashcard PDF
            </h1>
            <p className="text-xs text-mute dark:text-on-dark-mute font-medium mt-0.5">
              Cấu hình lưới trang in A4 hai mặt chuẩn, cắt rời thành thẻ học tiện lợi
            </p>
          </div>
        </div>
        
        <button
          onClick={handlePrint}
          disabled={selectedCardIds.size === 0}
          className="px-5 py-2.5 bg-primary hover:bg-primary-deep text-white font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer size={18} />
          In thẻ / Xuất PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-span-1 lg:grid-cols-10 gap-6 items-start">
        
        {/* Left Control Panel (Hidden when printing) */}
        <div className="lg:col-span-3 space-y-6 no-print">
          
          {/* Data Source Configuration */}
          <div className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              Nguồn từ vựng
            </h3>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSource('notebook')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  source === 'notebook'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark bg-transparent'
                }`}
              >
                <Star size={14} fill={source === 'notebook' ? 'currentColor' : 'none'} />
                Sổ tay lưu
              </button>
              
              <button
                onClick={() => setSource('deck')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  source === 'deck'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark bg-transparent'
                }`}
              >
                <Grid size={14} />
                Bộ bài học
              </button>
            </div>

            {source === 'deck' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-mute uppercase tracking-wider">Chọn Bộ bài</label>
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-hairline dark:border-divider-dark bg-transparent text-ink dark:text-on-dark focus:outline-none focus:border-primary/50"
                >
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.title} ({deck.cardCount} từ)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Layout Configuration */}
          <div className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-2">
              <Settings size={16} className="text-primary" />
              Cài đặt in ấn
            </h3>

            {/* Layout Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-mute uppercase tracking-wider">Kích thước & Bố cục</label>
              <div className="space-y-2">
                {[
                  { value: 'a4-8', label: 'Lưới A4 tiêu chuẩn (8 thẻ/trang)', desc: 'Bố cục 2x4 thẻ, kích thước 105x74.25mm' },
                  { value: 'a5-16', label: 'Lưới A5 nhỏ gọn (16 thẻ/trang)', desc: 'Bố cục 4x4 thẻ, kích thước 52.5x74.25mm' },
                  { value: 'a6-2', label: 'Thẻ A6 kích thước lớn (2 thẻ/trang)', desc: 'Bố cục 1x2 thẻ lớn, kích thước 210x148.5mm' },
                ].map((opt) => (
                  <label 
                    key={opt.value} 
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      layout === opt.value
                        ? 'bg-primary/5 border-primary/40 text-primary'
                        : 'border-hairline dark:border-divider-dark hover:bg-surface-bone/30 dark:hover:bg-black/15'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="layout" 
                      value={opt.value} 
                      checked={layout === opt.value}
                      onChange={() => setLayout(opt.value)}
                      className="mt-0.5 accent-primary" 
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold text-ink dark:text-on-dark">{opt.label}</div>
                      <div className="text-[10px] text-mute font-medium mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Back face Options */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-mute uppercase tracking-wider">Nội dung mặt sau</label>
              <select
                value={backType}
                onChange={(e) => setBackType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-hairline dark:border-divider-dark bg-transparent text-ink dark:text-on-dark focus:outline-none focus:border-primary/50"
              >
                <option value="meaning-pinyin">Chỉ in Nghĩa tiếng Việt & Pinyin</option>
                <option value="writing-grid">Ô viết chữ Hán mờ (米字格) để tập tô</option>
                <option value="split">Split: Nửa giải nghĩa + Nửa ô viết</option>
              </select>
            </div>

            {/* Sub options */}
            <div className="space-y-3 pt-2 border-t border-hairline dark:border-divider-dark">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-body dark:text-on-dark-mute">
                <input 
                  type="checkbox" 
                  checked={showCardNumber} 
                  onChange={(e) => setShowCardNumber(e.target.checked)} 
                  className="accent-primary"
                />
                In số thứ tự thẻ ở góc để đối chiếu
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-body dark:text-on-dark-mute">
                <input 
                  type="checkbox" 
                  checked={showSinoVietnamese} 
                  disabled={backType === 'writing-grid'}
                  onChange={(e) => setShowSinoVietnamese(e.target.checked)} 
                  className="accent-primary disabled:opacity-50"
                />
                In kèm âm Hán Việt (nếu có)
              </label>
            </div>
          </div>

          {/* Cards Selector list */}
          <div className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-2">
                <CheckSquare size={16} className="text-primary" />
                Bộ lọc từ vựng ({selectedCardIds.size}/{allCards.length})
              </h3>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSelectAll}
                className="flex-1 py-1 px-2 border border-hairline dark:border-divider-dark rounded-md text-[10px] font-bold text-body dark:text-on-dark-mute hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
              >
                Chọn tất cả
              </button>
              <button 
                onClick={handleDeselectAll}
                className="flex-1 py-1 px-2 border border-hairline dark:border-divider-dark rounded-md text-[10px] font-bold text-body dark:text-on-dark-mute hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            </div>

            {loading ? (
              <div className="text-center py-6 text-xs text-mute font-medium">Đang tải danh sách từ...</div>
            ) : allCards.length === 0 ? (
              <div className="text-center py-6 text-xs text-mute font-medium">Nguồn trống. Hãy thêm từ vựng trước!</div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-hairline dark:border-divider-dark rounded-lg p-2 bg-surface-bone/30 dark:bg-black/15">
                {allCards.map((card) => {
                  const isSel = selectedCardIds.has(card.id);
                  return (
                    <div 
                      key={card.id}
                      onClick={() => toggleSelectCard(card.id)}
                      className={`flex items-center justify-between p-2 rounded-md transition-all cursor-pointer ${
                        isSel 
                          ? 'bg-primary/5 text-primary border border-primary/20' 
                          : 'border border-transparent hover:bg-surface-bone dark:hover:bg-black text-body dark:text-on-dark-mute'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSel ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} className="text-mute" />}
                        <span className="text-xs font-bold font-display hanzi-text">{card.hanzi}</span>
                        <span className="text-[10px] text-mute font-mono">[{card.pinyin}]</span>
                      </div>
                      {card.hsk && (
                        <span className="text-[8px] bg-primary/10 border border-primary/20 text-primary px-1 rounded font-bold">
                          H{card.hsk}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Panel & Hidden PDF Sheet Renderer */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Top Options & Help Guide (Hidden when printing) */}
          <div className="w-full max-w-[210mm] mb-4 flex justify-between items-center no-print">
            
            {/* View Selection tab */}
            <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-lg p-1 flex gap-1 shadow-sm">
              <button
                onClick={() => setActivePreviewTab('front')}
                className={`py-1.5 px-4 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePreviewTab === 'front'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-mute hover:text-ink dark:hover:text-on-dark'
                }`}
              >
                <Eye size={14} />
                Xem mặt trước (Chữ Hán)
              </button>
              
              <button
                onClick={() => setActivePreviewTab('back')}
                className={`py-1.5 px-4 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePreviewTab === 'back'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-mute hover:text-ink dark:hover:text-on-dark'
                }`}
              >
                <Eye size={14} />
                Xem mặt sau (Dịch nghĩa)
              </button>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] text-mute font-semibold uppercase bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark px-3 py-1.5 rounded-lg shadow-xs">
              <Info size={12} className="text-primary" />
              Chuẩn A4 dọc
            </div>
          </div>

          <div className="w-full text-center text-xs text-mute italic mb-4 no-print flex items-center justify-center gap-1.5 bg-primary/5 p-3 rounded-lg border border-primary/10 max-w-[210mm]">
            <Sparkles size={14} className="text-primary" />
            <span>Mẹo: Giao diện xem trước hiển thị mặt trước/sau riêng lẻ, khi in ấn hệ thống sẽ tự động ghép xen kẽ để in 2 mặt hoàn chỉnh.</span>
          </div>

          {/* Actual Sheet Container */}
          <div className="w-full flex flex-col items-center space-y-8 print-sheets-wrapper overflow-x-auto w-full max-w-full">
            {selectedCardIds.size === 0 ? (
              <div className="w-full max-w-[210mm] aspect-[210/297] border border-dashed border-hairline dark:border-divider-dark rounded-xl bg-surface-card dark:bg-surface-dark flex flex-col items-center justify-center p-8 text-center text-mute dark:text-on-dark-mute no-print shadow-xs">
                <Printer size={48} className="text-mute/30 mb-3 animate-pulse" />
                <h4 className="text-sm font-bold text-ink dark:text-on-dark">Chưa chọn thẻ để xem trước</h4>
                <p className="text-xs max-w-xs mt-1 leading-relaxed">
                  Hãy chọn các từ vựng ở bảng điều khiển bên trái để bắt đầu lập lưới in A4.
                </p>
              </div>
            ) : (
              pages.map((pageCards, pageIndex) => {
                const sheetGlobalStartIndex = pageIndex * cardsPerPage;
                const mirroredCards = getMirroredPageCards(pageCards);

                return (
                  <React.Fragment key={pageIndex}>
                    {/* Front sheet container */}
                    <div 
                      className={`print-sheet print-front-sheet bg-white text-black shadow-lg border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between ${
                        activePreviewTab === 'front' ? 'block' : 'hidden print:block'
                      }`}
                      style={{
                        width: '210mm',
                        height: '297mm',
                        minWidth: '210mm',
                        minHeight: '297mm',
                        padding: '10mm', // standard printing printable margin
                        pageBreakAfter: 'always',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div className={getGridClass()}>
                        {pageCards.map((card, idx) => (
                          <React.Fragment key={idx}>
                            {renderCard(card, false, sheetGlobalStartIndex + idx)}
                          </React.Fragment>
                        ))}
                        {/* Fill the rest of grid if page has less than cardsPerPage */}
                        {pageCards.length < cardsPerPage && 
                          Array.from({ length: cardsPerPage - pageCards.length }).map((_, idx) => (
                            <React.Fragment key={`empty-${idx}`}>
                              {renderCard(null, false, 0)}
                            </React.Fragment>
                          ))
                        }
                      </div>
                    </div>

                    {/* Back sheet container (mirrored) */}
                    <div 
                      className={`print-sheet print-back-sheet bg-white text-black shadow-lg border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between ${
                        activePreviewTab === 'back' ? 'block' : 'hidden print:block'
                      }`}
                      style={{
                        width: '210mm',
                        height: '297mm',
                        minWidth: '210mm',
                        minHeight: '297mm',
                        padding: '10mm', // standard printing printable margin
                        pageBreakAfter: 'always',
                        boxSizing: 'border-box',
                        transform: 'rotateY(0deg)' // prevents rendering mirror text, we mirror columns only
                      }}
                    >
                      <div className={getGridClass()}>
                        {mirroredCards.map((card, idx) => {
                          if (!card) {
                            return (
                              <React.Fragment key={`empty-back-${idx}`}>
                                {renderCard(null, true, 0)}
                              </React.Fragment>
                            );
                          }
                          
                          // Find card's original global index in selected list for correct label matching
                          const origIndexInSelectedList = selectedCards.findIndex(c => c.id === card.id);

                          return (
                            <React.Fragment key={card.id}>
                              {renderCard(card, true, origIndexInSelectedList)}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* Global CSS overrides inside component to ensure printable A4 grid scales on desktop screen preview */}
      <style>{`
        @media screen {
          .print-sheets-wrapper {
            transform-origin: top center;
          }
          .print-sheet {
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
            border-radius: 4px;
            margin-bottom: 2rem;
          }
        }
        @media print {
          /* Remove print headers, footers and page margins */
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
          
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Force exact print layouts and hide scrollbars */
          .print-sheet {
            width: 210mm !important;
            height: 297mm !important;
            padding: 10mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always !important;
            display: block !important;
            background: white !important;
            box-sizing: border-box !important;
          }

          /* Force nested elements to show colors and borders */
          .border-dashed {
            border-style: dashed !important;
            border-color: #d4d4d8 !important; /* zinc-300 */
          }
          .text-primary {
            color: #0f5257 !important; /* brand primary color */
          }
          
          /* Hide dark mode styles for white printouts */
          .dark .print-sheet {
            background: white !important;
            color: black !important;
          }
          
          .dark .border-dashed {
            border-color: #d4d4d8 !important;
          }
        }
      `}</style>

    </div>
  );
}
