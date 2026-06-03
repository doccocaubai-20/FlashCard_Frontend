import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDeckDetails, fetchFlashcardsByDeck, importFlashcards } from '../features/deck/deckSlice';
import { Upload } from 'lucide-react';

export default function DeckDetailScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const currentDeck = useSelector((state) => state.deck.currentDeck);
  const flashcards = useSelector((state) => state.deck.flashcards);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchDeckDetails(id));
      dispatch(fetchFlashcardsByDeck(id));
    }
  }, [dispatch, id]);

  const handleBulkImport = async () => {
    const sampleImport = [
      { deckId: id, front: '你', back: 'nǐ | bạn' },
      { deckId: id, front: '好', back: 'hǎo | tốt' },
    ];

    try {
      await dispatch(importFlashcards(sampleImport)).unwrap();
      alert('Đã nhập các thẻ mẫu thành công.');
    } catch (error) {
      console.error(error);
      alert('Không thể nhập các thẻ mẫu.');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!Array.isArray(json)) {
          alert('Tệp tin JSON phải là một mảng các thẻ bài.');
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
        alert('Nhập dữ liệu từ file JSON thành công!');
      } catch (err) {
        console.error(err);
        alert('Lỗi: Không thể phân tích tệp tin JSON hoặc định dạng không hợp lệ.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleStartStudy = () => {
    navigate('/study');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/50 p-6 shadow-sm transition-colors">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display tracking-tight">{currentDeck?.title || currentDeck?.name || 'Chi tiết bộ bài'}</h1>
            <p className="mt-2 text-sm text-body dark:text-on-dark-mute">{currentDeck?.description || 'Xem lại các thẻ bài và nhập thêm nếu cần thiết.'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
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
              onClick={() => navigate(`/decks/${id}/game`)}
              className="rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              🎮 Chơi Game
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
                Số lượng thẻ: <span className="font-extrabold text-ink dark:text-on-dark">{flashcards?.length ?? 0} thẻ</span>
              </div>
              <div>
                Ngày tạo: <span className="font-semibold text-ink dark:text-on-dark">{currentDeck?.createdAt ? new Date(currentDeck.createdAt).toLocaleDateString() : '---'}</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/30 p-5">
            <h2 className="text-base font-bold text-ink dark:text-on-dark font-display tracking-tight">Danh sách thẻ bài</h2>
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {flashcards?.length > 0 ? (
                flashcards.map((card) => (
                  <div key={card.id || card.front} className="rounded-md border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-surface-dark/20 p-4 transition-colors">
                    <div className="text-lg font-extrabold text-ink dark:text-on-dark font-display">{card.front}</div>
                    <p className="mt-2 text-sm text-body dark:text-on-dark-mute font-medium leading-relaxed">{card.back}</p>
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
    </div>
  );
}
