import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Flashcard from '../components/flashcard/Flashcard';
import SRSButtons from '../components/study/SRSButtons';
import { fetchTodayStudy, submitReview } from '../features/study/studySlice';

export default function StudyScreen() {
  const dispatch = useDispatch();
  const [isFlipped, setIsFlipped] = useState(false);
  const todayCards = useSelector((state) => state.study.todayCards);
  const currentIndex = useSelector((state) => state.study.currentIndex);
  const isFinished = useSelector((state) => state.study.isFinished);

  useEffect(() => {
    dispatch(fetchTodayStudy());
  }, [dispatch]);

  const currentCard = todayCards?.[currentIndex];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleRate = async (rating) => {
    if (!currentCard) {
      return;
    }

    try {
      await dispatch(submitReview({ cardId: currentCard.id, rating })).unwrap();
      setIsFlipped(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (isFinished) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Study goal completed</h1>
          <p className="mt-4 text-slate-600">You finished today's cards. Keep your streak going!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Today's study</h1>
            <p className="text-slate-500">Card {currentIndex + 1} / {todayCards?.length ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
            {todayCards?.length ? `${currentIndex + 1} / ${todayCards.length}` : 'No cards available'}
          </div>
        </div>

        {!currentCard ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            Loading today's cards or no cards scheduled for today.
          </div>
        ) : (
          <div className="space-y-6">
            <Flashcard cardData={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />
            {isFlipped && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <SRSButtons onRate={handleRate} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
