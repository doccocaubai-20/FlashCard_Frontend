import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDeckDetails, fetchFlashcardsByDeck, importFlashcards, deleteFlashcard, clearCurrentDeck, updateFlashcard } from '../features/deck/deckSlice';
import { Upload, Star, X, Trash2, Volume2, Copy, Check, Pencil } from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { deckApi } from '../services/deckApi';
import { speakChinese } from '../utils/tts';
import { useToast } from '../context/ToastContext';
import HoverableText from '../components/common/HoverableText';
import AiParagraphModal from '../components/common/AiParagraphModal';

export default function DeckDetailScreen() {
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const currentDeck = useSelector((state) => state.deck.currentDeck);
  const flashcards = useSelector((state) => state.deck.flashcards);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [virtualDeck, setVirtualDeck] = useState(null);
  const [virtualCards, setVirtualCards] = useState([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAiParagraphModalOpen, setIsAiParagraphModalOpen] = useState(false);
  const [savedParagraphs, setSavedParagraphs] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [editFormData, setEditFormData] = useState({
    hanzi: '',
    pinyin: '',
    meaning: '',
    exampleHanzi: '',
    examplePinyin: '',
    exampleMeaning: '',
  });
  const isVirtual = id === 'favorites';

  const fetchParagraphs = () => {
    if (!isVirtual && id) {
      deckApi.getSavedParagraphs(id)
        .then((res) => {
          setSavedParagraphs(res.data || []);
        })
        .catch((err) => console.error('Failed to fetch saved paragraphs:', err));
    }
  };

  useEffect(() => {
    setLoading(true);
    setSavedParagraphs([]);

    if (isVirtual) {
      setVirtualDeck({
        title: 'Từ vựng yêu thích',
        description: 'Tất cả các từ vựng bạn đã đánh dấu sao khi tra cứu từ điển hoặc trong khi học.',
        createdAt: new Date().toISOString(),
      });
      favoriteWordsApi.getFavorites()
        .then((res) => {
          const cards = (res.data || []).map((f) => ({
            id: f.id,
            front: f.hanzi,
            back: f.pinyin && f.vi ? `${f.pinyin} | ${f.vi}` : (f.vi || f.pinyin || ''),
          }));
          setVirtualCards(cards);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load virtual favorites deck:', err);
          setLoading(false);
        });
    } else if (id) {
      dispatch(clearCurrentDeck());
      
      const fetchDeckPromise = dispatch(fetchDeckDetails(id)).unwrap();
      const fetchCardsPromise = dispatch(fetchFlashcardsByDeck(id)).unwrap();
      const fetchParagraphsPromise = deckApi.getSavedParagraphs(id)
        .then((res) => {
          setSavedParagraphs(res.data || []);
        })
        .catch((err) => console.error('Failed to fetch saved paragraphs:', err));

      Promise.all([fetchDeckPromise, fetchCardsPromise, fetchParagraphsPromise])
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load deck data:', err);
          setLoading(false);
        });
    }
  }, [dispatch, id, isVirtual]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!Array.isArray(json)) {
          showToast('Tệp tin JSON phải là một mảng các thẻ bài.', 'error');
          return;
        }

        const formattedData = json.map((item) => ({
          deckId: id,
          hanzi: item["Tiếng Trung"] || item.hanzi || item.front || '',
          pinyin: item["Pinyin"] || item.pinyin || '',
          meaning: item["Từ loại"]
            ? `(${item["Từ loại"]}) ${item["Dịch nghĩa"] || item.meaning || ''}`
            : (item["Dịch nghĩa"] || item.meaning || item.back || ''),
          exampleHanzi: item.exampleHanzi || null,
          examplePinyin: item.examplePinyin || null,
          exampleMeaning: item.exampleMeaning || null,
        }));

        await dispatch(importFlashcards(formattedData)).unwrap();
        showToast('Nhập dữ liệu từ file JSON thành công!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Lỗi: Không thể phân tích tệp tin JSON hoặc định dạng không hợp lệ.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };


  const user = useSelector((state) => state.auth.user);
  const displayDeck = isVirtual ? virtualDeck : currentDeck;
  const displayCards = isVirtual ? virtualCards : flashcards;

  const canDelete = isVirtual || (displayDeck && (!displayDeck.isSystem || user?.role === 'ADMIN'));

  const handleDeleteCard = async (cardId, front) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thẻ "${front}" này không?`)) {
      return;
    }

    try {
      if (isVirtual) {
        await favoriteWordsApi.deleteFavorite(cardId);
        setVirtualCards((prev) => prev.filter((c) => c.id !== cardId));
        showToast('Đã xóa thẻ khỏi mục yêu thích.', 'success');
      } else {
        await dispatch(deleteFlashcard(cardId)).unwrap();
        showToast('Xóa thẻ bài thành công.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xóa thẻ bài.', 'error');
    }
  };

  const canEdit = !isVirtual && (displayDeck && (!displayDeck.isSystem || user?.role === 'ADMIN'));

  const handleStartEdit = (card) => {
    setEditingCard(card);
    setEditFormData({
      hanzi: card.hanzi || card.front || '',
      pinyin: card.pinyin || '',
      meaning: card.meaning || '',
      exampleHanzi: card.exampleHanzi || '',
      examplePinyin: card.examplePinyin || '',
      exampleMeaning: card.exampleMeaning || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.hanzi.trim()) {
      showToast('Hán tự không được để trống.', 'error');
      return;
    }
    try {
      await dispatch(updateFlashcard({
        id: editingCard.id,
        data: {
          hanzi: editFormData.hanzi.trim(),
          pinyin: editFormData.pinyin.trim(),
          meaning: editFormData.meaning.trim(),
          exampleHanzi: editFormData.exampleHanzi.trim() || null,
          examplePinyin: editFormData.examplePinyin.trim() || null,
          exampleMeaning: editFormData.exampleMeaning.trim() || null,
        }
      })).unwrap();
      showToast('Cập nhật thẻ bài thành công!', 'success');
      setEditingCard(null);
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi cập nhật thẻ bài.', 'error');
    }
  };

  const handleDeleteParagraph = async (paragraphId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đoạn văn đã lưu này không?')) {
      return;
    }

    try {
      await deckApi.deleteParagraph(id, paragraphId);
      setSavedParagraphs((prev) => prev.filter((p) => p.id !== paragraphId));
      showToast('Xóa đoạn văn đã lưu thành công.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xóa đoạn văn.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/50 p-6 shadow-sm">
          <div className="h-7 bg-surface-bone dark:bg-surface-dark/70 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-surface-bone dark:bg-surface-dark/70 rounded w-2/3 mb-6"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-surface-bone dark:bg-surface-dark/70 rounded-full w-28"></div>
            <div className="h-10 bg-surface-bone dark:bg-surface-dark/70 rounded-full w-28"></div>
            <div className="h-10 bg-surface-bone dark:bg-surface-dark/70 rounded-full w-28"></div>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-surface-dark/40 p-5 space-y-4">
            <div className="h-4 bg-surface-card dark:bg-surface-dark/70 rounded w-1/2"></div>
            <div className="h-4 bg-surface-card dark:bg-surface-dark/70 rounded w-3/4"></div>
          </div>
          
          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/30 p-5 space-y-3">
            <div className="h-5 bg-surface-bone dark:bg-surface-dark/70 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-md border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-surface-dark/20 p-4 space-y-2">
                  <div className="h-5 bg-surface-card dark:bg-surface-dark/70 rounded w-1/4"></div>
                  <div className="h-4 bg-surface-card dark:bg-surface-dark/70 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/50 p-6 shadow-sm transition-colors">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display tracking-tight flex items-center gap-2">
              {isVirtual && <Star className="text-amber-500 fill-amber-500 shrink-0" size={24} />}
              {displayDeck?.title || displayDeck?.name || 'Chi tiết bộ bài'}
            </h1>
            <p className="mt-2 text-sm text-body dark:text-on-dark-mute">{displayDeck?.description || 'Xem lại các thẻ bài và nhập thêm nếu cần thiết.'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
            {!isVirtual && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  Nhập file JSON
                </button>
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(true)}
                  className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-mute hover:text-ink dark:hover:text-on-dark w-9 h-9 flex items-center justify-center text-sm font-semibold transition cursor-pointer active:scale-95 shadow-sm"
                  title="Hướng dẫn cấu trúc file JSON"
                >
                  ❓
                </button>
              </div>
            )}
            {!isVirtual && (
              <button
                type="button"
                onClick={() => navigate(`/decks/${id}/game`)}
                className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                Chơi Game
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/decks/${id}/quiz`)}
              className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              Trắc nghiệm
            </button>
            <button
              type="button"
              onClick={() => navigate(`/decks/${id}/dictation`)}
              className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              Nghe viết
            </button>
            {!isVirtual && (
              <button
                type="button"
                onClick={() => setIsAiParagraphModalOpen(true)}
                className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                Đoạn văn AI
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/study?deckId=${id}`)}
              className="rounded-full bg-primary hover:bg-primary-deep text-white px-5 py-2.5 text-sm font-bold shadow-sm hover:shadow-md transition cursor-pointer active:scale-95"
            >
              Học ngay
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] mt-6">
          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-surface-dark/40 p-5 self-start">
            <div className="text-sm font-bold text-ink dark:text-on-dark uppercase tracking-wider">Thông tin bộ bài</div>
            <div className="mt-4 space-y-3 text-sm text-body dark:text-on-dark-mute">
              <div>
                Số lượng thẻ: <span className="font-extrabold text-ink dark:text-on-dark">{displayCards?.length ?? 0} thẻ</span>
              </div>
              <div>
                Ngày tạo: <span className="font-semibold text-ink dark:text-on-dark">{displayDeck?.createdAt ? new Date(displayDeck.createdAt).toLocaleDateString() : '---'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/30 p-5">
            <h2 className="text-base font-bold text-ink dark:text-on-dark font-display tracking-tight">Danh sách thẻ bài</h2>
            <div className="mt-4 space-y-3 pr-2 max-h-[550px] overflow-y-auto">
              {displayCards?.length > 0 ? (
                displayCards.map((card) => (
                  <div key={card.id || card.front} className="rounded-md border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-surface-dark/20 p-4 transition-colors relative group">
                    <div className="text-lg font-extrabold text-ink dark:text-on-dark font-display">
                      <HoverableText text={card.front} />
                    </div>
                    <p className="mt-2 text-sm text-body dark:text-on-dark-mute font-medium leading-relaxed pr-8">{card.back}</p>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(card)}
                          className="p-1.5 rounded-full hover:bg-primary/10 text-mute hover:text-primary transition-colors cursor-pointer"
                          title="Sửa thẻ này"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id, card.front)}
                          className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-mute hover:text-red-500 transition-colors cursor-pointer"
                          title="Xóa thẻ này"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-hairline dark:border-divider-dark bg-surface-bone/30 dark:bg-surface-dark/20 p-5 text-sm text-mute dark:text-on-dark-mute text-center">
                  Bộ bài này chưa có thẻ nào.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Đoạn văn ôn tập đã lưu */}
      {!isVirtual && savedParagraphs.length > 0 && (
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/50 p-6 shadow-sm mt-6">
          <h3 className="text-lg font-bold text-ink dark:text-on-dark font-display flex items-center gap-2">
            📚 Đoạn văn ôn tập đã lưu ({savedParagraphs.length})
          </h3>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-1 mb-5">
            Danh sách các đoạn văn do AI viết từ từ vựng trong bộ bài được bạn chọn lưu trữ lại.
          </p>

          <div className="space-y-6">
            {savedParagraphs.map((paragraph) => (
              <SavedParagraphCard
                key={paragraph.id}
                paragraph={paragraph}
                onDelete={handleDeleteParagraph}
              />
            ))}
          </div>
        </div>
      )}

      {isHelpModalOpen && (
        <JsonFormatHelpModal onClose={() => setIsHelpModalOpen(false)} />
      )}
      {isAiParagraphModalOpen && (
        <AiParagraphModal
          deckId={id}
          flashcards={displayCards}
          onClose={() => setIsAiParagraphModalOpen(false)}
          onSaveSuccess={fetchParagraphs}
        />
      )}
      {editingCard && (
        <EditFlashcardModal
          card={editingCard}
          formData={editFormData}
          setFormData={setEditFormData}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

// ─── Edit Flashcard Modal ───────────────────────────────────────────────────
function EditFlashcardModal({ card, formData, setFormData, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-card dark:bg-surface-dark rounded-xl shadow-xl max-w-xl w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
          <h3 className="text-base font-bold text-ink dark:text-on-dark font-display">
            Chỉnh sửa thẻ bài
          </h3>
          <button onClick={onClose} className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer bg-transparent border-none">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={onSave}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm text-body dark:text-on-dark-mute leading-relaxed font-sans">
            
            {/* Row 1: Hanzi & Pinyin */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                  Hán tự (Hanzi) <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.hanzi}
                  onChange={(e) => setFormData({ ...formData, hanzi: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                  Phiên âm (Pinyin)
                </label>
                <input
                  type="text"
                  value={formData.pinyin}
                  onChange={(e) => setFormData({ ...formData, pinyin: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                />
              </div>
            </div>

            {/* Meaning */}
            <div>
              <label className="block text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-1">
                Ý nghĩa <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.meaning}
                onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
              />
            </div>

            <hr className="border-hairline dark:border-divider-dark" />

            {/* Example Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">
                Ví dụ minh họa (Tùy chọn)
              </h4>
              
              <div>
                <label className="block text-xs font-semibold text-mute mb-1">
                  Hán tự ví dụ
                </label>
                <input
                  type="text"
                  value={formData.exampleHanzi}
                  onChange={(e) => setFormData({ ...formData, exampleHanzi: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-mute mb-1">
                    Phiên âm ví dụ
                  </label>
                  <input
                    type="text"
                    value={formData.examplePinyin}
                    onChange={(e) => setFormData({ ...formData, examplePinyin: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-mute mb-1">
                    Nghĩa ví dụ
                  </label>
                  <input
                    type="text"
                    value={formData.exampleMeaning}
                    onChange={(e) => setFormData({ ...formData, exampleMeaning: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-ink dark:text-on-dark"
                  />
                </div>
              </div>
            </div>

          </div>
          
          <div className="px-6 py-4 border-t border-hairline dark:border-divider-dark flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black rounded-full font-bold text-xs cursor-pointer transition-colors bg-transparent"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-deep text-white font-bold text-xs rounded-full cursor-pointer transition-colors shadow-xs"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Help Modal ──────────────────────────────────────────────────────────────
function JsonFormatHelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-card dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full border border-hairline dark:border-divider-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark">
          <h3 className="text-base font-bold text-ink dark:text-on-dark font-display flex items-center gap-2">
            Hướng dẫn định dạng file JSON
          </h3>
          <button onClick={onClose} className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-body dark:text-on-dark-mute leading-relaxed font-sans">
          <p>
            Hệ thống hỗ trợ nhập bộ thẻ hàng loạt từ tệp tin <strong>.json</strong>. Tệp tin phải chứa một mảng các đối tượng thẻ bài. Bạn có thể sử dụng một trong hai định dạng dưới đây:
          </p>

          <div className="space-y-2">
            <div className="font-bold text-ink dark:text-on-dark">Định dạng 1 (Cơ bản - Tiếng Anh):</div>
            <pre className="bg-surface-bone dark:bg-black/30 p-3 rounded-lg overflow-x-auto font-mono text-[11px] text-primary">
              {`[
  {
    "hanzi": "你",
    "pinyin": "nǐ",
    "meaning": "bạn, anh, chị (ngôi thứ hai số ít)",
    "exampleHanzi": "你好",
    "examplePinyin": "nǐ hǎo",
    "exampleMeaning": "Chào bạn"
  }
]`}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-ink dark:text-on-dark">Định dạng 2 (Nâng cao - Tiếng Việt):</div>
            <pre className="bg-surface-bone dark:bg-black/30 p-3 rounded-lg overflow-x-auto font-mono text-[11px] text-primary">
              {`[
  {
    "Tiếng Trung": "你",
    "Pinyin": "nǐ",
    "Từ loại": "Đại từ",
    "Dịch nghĩa": "Bạn, anh, chị",
    "exampleHanzi": "你好",
    "examplePinyin": "nǐ hǎo",
    "exampleMeaning": "Chào bạn"
  }
]`}
            </pre>
          </div>

          <div className="border-t border-hairline dark:border-divider-dark pt-3">
            <h4 className="font-bold text-ink dark:text-on-dark mb-1">Mô tả các trường thông tin:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>hanzi</strong> hoặc <strong>Tiếng Trung</strong> (Bắt buộc): Từ vựng hoặc câu tiếng Hán.</li>
              <li><strong>pinyin</strong> hoặc <strong>Pinyin</strong> (Tùy chọn): Phiên âm Pinyin tương ứng.</li>
              <li><strong>meaning</strong> / <strong>Dịch nghĩa</strong> / <strong>Từ loại</strong> (Tùy chọn): Định nghĩa tiếng Việt của từ. Nếu có cả <i>Từ loại</i> và <i>Dịch nghĩa</i>, chúng sẽ tự động được ghép lại dưới dạng <code>(Từ loại) Dịch nghĩa</code>.</li>
              <li>Các trường ví dụ (Tùy chọn): <strong>exampleHanzi</strong> (Câu ví dụ tiếng Hán), <strong>examplePinyin</strong> (Phiên âm ví dụ), <strong>exampleMeaning</strong> (Dịch nghĩa ví dụ).</li>
            </ul>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-hairline dark:border-divider-dark flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-primary hover:bg-primary-deep text-white font-bold text-xs rounded-full cursor-pointer transition-colors shadow-xs">
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Saved Paragraph Card Component ──────────────────────────────────────────
function SavedParagraphCard({ paragraph, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();
    speakChinese(paragraph.hanzi);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(paragraph.hanzi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(paragraph.id);
  };

  return (
    <div className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone/30 dark:bg-black/10 p-5 space-y-4 hover:shadow-md transition-all relative">
      <div className="flex items-start justify-between gap-4">
        <div className="pr-24 space-y-1">
          <div className="text-[10px] font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
            Từ vựng ôn tập: {paragraph.words.join(', ')}
          </div>
          <div className="text-xl font-extrabold text-ink dark:text-on-dark font-display leading-loose">
            <HoverableText text={paragraph.hanzi} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSpeak}
            className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark hover:text-primary transition cursor-pointer active:scale-95 shadow-xs"
            title="Nghe đọc"
          >
            <Volume2 size={14} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark hover:text-primary transition cursor-pointer active:scale-95 shadow-xs"
            title="Sao chép"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-red-50 dark:hover:bg-red-950/20 text-mute hover:text-red-500 transition cursor-pointer active:scale-95 shadow-xs"
            title="Xóa đoạn văn"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="border-t border-hairline dark:border-divider-dark/50 pt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          {expanded ? '🔼 Thu gọn phiên âm & dịch nghĩa' : '🔽 Xem phiên âm & dịch nghĩa'}
        </button>

        {expanded && (
          <div className="grid gap-4 md:grid-cols-2 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-4 rounded-lg bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark/50">
              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">
                Phiên âm Pinyin
              </div>
              <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium">
                {paragraph.pinyin}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark/50">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">
                Dịch nghĩa Tiếng Việt
              </div>
              <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium">
                {paragraph.meaning}
              </p>
            </div>

            {paragraph.wordUsage && (
              <div className="md:col-span-2 mt-2 space-y-2">
                <div className="text-[10px] font-bold text-ink dark:text-on-dark uppercase tracking-wider">
                  Giải nghĩa từ vựng trong văn cảnh
                </div>
                <div className="border border-hairline dark:border-divider-dark rounded-lg overflow-hidden divide-y divide-hairline dark:divide-divider-dark bg-surface-card dark:bg-surface-dark/25">
                  {(Array.isArray(paragraph.wordUsage) ? paragraph.wordUsage : []).map((item, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-start gap-2 hover:bg-surface-bone/10 transition-colors">
                      <div className="sm:w-1/4 shrink-0">
                        <span className="text-xs font-bold text-ink dark:text-on-dark">{item.word}</span>
                        <span className="block text-[10px] text-mute dark:text-on-dark-mute font-medium">{item.pinyin} - {item.meaning}</span>
                      </div>
                      <div className="text-xs text-body dark:text-on-dark-mute font-medium leading-relaxed">
                        {item.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
