import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDeckDetails, fetchFlashcardsByDeck, importFlashcards } from '../features/deck/deckSlice';

export default function DeckDetailScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const currentDeck = useSelector((state) => state.deck.currentDeck);
  const flashcards = useSelector((state) => state.deck.flashcards);

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

  const handleStartStudy = () => {
    navigate('/study');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentDeck?.title || currentDeck?.name || 'Chi tiết bộ bài'}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{currentDeck?.description || 'Xem lại các thẻ bài và nhập thêm nếu cần thiết.'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBulkImport}
              className="rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 text-sm font-semibold transition cursor-pointer active:scale-95"
            >
              Nhập mẫu (Bulk Import)
            </button>
            <button
              type="button"
              onClick={handleStartStudy}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
            >
              Học ngay (Start Study)
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] mt-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-5 self-start">
            <div className="text-sm font-bold text-slate-750 dark:text-slate-350">Thông tin bộ bài</div>
            <div className="mt-4 space-y-3 text-sm text-slate-650 dark:text-slate-400">
              <div>
                Số lượng thẻ: <span className="font-extrabold text-slate-900 dark:text-slate-200">{flashcards?.length ?? 0} thẻ</span>
              </div>
              <div>
                Ngày tạo: <span className="font-semibold text-slate-900 dark:text-slate-250">{currentDeck?.createdAt ? new Date(currentDeck.createdAt).toLocaleDateString() : '---'}</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Danh sách thẻ bài</h2>
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {flashcards?.length > 0 ? (
                flashcards.map((card) => (
                  <div key={card.id || card.front} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 transition-colors">
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-200">{card.front}</div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{card.back}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-5 text-sm text-slate-500 dark:text-slate-400 text-center">
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
