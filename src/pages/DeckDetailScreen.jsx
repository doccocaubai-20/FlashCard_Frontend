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
      alert('Sample cards imported successfully.');
    } catch (error) {
      console.error(error);
      alert('Unable to import sample cards.');
    }
  };

  const handleStartStudy = () => {
    navigate('/study');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{currentDeck?.name || 'Deck details'}</h1>
            <p className="mt-2 text-sm text-slate-500">{currentDeck?.description || 'Review the deck cards and import more if needed.'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBulkImport}
              className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Bulk Import
            </button>
            <button
              type="button"
              onClick={handleStartStudy}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Start Study
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-700">Deck information</div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div>
                Cards: <span className="font-semibold text-slate-900">{flashcards?.length ?? 0}</span>
              </div>
              <div>
                Created: <span className="font-semibold text-slate-900">{currentDeck?.createdAt ? new Date(currentDeck.createdAt).toLocaleDateString() : '---'}</span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Flashcards</h2>
            <div className="mt-4 space-y-3">
              {flashcards?.length > 0 ? (
                flashcards.map((card) => (
                  <div key={card.id || card.front} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-lg font-semibold text-slate-900">{card.front}</div>
                    <p className="mt-2 text-sm text-slate-600">{card.back}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  No flashcards in this deck yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
