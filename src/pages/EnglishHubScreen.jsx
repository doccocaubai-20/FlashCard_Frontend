import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Plus, 
  Trash2, 
  Volume2, 
  Check, 
  Send,
  HelpCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Languages,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { deckApi } from '../services/deckApi';
import { flashcardApi } from '../services/flashcardApi';
import { chatApi } from '../services/chatApi';
import { speakChinese } from '../utils/tts';
import { englishGrammarData } from '../data/englishGrammarData';
import { aiFlashcardApi } from '../services/aiFlashcardApi';

export default function EnglishHubScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('vocab'); // vocab, grammar, unscramble, freestyle
  
  // Tab 1: Decks and Flashcards states
  const [englishDecks, setEnglishDecks] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  
  // Modals / Form toggles
  const [showAddDeck, setShowAddDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardWord, setNewCardWord] = useState('');
  const [newCardIpa, setNewCardIpa] = useState('');
  const [newCardMeaning, setNewCardMeaning] = useState('');
  const [newCardExEn, setNewCardExEn] = useState('');
  const [newCardExVi, setNewCardExVi] = useState('');
  
  // Tab 2: Grammar state
  const [searchGrammar, setSearchGrammar] = useState('');
  const [showSaveGrammarModal, setShowSaveGrammarModal] = useState(false);
  const [selectedGrammarToSave, setSelectedGrammarToSave] = useState(null);
  const [targetDeckForGrammar, setTargetDeckForGrammar] = useState('');

  // Tab 3: Unscramble states
  const [unscrambleSentences, setUnscrambleSentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [unscrambleResult, setUnscrambleResult] = useState(null); // 'success', 'error', null

  // Tab 4: Freestyle writing states
  const [freestyleText, setFreestyleText] = useState('');
  const [selectedFreestyleGrammar, setSelectedFreestyleGrammar] = useState('Tự do');
  const [aiChecking, setAiChecking] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  // AI generation states
  const [showAiGenerate, setShowAiGenerate] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCards, setAiCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [aiSaving, setAiSaving] = useState(false);

  // Fetch English Decks
  const fetchEnglishDecks = async () => {
    setLoadingDecks(true);
    try {
      const res = await deckApi.getDecks();
      // Filter decks with language EN
      const filtered = (res.data || []).filter(d => d.language === 'EN');
      setEnglishDecks(filtered);
    } catch (err) {
      console.error('Failed to load decks:', err);
      showToast('Không thể tải danh sách bộ thẻ.', 'error');
    } finally {
      setLoadingDecks(false);
    }
  };

  useEffect(() => {
    fetchEnglishDecks();
  }, []);

  // Fetch cards when selectedDeck changes
  useEffect(() => {
    if (selectedDeck) {
      setLoadingCards(true);
      flashcardApi.getByDeck(selectedDeck.id)
        .then(res => {
          setDeckCards(res.data || []);
        })
        .catch(err => {
          console.error(err);
          showToast('Không thể tải thẻ từ vựng.', 'error');
        })
        .finally(() => {
          setLoadingCards(false);
        });
    } else {
      setDeckCards([]);
    }
  }, [selectedDeck]);

  // Tab 3: Prepare sentence list for unscrambling
  useEffect(() => {
    if (activeTab === 'unscramble') {
      prepareUnscrambleGame();
    }
  }, [activeTab, englishDecks, selectedDeck]);

  const prepareUnscrambleGame = async () => {
    let sourceSentences = [];
    
    // 1. Gather examples from English decks
    try {
      const res = await deckApi.getDecks();
      const enDecks = (res.data || []).filter(d => d.language === 'EN');
      for (const d of enDecks) {
        const cardsRes = await flashcardApi.getByDeck(d.id);
        const cards = cardsRes.data || [];
        for (const card of cards) {
          if (card.exampleHanzi && card.exampleMeaning) {
            sourceSentences.push({
              en: card.exampleHanzi.trim(),
              vi: card.exampleMeaning.trim(),
              source: `Bộ thẻ: ${d.title}`
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fallback to Grammar patterns if no saved example sentences exist
    if (sourceSentences.length === 0) {
      englishGrammarData.forEach(pattern => {
        pattern.examples.forEach(ex => {
          sourceSentences.push({
            en: ex.en.trim(),
            vi: ex.vi.trim(),
            source: `Ngữ pháp: ${pattern.title}`
          });
        });
      });
    }

    setUnscrambleSentences(sourceSentences);
    setCurrentSentenceIndex(0);
    initUnscrambleSentence(0, sourceSentences);
  };

  const initUnscrambleSentence = (index, list = unscrambleSentences) => {
    if (!list || list.length === 0 || !list[index]) return;
    
    const sentenceObj = list[index];
    // Clean and split words
    // Match words and contractions or punctuation as separate tokens if needed
    const words = sentenceObj.en
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "") // remove punctuation for simplicity
      .split(/\s+/)
      .filter(Boolean);
      
    // Shuffle words
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setShuffledWords(shuffled);
    setSelectedWords([]);
    setUnscrambleResult(null);
  };

  const handleWordClick = (word, index) => {
    if (unscrambleResult) return;
    setSelectedWords([...selectedWords, { word, originalIndex: index }]);
    setShuffledWords(shuffledWords.filter((_, idx) => idx !== index));
  };

  const handleRemoveWord = (wordObj, index) => {
    if (unscrambleResult) return;
    setSelectedWords(selectedWords.filter((_, idx) => idx !== index));
    setShuffledWords([...shuffledWords, wordObj.word]);
  };

  const handleCheckUnscramble = () => {
    const current = unscrambleSentences[currentSentenceIndex];
    if (!current) return;
    
    const submittedStr = selectedWords.map(w => w.word).join(" ").toLowerCase();
    const correctStr = current.en
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (submittedStr === correctStr) {
      setUnscrambleResult('success');
      showToast('Chính xác! Cố gắng phát huy nhé.', 'success');
      // Speak the correct sentence
      speakChinese(current.en, 'en-US');
    } else {
      setUnscrambleResult('error');
      showToast('Chưa chính xác! Thử lại xem sao nhé.', 'error');
    }
  };

  const handleNextUnscramble = () => {
    const nextIndex = (currentSentenceIndex + 1) % unscrambleSentences.length;
    setCurrentSentenceIndex(nextIndex);
    initUnscrambleSentence(nextIndex);
  };

  // Add English Deck handler
  const handleAddDeck = async (e) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) {
      showToast('Vui lòng nhập tên bộ thẻ.', 'warning');
      return;
    }
    
    try {
      await deckApi.createDeck({
        title: newDeckTitle,
        description: newDeckDesc,
        language: 'EN'
      });
      showToast('Đã tạo bộ thẻ tiếng Anh thành công!', 'success');
      setNewDeckTitle('');
      setNewDeckDesc('');
      setShowAddDeck(false);
      fetchEnglishDecks();
    } catch (err) {
      console.error(err);
      showToast('Tạo bộ thẻ thất bại.', 'error');
    }
  };

  // AI Flashcard Generation Handlers
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      showToast('Vui lòng nhập chủ đề!', 'warning');
      return;
    }
    setAiGenerating(true);
    setAiCards([]);
    setSelectedCards(new Set());
    try {
      const existingWords = deckCards.map(c => c.hanzi);
      const res = await aiFlashcardApi.generate(
        aiTopic.trim(),
        aiCount,
        null,
        existingWords,
        'EN'
      );
      const cards = res.data?.cards || res.data || [];
      setAiCards(cards);
      setSelectedCards(new Set(cards.map((_, i) => i)));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Không thể tạo từ vựng bằng AI.', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleCardSelection = (idx) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCards.size === aiCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(aiCards.map((_, i) => i)));
    }
  };

  const handleAiSave = async () => {
    if (selectedCards.size === 0) return;
    setAiSaving(true);
    try {
      const payload = Array.from(selectedCards).map(idx => {
        const card = aiCards[idx];
        return {
          deckId: selectedDeck.id,
          hanzi: card.hanzi,
          pinyin: card.pinyin,
          meaning: card.meaning,
          exampleHanzi: card.exampleHanzi || null,
          examplePinyin: card.examplePinyin || null,
          exampleMeaning: card.exampleMeaning || null,
        };
      });
      const res = await flashcardApi.bulkImport(payload);
      setDeckCards(res.data || []);
      showToast(`Đã thêm thành công ${payload.length} từ vựng từ AI!`, 'success');
      setShowAiGenerate(false);
      setAiCards([]);
      setAiTopic('');
    } catch (err) {
      console.error(err);
      showToast('Lưu từ vựng thất bại.', 'error');
    } finally {
      setAiSaving(false);
    }
  };

  // Add Flashcard handler
  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCardWord.trim() || !newCardMeaning.trim()) {
      showToast('Vui lòng điền đủ từ vựng và nghĩa tiếng Việt.', 'warning');
      return;
    }
    
    try {
      await flashcardApi.create({
        deckId: selectedDeck.id,
        hanzi: newCardWord.trim(),
        pinyin: newCardIpa.trim(),
        meaning: newCardMeaning.trim(),
        exampleHanzi: newCardExEn.trim() || undefined,
        exampleMeaning: newCardExVi.trim() || undefined
      });
      showToast('Đã thêm thẻ từ vựng mới.', 'success');
      setNewCardWord('');
      setNewCardIpa('');
      setNewCardMeaning('');
      setNewCardExEn('');
      setNewCardExVi('');
      setShowAddCard(false);
      
      // Reload cards
      const res = await flashcardApi.getByDeck(selectedDeck.id);
      setDeckCards(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Thêm thẻ thất bại.', 'error');
    }
  };

  const handleDeleteDeck = async (deckId, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa bộ thẻ này? Tất cả các từ vựng bên trong sẽ bị mất!')) return;
    
    try {
      await deckApi.deleteDeck(deckId);
      showToast('Đã xóa bộ thẻ thành công.', 'success');
      if (selectedDeck && selectedDeck.id === deckId) {
        setSelectedDeck(null);
      }
      fetchEnglishDecks();
    } catch (err) {
      console.error(err);
      showToast('Không thể xóa bộ thẻ.', 'error');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Bạn muốn xóa thẻ từ vựng này?')) return;
    
    try {
      await flashcardApi.delete(cardId);
      showToast('Đã xóa thẻ.', 'success');
      setDeckCards(deckCards.filter(c => c.id !== cardId));
    } catch (err) {
      console.error(err);
      showToast('Không thể xóa thẻ.', 'error');
    }
  };

  // Tab 2: Save Grammar Pattern as Card
  const openSaveGrammarModal = (pattern) => {
    if (englishDecks.length === 0) {
      showToast('Vui lòng tạo ít nhất 1 bộ thẻ tiếng Anh trước khi lưu!', 'warning');
      return;
    }
    setSelectedGrammarToSave(pattern);
    setTargetDeckForGrammar(englishDecks[0].id.toString());
    setShowSaveGrammarModal(true);
  };

  const handleSaveGrammarAsCard = async () => {
    if (!selectedGrammarToSave || !targetDeckForGrammar) return;

    try {
      await flashcardApi.create({
        deckId: Number(targetDeckForGrammar),
        hanzi: selectedGrammarToSave.title,
        pinyin: selectedGrammarToSave.formula,
        meaning: selectedGrammarToSave.meaning,
        exampleHanzi: selectedGrammarToSave.examples[0].en,
        exampleMeaning: selectedGrammarToSave.examples[0].vi
      });
      showToast('Đã lưu cấu trúc ngữ pháp thành thẻ ghi nhớ thành công!', 'success');
      setShowSaveGrammarModal(false);
    } catch (err) {
      console.error(err);
      showToast('Lưu cấu trúc thất bại.', 'error');
    }
  };

  // Tab 4: AI Check Freestyle Sentence
  const handleCheckFreestyle = async () => {
    if (!freestyleText.trim()) {
      showToast('Vui lòng nhập câu tiếng Anh cần kiểm tra.', 'warning');
      return;
    }

    setAiChecking(true);
    setAiFeedback('');
    
    const prompt = `Bạn là giáo viên tiếng Anh AI của ChongZi. Hãy giúp người dùng kiểm tra câu tiếng Anh sau: "${freestyleText}"
Cấu trúc ngữ pháp họ muốn thực hành áp dụng (nếu có): ${selectedFreestyleGrammar}.
Hãy phản hồi bằng tiếng Việt thân thiện, rõ ràng, chi tiết, định dạng Markdown đẹp, bao gồm:
1. Đánh giá tính chính xác ngữ pháp (Đúng/Sai).
2. Nhận xét về cách dùng từ và độ tự nhiên trong văn phong (Naturalness).
3. Đưa ra câu viết lại tối ưu nhất (nếu câu của họ chưa chuẩn hoặc chưa tự nhiên).
4. Giải thích ngắn gọn các từ vựng hoặc cấu trúc chính được sử dụng.`;

    try {
      const res = await chatApi.sendMessage(prompt);
      setAiFeedback(res.data?.reply || res.data || 'Không nhận được phản hồi từ AI.');
    } catch (err) {
      console.error(err);
      showToast('Không thể kết nối với AI. Vui lòng thử lại.', 'error');
      setAiFeedback('Lỗi kết nối AI. Vui lòng thử lại sau.');
    } finally {
      setAiChecking(false);
    }
  };

  // Filter grammar based on search query
  const filteredGrammar = englishGrammarData.filter(g => 
    g.title.toLowerCase().includes(searchGrammar.toLowerCase()) ||
    g.formula.toLowerCase().includes(searchGrammar.toLowerCase()) ||
    g.meaning.toLowerCase().includes(searchGrammar.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reference-hub')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-black text-mute cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Languages size={22} className="text-primary animate-pulse" />
              Góc Tiếng Anh
            </h1>
            <p className="text-xs text-mute mt-0.5">Sổ tay từ vựng Flashcard, kho ngữ pháp thông dụng và luyện tập đặt câu.</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-hairline dark:border-divider-dark">
        <button
          onClick={() => { setActiveTab('vocab'); setSelectedDeck(null); }}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'vocab' ? 'border-primary text-primary' : 'border-transparent text-mute hover:text-ink dark:hover:text-on-dark'
          }`}
        >
          🗂️ Từ vựng & Flashcard
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'grammar' ? 'border-primary text-primary' : 'border-transparent text-mute hover:text-ink dark:hover:text-on-dark'
          }`}
        >
          📝 Ngữ pháp & Cấu trúc
        </button>
        <button
          onClick={() => setActiveTab('unscramble')}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'unscramble' ? 'border-primary text-primary' : 'border-transparent text-mute hover:text-ink dark:hover:text-on-dark'
          }`}
        >
          🧩 Luyện ghép câu
        </button>
        <button
          onClick={() => setActiveTab('freestyle')}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'freestyle' ? 'border-primary text-primary' : 'border-transparent text-mute hover:text-ink dark:hover:text-on-dark'
          }`}
        >
          ✍️ Viết tự do (AI Check)
        </button>
      </div>

      {/* Tab Content 1: Vocab and Flashcards */}
      {activeTab === 'vocab' && (
        <div className="space-y-6">
          {!selectedDeck ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-mono font-bold text-ink dark:text-on-dark uppercase tracking-wider">
                  Các bộ bài Tiếng Anh của bạn ({englishDecks.length})
                </h3>
                <button
                  onClick={() => setShowAddDeck(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>Bộ thẻ mới</span>
                </button>
              </div>

              {showAddDeck && (
                <form onSubmit={handleAddDeck} className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl space-y-4 text-left shadow-sm">
                  <h4 className="text-xs font-mono font-bold text-ink dark:text-on-dark uppercase">Tạo bộ bài Tiếng Anh mới</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Tên bộ bài</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Oxford 3000, English Daily..."
                        value={newDeckTitle}
                        onChange={(e) => setNewDeckTitle(e.target.value)}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Mô tả bộ bài</label>
                      <input
                        type="text"
                        placeholder="Mô tả mục tiêu học tập của bộ bài..."
                        value={newDeckDesc}
                        onChange={(e) => setNewDeckDesc(e.target.value)}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDeck(false)}
                      className="px-3.5 py-1.5 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-xs font-mono font-bold rounded-lg cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-primary text-white text-xs font-mono font-bold rounded-lg cursor-pointer"
                    >
                      Lưu lại
                    </button>
                  </div>
                </form>
              )}

              {loadingDecks ? (
                <div className="text-center py-12 text-xs text-mute italic animate-pulse">Đang tải danh sách bộ thẻ...</div>
              ) : englishDecks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {englishDecks.map((deck) => (
                    <div
                      key={deck.id}
                      onClick={() => setSelectedDeck(deck)}
                      className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl flex flex-col justify-between hover:border-primary/40 cursor-pointer shadow-xs transition-colors text-left group"
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-display font-extrabold text-base text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                            {deck.title}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDeck(deck.id, e)}
                            className="text-mute hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa bộ thẻ"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-xs text-mute line-clamp-2">{deck.description || 'Không có mô tả.'}</p>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-hairline dark:border-divider-dark mt-4 pt-3 text-[10px] font-mono font-bold text-mute">
                        <span>🏷️ {deck.cardCount || 0} TỪ VỰNG</span>
                        <span className="text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          MỞ BỘ THẺ <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-bone/50 dark:bg-black/10 border border-dashed border-hairline dark:border-divider-dark rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-3">
                  <Languages size={40} className="text-mute stroke-1" />
                  <p className="text-xs text-mute leading-relaxed font-sans max-w-xs">
                    Bạn chưa có bộ thẻ tiếng Anh nào. Hãy bấm <strong>Bộ thẻ mới</strong> để bắt đầu tạo không gian học từ vựng cho riêng mình nhé!
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Deck detail inside English Hub
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-3">
                <button
                  onClick={() => setSelectedDeck(null)}
                  className="flex items-center gap-1 text-xs font-mono font-bold text-mute hover:text-ink dark:hover:text-on-dark cursor-pointer"
                >
                  <ArrowLeft size={12} />
                  <span>Quay lại danh sách</span>
                </button>
                <div className="flex gap-2">
                  {deckCards.length > 0 && (
                    <button
                      onClick={() => navigate(`/study?deckId=${selectedDeck.id}`)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white text-xs font-mono font-bold rounded-lg cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Học Flashcard</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setAiTopic('');
                      setAiCards([]);
                      setSelectedCards(new Set());
                      setShowAiGenerate(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold rounded-lg cursor-pointer hover:bg-purple-500/20"
                  >
                    <Sparkles size={12} />
                    <span>Tạo bằng AI</span>
                  </button>
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold rounded-lg cursor-pointer hover:bg-primary/20"
                  >
                    <Plus size={14} />
                    <span>Thêm từ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-xl font-extrabold text-ink dark:text-on-dark">{selectedDeck.title}</h3>
                <p className="text-xs text-mute">{selectedDeck.description || 'Không có mô tả.'}</p>
              </div>

              {showAddCard && (
                <form onSubmit={handleAddCard} className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-6 rounded-xl space-y-4 text-left shadow-sm">
                  <h4 className="text-xs font-mono font-bold text-ink dark:text-on-dark uppercase">Thêm từ vựng tiếng Anh mới</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Từ vựng (English)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Understand"
                        value={newCardWord}
                        onChange={(e) => setNewCardWord(e.target.value)}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Phiên âm IPA (Tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: /ˌʌndərˈstænd/"
                        value={newCardIpa}
                        onChange={(e) => setNewCardIpa(e.target.value)}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Giải nghĩa tiếng Việt</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Hiểu, hiểu biết..."
                        value={newCardMeaning}
                        onChange={(e) => setNewCardMeaning(e.target.value)}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Câu ví dụ Tiếng Anh (Tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Do you understand the lesson?"
                        value={newCardExEn}
                        onChange={(e) => setNewCardExEn(e.target.value)}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Nghĩa câu ví dụ (Tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Bạn có hiểu bài học không?"
                        value={newCardExVi}
                        onChange={(e) => setNewCardExVi(e.target.value)}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCard(false)}
                      className="px-3.5 py-1.5 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-xs font-mono font-bold rounded-lg cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-primary text-white text-xs font-mono font-bold rounded-lg cursor-pointer"
                    >
                      Thêm thẻ
                    </button>
                  </div>
                </form>
              )}

              {loadingCards ? (
                <div className="text-center py-12 text-xs text-mute italic animate-pulse">Đang tải thẻ từ vựng...</div>
              ) : deckCards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deckCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-4 rounded-xl flex gap-3 shadow-xs justify-between group hover:border-primary/30 transition-colors"
                    >
                      <div className="flex gap-3 min-w-0">
                        <button
                          onClick={() => speakChinese(card.hanzi, 'en-US')}
                          className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 shrink-0 cursor-pointer"
                          title="Nghe phát âm"
                        >
                          <Volume2 size={14} />
                        </button>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <span className="font-display font-extrabold text-base text-ink dark:text-on-dark">{card.hanzi}</span>
                            {card.pinyin && (
                              <span className="text-xs font-mono font-semibold text-primary">{card.pinyin}</span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-body dark:text-on-dark-mute">{card.meaning}</p>
                          {card.exampleHanzi && (
                            <div className="border-l-2 border-primary/30 pl-2 mt-1 py-0.5 space-y-0.5">
                              <p className="text-[10px] font-medium text-mute line-clamp-2 italic">{card.exampleHanzi}</p>
                              {card.exampleMeaning && (
                                <p className="text-[9px] text-mute/80 line-clamp-1">{card.exampleMeaning}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-mute hover:text-red-500 p-1 self-start opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa thẻ"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-bone/50 dark:bg-black/10 border border-dashed border-hairline dark:border-divider-dark rounded-xl p-10 text-center text-mute text-xs">
                  Chưa có thẻ từ vựng nào trong bộ thẻ này. Hãy bấm <strong>Thêm từ</strong> ở phía trên để bắt đầu thêm từ mới!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Grammar and Structures */}
      {activeTab === 'grammar' && (
        <div className="space-y-4">
          <div className="flex items-center border border-hairline dark:border-white/10 rounded-xl bg-surface-card dark:bg-surface-dark px-3 py-1.5 max-w-md">
            <span className="text-mute text-xs select-none mr-2">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm công thức ngữ pháp..."
              value={searchGrammar}
              onChange={(e) => setSearchGrammar(e.target.value)}
              className="w-full bg-transparent text-xs text-ink dark:text-on-dark focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {filteredGrammar.length > 0 ? (
              filteredGrammar.map((pattern) => (
                <div 
                  key={pattern.id}
                  className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark p-5 rounded-xl shadow-xs space-y-3 hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-display font-extrabold text-sm text-ink dark:text-on-dark leading-snug">
                        {pattern.title}
                      </h4>
                      <button
                        onClick={() => openSaveGrammarModal(pattern)}
                        className="shrink-0 text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                        title="Lưu cấu trúc này thành thẻ ghi nhớ Flashcard"
                      >
                        + Lưu thẻ
                      </button>
                    </div>

                    <div className="bg-surface-bone dark:bg-black/30 border border-hairline dark:border-divider-dark rounded-md px-3 py-2 text-xs font-mono font-bold text-primary text-center">
                      {pattern.formula}
                    </div>

                    <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-semibold">
                      {pattern.meaning}
                    </p>
                    <p className="text-[10px] text-mute italic leading-relaxed">
                      💡 {pattern.usage}
                    </p>
                  </div>

                  <div className="border-t border-hairline dark:border-divider-dark pt-3 mt-2 space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase text-mute">Ví dụ mẫu:</div>
                    {pattern.examples.map((ex, exIdx) => (
                      <div key={exIdx} className="space-y-0.5 bg-surface-bone/30 dark:bg-black/10 p-2 rounded border border-hairline dark:border-divider-dark/40">
                        <div className="flex justify-between items-center gap-1">
                          <p className="text-xs font-medium text-ink dark:text-on-dark italic pr-6 leading-normal">{ex.en}</p>
                          <button
                            onClick={() => speakChinese(ex.en, 'en-US')}
                            className="text-mute hover:text-primary transition-colors cursor-pointer text-xs shrink-0"
                            title="Nghe câu ví dụ"
                          >
                            🔊
                          </button>
                        </div>
                        <p className="text-[10px] text-mute leading-normal">{ex.vi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 text-center py-12 text-xs text-mute italic">Không tìm thấy công thức ngữ pháp nào khớp với từ khóa tìm kiếm.</div>
            )}
          </div>

          {/* Save Grammar Modal */}
          {showSaveGrammarModal && selectedGrammarToSave && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="max-w-md w-full bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl p-6 shadow-xl text-left space-y-4">
                <h4 className="text-sm font-mono font-bold text-ink dark:text-on-dark uppercase">Lưu ngữ pháp thành Flashcard</h4>
                <p className="text-xs text-mute leading-relaxed">
                  Hệ thống sẽ chuyển công thức <strong>{selectedGrammarToSave.title}</strong> thành một thẻ ghi nhớ giúp bạn ôn tập tự động.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-mute">Chọn bộ bài Tiếng Anh lưu trữ</label>
                  <select
                    value={targetDeckForGrammar}
                    onChange={(e) => setTargetDeckForGrammar(e.target.value)}
                    className="w-full px-3 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary cursor-pointer"
                  >
                    {englishDecks.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSaveGrammarModal(false)}
                    className="px-4 py-1.5 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-xs font-mono font-bold rounded-lg cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSaveGrammarAsCard}
                    className="px-4 py-1.5 bg-primary text-white text-xs font-mono font-bold rounded-lg cursor-pointer"
                  >
                    Lưu thẻ ngay
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab Content 3: Sentence Unscrambler */}
      {activeTab === 'unscramble' && (
        <div className="max-w-xl mx-auto bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-white/5 rounded-xl p-6 shadow-sm text-center space-y-6">
          <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-3">
            <span className="text-[10px] font-mono font-bold text-mute uppercase tracking-wider">
              🎮 Luyện ghép câu (Sentence Builder)
            </span>
            {unscrambleSentences.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-primary">
                CÂU {currentSentenceIndex + 1} / {unscrambleSentences.length}
              </span>
            )}
          </div>

          {unscrambleSentences.length > 0 ? (
            <div className="space-y-6">
              {/* Question: Vietnamese Translation */}
              <div className="space-y-2">
                <p className="text-xs font-mono font-bold text-mute uppercase tracking-widest">Hãy dịch câu này:</p>
                <h3 className="font-display text-lg font-extrabold text-ink dark:text-on-dark leading-relaxed px-4">
                  "{unscrambleSentences[currentSentenceIndex].vi}"
                </h3>
                <span className="inline-block text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase">
                  {unscrambleSentences[currentSentenceIndex].source}
                </span>
              </div>

              {/* Answer Area (Words built by user) */}
              <div className="min-h-[70px] bg-surface-bone/50 dark:bg-black/20 border border-hairline dark:border-divider-dark/40 rounded-xl p-4 flex flex-wrap gap-2 items-center justify-center transition-all duration-300">
                {selectedWords.length > 0 ? (
                  selectedWords.map((wordObj, index) => (
                    <button
                      key={index}
                      onClick={() => handleRemoveWord(wordObj, index)}
                      className="px-3 py-1.5 bg-primary text-white border border-transparent text-xs font-mono font-bold rounded-lg cursor-pointer hover:bg-red-500 hover:text-white transition-colors animate-fade-in shadow-xs"
                      title="Bấm để gỡ từ"
                    >
                      {wordObj.word}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-mute italic select-none">Nhấp vào các từ ở dưới để bắt đầu ghép câu...</span>
                )}
              </div>

              {/* Choices (Shuffled Words pool) */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-mute uppercase tracking-wider text-left">Từ khóa xáo trộn:</p>
                <div className="flex flex-wrap gap-2 items-center justify-center py-2 min-h-[50px]">
                  {shuffledWords.length > 0 ? (
                    shuffledWords.map((word, index) => (
                      <button
                        key={index}
                        onClick={() => handleWordClick(word, index)}
                        className="px-3 py-1.5 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-xs font-mono font-bold rounded-lg cursor-pointer hover:border-primary/50 transition-all select-none shadow-xs"
                      >
                        {word}
                      </button>
                    ))
                  ) : selectedWords.length > 0 ? (
                    <span className="text-[10px] text-mute italic">Đã sử dụng tất cả từ khóa. Nhấn nút kiểm tra kết quả bên dưới!</span>
                  ) : null}
                </div>
              </div>

              {/* Result state notifications */}
              {unscrambleResult === 'success' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg p-3 flex items-center justify-center gap-2">
                  <Check size={16} />
                  <span>Chính xác hoàn hảo! Âm thanh đọc mẫu đã phát.</span>
                </div>
              )}
              {unscrambleResult === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg p-3 flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  <span>Thứ tự các từ chưa đúng. Bạn hãy kiểm tra lại nhé!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => initUnscrambleSentence(currentSentenceIndex)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-xs font-mono font-bold rounded-full cursor-pointer transition-colors"
                  title="Xếp lại từ đầu"
                >
                  <RotateCcw size={12} />
                  <span>Xếp lại</span>
                </button>
                
                {unscrambleResult !== 'success' ? (
                  <button
                    onClick={handleCheckUnscramble}
                    disabled={selectedWords.length === 0}
                    className="px-5 py-2 bg-primary text-white disabled:opacity-50 text-xs font-mono font-bold rounded-full cursor-pointer hover:bg-primary-deep transition-all shadow-sm"
                  >
                    Kiểm tra kết quả
                  </button>
                ) : (
                  <button
                    onClick={handleNextUnscramble}
                    className="flex items-center gap-1 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-mono font-bold rounded-full cursor-pointer transition-all shadow-sm"
                  >
                    <span>Câu tiếp theo</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-mute py-8">Đang khởi tạo trò chơi ghép câu...</div>
          )}
        </div>
      )}

      {/* Tab Content 4: Freestyle Writing and AI Checker */}
      {activeTab === 'freestyle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Panel: Text editor (7/12) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-white/5 p-6 rounded-xl shadow-sm text-left space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-xs font-mono font-bold text-mute uppercase tracking-wider">✍️ Luyện viết câu tự do</h3>
              <p className="text-[11px] text-mute">Gõ câu tiếng Anh bất kỳ, AI sẽ nhận xét ngữ pháp và văn phong trực tiếp bằng tiếng Việt.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-mute">Chọn cấu trúc muốn thực hành (Tùy chọn)</label>
              <select
                value={selectedFreestyleGrammar}
                onChange={(e) => setSelectedFreestyleGrammar(e.target.value)}
                className="w-full px-3 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary cursor-pointer"
              >
                <option value="Tự do">-- Viết tự do (Không theo cấu trúc cố định) --</option>
                {englishGrammarData.map(g => (
                  <option key={g.id} value={g.title}>{g.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-[10px] font-mono font-bold uppercase text-mute">Nội dung câu của bạn</label>
              <textarea
                placeholder="Ví dụ: I used to went fishing when I am child..."
                value={freestyleText}
                onChange={(e) => setFreestyleText(e.target.value)}
                className="w-full p-4 border border-hairline dark:border-white/10 rounded-xl bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary resize-none flex-1 min-h-[140px] font-mono"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCheckFreestyle}
                disabled={aiChecking || !freestyleText.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white disabled:opacity-50 text-xs font-mono font-bold rounded-full cursor-pointer hover:bg-primary-deep transition-all active:scale-[0.98] shadow-sm"
              >
                {aiChecking ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    <span>Gửi AI kiểm tra</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: AI Response (5/12) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-white/5 p-5 rounded-xl shadow-sm text-left">
            <div className="space-y-4 h-full flex flex-col">
              <h3 className="text-xs font-mono font-bold text-mute uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-2.5">
                <Sparkles size={14} className="text-primary" />
                Kết quả phân tích từ AI
              </h3>

              <div className="flex-1 overflow-y-auto max-h-[340px] text-xs text-body dark:text-on-dark-mute leading-relaxed space-y-3 font-sans pr-1">
                {aiFeedback ? (
                  <div className="whitespace-pre-wrap font-sans bg-surface-bone/35 dark:bg-black/20 border border-hairline dark:border-divider-dark rounded-xl p-4">
                    {aiFeedback}
                  </div>
                ) : aiChecking ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-mute italic">
                    <span className="animate-pulse">AI đang phân tích câu viết, kiểm tra lỗi ngữ pháp và so sánh từ vựng...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-mute italic">
                    <HelpCircle size={32} className="stroke-1 text-mute/60 mb-2" />
                    <p className="max-w-[200px] leading-relaxed">
                      Nhập câu tiếng Anh ở khung bên trái và ấn gửi để xem phân tích chi tiết.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* AI Generate Modal */}
      {showAiGenerate && selectedDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-2xl w-full bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-3">
              <h3 className="text-sm font-mono font-bold text-ink dark:text-on-dark uppercase flex items-center gap-1.5">
                <Sparkles size={16} className="text-purple-500" />
                Tạo từ vựng bằng AI (Tiếng Anh)
              </h3>
              <button
                onClick={() => setShowAiGenerate(false)}
                className="text-mute hover:text-ink dark:hover:text-on-dark text-lg"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 space-y-1.5">
                <p className="text-xs text-purple-700 dark:text-purple-400 font-semibold">
                  💡 Nhập chủ đề bất kỳ bằng Tiếng Việt hoặc Tiếng Anh
                </p>
                <p className="text-[10px] text-mute leading-relaxed">
                  DeepSeek AI sẽ phân tích chủ đề và tạo ra danh sách từ vựng thông dụng đi kèm phiên âm chuẩn IPA, dịch nghĩa tiếng Việt và câu ví dụ song ngữ.
                </p>
              </div>

              {aiCards.length === 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Chủ đề từ vựng</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Job Interview, Travel, Airport, Cooking..."
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-mute">Số từ cần tạo</label>
                      <select
                        value={aiCount}
                        onChange={(e) => setAiCount(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border border-hairline dark:border-white/10 rounded-lg bg-surface-card dark:bg-surface-dark text-xs text-ink dark:text-on-dark focus:outline-hidden focus:border-primary cursor-pointer"
                      >
                        <option value={5}>5 từ</option>
                        <option value={10}>10 từ</option>
                        <option value={15}>15 từ</option>
                        <option value={20}>20 từ</option>
                        <option value={30}>30 từ</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAiGenerate}
                    disabled={aiGenerating || !aiTopic.trim()}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {aiGenerating ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-pulse" />
                        <span>AI đang chuẩn bị bài giảng...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Tạo từ vựng ngay</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-2">
                    <span className="text-[10px] font-mono font-bold text-mute uppercase">
                      Danh sách từ vựng đề xuất ({selectedCards.size} / {aiCards.length} được chọn)
                    </span>
                    <button
                      onClick={toggleSelectAll}
                      className="text-[10px] font-mono font-bold text-primary hover:underline cursor-pointer"
                    >
                      {selectedCards.size === aiCards.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {aiCards.map((card, idx) => {
                      const isSelected = selectedCards.has(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleCardSelection(idx)}
                          className={`border rounded-xl p-3.5 text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-500/5 border-purple-500 dark:border-purple-400'
                              : 'bg-surface-card dark:bg-surface-dark border-hairline dark:border-divider-dark hover:border-purple-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="font-display font-extrabold text-sm text-ink dark:text-on-dark">{card.hanzi}</span>
                                <span className="text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400">{card.pinyin}</span>
                              </div>
                              <p className="text-xs text-body dark:text-on-dark-mute font-semibold">{card.meaning}</p>
                              {card.exampleHanzi && (
                                <div className="border-l-2 border-purple-500/30 pl-2 mt-1.5 py-0.5 space-y-0.5">
                                  <p className="text-[9px] font-medium text-mute italic leading-relaxed">{card.exampleHanzi}</p>
                                  {card.exampleMeaning && (
                                    <p className="text-[8px] text-mute/80 leading-normal">{card.exampleMeaning}</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-purple-600 border-transparent text-white' : 'border-mute/40'
                            }`}>
                              {isSelected && <Check size={10} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-hairline dark:border-divider-dark pt-3 flex justify-between gap-2">
              {aiCards.length > 0 && (
                <button
                  onClick={() => setAiCards([])}
                  className="px-4 py-1.5 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-xs font-mono font-bold rounded-lg cursor-pointer"
                >
                  Tạo chủ đề khác
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowAiGenerate(false)}
                  className="px-4 py-1.5 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-xs font-mono font-bold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                {aiCards.length > 0 && (
                  <button
                    onClick={handleAiSave}
                    disabled={aiSaving || selectedCards.size === 0}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {aiSaving && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
                    <span>Lưu {selectedCards.size} từ vào bộ bài</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
