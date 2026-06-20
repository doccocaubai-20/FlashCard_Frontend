import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDeckDetails, fetchFlashcardsByDeck, importFlashcards, deleteFlashcard } from '../features/deck/deckSlice';
import { Upload, Star, X, Trash2 } from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { useToast } from '../context/ToastContext';
import HoverableText from '../components/common/HoverableText';

export default function DeckDetailScreen() {
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const currentDeck = useSelector((state) => state.deck.currentDeck);
  const flashcards = useSelector((state) => state.deck.flashcards);
  const fileInputRef = useRef(null);

  const [virtualDeck, setVirtualDeck] = useState(null);
  const [virtualCards, setVirtualCards] = useState([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const isVirtual = id === 'favorites';

  useEffect(() => {
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
        })
        .catch((err) => console.error('Failed to load virtual favorites deck:', err));
    } else if (id) {
      dispatch(fetchDeckDetails(id));
      dispatch(fetchFlashcardsByDeck(id));
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
                🎮 Chơi Game
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/decks/${id}/quiz`)}
              className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              📝 Trắc nghiệm
            </button>
            <button
              type="button"
              onClick={() => navigate(`/decks/${id}/dictation`)}
              className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              🎧 Nghe viết
            </button>
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
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {displayCards?.length > 0 ? (
                displayCards.map((card) => (
                  <div key={card.id || card.front} className="rounded-md border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-surface-dark/20 p-4 transition-colors relative group">
                    <div className="text-lg font-extrabold text-ink dark:text-on-dark font-display">
                      <HoverableText text={card.front} />
                    </div>
                    <p className="mt-2 text-sm text-body dark:text-on-dark-mute font-medium leading-relaxed pr-8">{card.back}</p>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id, card.front)}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-mute hover:text-red-500 transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                        title="Xóa thẻ này"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
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

      {isHelpModalOpen && (
        <JsonFormatHelpModal onClose={() => setIsHelpModalOpen(false)} />
      )}
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
            <span>ℹ️</span> Hướng dẫn định dạng file JSON
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
